/** Pure progress statistics derived from practice attempts. */
import { headlineScore, type Attempt } from "./attempt";
import { localDay } from "./stats";

export type AccentArea = "sounds" | "stress" | "rhythm" | "intonation";
export const ACCENT_AREAS: AccentArea[] = ["sounds", "stress", "rhythm", "intonation"];

export const AREA_ADVICE: Record<AccentArea, string> = {
  sounds: "Slow the model to 0.75x and copy individual vowels and consonants exactly.",
  stress: "Exaggerate the underlined words; let the small words go weak and quick.",
  rhythm: "Shadow phrase by phrase and keep the beat even, linking words together.",
  intonation: "Hum the model's melody first, then copy where the voice rises and falls.",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Reps per local day for the last `days` days, oldest first (for the calendar). */
export function dailyActivity(attempts: readonly Attempt[], now: Date, days = 35): { day: string; reps: number }[] {
  const counts = new Map<string, number>();
  for (const a of attempts) {
    const d = localDay(new Date(a.at));
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const out: { day: string; reps: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
    out.push({ day: d, reps: counts.get(d) ?? 0 });
  }
  return out;
}

/** Average headline score in the last 7 days vs the 7 days before (null when no data). */
export function weeklyTrend(attempts: readonly Attempt[], now: number): { thisWeek: number | null; lastWeek: number | null } {
  const inRange = (from: number, to: number) =>
    attempts.filter((a) => a.at > now - from * DAY_MS && a.at <= now - to * DAY_MS).map(headlineScore);
  return { thisWeek: avg(inRange(7, 0)), lastWeek: avg(inRange(14, 7)) };
}

/** Mean accent sub-scores over the most recent `n` attempts that have accent scores. */
export function recentAreaAverages(attempts: readonly Attempt[], n = 10): Record<AccentArea, number> | null {
  const scored = attempts.filter((a) => a.accent).slice(-n);
  if (scored.length === 0) return null;
  const out = {} as Record<AccentArea, number>;
  for (const area of ACCENT_AREAS) out[area] = avg(scored.map((a) => a.accent![area]))!;
  return out;
}

/** The lowest-scoring accent area, which is what to work on next. */
export function weakestArea(averages: Record<AccentArea, number> | null): AccentArea | null {
  if (!averages) return null;
  return ACCENT_AREAS.reduce((worst, area) => (averages[area] < averages[worst] ? area : worst), ACCENT_AREAS[0]);
}

/** The last `n` scored attempts as chart points, oldest first. */
export function scoreSeries(attempts: readonly Attempt[], n = 30): { at: number; score: number; scriptId: string }[] {
  return attempts.slice(-n).map((a) => ({ at: a.at, score: Math.round(headlineScore(a)), scriptId: a.scriptId }));
}
