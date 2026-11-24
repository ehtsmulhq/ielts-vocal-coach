/**
 * Client helper: fetch (and cache) British RP model audio for a script.
 * Cache: in-memory Map + IndexedDB, keyed by a hash of voice + text.
 */

const DB_NAME = "vocal_lab_model_audio_v1";
const STORE = "clips";
const memory = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "_" + s.length;
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
export function getModelAudio(text: string, voice?: string): Promise<Blob> {
  const key = hash(`${voice ?? "default"}::${text}`);
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
    if (!res.ok) throw new Error(`Model audio failed (${res.status})`);
    const blob = await res.blob();
    memory.set(key, blob);
    void dbPut(key, blob);
    return blob;
  })().finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
