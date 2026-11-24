import { describe, expect, it } from "vitest";
import { buildGreeting, timeOfDay } from "./greeting";

describe("fallback coach greeting", () => {
  it("picks the time of day", () => {
    expect(timeOfDay(8)).toBe("morning");
    expect(timeOfDay(14)).toBe("afternoon");
    expect(timeOfDay(21)).toBe("evening");
  });

  it("talks about progress in words, never in numbers", () => {
    const text = buildGreeting({
      learnerName: "Sam",
      hour: 9,
      streak: 4,
      totalReps: 20,
      lastScore: 85,
      previousScore: 72,
      daysSinceLastPractice: 1,
      focusArea: "rhythm",
      scriptTopic: "food & cooking",
    });
    expect(text).not.toMatch(/\d/);
    expect(text).toContain("Sam");
    expect(text).toContain("real step up");
    expect(text).toContain("rhythm and linking");
    expect(text).toContain("food & cooking");
  });

  it("is glad to see someone back after a break, without guilt", () => {
    const text = buildGreeting({ learnerName: "", hour: 10, streak: 0, totalReps: 9, lastScore: 70, daysSinceLastPractice: 6 });
    expect(text).toMatch(/back|again/i);
    expect(text).not.toMatch(/\d/);
  });

  it("varies its wording from day to day", () => {
    const base = { learnerName: "", hour: 10, streak: 0, totalReps: 9, lastScore: 70, daysSinceLastPractice: 1 };
    const texts = new Set([0, 1, 2].map((seed) => buildGreeting({ ...base, seed })));
    expect(texts.size).toBeGreaterThan(1);
  });

  it("never calls it a first rep once there is a score", () => {
    expect(buildGreeting({ learnerName: "", hour: 10, streak: 0, totalReps: 0, lastScore: 80 })).not.toContain("very first rep");
  });

  it("works for a brand-new learner without a name", () => {
    expect(buildGreeting({ learnerName: "", hour: 19, streak: 0, totalReps: 0 })).toBe("Let's get started with your very first rep.");
  });
});
