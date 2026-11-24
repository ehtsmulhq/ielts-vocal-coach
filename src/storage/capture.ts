import { createStore } from "./store";
import { STORAGE_KEYS } from "./registry";
import type { ScriptItem } from "@/domain/contracts";
import type { DailyImprovementDelta } from "@/domain/improvement";
import type { Feedback, Lesson, Stage, TargetBand, TranscriptEntry } from "@/lib/types";

/** An interview in progress, saved so a refresh or crash doesn't lose what was said. */
export interface CaptureDraft {
  lesson: Lesson;
  band: TargetBand;
  transcript: TranscriptEntry[];
  stage: Stage;
  seconds: number;
  startedAt: number;
  updatedAt: number;
}

/** The outcome of grading, kept until the learner decides which scripts to keep. */
export interface CaptureReport {
  id: string;
  createdAt: number;
  topic: string;
  band: TargetBand;
  feedback: Feedback | null;
  noSpeech: boolean;
  improvementDelta: DailyImprovementDelta | null;
  sessionNumber: number;
  proposedScripts: ScriptItem[];
  decision: { at: number; acceptedIds: string[] } | null;
  errors: string[];
}

export interface CaptureState {
  draft: CaptureDraft | null;
  report: CaptureReport | null;
}

const EMPTY: CaptureState = { draft: null, report: null };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function migrateCapture(data: unknown): CaptureState {
  if (!isObject(data)) return EMPTY;
  const draft = isObject(data.draft) && Array.isArray(data.draft.transcript) && isObject(data.draft.lesson) ? (data.draft as unknown as CaptureDraft) : null;
  const report =
    isObject(data.report) && Array.isArray(data.report.proposedScripts) ? (data.report as unknown as CaptureReport) : null;
  return { draft, report };
}

const captureStore = createStore<CaptureState>({
  key: STORAGE_KEYS.capture,
  version: 1,
  fallback: () => EMPTY,
  migrate: (data) => migrateCapture(data),
});

export const subscribeCapture = captureStore.subscribe;
export const getCaptureSnapshot = captureStore.get;
export const getCaptureServerSnapshot = captureStore.getServerSnapshot;

export function saveCaptureDraft(draft: CaptureDraft): void {
  captureStore.update((s) => ({ ...s, draft }));
}

export function clearCaptureDraft(): void {
  captureStore.update((s) => ({ ...s, draft: null }));
}

/** Stores a new report and drops the draft it came from. */
export function saveCaptureReport(report: CaptureReport): void {
  captureStore.set({ draft: null, report });
}

export function recordScriptDecision(acceptedIds: string[], at = Date.now()): void {
  captureStore.update((s) => (s.report ? { ...s, report: { ...s.report, decision: { at, acceptedIds } } } : s));
}
