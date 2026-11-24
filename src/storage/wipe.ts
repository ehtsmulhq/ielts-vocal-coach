import { AUDIO_CACHE_DB, LEGACY_KEYS, SESSION_KEYS, STORAGE_KEYS } from "./registry";
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

/** Resolves once the database is really gone (or after a safety timeout if something keeps it open). */
function deleteAudioCache(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    try {
      const req = indexedDB.deleteDatabase(AUDIO_CACHE_DB);
      // onblocked only means other connections are still closing: keep waiting for onsuccess.
      req.onsuccess = req.onerror = done;
    } catch {
      done();
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
  try {
    for (const key of Object.values(SESSION_KEYS)) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  resetAllStores();
  const { clearModelAudioMemoryCache } = await import("@/lib/model-audio");
  clearModelAudioMemoryCache();
  await deleteAudioCache();
}
