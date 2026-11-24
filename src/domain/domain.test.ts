import { describe, expect, it } from "vitest";
import { activeStreak, applyRep, localDay, nextDayStreak, previousLocalDay } from "./stats";
import { cadenceWpm, countWords, studentTurnCount, studentWordCount, substantiveTurnCount } from "./transcript";
import { safeParseJson } from "./json";
import { appendAttempt, attemptsFor, headlineScore, isAttempt, previousAttempt, type Attempt } from "./attempt";
import { computeImprovementDelta, type HotSeatSessionRecord, type NewSessionRecord } from "./improvement";

describe("stats", () => {
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

  it("formats local days and finds yesterday across month boundaries", () => {
    expect(localDay(d(2026, 3, 1))).toBe("2026-03-01");
    expect(previousLocalDay(d(2026, 3, 1))).toBe("2026-02-28");
    expect(previousLocalDay(d(2026, 1, 1))).toBe("2025-12-31");
  });

  it("extends, keeps or restarts the day streak", () => {
    expect(nextDayStreak(undefined, 0, d(2026, 5, 10))).toBe(1);
    expect(nextDayStreak("2026-05-10", 3, d(2026, 5, 10))).toBe(3);
    expect(nextDayStreak("2026-05-09", 3, d(2026, 5, 10))).toBe(4);
    expect(nextDayStreak("2026-05-07", 3, d(2026, 5, 10))).toBe(1);
  });

  it("reports a streak as broken after a missed day", () => {
    expect(activeStreak("2026-05-09", 4, d(2026, 5, 10))).toBe(4);
    expect(activeStreak("2026-05-08", 4, d(2026, 5, 10))).toBe(0);
    expect(activeStreak(undefined, 4, d(2026, 5, 10))).toBe(0);
  });

  it("counts reps and keeps the best clamped score", () => {
    const first = applyRep(undefined, 72, 1);
    expect(first).toEqual({ reps: 1, bestAccentScore: 72, lastPracticedAt: 1 });
    const second = applyRep(first, 65, 2);
    expect(second).toEqual({ reps: 2, bestAccentScore: 72, lastPracticedAt: 2 });
    expect(applyRep(second, 150, 3).bestAccentScore).toBe(100);
    expect(applyRep(second, undefined, 3).bestAccentScore).toBe(72);
  });
});

describe("transcript", () => {
  const entries = [
    { role: "tutor" as const, text: "Tell me about your hometown.", stage: "part1" },
    { role: "student" as const, text: "  I grew up in a small coastal town ", stage: "part1" },
    { role: "student" as const, text: "yes", stage: "part1" },
    { role: "student" as const, text: "", stage: "part2" },
    { role: "student" as const, text: "It was a quiet place by the sea", stage: "part2" },
  ];

  it("counts words robustly", () => {
    expect(countWords("  hello   world ")).toBe(2);
    expect(countWords("")).toBe(0);
  });

  it("counts student words overall and per stage", () => {
    expect(studentWordCount(entries)).toBe(8 + 1 + 8);
    expect(studentWordCount(entries, "part2")).toBe(8);
  });

  it("counts turns and substantive answers", () => {
    expect(studentTurnCount(entries)).toBe(3);
    expect(substantiveTurnCount(entries, "part1")).toBe(1);
  });

  it("computes cadence only for meaningful samples", () => {
    expect(cadenceWpm(130, 60)).toBe(130);
    expect(cadenceWpm(10, 3, 125)).toBe(125);
    expect(cadenceWpm(0, 60, 99)).toBe(99);
  });
});

describe("safeParseJson", () => {
  it("parses plain, fenced and wrapped JSON", () => {
    expect(safeParseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseJson<{ a: number }>('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(safeParseJson<number[]>("Here you go: [1,2,3] hope that helps")).toEqual([1, 2, 3]);
  });

  it("repairs trailing commas", () => {
    expect(safeParseJson<{ a: number[] }>('note {"a":[1,2,],}')).toEqual({ a: [1, 2] });
  });

  it("throws on text with no JSON", () => {
    expect(() => safeParseJson("no json here")).toThrow(/Failed to parse/);
  });
});

describe("attempts", () => {
  const mk = (id: string, scriptId: string, at: number, accuracy: number, overall?: number): Attempt => ({
    id,
    scriptId,
    at,
    accuracy,
    wpm: 130,
    accent: overall === undefined ? undefined : { overall, stress: 1, rhythm: 1, intonation: 1, sounds: 1 },
  });

  it("caps history at the most recent entries", () => {
    let list: Attempt[] = [];
    for (let i = 0; i < 5; i++) list = appendAttempt(list, mk(`a${i}`, "s", i, 50), 3);
    expect(list.map((a) => a.id)).toEqual(["a2", "a3", "a4"]);
  });

  it("finds the previous attempt on the same script only", () => {
    const list = [mk("a", "s1", 1, 50), mk("b", "s2", 2, 60), mk("c", "s1", 3, 70)];
    expect(attemptsFor(list, "s1").map((a) => a.id)).toEqual(["a", "c"]);
    expect(previousAttempt(list, "c")?.id).toBe("a");
    expect(previousAttempt(list, "a")).toBeUndefined();
    expect(previousAttempt(list, "missing")).toBeUndefined();
  });

  it("prefers the accent score as the headline", () => {
    expect(headlineScore(mk("a", "s", 1, 50, 80))).toBe(80);
    expect(headlineScore(mk("a", "s", 1, 50))).toBe(50);
  });

  it("validates stored attempts", () => {
    expect(isAttempt(mk("a", "s", 1, 50))).toBe(true);
    expect(isAttempt({ id: "x" })).toBe(false);
    expect(isAttempt(null)).toBe(false);
  });
});

describe("computeImprovementDelta", () => {
  const record = (overall: number, fluency: number, words: number, wpm: number): NewSessionRecord => ({
    timestamp: 1,
    targetBand: "7.5",
    overallBand: overall,
    subScores: { pronunciation: 6.5, fluency, lexical: 7, grammar: 7 },
    metrics: { wpm, totalStudentWords: words, durationSeconds: 300, turnCount: 8 },
    cambridgeTopic: "Hometown",
  });

  it("returns a baseline for the first session", () => {
    const delta = computeImprovementDelta(undefined, record(6.5, 6.5, 200, 120));
    expect(delta.overallDelta).toBe(0);
    expect(delta.keyWins[0]).toMatch(/baseline \(6\.5 band\)/);
  });

  it("reports improvements and focus areas against the previous session", () => {
    const prev = { ...record(6.0, 6.0, 150, 110), id: "p", dayNumber: 1, dateStr: "" } as HotSeatSessionRecord;
    const delta = computeImprovementDelta(prev, record(6.5, 6.5, 200, 120));
    expect(delta.overallDelta).toBe(0.5);
    expect(delta.fluencyDelta).toBe(0.5);
    expect(delta.wpmDelta).toBe(10);
    expect(delta.keyWins.some((w) => w.includes("50 more words"))).toBe(true);
    expect(delta.focusAreasForTomorrow.some((f) => f.includes("0.85x"))).toBe(true);
  });
});
