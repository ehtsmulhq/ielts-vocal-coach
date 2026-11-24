import { describe, expect, it } from "vitest";
import { extraWordRatio, isFaithfulReading, readingCoverage } from "./reading";

const script = "To be honest, I'm not a natural cook, but I've grown to enjoy it.";

describe("reading checks", () => {
  it("accepts a verbatim reading regardless of punctuation and case", () => {
    expect(readingCoverage(script, "to be honest I'm not a natural cook but I've grown to enjoy it")).toBe(1);
    expect(isFaithfulReading(script, "To be honest I’m not a natural cook, but I’ve grown to enjoy it.")).toBe(true);
  });

  it("rejects chatter and skipped words", () => {
    const chatty = "Sure! Here is the reading you asked for. To be honest, I'm not a natural cook, but I've grown to enjoy it. Let me know!";
    expect(extraWordRatio(script, chatty)).toBeGreaterThan(0.1);
    expect(isFaithfulReading(script, chatty)).toBe(false);
    expect(isFaithfulReading(script, "To be honest, I'm a cook.")).toBe(false);
  });

  it("measures coverage in order", () => {
    expect(readingCoverage("a b c d", "d c b a")).toBe(0.25);
    expect(readingCoverage("", "anything")).toBe(1);
    expect(readingCoverage("words here", "")).toBe(0);
  });
});
