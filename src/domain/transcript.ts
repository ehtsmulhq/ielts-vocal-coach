/** Pure transcript helpers shared by the capture interview and grading. */

export interface TranscriptLine {
  role: "tutor" | "student";
  text: string;
  stage: string;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Total words the student spoke, optionally limited to one stage. */
export function studentWordCount(entries: readonly TranscriptLine[], stage?: string): number {
  return entries
    .filter((t) => t.role === "student" && (stage === undefined || t.stage === stage))
    .reduce((acc, t) => acc + countWords(t.text), 0);
}

/** Number of non-empty student turns across the whole transcript. */
export function studentTurnCount(entries: readonly TranscriptLine[]): number {
  return entries.filter((t) => t.role === "student" && t.text.trim().length > 0).length;
}

/** Student turns in a stage long enough to count as an answer (not "um", "yes"). */
export function substantiveTurnCount(entries: readonly TranscriptLine[], stage: string, minWords = 4): number {
  return entries.filter((t) => t.role === "student" && t.stage === stage && countWords(t.text) >= minWords).length;
}

/** Words per minute, or `fallback` when the sample is too short to be meaningful. */
export function cadenceWpm(words: number, seconds: number, fallback = 0, minSeconds = 5): number {
  if (seconds <= minSeconds || words <= 0) return fallback;
  return Math.round(words / (seconds / 60));
}
