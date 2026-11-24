import { CandidateProfile, DEFAULT_PROFILE } from "./types";
import { createStore } from "@/storage/store";
import { STORAGE_KEYS } from "@/storage/registry";
import { applyRep, localDay, nextDayStreak, type ItemStats } from "@/domain/stats";
import { isStarterScript, mergeAcceptedScripts } from "@/domain/capture";

export type { ItemStats };

export type { ScriptItem, TargetCollocation } from "@/domain/contracts";
import type { ScriptItem } from "@/domain/contracts";

export interface MasterScriptRepository {
  id: string;
  candidateName: string;
  preferredName: string;
  targetBand: string;
  createdAt: number;
  lastPracticedAt: number;
  totalPracticeCount: number; // Increments with each repetition session
  streakReps: number; // Legacy counter, kept for backwards compatibility
  dayStreak?: number; // Consecutive calendar days with at least one rep
  lastPracticeDay?: string; // YYYY-MM-DD (local)
  itemStats?: Record<string, ItemStats>; // Keyed by ScriptItem.id; survives script upgrades
  items: ScriptItem[];
}

/**
 * A new, empty collection. Learners start with the curated library and add
 * their own scripts through Capture. (Older versions seeded "canonical-*"
 * starter scripts from an example profile; existing ones are kept until the
 * learner captures their own, see `mergeAcceptedScripts`.)
 */
export function createDefaultMasterRepository(profile: CandidateProfile = DEFAULT_PROFILE): MasterScriptRepository {
  const now = Date.now();
  return {
    id: "repo-default",
    candidateName: profile.fullName,
    preferredName: profile.preferredName,
    targetBand: profile.targetBand || "7.5",
    createdAt: now,
    lastPracticedAt: now,
    totalPracticeCount: 0,
    streakReps: 0,
    items: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalises any stored vault (legacy raw JSON = version 0, or envelope v1).
 * Unknown or broken data falls back to the starter vault rather than crashing.
 */
export function migrateScriptVault(data: unknown): MasterScriptRepository {
  if (!isRecord(data) || !Array.isArray(data.items)) return createDefaultMasterRepository();
  // An absent or broken vault never loses data that exists: only missing fields get defaults.
  const fallback = createDefaultMasterRepository();
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const itemStats = isRecord(data.itemStats) ? (data.itemStats as Record<string, ItemStats>) : {};
  const valid = (data.items as unknown[]).filter(
    (i): i is ScriptItem => isRecord(i) && typeof i.id === "string" && typeof i.upgradedScript === "string"
  );
  // Older versions seeded "canonical-*" starters from an example persona. Drop the ones the
  // learner never practised; practised ones keep their history, and personal scripts are untouched.
  const items = valid.filter((s) => !isStarterScript(s) || (itemStats[s.id]?.reps ?? 0) > 0);
  return {
    ...fallback,
    ...(data as Partial<MasterScriptRepository>),
    totalPracticeCount: num(data.totalPracticeCount, 0),
    streakReps: num(data.streakReps, 0),
    dayStreak: num(data.dayStreak, 0),
    itemStats,
    items,
  };
}

const vaultStore = createStore<MasterScriptRepository>({
  key: STORAGE_KEYS.scriptVault,
  version: 1,
  fallback: () => createDefaultMasterRepository(),
  migrate: (data) => migrateScriptVault(data),
});

export const subscribeMasterScript = vaultStore.subscribe;
export const getMasterScriptSnapshot = vaultStore.get;
export const getMasterScriptServerSnapshot = vaultStore.getServerSnapshot;

/** Persists the vault and notifies subscribers. */
export function saveMasterScript(repository: MasterScriptRepository): void {
  vaultStore.set(repository);
}

/**
 * Logs a completed repetition: bumps totals, the per-item stats, and the day streak.
 * @param itemId      the script item practised
 * @param accentScore optional 0-100 accent score from the coach
 */
export function logRepetitionCompleted(itemId?: string, accentScore?: number): void {
  const now = new Date();
  vaultStore.update((current) => {
    const itemStats = { ...(current.itemStats ?? {}) };
    if (itemId) itemStats[itemId] = applyRep(itemStats[itemId], accentScore, now.getTime());
    return {
      ...current,
      totalPracticeCount: current.totalPracticeCount + 1,
      streakReps: current.streakReps + 1,
      dayStreak: nextDayStreak(current.lastPracticeDay, current.dayStreak ?? 0, now),
      lastPracticeDay: localDay(now),
      itemStats,
      lastPracticedAt: now.getTime(),
    };
  });
}

/** Adds accepted capture scripts (see `mergeAcceptedScripts`) and records the learner's band. */
export function addPersonalScripts(accepted: ScriptItem[], targetBand?: string): void {
  vaultStore.update((current) => ({
    ...current,
    targetBand: targetBand ?? current.targetBand,
    items: mergeAcceptedScripts(current.items, accepted, current.itemStats),
  }));
}
