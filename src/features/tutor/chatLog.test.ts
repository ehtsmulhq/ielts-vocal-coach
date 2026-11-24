import { describe, expect, it } from "vitest";
import { nextLog, type ChatMessage, type Captions } from "./chatLog";

const empty: Captions = { caption: "", learner: "" };
const cap = (caption: string, learner = ""): Captions => ({ caption, learner });

describe("chat history from captions", () => {
  it("grows one bubble while the coach keeps talking, then starts a new one", () => {
    let log: ChatMessage[] = [];
    let prev = empty;
    for (const next of [cap("Hi"), cap("Hi Sam"), cap("Hi Sam, welcome."), cap("Listen first.")]) {
      log = nextLog(log, prev, next);
      prev = next;
    }
    expect(log.map((m) => [m.role, m.text])).toEqual([
      ["coach", "Hi Sam, welcome."],
      ["coach", "Listen first."],
    ]);
  });

  it("puts what the learner says in its own bubble, in order", () => {
    let log: ChatMessage[] = [];
    let prev = empty;
    const steps = [cap("Hi Sam."), cap("Hi Sam.", "can you"), cap("Hi Sam.", "can you say it slower"), cap("Of course.", "can you say it slower")];
    for (const next of steps) {
      log = nextLog(log, prev, next);
      prev = next;
    }
    expect(log.map((m) => [m.role, m.text])).toEqual([
      ["coach", "Hi Sam."],
      ["you", "can you say it slower"],
      ["coach", "Of course."],
    ]);
  });

  it("starts a new learner bubble after the turn's captions were cleared", () => {
    let log: ChatMessage[] = [];
    let prev = empty;
    for (const next of [cap("", "slower"), cap("Sure."), cap("Sure.", "thanks")]) {
      log = nextLog(log, prev, next);
      prev = next;
    }
    expect(log.filter((m) => m.role === "you").map((m) => m.text)).toEqual(["slower", "thanks"]);
  });

  it("ignores empty captions and keeps ids unique", () => {
    const log = nextLog(nextLog([], empty, cap("One")), cap("One"), cap("Two"));
    expect(nextLog(log, cap("Two"), empty)).toBe(log);
    expect(new Set(log.map((m) => m.id)).size).toBe(log.length);
  });

  it("keeps the history bounded", () => {
    let log: ChatMessage[] = [];
    let prev = empty;
    for (let i = 0; i < 150; i++) {
      const next = cap(`turn ${i}`);
      log = nextLog(log, prev, next);
      prev = next;
    }
    expect(log.length).toBe(100);
    expect(log[log.length - 1].text).toBe("turn 149");
  });
});
