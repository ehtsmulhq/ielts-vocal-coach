/**
 * What the voice coach should know about the learner when a lesson starts:
 * how recently and how often they practise, how this script has gone, and
 * where they are on the page. Pure, so it can be tested with a fixed clock.
 */
import { headlineScore, type Attempt } from "./attempt";
import type { TutorContext } from "./contracts";
import type { AccentArea } from "./progress";
import { activeStreak, localDay } from "./stats";

/** One lesson with the voice coach (when it connected, on which script). */
export interface LessonVisit {
  at: number;
  scriptId: string;
}

export type PracticePhase = NonNullable<TutorContext["phase"]>;

export function partOfDay(hour: number): NonNullable<TutorContext["partOfDay"]> {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

/** Whole local calendar days between two moments (0 = same day), robust to DST. */
export function calendarDaysBetween(earlier: number, now: Date): number {
  const a = new Date(earlier);
  const startA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const startB = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((startB - startA) / 86_400_000));
}

export interface LearnerContextInput {
  now: Date;
  scriptId: string;
  phase: PracticePhase;
  attempts: readonly Attempt[];
  lessons: readonly LessonVisit[];
  focusArea?: AccentArea | null;
  streak: number;
  lastPracticeDay?: string;
}

const round = (n: number) => Math.round(n);

export function buildLearnerContext(input: LearnerContextInput): TutorContext {
  const { now, scriptId, attempts, lessons } = input;
  const nowMs = now.getTime();
  const today = localDay(now);
  const isToday = (at: number) => localDay(new Date(at)) === today;

  const mine = attempts.filter((a) => a.scriptId === scriptId).sort((a, b) => a.at - b.at);
  const last = mine[mine.length - 1];
  const previous = mine[mine.length - 2];
  const lessonsBefore = lessons.filter((l) => l.at <= nowMs).sort((a, b) => a.at - b.at);
  const lastLesson = lessonsBefore[lessonsBefore.length - 1];
  const tipOf = (a?: Attempt) => (typeof a?.focusTip === "string" && a.focusTip.trim() ? a.focusTip.trim() : undefined);
  const latestTip = tipOf([...attempts].sort((a, b) => b.at - a.at).find((a) => tipOf(a)));

  const lastActivity = Math.max(attempts.reduce((m, a) => Math.max(m, a.at), 0), lastLesson?.at ?? 0);

  return {
    focusArea: input.focusArea ?? undefined,
    lastScore: last ? round(headlineScore(last)) : undefined,
    previousScore: previous ? round(headlineScore(previous)) : undefined,
    bestScore: mine.length ? round(Math.max(...mine.map(headlineScore))) : undefined,
    reps: mine.length,
    daysSinceScriptPractice: last ? calendarDaysBetween(last.at, now) : undefined,
    lastFocusTip: (tipOf(last) ?? latestTip)?.slice(0, 300),
    phase: input.phase,
    partOfDay: partOfDay(now.getHours()),
    lessonsToday: lessonsBefore.filter((l) => isToday(l.at)).length,
    minutesSinceLastLesson: lastLesson ? Math.max(0, round((nowMs - lastLesson.at) / 60_000)) : undefined,
    daysSinceLastPractice: lastActivity > 0 ? calendarDaysBetween(lastActivity, now) : undefined,
    repsToday: attempts.filter((a) => isToday(a.at)).length,
    streakDays: activeStreak(input.lastPracticeDay, input.streak, now),
    totalLessons: lessonsBefore.length,
    totalReps: attempts.length,
  };
}
