/**
 * Versioned, migrating, local-first store.
 *
 * Every value is saved as an envelope `{ v, data }`. Values written by older app
 * versions (raw JSON without an envelope) are treated as version 0 and passed
 * through `migrate`, so upgrading the app never wipes a learner's data.
 *
 * Stores are designed for `useSyncExternalStore`: `get` is read-only and cached,
 * `getServerSnapshot` is stable, and changes from other tabs are picked up via
 * the `storage` event.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoreOptions<T> {
  key: string;
  /** Current schema version. Bump it and extend `migrate` when the shape changes. */
  version: number;
  /** Value used when nothing is stored, the data is corrupt, or on the server. */
  fallback: () => T;
  /** Converts data saved at `fromVersion` (0 = legacy, no envelope) into the current shape. */
  migrate: (data: unknown, fromVersion: number) => T;
  /** Injected for tests; defaults to `window.localStorage` in the browser. */
  storage?: () => StorageLike | null;
}

export interface Store<T> {
  readonly key: string;
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  reset(): void;
  /** Drops the cache so the next `get` re-reads storage (after an import, for example). */
  reload(): void;
  subscribe(listener: () => void): () => void;
  getServerSnapshot(): T;
}

export interface StorageErrorEvent {
  key: string;
  error: unknown;
  kind: "write" | "corrupt";
}

const errorListeners = new Set<(e: StorageErrorEvent) => void>();

/** Lets the UI surface quota or corruption problems instead of failing silently. */
export function subscribeStorageErrors(listener: (e: StorageErrorEvent) => void): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

function emitError(e: StorageErrorEvent) {
  console.warn(`[storage] ${e.kind} error on ${e.key}:`, e.error);
  errorListeners.forEach((l) => l(e));
}

export function browserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // Access can throw when storage is blocked (privacy modes).
  }
}

export function encodeEnvelope<T>(value: T, version: number): string {
  return JSON.stringify({ v: version, data: value });
}

function isEnvelope(value: unknown): value is { v: number; data: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "v" in value &&
    "data" in value &&
    typeof (value as { v: unknown }).v === "number"
  );
}

/** Pure decoder, exported for tests. */
export function decodeEnvelope<T>(
  raw: string | null,
  opts: Pick<StoreOptions<T>, "version" | "fallback" | "migrate">
): { value: T; fromVersion: number | null; corrupt: boolean } {
  if (raw === null) return { value: opts.fallback(), fromVersion: null, corrupt: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: opts.fallback(), fromVersion: null, corrupt: true };
  }
  const fromVersion = isEnvelope(parsed) ? parsed.v : 0;
  const data = isEnvelope(parsed) ? parsed.data : parsed;
  try {
    return { value: opts.migrate(data, fromVersion), fromVersion, corrupt: false };
  } catch {
    return { value: opts.fallback(), fromVersion, corrupt: true };
  }
}

const allStores = new Set<Store<unknown>>();

export function createStore<T>(opts: StoreOptions<T>): Store<T> {
  const getStorage = opts.storage ?? browserStorage;
  const listeners = new Set<() => void>();
  let cache: { value: T } | null = null;
  let serverValue: { value: T } | null = null;
  let detachStorageEvent: (() => void) | null = null;

  const notify = () => listeners.forEach((l) => l());

  const read = (): T => {
    const storage = getStorage();
    let raw: string | null = null;
    try {
      raw = storage?.getItem(opts.key) ?? null;
    } catch (error) {
      emitError({ key: opts.key, error, kind: "corrupt" });
    }
    const result = decodeEnvelope(raw, opts);
    if (result.corrupt) emitError({ key: opts.key, error: new Error("Unreadable stored value"), kind: "corrupt" });
    return result.value;
  };

  const store: Store<T> = {
    key: opts.key,
    get() {
      if (!cache) cache = { value: read() };
      return cache.value;
    },
    set(value) {
      cache = { value };
      try {
        getStorage()?.setItem(opts.key, encodeEnvelope(value, opts.version));
      } catch (error) {
        emitError({ key: opts.key, error, kind: "write" });
      }
      notify();
    },
    update(fn) {
      store.set(fn(store.get()));
    },
    reset() {
      try {
        getStorage()?.removeItem(opts.key);
      } catch (error) {
        emitError({ key: opts.key, error, kind: "write" });
      }
      cache = { value: opts.fallback() };
      notify();
    },
    reload() {
      cache = null;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (!detachStorageEvent && typeof window !== "undefined") {
        const onStorage = (e: StorageEvent) => {
          if (e.key === opts.key || e.key === null) store.reload();
        };
        window.addEventListener("storage", onStorage);
        detachStorageEvent = () => window.removeEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && detachStorageEvent) {
          detachStorageEvent();
          detachStorageEvent = null;
        }
      };
    },
    getServerSnapshot() {
      if (!serverValue) serverValue = { value: opts.fallback() };
      return serverValue.value;
    },
  };

  allStores.add(store as Store<unknown>);
  return store;
}

/** Re-reads every store from storage (used after importing a backup). */
export function reloadAllStores(): void {
  allStores.forEach((s) => s.reload());
}

/** Removes every store's data and resets it to its fallback. */
export function resetAllStores(): void {
  allStores.forEach((s) => s.reset());
}

/** In-memory StorageLike for tests and non-browser environments. */
export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map),
  };
}
