import { AUDIO_CACHE_DB, LEGACY_KEYS, STORAGE_KEYS } from "./registry";
import { browserStorage, resetAllStores } from "./store";

/** Removes keys left by older app versions. Never touches current data. */
export function cleanupLegacyKeys(): void {
  const storage = browserStorage();
  if (!storage) return;
  for (const key of LEGACY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      /* storage blocked: nothing to clean */
    }
  }
}

function deleteAudioCache(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(AUDIO_CACHE_DB);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Erases everything the app stores in this browser: profile, scripts, history,
 * attempts, legacy keys and cached model audio. Stores reset to their defaults.
 */
export async function wipeAllUserData(): Promise<void> {
  const storage = browserStorage();
  if (storage) {
    for (const key of [...Object.values(STORAGE_KEYS), ...LEGACY_KEYS]) {
      try {
        storage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
  resetAllStores();
  const { clearModelAudioMemoryCache } = await import("@/lib/model-audio");
  clearModelAudioMemoryCache();
  await deleteAudioCache();
}
