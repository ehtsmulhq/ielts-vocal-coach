import { createStore } from "./store";
import { STORAGE_KEYS } from "./registry";
import type { LessonVisit } from "@/domain/learner-context";

export const MAX_LESSONS = 200;

function isLessonVisit(v: unknown): v is LessonVisit {
  return typeof v === "object" && v !== null && typeof (v as LessonVisit).at === "number" && typeof (v as LessonVisit).scriptId === "string";
}

/** When the learner opened a lesson with the voice coach, so the coach knows if they're back after a minute or a week. */
const lessonsStore = createStore<LessonVisit[]>({
  key: STORAGE_KEYS.lessons,
  version: 1,
  fallback: () => [],
  migrate: (data) => (Array.isArray(data) ? data.filter(isLessonVisit) : []),
});

export const getLessonsSnapshot = lessonsStore.get;

export function recordLessonVisit(scriptId: string, at = Date.now()): void {
  lessonsStore.update((list) => [...list, { at, scriptId }].slice(-MAX_LESSONS));
}
