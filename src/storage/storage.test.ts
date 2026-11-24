import { describe, expect, it, vi } from "vitest";
import { createStore, decodeEnvelope, encodeEnvelope, memoryStorage, subscribeStorageErrors } from "./store";
import { applyBackup, buildBackup, BACKUP_FORMAT } from "./backup";
import { STORAGE_KEYS } from "./registry";
import { migrateScriptVault, createDefaultMasterRepository } from "@/lib/master-script";
import { LEGACY_STARTERS } from "@/test/fixtures";
import { migrateProfile } from "@/lib/profile";
import { DEFAULT_PROFILE } from "@/lib/types";

const numberStore = (storage = memoryStorage()) =>
  createStore<number>({
    key: "test_key",
    version: 2,
    fallback: () => 0,
    migrate: (data, from) => (from < 2 ? Number(data) * 10 : Number(data)),
    storage: () => storage,
  });

describe("envelope decoding", () => {
  const opts = { version: 2, fallback: () => -1, migrate: (d: unknown, from: number) => (from === 0 ? 100 : Number(d)) };

  it("falls back when nothing is stored", () => {
    expect(decodeEnvelope(null, opts)).toEqual({ value: -1, fromVersion: null, corrupt: false });
  });

  it("treats legacy raw JSON as version 0", () => {
    expect(decodeEnvelope('{"anything":true}', opts)).toEqual({ value: 100, fromVersion: 0, corrupt: false });
  });

  it("reads current envelopes", () => {
    expect(decodeEnvelope(encodeEnvelope(7, 2), opts).value).toBe(7);
  });

  it("flags unreadable data instead of throwing", () => {
    expect(decodeEnvelope("{not json", opts)).toEqual({ value: -1, fromVersion: null, corrupt: true });
  });
});

describe("createStore", () => {
  it("persists envelopes and notifies subscribers", () => {
    const storage = memoryStorage();
    const store = numberStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);
    store.set(5);
    expect(store.get()).toBe(5);
    expect(JSON.parse(storage.getItem("test_key")!)).toEqual({ v: 2, data: 5 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("migrates older versions on read without writing during the read", () => {
    const storage = memoryStorage({ test_key: JSON.stringify({ v: 1, data: 4 }) });
    const store = numberStore(storage);
    expect(store.get()).toBe(40);
    expect(storage.getItem("test_key")).toBe(JSON.stringify({ v: 1, data: 4 }));
  });

  it("returns a stable server snapshot", () => {
    const store = numberStore();
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
  });

  it("resets and reloads", () => {
    const storage = memoryStorage();
    const store = numberStore(storage);
    store.set(9);
    store.reset();
    expect(store.get()).toBe(0);
    expect(storage.getItem("test_key")).toBeNull();
    storage.setItem("test_key", encodeEnvelope(3, 2));
    store.reload();
    expect(store.get()).toBe(3);
  });

  it("reports write failures (e.g. quota) and keeps the in-memory value", () => {
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };
    const errors = vi.fn();
    const unsubscribe = subscribeStorageErrors(errors);
    const store = createStore<number>({ key: "q", version: 1, fallback: () => 0, migrate: Number, storage: () => failing });
    store.set(1);
    expect(store.get()).toBe(1);
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ key: "q", kind: "write" }));
    unsubscribe();
  });
});

describe("migrations of today's stored data", () => {
  it("keeps a legacy (un-enveloped) script vault and adds missing fields", () => {
    const legacy = { ...createDefaultMasterRepository(), items: LEGACY_STARTERS };
    const { itemStats: _i, dayStreak: _d, ...withoutNewFields } = legacy;
    void _i;
    void _d;
    // The learner practised every starter, so their history is kept.
    const practised = Object.fromEntries(LEGACY_STARTERS.map((s) => [s.id, { reps: 2, bestAccentScore: 70, lastPracticedAt: 1 }]));
    const migrated = migrateScriptVault({ ...withoutNewFields, totalPracticeCount: 12, itemStats: practised });
    expect(migrated.totalPracticeCount).toBe(12);
    expect(migrated.items).toHaveLength(legacy.items.length);
    expect(migrated.dayStreak).toBe(0);
  });

  it("retires unpractised starter scripts from the removed example persona, keeping everything else", () => {
    const personal = { ...LEGACY_STARTERS[0], id: "mine-work-1-0" };
    const migrated = migrateScriptVault({
      ...createDefaultMasterRepository(),
      items: [...LEGACY_STARTERS, personal],
      itemStats: { [LEGACY_STARTERS[1].id]: { reps: 1, bestAccentScore: 60, lastPracticedAt: 1 } },
    });
    expect(migrated.items.map((s) => s.id).sort()).toEqual([LEGACY_STARTERS[1].id, "mine-work-1-0"].sort());
  });

  it("drops malformed script items and recovers from garbage", () => {
    const migrated = migrateScriptVault({ items: [{ id: "ok", upgradedScript: "Hi" }, { bad: true }, null] });
    expect(migrated.items.map((i) => i.id)).toEqual(["ok"]);
    expect(migrateScriptVault("garbage").items).toEqual([]);
  });

  it("merges a stored profile onto the defaults", () => {
    const profile = migrateProfile({ preferredName: "Sam" });
    expect(profile.preferredName).toBe("Sam");
    expect(profile.targetBand).toBe(DEFAULT_PROFILE.targetBand);
    expect(migrateProfile(null)).toEqual(DEFAULT_PROFILE);
  });
});

describe("backup", () => {
  it("round-trips every known key and ignores unknown ones", () => {
    const source = memoryStorage({
      [STORAGE_KEYS.profile]: encodeEnvelope({ preferredName: "Sam" }, 1),
      [STORAGE_KEYS.attempts]: encodeEnvelope([], 1),
      unrelated_key: "x",
    });
    const backup = buildBackup(source, new Date("2026-11-24T00:00:00Z"));
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(Object.keys(backup.entries).sort()).toEqual([STORAGE_KEYS.attempts, STORAGE_KEYS.profile].sort());

    const target = memoryStorage();
    const result = applyBackup(target, JSON.stringify(backup));
    expect(result).toEqual({ ok: true, restoredKeys: expect.arrayContaining([STORAGE_KEYS.profile]) });
    expect(target.getItem(STORAGE_KEYS.profile)).toBe(source.getItem(STORAGE_KEYS.profile));
    expect(target.getItem("unrelated_key")).toBeNull();
  });

  it("rejects invalid files without writing anything", () => {
    const target = memoryStorage();
    expect(applyBackup(target, "not json")).toEqual({ ok: false, error: expect.any(String) });
    expect(applyBackup(target, JSON.stringify({ format: "other" }))).toEqual({ ok: false, error: expect.any(String) });
    const damaged = {
      format: BACKUP_FORMAT,
      formatVersion: 1,
      exportedAt: "",
      entries: { [STORAGE_KEYS.profile]: encodeEnvelope({}, 1), [STORAGE_KEYS.attempts]: "{broken" },
    };
    expect(applyBackup(target, JSON.stringify(damaged)).ok).toBe(false);
    expect(target.dump()).toEqual({});
  });
});
