export interface ChatMessage {
  id: number;
  role: "coach" | "you";
  text: string;
}

export interface Captions {
  /** What the coach is saying (or last said) this turn. */
  caption: string;
  /** What the learner is saying this turn. */
  learner: string;
}

const MAX_MESSAGES = 100;

/**
 * Turns the coach's live captions into a chat history. The captions only ever
 * hold the current turn, so this notices when they grow (same bubble) or are
 * replaced (new bubble). Pure, so it can be tested without a voice session.
 */
export function nextLog(log: ChatMessage[], prev: Captions, now: Captions): ChatMessage[] {
  let out = log;
  const add = (role: ChatMessage["role"], text: string) => {
    const id = (out[out.length - 1]?.id ?? 0) + 1;
    out = [...out, { id, role, text }].slice(-MAX_MESSAGES);
  };

  if (now.learner && now.learner !== prev.learner) {
    const lastYou = [...out].reverse().find((m) => m.role === "you");
    if (prev.learner && lastYou) {
      out = out.map((m) => (m.id === lastYou.id ? { ...m, text: now.learner } : m));
    } else {
      add("you", now.learner);
    }
  }

  if (now.caption && now.caption !== prev.caption) {
    const last = out[out.length - 1];
    if (last?.role === "coach" && now.caption.startsWith(last.text)) {
      out = out.map((m) => (m.id === last.id ? { ...m, text: now.caption } : m));
    } else {
      add("coach", now.caption);
    }
  }
  return out;
}
