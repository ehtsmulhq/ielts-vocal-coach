/**
 * Client helper: fetch (and cache) British RP model audio for a script.
 * Cache: in-memory Map + IndexedDB, keyed by a hash of voice + text.
 */

import { AUDIO_CACHE_DB } from "@/storage/registry";
import { readApiError } from "@/lib/api-client";

const DB_NAME = AUDIO_CACHE_DB;
const STORE = "clips";
const memory = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();

/** SHA-256 cache key (falls back to djb2 where SubtleCrypto is unavailable, e.g. plain http). */
async function hash(s: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return "djb2_" + (h >>> 0).toString(36) + "_" + s.length;
  }
}

/** Drops in-memory clips (the IndexedDB database is deleted separately by the wipe). */
export function clearModelAudioMemoryCache(): void {
  memory.clear();
  inflight.clear();
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function dbGet(key: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => resolve(null);
  });
}

async function dbPut(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Returns a WAV blob of the RP model reading `text`. Throws if TTS is unavailable. */
export async function getModelAudio(text: string, voice?: string): Promise<Blob> {
  const key = await hash(`${voice ?? "default"}::${text}`);
  const cached = memory.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    const stored = await dbGet(key);
    if (stored) {
      memory.set(key, stored);
      return stored;
    }
    const res = await fetch("/api/model-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) throw await readApiError(res, "The model voice is unavailable right now.");
    const blob = await res.blob();
    memory.set(key, blob);
    void dbPut(key, blob);
    return blob;
  })().finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

/**
 * Renders clips ahead of time, one at a time, so the first Play is instant.
 * Failures are ignored: playing will simply try again.
 */
export async function prefetchModelAudio(texts: string[], voice: string | undefined, isCancelled: () => boolean): Promise<void> {
  for (const text of texts) {
    if (isCancelled()) return;
    try {
      await getModelAudio(text, voice);
    } catch {
      return; // stop prefetching on the first failure (offline, rate limited)
    }
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
