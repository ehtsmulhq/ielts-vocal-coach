import { describe, expect, it } from "vitest";
import { captureReducer, initialCaptureState, type CaptureAction, type CaptureState } from "./captureReducer";
import type { Lesson } from "@/lib/types";

const lesson = {
  topic: "Hometown",
  band: "7.5",
  hotSeatTest: {
    part1Questions: ["Where are you from?", "Do you work or study?", "What do you enjoy doing at weekends?"],
    part3Questions: ["Why do people move to cities?"],
  },
} as unknown as Lesson;

const run = (actions: CaptureAction[], start: CaptureState = initialCaptureState()) => actions.reduce(captureReducer, start);
const live: CaptureAction = {
  type: "LIVE",
  lesson,
  band: "7.5",
  model: "m",
  startedAt: 1,
  micAnalyser: null,
  tutorAnalyser: null,
};

describe("captureReducer", () => {
  it("records the transcript against the current stage", () => {
    const s = run([
      live,
      { type: "TRANSCRIPT", role: "tutor", text: "Hello." },
      { type: "TRANSCRIPT", role: "tutor", text: "Where are you from?" },
      { type: "TRANSCRIPT", role: "student", text: "I'm from Leeds." },
      { type: "NEXT_STAGE" },
      { type: "TRANSCRIPT", role: "student", text: "Let me describe it." },
    ]);
    expect(s.transcript.map((e) => [e.role, e.stage])).toEqual([
      ["tutor", "part1"],
      ["student", "part1"],
      ["student", "part2"],
    ]);
    expect(s.stage).toBe("part2");
    expect(s.lastTutorText).toBe("");
  });

  it("ignores transcript fragments when not live", () => {
    expect(run([{ type: "TRANSCRIPT", role: "student", text: "hi" }]).transcript).toEqual([]);
  });

  it("tracks the question the examiner asked and answered turns", () => {
    let s = run([live, { type: "TRANSCRIPT", role: "tutor", text: "Thank you. Next, do you work or do you study?" }]);
    expect(s.activeQuestionIdx).toBe(1);
    s = run(
      [
        { type: "TRANSCRIPT", role: "student", text: "I work as a nurse in a big hospital" },
        { type: "TURN_COMPLETE" },
      ],
      s
    );
    expect(s.turnSeq).toBe(1);
    expect(s.activeQuestionIdx).toBeGreaterThanOrEqual(1);
  });

  it("moves to grading after the last stage or on finish", () => {
    const afterAll = run([live, { type: "NEXT_STAGE" }, { type: "NEXT_STAGE" }, { type: "NEXT_STAGE" }]);
    expect(afterAll.status).toBe("grading");
    expect(run([live, { type: "FINISH" }]).status).toBe("grading");
    expect(run([{ type: "FINISH" }]).status).toBe("idle");
  });

  it("only ticks the timer while live", () => {
    expect(run([live, { type: "TICK" }, { type: "TICK" }]).seconds).toBe(2);
    expect(run([{ type: "TICK" }]).seconds).toBe(0);
  });

  it("restores a saved draft straight into grading", () => {
    const s = run([
      {
        type: "RESTORE_FOR_GRADING",
        draft: {
          lesson,
          band: "6.5",
          transcript: [{ id: 7, role: "student", text: "Hi", stage: "part1" }],
          stage: "part1",
          seconds: 40,
          startedAt: 5,
          updatedAt: 6,
        },
      },
    ]);
    expect(s.status).toBe("grading");
    expect(s.nextId).toBe(8);
    expect(s.seconds).toBe(40);
  });

  it("keeps mic preferences across a reset", () => {
    const s = run([{ type: "SET_MIC_MODE", mode: "push-to-talk" }, live, { type: "RESET" }]);
    expect(s.micMode).toBe("push-to-talk");
    expect(s.status).toBe("idle");
  });
});
