import { describe, expect, it } from "vitest";
import { buildGreeting, timeOfDay } from "./greeting";

describe("coach greeting", () => {
  it("picks the time of day", () => {
    expect(timeOfDay(8)).toBe("morning");
    expect(timeOfDay(14)).toBe("afternoon");
    expect(timeOfDay(21)).toBe("evening");
  });

  it("greets a returning learner personally", () => {
    const text = buildGreeting({
      learnerName: "Sam",
      hour: 9,
      streak: 4,
      totalReps: 20,
      lastScore: 78.4,
      focusArea: "rhythm",
      scriptTopic: "Food & cooking",
    });
    expect(text).toBe(
      "Good morning, Sam. That's 4 days in a row. Brilliant. Last time you scored 78. Today let's work on your rhythm and linking. I've picked Food & cooking for you. Shall we start?"
    );
  });

  it("never calls it a first rep once there is a score", () => {
    const text = buildGreeting({ learnerName: "", hour: 10, streak: 0, totalReps: 0, lastScore: 80 });
    expect(text).not.toContain("very first rep");
    expect(text).toContain("Last time you scored 80.");
  });

  it("works for a brand-new learner without a name", () => {
    expect(buildGreeting({ learnerName: "", hour: 19, streak: 0, totalReps: 0 })).toBe(
      "Good evening. Let's get started with your very first rep."
    );
  });
});
