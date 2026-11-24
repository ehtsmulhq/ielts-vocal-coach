"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveSession } from "@/lib/live-session";
import { postJson } from "@/lib/api-client";
import type { ScriptItem } from "@/domain/contracts";
import type { AccentArea } from "@/domain/progress";

export type TutorStatus = "idle" | "connecting" | "live" | "ended" | "error";

export interface TutorContext {
  focusArea?: AccentArea;
  lastScore?: number;
  reps?: number;
}

/**
 * The learner's personal voice coach for one script: a Gemini Live session the
 * app steers with [EVENT] messages and the learner can talk to between
 * exercises.
 *
 * `hold()` / `release()` pause the coach while the learner practises (mic not
 * sent, coach interrupted). Holds nest, so overlapping exercises (a model clip
 * inside the shadow loop) compose safely.
 */
export function useTutor(opts: { script: ScriptItem; learnerName: string; tutorId: string; context: TutorContext }) {
  const [status, setStatus] = useState<TutorStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [learnerCaption, setLearnerCaption] = useState("");
  const [held, setHeld] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const holdsRef = useRef(0);
  const userMutedRef = useRef(false);
  const newTurnRef = useRef(true);
  const endedByUserRef = useRef(false);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const applyMute = useCallback(() => {
    sessionRef.current?.setMuted(holdsRef.current > 0 || userMutedRef.current);
  }, []);

  const send = useCallback((event: string, data?: unknown) => {
    const session = sessionRef.current;
    if (!session) return;
    newTurnRef.current = true;
    session.sendText(`[EVENT] ${event}${data === undefined ? "" : ` ${JSON.stringify(data)}`}`);
  }, []);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    const { script, learnerName, tutorId, context } = optsRef.current;
    setError(null);
    setStatus("connecting");
    endedByUserRef.current = false;
    try {
      const { token, model, voice, systemInstruction } = await postJson<{
        token: string;
        model: string;
        voice: string;
        systemInstruction: string;
      }>(
        "/api/tutor-token",
        {
          tutorId,
          learnerName,
          script: {
            title: script.part ? `${script.topic ?? script.title}` : script.title,
            question: script.question,
            upgradedScript: script.upgradedScript,
            thoughtChunks: script.thoughtChunks,
            stressedWords: script.stressedWords,
            targetCollocations: script.targetCollocations,
          },
          context,
        },
        { fallbackError: "Your coach couldn't join right now." }
      );

      const live = new LiveSession({
        onStatus: (s) => {
          if ((s === "closed" || s === "error") && sessionRef.current === live) {
            sessionRef.current = null;
            setSpeaking(false);
            setStatus(endedByUserRef.current ? "ended" : "error");
            if (!endedByUserRef.current) setError("The connection to your coach dropped. You can start again.");
          }
        },
        onTranscript: (role, text) => {
          if (role === "tutor") {
            setCaption((prev) => {
              const next = newTurnRef.current ? text : `${prev} ${text}`;
              newTurnRef.current = false;
              return next.trim();
            });
          } else {
            setLearnerCaption((prev) => `${prev} ${text}`.trim().slice(-200));
          }
        },
        onTurnComplete: () => {
          newTurnRef.current = true;
          setSpeaking(false);
          setLearnerCaption("");
        },
        onTutorSpeaking: setSpeaking,
      });
      live.setMicMode("continuous");
      // Don't let the coach's own voice (without headphones) cut it off mid-sentence.
      live.setSpeechProtection("protected");
      sessionRef.current = live;
      await live.start({ token, model, voice, systemInstruction });
      applyMute();
      setStatus("live");
      send("start");
    } catch (err) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setStatus("error");
      setError((err as Error).message);
    }
  }, [applyMute, send]);

  const end = useCallback(() => {
    endedByUserRef.current = true;
    sessionRef.current?.stop();
    sessionRef.current = null;
    setSpeaking(false);
    setStatus("ended");
  }, []);

  const hold = useCallback(() => {
    holdsRef.current += 1;
    sessionRef.current?.interruptTutor();
    applyMute();
    setHeld(true);
  }, [applyMute]);

  const release = useCallback(() => {
    holdsRef.current = Math.max(0, holdsRef.current - 1);
    applyMute();
    setHeld(holdsRef.current > 0);
  }, [applyMute]);

  const toggleMic = useCallback(() => {
    userMutedRef.current = !userMutedRef.current;
    applyMute();
    setMicMuted(userMutedRef.current);
  }, [applyMute]);

  useEffect(
    () => () => {
      endedByUserRef.current = true;
      sessionRef.current?.stop();
      sessionRef.current = null;
    },
    []
  );

  return {
    status,
    live: status === "live",
    speaking,
    caption,
    learnerCaption,
    held,
    micMuted,
    error,
    start,
    end,
    send,
    hold,
    release,
    toggleMic,
  };
}

export type Tutor = ReturnType<typeof useTutor>;
