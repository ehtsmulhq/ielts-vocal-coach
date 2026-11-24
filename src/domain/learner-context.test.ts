import { describe, expect, it } from "vitest";
import { buildLearnerContext, calendarDaysBetween, partOfDay } from "./learner-context";
import type { Attempt } from "./attempt";

const NOW = new Date(2026, 10, 24, 19, 30); // 24 Nov 2026, 19:30 local
const minutesAgo = (m: number) => NOW.getTime() - m * 60_000;
const daysAgo = (d: number, hour = 10) => new Date(2026, 10, 24 - d, hour).getTime();

const attempt = (scriptId: string, at: number, overall: number, focusTip?: string): Attempt => ({
  id: `${scriptId}-${at}`,
  scriptId,
  at,
  accuracy: 90,
  wpm: 130,
  accent: { overall, stress: overall, rhythm: overall, intonation: overall, sounds: overall },
  focusTip,
});

const base = { now: NOW, scriptId: "s1", phase: "listen" as const, streak: 0 };

describe("learner context", () => {
  it("knows a brand-new learner", () => {
    const c = buildLearnerContext({ ...base, attempts: [], lessons: [] });
    expect(c).toMatchObject({ totalLessons: 0, totalReps: 0, reps: 0, lessonsToday: 0, partOfDay: "evening", phase: "listen" });
    expect(c.daysSinceLastPractice).toBeUndefined();
    expect(c.minutesSinceLastLesson).toBeUndefined();
  });

  it("counts earlier lessons today and how long ago the last one was", () => {
    const c = buildLearnerContext({
      ...base,
      attempts: [],
      lessons: [
        { at: daysAgo(1), scriptId: "s1" },
        { at: minutesAgo(180), scriptId: "s2" },
        { at: minutesAgo(5), scriptId: "s1" },
      ],
    });
    expect(c.lessonsToday).toBe(2);
    expect(c.minutesSinceLastLesson).toBe(5);
    expect(c.daysSinceLastPractice).toBe(0);
    expect(c.totalLessons).toBe(3);
  });

  it("notices a gap of several days", () => {
    const c = buildLearnerContext({ ...base, attempts: [attempt("s2", daysAgo(4), 70)], lessons: [{ at: daysAgo(4), scriptId: "s2" }] });
    expect(c.daysSinceLastPractice).toBe(4);
    expect(c.lessonsToday).toBe(0);
    expect(c.reps).toBe(0);
  });

  it("summarises this script's history and keeps the last focus tip", () => {
    const c = buildLearnerContext({
      ...base,
      attempts: [attempt("s1", daysAgo(2), 70), attempt("s1", daysAgo(1), 82, "Link 'I'd' smoothly"), attempt("s2", minutesAgo(30), 60)],
      lessons: [],
      streak: 3,
      lastPracticeDay: "2026-11-24",
      focusArea: "rhythm",
    });
    expect(c).toMatchObject({
      reps: 2,
      lastScore: 82,
      previousScore: 70,
      bestScore: 82,
      daysSinceScriptPractice: 1,
      lastFocusTip: "Link 'I'd' smoothly",
      repsToday: 1,
      streakDays: 3,
      focusArea: "rhythm",
      totalReps: 3,
    });
  });

  it("drops a streak that has lapsed and ignores malformed tips", () => {
    const bad = { ...attempt("s1", daysAgo(5), 50), focusTip: 42 } as unknown as Attempt;
    const c = buildLearnerContext({ ...base, attempts: [bad], lessons: [], streak: 9, lastPracticeDay: "2026-11-19" });
    expect(c.streakDays).toBe(0);
    expect(c.lastFocusTip).toBeUndefined();
  });

  it("splits the day and counts calendar days across midnight", () => {
    expect([5, 12, 18, 23, 2].map(partOfDay)).toEqual(["morning", "afternoon", "evening", "night", "night"]);
    expect(calendarDaysBetween(new Date(2026, 10, 23, 23, 50).getTime(), new Date(2026, 10, 24, 0, 10))).toBe(1);
    expect(calendarDaysBetween(minutesAgo(60), NOW)).toBe(0);
  });
});
