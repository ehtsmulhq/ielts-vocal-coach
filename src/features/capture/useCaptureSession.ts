"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveSession, type MicMode } from "@/lib/live-session";
import { SpeechEngine } from "@/lib/speech-engine";
import { examinerInstruction, STAGE_CUES } from "@/lib/prompts";
import { postJson } from "@/lib/api-client";
import { decideAutoAdvance } from "@/domain/capture";
import type { CandidateProfile, Lesson, TargetBand } from "@/lib/types";
import { clearCaptureDraft, saveCaptureDraft, saveCaptureReport, type CaptureDraft } from "@/storage/capture";
import { captureReducer, initialCaptureState } from "./captureReducer";
import { gradeCapture } from "./gradeCapture";

export interface CaptureConfig {
  band: TargetBand;
  cambridgeTestId?: string;
  sceneId?: string;
  model: string;
  voice: string;
}

export function useCaptureSession(profile: CandidateProfile) {
  const router = useRouter();
  const [state, dispatch] = useReducer(captureReducer, undefined, initialCaptureState);
  const [coachSpeaking, setCoachSpeaking] = useState(false);

  // Resources (not state mirrors): the live connection, browser speech, timers.
  const sessionRef = useRef<LiveSession | null>(null);
  const speechRef = useRef<SpeechEngine | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cuedStageRef = useRef<string | null>(null);
  const seenTurnRef = useRef(0);
  const gradingRef = useRef(false);

  const speech = useCallback(() => {
    speechRef.current ??= new SpeechEngine({ onCoachSpeaking: setCoachSpeaking });
    return speechRef.current;
  }, []);

  const clearAdvance = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
  }, []);

  const stopLive = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    speechRef.current?.stopSpeaking();
  }, []);

  // ---------------------------------------------------------------- start
  const start = useCallback(
    async (config: CaptureConfig) => {
      dispatch({ type: "PREPARE", step: "Preparing your interview questions…" });
      try {
        const { lesson } = await postJson<{ lesson: Lesson }>(
          "/api/lesson",
          { band: config.band, cambridgeTestId: config.cambridgeTestId, sceneId: config.sceneId },
          { fallbackError: "Could not prepare the interview questions." }
        );
        dispatch({ type: "PREPARE", step: "Connecting to the examiner…" });
        const { token, model, voice } = await postJson<{ token: string; model: string; voice: string }>(
          "/api/token",
          { model: config.model, voice: config.voice },
          { fallbackError: "Could not start the live examiner." }
        );

        const live = new LiveSession({
          onStatus: (status) => dispatch({ type: "LIVE_STATUS", status }),
          onTranscript: (role, text) => dispatch({ type: "TRANSCRIPT", role, text }),
          onTurnComplete: () => dispatch({ type: "TURN_COMPLETE" }),
          onMicVolume: (volume) => dispatch({ type: "MIC_VOLUME", volume }),
          onTutorSpeaking: (speaking) => dispatch({ type: "TUTOR_SPEAKING", speaking }),
          onTelemetry: (telemetry) => dispatch({ type: "TELEMETRY", telemetry }),
        });
        sessionRef.current = live;
        live.setMicMode(state.micMode);
        live.setSpeechProtection(state.protection);
        await live.start({ token, model, voice, systemInstruction: examinerInstruction(lesson, profile) });

        cuedStageRef.current = "part1";
        seenTurnRef.current = 0;
        gradingRef.current = false;
        dispatch({
          type: "LIVE",
          lesson,
          band: config.band,
          model,
          startedAt: Date.now(),
          micAnalyser: live.micAnalyser,
          tutorAnalyser: live.tutorAnalyser,
        });
        live.sendText(STAGE_CUES.part1);
      } catch (err) {
        stopLive();
        dispatch({ type: "FAILED", error: (err as Error).message });
      }
    },
    [profile, state.micMode, state.protection, stopLive]
  );

  // ---------------------------------------------------------------- controls
  const next = useCallback(() => {
    clearAdvance();
    speechRef.current?.stopSpeaking();
    dispatch({ type: "NEXT_STAGE" });
  }, [clearAdvance]);

  const finish = useCallback(() => {
    clearAdvance();
    dispatch({ type: "FINISH" });
  }, [clearAdvance]);

  const abandon = useCallback(() => {
    clearAdvance();
    stopLive();
    clearCaptureDraft();
    dispatch({ type: "RESET" });
  }, [clearAdvance, stopLive]);

  const gradeDraft = useCallback((draft: CaptureDraft) => {
    gradingRef.current = false;
    dispatch({ type: "RESTORE_FOR_GRADING", draft });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    sessionRef.current?.setMuted(muted);
    dispatch({ type: "SET_MUTED", muted });
  }, []);

  const setMicMode = useCallback((mode: MicMode) => {
    sessionRef.current?.setMicMode(mode);
    dispatch({ type: "SET_MIC_MODE", mode });
  }, []);

  const toggleProtection = useCallback(() => {
    const protection = state.protection === "protected" ? "barge-in" : "protected";
    sessionRef.current?.setSpeechProtection(protection);
    dispatch({ type: "SET_PROTECTION", protection });
  }, [state.protection]);

  const setPushToTalk = useCallback((active: boolean) => sessionRef.current?.setPushToTalkActive(active), []);

  const interrupt = useCallback(() => {
    sessionRef.current?.interruptTutor();
    speechRef.current?.stopSpeaking();
    dispatch({ type: "TUTOR_SPEAKING", speaking: false });
  }, []);

  const speak = useCallback(
    (text: string, rate = 1) => {
      sessionRef.current?.interruptTutor();
      speech().speak(text, { rate });
    },
    [speech]
  );
  const stopSpeaking = useCallback(() => speechRef.current?.stopSpeaking(), []);

  // ---------------------------------------------------------------- effects
  // Tell the examiner to begin each new part (Part 1 is cued at start).
  useEffect(() => {
    if (state.status !== "live" || cuedStageRef.current === state.stage) return;
    cuedStageRef.current = state.stage;
    sessionRef.current?.sendText(STAGE_CUES[state.stage]);
  }, [state.status, state.stage]);

  // Auto-advance when the examiner announces the next part or the answers are in.
  useEffect(() => {
    if (state.status !== "live" || !state.lesson || advanceTimerRef.current) return;
    const afterTurn = state.turnSeq !== seenTurnRef.current;
    seenTurnRef.current = state.turnSeq;
    const decision = decideAutoAdvance(state.lesson, state.stage, state.transcript, state.lastTutorText, afterTurn);
    if (!decision) return;
    dispatch({ type: "NOTICE", notice: decision.notice });
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      dispatch({ type: decision.action === "next" ? "NEXT_STAGE" : "FINISH" });
    }, decision.delayMs);
    // Re-evaluates only when a turn ends or the examiner says something new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.stage, state.turnSeq, state.lastTutorText]);

  // Interview clock.
  useEffect(() => {
    if (state.status !== "live" || state.liveStatus !== "live") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.status, state.liveStatus]);

  // Warn (once) if the connection drops mid-interview; what was said is kept.
  useEffect(() => {
    if (state.status === "live" && (state.liveStatus === "closed" || state.liveStatus === "error")) {
      dispatch({
        type: "ERROR",
        error: "The connection to the examiner dropped. Finish now to get a report and scripts from what you've said.",
      });
    }
  }, [state.status, state.liveStatus]);

  // Save the interview as it happens so a refresh or crash loses nothing.
  useEffect(() => {
    if (state.status !== "live" || !state.lesson || state.transcript.length === 0) return;
    const id = setTimeout(
      () =>
        saveCaptureDraft({
          lesson: state.lesson!,
          band: state.band,
          transcript: state.transcript,
          stage: state.stage,
          seconds: state.seconds,
          startedAt: state.startedAt,
          updatedAt: Date.now(),
        }),
      1500
    );
    return () => clearTimeout(id);
  }, [state.status, state.lesson, state.band, state.transcript, state.stage, state.seconds, state.startedAt]);

  // Grade once, then hand over to the report page.
  useEffect(() => {
    if (state.status !== "grading" || gradingRef.current || !state.lesson) return;
    gradingRef.current = true;
    clearAdvance();
    stopLive();
    void (async () => {
      try {
        const report = await gradeCapture({
          lesson: state.lesson!,
          band: state.band,
          transcript: state.transcript,
          seconds: state.seconds,
          profile,
        });
        saveCaptureReport(report);
        router.push("/capture/report");
      } catch (err) {
        gradingRef.current = false;
        dispatch({ type: "FAILED", error: (err as Error).message || "Could not prepare your report." });
      }
    })();
  }, [state.status, state.lesson, state.band, state.transcript, state.seconds, profile, router, clearAdvance, stopLive]);

  // Release the microphone and connection when leaving the page.
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      sessionRef.current?.stop();
      speechRef.current?.cleanup();
    },
    []
  );

  return {
    state,
    coachSpeaking,
    start,
    next,
    finish,
    abandon,
    gradeDraft,
    setMuted,
    setMicMode,
    toggleProtection,
    setPushToTalk,
    interrupt,
    speak,
    stopSpeaking,
    selectQuestion: (index: number) => dispatch({ type: "SET_QUESTION", index }),
  };
}

export type CaptureSession = ReturnType<typeof useCaptureSession>;
