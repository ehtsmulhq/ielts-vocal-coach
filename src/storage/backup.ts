import { z } from "zod";
import { STORAGE_KEYS } from "./registry";
import { browserStorage, reloadAllStores, type StorageLike } from "./store";

export const BACKUP_FORMAT = "accent-shadowing-gym-backup";
export const BACKUP_FORMAT_VERSION = 1;

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  formatVersion: z.number().int().min(1).max(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  // Raw stored strings, keyed by storage key. Only known keys are restored.
  entries: z.record(z.string(), z.string()),
});

export type BackupFile = z.infer<typeof backupSchema>;

const KNOWN_KEYS = new Set<string>(Object.values(STORAGE_KEYS));

/** Builds a backup of every persisted store (model audio is regenerable, so not included). */
export function buildBackup(storage: StorageLike, now = new Date()): BackupFile {
  const entries: Record<string, string> = {};
  for (const key of KNOWN_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) entries[key] = raw;
  }
  return { format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION, exportedAt: now.toISOString(), entries };
}

export type RestoreResult = { ok: true; restoredKeys: string[] } | { ok: false; error: string };

/**
 * Validates and restores a backup. Nothing is written unless the whole file is valid.
 * Each entry must be parseable JSON; store migrations handle older shapes on read.
 */
export function applyBackup(storage: StorageLike, text: string): RestoreResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "This is not a Sounds Like You backup file." };

  const toRestore = Object.entries(parsed.data.entries).filter(([key]) => KNOWN_KEYS.has(key));
  for (const [key, raw] of toRestore) {
    try {
      JSON.parse(raw);
    } catch {
      return { ok: false, error: `The backup entry for ${key} is damaged.` };
    }
  }
  try {
    for (const [key, raw] of toRestore) storage.setItem(key, raw);
  } catch {
    return { ok: false, error: "Your browser storage is full or blocked." };
  }
  return { ok: true, restoredKeys: toRestore.map(([k]) => k) };
}

/** Browser helper: returns the backup as a pretty-printed JSON string. */
export function exportUserData(): string {
  const storage = browserStorage();
  if (!storage) throw new Error("Browser storage is unavailable.");
  return JSON.stringify(buildBackup(storage), null, 2);
}

/** Browser helper: restores a backup and refreshes every store. */
export function importUserData(text: string): RestoreResult {
  const storage = browserStorage();
  if (!storage) return { ok: false, error: "Browser storage is unavailable." };
  const result = applyBackup(storage, text);
  if (result.ok) reloadAllStores();
  return result;
}
