import { appendTranscript, nextStage, questionsFor, spokenQuestionIndex } from "@/domain/capture";
import { substantiveTurnCount } from "@/domain/transcript";
import type { LiveStatus, MicMode } from "@/lib/live-session";
import type { Lesson, NetworkTelemetry, Stage, TargetBand, TranscriptEntry } from "@/lib/types";
import type { CaptureDraft } from "@/storage/capture";

/**
 * All interview state in one reducer. Live-session callbacks only dispatch
 * actions; side effects (stage cues, auto-advance, grading) run in effects that
 * react to this state, so no callback ever reads a stale snapshot.
 */

export type CaptureStatus = "idle" | "preparing" | "live" | "grading";
export type SpeechProtection = "protected" | "barge-in";

export interface CaptureState {
  status: CaptureStatus;
  loadingStep: string;
  error: string | null;
  lesson: Lesson | null;
  band: TargetBand;
  model: string;
  startedAt: number;
  transcript: TranscriptEntry[];
  nextId: number;
  stage: Stage;
  seconds: number;
  activeQuestionIdx: number;
  notice: string | null;
  lastTutorText: string;
  turnSeq: number;
  liveStatus: LiveStatus;
  micVolume: number;
  tutorSpeaking: boolean;
  muted: boolean;
  micMode: MicMode;
  protection: SpeechProtection;
  telemetry: NetworkTelemetry | null;
  micAnalyser: AnalyserNode | null;
  tutorAnalyser: AnalyserNode | null;
}

export type CaptureAction =
  | { type: "PREPARE"; step: string }
  | { type: "FAILED"; error: string }
  | {
      type: "LIVE";
      lesson: Lesson;
      band: TargetBand;
      model: string;
      startedAt: number;
      micAnalyser: AnalyserNode | null;
      tutorAnalyser: AnalyserNode | null;
    }
  | { type: "RESTORE_FOR_GRADING"; draft: CaptureDraft }
  | { type: "TRANSCRIPT"; role: TranscriptEntry["role"]; text: string }
  | { type: "TURN_COMPLETE" }
  | { type: "LIVE_STATUS"; status: LiveStatus }
  | { type: "MIC_VOLUME"; volume: number }
  | { type: "TUTOR_SPEAKING"; speaking: boolean }
  | { type: "TELEMETRY"; telemetry: NetworkTelemetry }
  | { type: "TICK" }
  | { type: "SET_QUESTION"; index: number }
  | { type: "NOTICE"; notice: string | null }
  | { type: "NEXT_STAGE" }
  | { type: "FINISH" }
  | { type: "SET_MUTED"; muted: boolean }
  | { type: "SET_MIC_MODE"; mode: MicMode }
  | { type: "SET_PROTECTION"; protection: SpeechProtection }
  | { type: "ERROR"; error: string | null }
  | { type: "RESET" };

export function initialCaptureState(): CaptureState {
  return {
    status: "idle",
    loadingStep: "",
    error: null,
    lesson: null,
    band: "7.5",
    model: "",
    startedAt: 0,
    transcript: [],
    nextId: 1,
    stage: "part1",
    seconds: 0,
    activeQuestionIdx: 0,
    notice: null,
    lastTutorText: "",
    turnSeq: 0,
    liveStatus: "idle",
    micVolume: 0,
    tutorSpeaking: false,
    muted: false,
    micMode: "continuous",
    protection: "protected",
    telemetry: null,
    micAnalyser: null,
    tutorAnalyser: null,
  };
}

export function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  switch (action.type) {
    case "PREPARE":
      return { ...state, status: "preparing", loadingStep: action.step, error: null };
    case "FAILED":
      return { ...state, status: "idle", loadingStep: "", error: action.error };
    case "LIVE":
      return {
        ...initialCaptureState(),
        micMode: state.micMode,
        protection: state.protection,
        status: "live",
        lesson: action.lesson,
        band: action.band,
        model: action.model,
        startedAt: action.startedAt,
        micAnalyser: action.micAnalyser,
        tutorAnalyser: action.tutorAnalyser,
        liveStatus: "live",
      };
    case "RESTORE_FOR_GRADING":
      return {
        ...initialCaptureState(),
        status: "grading",
        lesson: action.draft.lesson,
        band: action.draft.band,
        startedAt: action.draft.startedAt,
        transcript: action.draft.transcript,
        nextId: action.draft.transcript.reduce((m, e) => Math.max(m, e.id), 0) + 1,
        stage: action.draft.stage,
        seconds: action.draft.seconds,
      };
    case "TRANSCRIPT": {
      if (state.status !== "live" || !action.text.trim()) return state;
      const { entries, nextId } = appendTranscript(state.transcript, action.role, action.text, state.stage, state.nextId);
      if (action.role !== "tutor" || !state.lesson) return { ...state, transcript: entries, nextId };
      const tutorText = entries[entries.length - 1].text;
      const matched = spokenQuestionIndex(state.lesson, state.stage, tutorText);
      return {
        ...state,
        transcript: entries,
        nextId,
        lastTutorText: tutorText,
        activeQuestionIdx: matched ?? state.activeQuestionIdx,
      };
    }
    case "TURN_COMPLETE": {
      let activeQuestionIdx = state.activeQuestionIdx;
      if (state.lesson && state.stage !== "part2") {
        const total = questionsFor(state.lesson, state.stage).length || 3;
        const answered = substantiveTurnCount(state.transcript, state.stage);
        activeQuestionIdx = Math.max(activeQuestionIdx, Math.min(answered, total - 1));
      }
      return { ...state, tutorSpeaking: false, turnSeq: state.turnSeq + 1, activeQuestionIdx };
    }
    case "LIVE_STATUS":
      return { ...state, liveStatus: action.status };
    case "MIC_VOLUME":
      return { ...state, micVolume: action.volume };
    case "TUTOR_SPEAKING":
      return { ...state, tutorSpeaking: action.speaking };
    case "TELEMETRY":
      return { ...state, telemetry: action.telemetry };
    case "TICK":
      return state.status === "live" ? { ...state, seconds: state.seconds + 1 } : state;
    case "SET_QUESTION":
      return { ...state, activeQuestionIdx: action.index };
    case "NOTICE":
      return { ...state, notice: action.notice };
    case "NEXT_STAGE": {
      if (state.status !== "live") return state;
      const next = nextStage(state.stage);
      if (!next) return { ...state, status: "grading", notice: null };
      // Clearing lastTutorText stops the previous announcement from re-triggering.
      return { ...state, stage: next, activeQuestionIdx: 0, notice: null, lastTutorText: "" };
    }
    case "FINISH":
      return state.status === "live" ? { ...state, status: "grading", notice: null } : state;
    case "SET_MUTED":
      return { ...state, muted: action.muted };
    case "SET_MIC_MODE":
      return { ...state, micMode: action.mode };
    case "SET_PROTECTION":
      return { ...state, protection: action.protection };
    case "ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return { ...initialCaptureState(), micMode: state.micMode, protection: state.protection };
  }
}
