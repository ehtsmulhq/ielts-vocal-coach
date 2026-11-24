import { describe, expect, it } from "vitest";
import {
  appendTranscript,
  assignScriptIds,
  decideAutoAdvance,
  hasStudentSpeech,
  mergeAcceptedScripts,
  nextStage,
  PART2_MIN_WORDS,
} from "./capture";
import type { Lesson, TranscriptEntry } from "@/lib/types";
import { LEGACY_STARTERS } from "@/test/fixtures";
import { SHADOWING_LIBRARY } from "@/lib/shadowing-library";

const lesson = {
  topic: "Hometown",
  band: "7.5",
  hotSeatTest: {
    part1Questions: ["Where are you from?", "Do you work or study?", "What do you do in your free time?"],
    part3Questions: ["Why do people move to cities?", "Is city life better?"],
  },
} as unknown as Lesson;

const said = (role: "tutor" | "student", text: string, stage: "part1" | "part2" | "part3", id: number): TranscriptEntry => ({
  id,
  role,
  text,
  stage,
});

describe("transcript merging", () => {
  it("extends the current turn and starts a new one on a speaker or stage change", () => {
    let state = { entries: [] as TranscriptEntry[], nextId: 1 };
    state = appendTranscript(state.entries, "tutor", "Good morning.", "part1", state.nextId);
    state = appendTranscript(state.entries, "tutor", "Where are you from?", "part1", state.nextId);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].text).toBe("Good morning. Where are you from?");

    state = appendTranscript(state.entries, "student", "I'm from Leeds.", "part1", state.nextId);
    state = appendTranscript(state.entries, "student", "Now let's talk.", "part2", state.nextId);
    expect(state.entries.map((e) => e.id)).toEqual([1, 2, 3]);
    expect(state.nextId).toBe(4);
  });
});

describe("auto-advance", () => {
  it("follows the examiner announcing the next part", () => {
    const d = decideAutoAdvance(lesson, "part1", [], "Now I'm going to give you a topic for Part 2.", false);
    expect(d?.action).toBe("next");
  });

  it("moves on from Part 1 once every question has a real answer", () => {
    const answers = [1, 2, 3].map((i) => said("student", "I really enjoy living there a lot", "part1", i));
    expect(decideAutoAdvance(lesson, "part1", answers.slice(0, 2), "", true)).toBeNull();
    expect(decideAutoAdvance(lesson, "part1", answers, "", true)?.action).toBe("next");
    // Count-based moves only happen at the end of a turn, never mid-sentence.
    expect(decideAutoAdvance(lesson, "part1", answers, "", false)).toBeNull();
  });

  it("waits for a proper long turn in Part 2", () => {
    const short = [said("student", "word ".repeat(60), "part2", 1)];
    const long = [said("student", "word ".repeat(PART2_MIN_WORDS), "part2", 1)];
    expect(decideAutoAdvance(lesson, "part2", short, "", true)).toBeNull();
    expect(decideAutoAdvance(lesson, "part2", long, "", true)?.action).toBe("next");
  });

  it("finishes after the Part 3 questions", () => {
    const answers = [1, 2].map((i) => said("student", "Because opportunities are concentrated there", "part3", i));
    expect(decideAutoAdvance(lesson, "part3", answers, "", true)?.action).toBe("finish");
  });

  it("knows the stage order", () => {
    expect(nextStage("part1")).toBe("part2");
    expect(nextStage("part3")).toBeNull();
  });
});

describe("script merge", () => {
  const starters = LEGACY_STARTERS;
  const proposed = assignScriptIds(SHADOWING_LIBRARY.slice(0, 2), 123);

  it("assigns unique ids that never reuse existing ones", () => {
    expect(proposed.map((s) => s.id)).toEqual([
      `mine-${SHADOWING_LIBRARY[0].category}-123-0`,
      `mine-${SHADOWING_LIBRARY[1].category}-123-1`,
    ]);
  });

  it("strips breath marks that leak into the script text", () => {
    const [s] = assignScriptIds([{ ...SHADOWING_LIBRARY[0], upgradedScript: "To be honest, | I cook | a lot." }], 1);
    expect(s.upgradedScript).toBe("To be honest, I cook a lot.");
  });

  it("adds new scripts first and retires only untouched starters", () => {
    const practisedStarter = starters[0].id;
    const merged = mergeAcceptedScripts(starters, proposed, {
      [practisedStarter]: { reps: 3, bestAccentScore: 70, lastPracticedAt: 1 },
    });
    expect(merged.slice(0, 2).map((s) => s.id)).toEqual(proposed.map((s) => s.id));
    expect(merged.map((s) => s.id)).toContain(practisedStarter);
    expect(merged).toHaveLength(3);
  });

  it("keeps earlier personal scripts when new ones arrive", () => {
    const first = mergeAcceptedScripts(starters, proposed, {});
    const second = mergeAcceptedScripts(first, assignScriptIds(SHADOWING_LIBRARY.slice(2, 3), 456), {});
    expect(second).toHaveLength(3);
    expect(second[0].id).toContain("-456-");
  });

  it("changes nothing when no scripts are accepted", () => {
    expect(mergeAcceptedScripts(starters, [], {})).toEqual(starters);
  });

  it("detects whether the learner spoke", () => {
    expect(hasStudentSpeech([said("tutor", "Hello", "part1", 1)])).toBe(false);
    expect(hasStudentSpeech([said("student", " hi ", "part1", 1)])).toBe(true);
  });
});
