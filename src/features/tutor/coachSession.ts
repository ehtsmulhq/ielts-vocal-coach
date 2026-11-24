import type { ScriptItem } from "@/domain/contracts";
import { plainText } from "@/domain/plain-text";
import { SESSION_KEYS } from "@/storage/registry";
import type { ChatMessage } from "./chatLog";

/** The script as the token route expects it. */
export function coachScript(script: ScriptItem) {
  return {
    title: script.part ? `${script.topic ?? script.title}` : script.title,
    question: script.question,
    upgradedScript: script.upgradedScript,
    thoughtChunks: script.thoughtChunks,
    stressedWords: script.stressedWords,
    targetCollocations: script.targetCollocations,
  };
}

const cap = (s: string, n: number) => plainText(s).slice(0, n);

/** A compact, sanitised script for the `[EVENT] new_script` message, with the same caps as the token request. */
export function scriptEvent(script: ScriptItem) {
  const s = coachScript(script);
  return {
    topic: cap(s.title, 120),
    question: cap(s.question, 300),
    script: cap(s.upgradedScript, 1500),
    breathGroups: s.thoughtChunks.slice(0, 30).map((c) => cap(c.replace(/\s*\|\s*$/, ""), 300)),
    stressedWords: s.stressedWords.slice(0, 12).map((w) => cap(w, 40)),
    keyPhrases: s.targetCollocations.slice(0, 6).map((c) => `${cap(c.phrase, 100)} (${cap(c.phoneticTip, 200)})`),
  };
}

/** What a tab remembers about its live lesson, so a reload carries on the same conversation. */
export interface SavedLesson {
  /** A lesson is running in this tab (cleared when the learner ends it). */
  active: boolean;
  tutorId: string;
  scriptId?: string;
  handle?: string;
  /** When the handle was last refreshed; Gemini keeps resumable sessions for a limited time. */
  handleAt?: number;
  log: ChatMessage[];
}

/** Resume handles stay valid for about two hours; stay safely inside that. */
export const RESUME_WINDOW_MS = 100 * 60 * 1000;

function isMessage(m: unknown): m is ChatMessage {
  const v = m as ChatMessage;
  return typeof v === "object" && v !== null && typeof v.id === "number" && (v.role === "coach" || v.role === "you") && typeof v.text === "string";
}

export function parseSavedLesson(raw: string | null): SavedLesson | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SavedLesson>;
    if (typeof v !== "object" || v === null || typeof v.tutorId !== "string") return null;
    return {
      active: v.active === true,
      tutorId: v.tutorId,
      scriptId: typeof v.scriptId === "string" ? v.scriptId : undefined,
      handle: typeof v.handle === "string" && v.handle ? v.handle : undefined,
      handleAt: typeof v.handleAt === "number" ? v.handleAt : undefined,
      log: Array.isArray(v.log) ? v.log.filter(isMessage).slice(-100) : [],
    };
  } catch {
    return null;
  }
}

/** A handle that can still continue the conversation, if any. */
export function usableHandle(saved: SavedLesson, now: number): string | undefined {
  return saved.handle && saved.handleAt !== undefined && now - saved.handleAt < RESUME_WINDOW_MS ? saved.handle : undefined;
}

export function loadLesson(): SavedLesson | null {
  try {
    return parseSavedLesson(sessionStorage.getItem(SESSION_KEYS.coachLesson));
  } catch {
    return null;
  }
}

export function saveLesson(lesson: SavedLesson): void {
  try {
    sessionStorage.setItem(SESSION_KEYS.coachLesson, JSON.stringify(lesson));
  } catch {
    /* storage full or blocked: a reload will simply start a fresh lesson */
  }
}
