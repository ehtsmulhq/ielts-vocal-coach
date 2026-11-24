import { createStore } from "./store";
import { STORAGE_KEYS } from "./registry";
import { appendAttempt, attemptsFor, isAttempt, previousAttempt, type Attempt } from "@/domain/attempt";

const attemptsStore = createStore<Attempt[]>({
  key: STORAGE_KEYS.attempts,
  version: 1,
  fallback: () => [],
  migrate: (data) => (Array.isArray(data) ? data.filter(isAttempt) : []),
});

export const subscribeAttempts = attemptsStore.subscribe;
export const getAttemptsSnapshot = attemptsStore.get;
export const getAttemptsServerSnapshot = attemptsStore.getServerSnapshot;

/** Saves a scored delivery and returns it with its generated id. */
export function recordAttempt(input: Omit<Attempt, "id" | "at"> & { at?: number }): Attempt {
  const at = input.at ?? Date.now();
  const attempt: Attempt = { ...input, at, id: `${input.scriptId}-${at}` };
  attemptsStore.update((list) => appendAttempt(list, attempt));
  return attempt;
}

export function getAttemptsForScript(scriptId: string): Attempt[] {
  return attemptsFor(attemptsStore.get(), scriptId);
}

export function getPreviousAttempt(attemptId: string): Attempt | undefined {
  return previousAttempt(attemptsStore.get(), attemptId);
}
