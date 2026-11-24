/** A single scored delivery of a script, kept so learners can see before/after. */
export interface Attempt {
  id: string;
  scriptId: string;
  at: number; // epoch ms
  accuracy: number; // 0-100
  wpm: number;
  accent?: {
    overall: number;
    stress: number;
    rhythm: number;
    intonation: number;
    sounds: number;
  };
}

export const MAX_ATTEMPTS = 500;

/** Appends and keeps only the most recent `max` attempts. */
export function appendAttempt(list: readonly Attempt[], attempt: Attempt, max = MAX_ATTEMPTS): Attempt[] {
  const next = [...list, attempt];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Attempts for one script, oldest first. */
export function attemptsFor(list: readonly Attempt[], scriptId: string): Attempt[] {
  return list.filter((a) => a.scriptId === scriptId).sort((a, b) => a.at - b.at);
}

/** The attempt immediately before `attemptId` on the same script (for before/after). */
export function previousAttempt(list: readonly Attempt[], attemptId: string): Attempt | undefined {
  const target = list.find((a) => a.id === attemptId);
  if (!target) return undefined;
  const same = attemptsFor(list, target.scriptId);
  const idx = same.findIndex((a) => a.id === attemptId);
  return idx > 0 ? same[idx - 1] : undefined;
}

/** Score used for "best" and trends: accent overall when present, else accuracy. */
export function headlineScore(a: Attempt): number {
  return a.accent?.overall ?? a.accuracy;
}

export function isAttempt(value: unknown): value is Attempt {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.scriptId === "string" &&
    typeof v.at === "number" &&
    typeof v.accuracy === "number" &&
    typeof v.wpm === "number"
  );
}
