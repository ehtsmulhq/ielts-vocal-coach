/** Pure practice-statistics helpers (no React, no storage). */

export interface ItemStats {
  reps: number;
  bestAccentScore: number; // 0-100, 0 if never scored
  lastPracticedAt: number;
}

/** Local calendar day as YYYY-MM-DD. */
export function localDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The previous local calendar day, robust to DST changes. */
export function previousLocalDay(d: Date): string {
  const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return localDay(prev);
}

/**
 * Consecutive-day streak after practising on `now`.
 * Same day keeps the streak, the next day extends it, any gap restarts at 1.
 */
export function nextDayStreak(lastPracticeDay: string | undefined, currentStreak: number, now: Date): number {
  const today = localDay(now);
  if (lastPracticeDay === today) return Math.max(1, currentStreak);
  if (lastPracticeDay === previousLocalDay(now)) return currentStreak + 1;
  return 1;
}

/** A streak only counts if the learner practised today or yesterday. */
export function activeStreak(lastPracticeDay: string | undefined, streak: number, now: Date): number {
  if (!lastPracticeDay) return 0;
  if (lastPracticeDay === localDay(now) || lastPracticeDay === previousLocalDay(now)) return streak;
  return 0;
}

export function applyRep(prev: ItemStats | undefined, accentScore: number | undefined, now: number): ItemStats {
  const base = prev ?? { reps: 0, bestAccentScore: 0, lastPracticedAt: 0 };
  const score = Number.isFinite(accentScore) ? Math.max(0, Math.min(100, accentScore as number)) : 0;
  return {
    reps: base.reps + 1,
    bestAccentScore: Math.max(base.bestAccentScore, score),
    lastPracticedAt: now,
  };
}
