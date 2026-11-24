/**
 * Pure logic for the capture interview: transcript merging, question tracking,
 * auto-advance decisions and the non-destructive merge of new scripts.
 */
import type { ScriptItem } from "./contracts";
import type { ItemStats } from "./stats";
import { countWords, studentWordCount, substantiveTurnCount } from "./transcript";
import { detectSpokenStageTransition, findSpokenQuestionIndex } from "@/lib/voice-tracking";
import type { Lesson, Stage, TranscriptEntry } from "@/lib/types";

export const STAGE_ORDER: Stage[] = ["part1", "part2", "part3"];

export function nextStage(stage: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

/** Live transcription arrives in fragments: extend the speaker's current turn, or start a new one. */
export function appendTranscript(
  entries: readonly TranscriptEntry[],
  role: TranscriptEntry["role"],
  text: string,
  stage: Stage,
  nextId: number
): { entries: TranscriptEntry[]; nextId: number } {
  const last = entries[entries.length - 1];
  if (last && last.role === role && last.stage === stage) {
    return {
      entries: [...entries.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }],
      nextId,
    };
  }
  return { entries: [...entries, { id: nextId, role, text: text.trim(), stage }], nextId: nextId + 1 };
}

export function questionsFor(lesson: Lesson, stage: Stage): string[] {
  const test = lesson.hotSeatTest;
  if (stage === "part1") return test?.part1Questions ?? [];
  if (stage === "part3") return test?.part3Questions ?? [];
  return [];
}

/** Which question the examiner just asked (highlights it on the card), if recognisable. */
export function spokenQuestionIndex(lesson: Lesson, stage: Stage, tutorText: string): number | null {
  const questions = questionsFor(lesson, stage);
  return questions.length ? findSpokenQuestionIndex(tutorText, questions) : null;
}

/** Part 2 asks for 1–2 minutes of speech; ~150 words is roughly a minute and a quarter. */
export const PART2_MIN_WORDS = 150;

export interface AdvanceDecision {
  action: "next" | "finish";
  notice: string;
  delayMs: number;
}

/**
 * Should the interview move on? The examiner announcing the next part is the
 * strongest signal; otherwise move on once the learner has answered every
 * question (Parts 1 and 3) or spoken enough (Part 2). The explicit
 * "Next part" button always works regardless.
 */
export function decideAutoAdvance(
  lesson: Lesson,
  stage: Stage,
  entries: readonly TranscriptEntry[],
  lastTutorText: string,
  afterTurn: boolean
): AdvanceDecision | null {
  const spoken = lastTutorText ? detectSpokenStageTransition(lastTutorText) : null;
  if (spoken === "part2" && stage === "part1") return { action: "next", notice: "Moving on to Part 2…", delayMs: 1500 };
  if (spoken === "part3" && stage === "part2") return { action: "next", notice: "Moving on to Part 3…", delayMs: 1500 };
  if (spoken === "finish" && stage === "part3") return { action: "finish", notice: "Interview finished. Preparing your report…", delayMs: 1500 };
  if (!afterTurn) return null;

  if (stage === "part2") {
    return studentWordCount(entries, "part2") >= PART2_MIN_WORDS
      ? { action: "next", notice: "Long turn complete. Moving on to Part 3…", delayMs: 2500 }
      : null;
  }
  const total = questionsFor(lesson, stage).length || 3;
  if (substantiveTurnCount(entries, stage) >= total) {
    return stage === "part1"
      ? { action: "next", notice: "Part 1 complete. Moving on to Part 2…", delayMs: 2500 }
      : { action: "finish", notice: "Interview finished. Preparing your report…", delayMs: 2000 };
  }
  return null;
}

// ---------------------------------------------------------------- scripts

const STARTER_PREFIX = "canonical-";

export function isStarterScript(script: ScriptItem): boolean {
  return script.id.startsWith(STARTER_PREFIX);
}

/** Gives generated scripts stable, unique ids so they never collide with or replace existing ones. */
export function assignScriptIds(scripts: readonly ScriptItem[], createdAt: number): ScriptItem[] {
  return scripts.map((s, i) => ({
    ...s,
    id: `mine-${s.category}-${createdAt}-${i}`,
    // Breath marks belong in thoughtChunks only; the model sometimes leaks them into the text.
    upgradedScript: s.upgradedScript.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

/**
 * Adds accepted scripts to the learner's collection without destroying anything:
 * new scripts go first, earlier personal scripts are kept, and untouched starter
 * scripts are retired once the learner has scripts of their own (starters they
 * have practised are kept so their history stays meaningful).
 */
export function mergeAcceptedScripts(
  existing: readonly ScriptItem[],
  accepted: readonly ScriptItem[],
  stats: Record<string, ItemStats> | undefined
): ScriptItem[] {
  if (accepted.length === 0) return [...existing];
  const acceptedIds = new Set(accepted.map((s) => s.id));
  const kept = existing.filter(
    (s) => !acceptedIds.has(s.id) && (!isStarterScript(s) || (stats?.[s.id]?.reps ?? 0) > 0)
  );
  return [...accepted, ...kept];
}

/** Rough check that a learner actually spoke enough to grade. */
export function hasStudentSpeech(entries: readonly TranscriptEntry[]): boolean {
  return entries.some((e) => e.role === "student" && countWords(e.text) > 0);
}
