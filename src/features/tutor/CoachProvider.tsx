"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { LiveSession } from "@/lib/live-session";
import { postJson } from "@/lib/api-client";
import type { ScriptItem, TutorContext } from "@/domain/contracts";
import { getTutor } from "@/lib/tutors";
import { usePreferences, useProfile } from "@/features/shared/stores";
import { recordLessonVisit } from "@/storage/lessons";
import { nextLog, type ChatMessage } from "./chatLog";
import { coachScript, loadLesson, saveLesson, scriptEvent, usableHandle } from "./coachSession";

export type TutorStatus = "idle" | "connecting" | "live" | "reconnecting" | "ended" | "error";

interface Attachment {
  script: ScriptItem;
  getContext: () => TutorContext;
}

/** Reconnect attempts after a dropped connection (1s, 2s, 4s, 8s) before giving up. */
const MAX_RETRIES = 4;

/**
 * The learner's voice coach, for the whole app. One Gemini Live lesson stays
 * connected while the learner switches scripts and pages; a dropped connection
 * or a page reload reconnects on its own and carries on the same conversation
 * (session resumption). The lesson only ends when the learner ends it.
 *
 * Practice pages attach their script with `useCoachForScript`. Away from a
 * practice page the coach is on hold: its mic is off and it stays quiet.
 * `hold()` / `release()` pause the coach while the learner practises; holds nest.
 */
function useCoachSession() {
  const { tutorId: preferredTutorId } = usePreferences();
  const { preferredName } = useProfile();

  const [status, setStatus] = useState<TutorStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [learnerCaption, setLearnerCaption] = useState("");
  const [held, setHeld] = useState(false);
  const [away, setAway] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [attachedScriptId, setAttachedScriptId] = useState<string | null>(null);
  const [lessonTutorId, setLessonTutorId] = useState<string | null>(null);
  const [log, setLog] = useState<ChatMessage[]>([]);
  const [seen, setSeen] = useState({ caption: "", learner: "" });

  const sessionRef = useRef<LiveSession | null>(null);
  const holdsRef = useRef(0);
  const awayRef = useRef(false);
  const userMutedRef = useRef(false);
  const newTurnRef = useRef(true);
  const captionRef = useRef("");
  const endedByUserRef = useRef(false);
  const activeRef = useRef(false);
  const startingRef = useRef(false);
  const goAwayRef = useRef(false);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachRef = useRef<Attachment | null>(null);
  const lessonScriptRef = useRef<string | undefined>(undefined);
  const lessonTutorRef = useRef<string | null>(null);
  const handleRef = useRef<{ handle: string; at: number } | null>(null);
  const logRef = useRef<ChatMessage[]>([]);
  const restoredRef = useRef(false);
  const prefsRef = useRef({ tutorId: preferredTutorId, learnerName: preferredName });
  useEffect(() => {
    prefsRef.current = { tutorId: preferredTutorId, learnerName: preferredName };
  });

  // The chat history, derived from the live captions during render.
  if (seen.caption !== caption || seen.learner !== learnerCaption) {
    setSeen({ caption, learner: learnerCaption });
    setLog(nextLog(log, seen, { caption, learner: learnerCaption }));
  }

  const persist = useCallback(() => {
    // Nothing is written until the saved lesson (if any) has been read back, or the first render would erase it.
    if (!restoredRef.current) return;
    saveLesson({
      active: activeRef.current,
      tutorId: lessonTutorRef.current ?? prefsRef.current.tutorId,
      scriptId: lessonScriptRef.current,
      handle: handleRef.current?.handle,
      handleAt: handleRef.current?.at,
      log: logRef.current,
    });
  }, []);

  useEffect(() => {
    logRef.current = log;
    persist();
  }, [log, persist]);

  const applyMute = useCallback(() => {
    const paused = holdsRef.current > 0 || awayRef.current;
    sessionRef.current?.setMuted(paused || userMutedRef.current);
    sessionRef.current?.setPlaybackHeld(paused);
  }, []);

  const send = useCallback((event: string, data?: unknown) => {
    const session = sessionRef.current;
    if (!session) return;
    newTurnRef.current = true;
    session.sendText(`[EVENT] ${event}${data === undefined ? "" : ` ${JSON.stringify(data)}`}`);
  }, []);

  // Declared before `connect` (which retries through it) and kept stable via a ref.
  const connectRef = useRef<(opts: { fresh: boolean }) => Promise<void>>(async () => {});

  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (retryRef.current >= MAX_RETRIES) {
      activeRef.current = false;
      persist();
      setStatus("error");
      setError("The connection to your coach dropped. You can start again.");
      return;
    }
    const delay = goAwayRef.current ? 0 : 1000 * 2 ** retryRef.current;
    goAwayRef.current = false;
    retryRef.current += 1;
    setStatus("reconnecting");
    retryTimerRef.current = setTimeout(() => void connectRef.current({ fresh: false }), delay);
  }, [persist]);

  const connect = useCallback(
    async ({ fresh }: { fresh: boolean }) => {
      if (startingRef.current) return;
      startingRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const attached = attachRef.current;
      const tutorId = fresh ? prefsRef.current.tutorId : (lessonTutorRef.current ?? prefsRef.current.tutorId);
      const handle = fresh ? undefined : handleRef.current?.handle;
      endedByUserRef.current = false;
      activeRef.current = true;
      setError(null);
      setStatus(fresh ? "connecting" : "reconnecting");

      let live: LiveSession | null = null;
      let connected = false;
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
            learnerName: prefsRef.current.learnerName,
            script: attached ? coachScript(attached.script) : undefined,
            context: attached?.getContext() ?? {},
            resumeHandle: handle,
          },
          { fallbackError: "Your coach couldn't join right now." }
        );
        if (endedByUserRef.current) return;

        const session = new LiveSession({
          onStatus: (s) => {
            // Failures before the connection is up are handled by the catch below.
            if (!connected || sessionRef.current !== session || (s !== "closed" && s !== "error")) return;
            sessionRef.current = null;
            setSpeaking(false);
            if (endedByUserRef.current) setStatus("ended");
            else scheduleRetry();
          },
          onTranscript: (role, text) => {
            if (role === "tutor") {
              // Built outside the state updater: updaters must be pure (React may run them twice).
              captionRef.current = (newTurnRef.current ? text : `${captionRef.current} ${text}`).trim();
              newTurnRef.current = false;
              setCaption(captionRef.current);
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
          onResumeHandle: (h) => {
            handleRef.current = { handle: h, at: Date.now() };
            persist();
          },
          onGoAway: () => {
            goAwayRef.current = true;
          },
        });
        live = session;
        session.setMicMode("continuous");
        // Don't let the coach's own voice (without headphones) cut it off mid-sentence.
        session.setSpeechProtection("protected");
        const previous = sessionRef.current;
        sessionRef.current = session;
        previous?.stop();
        newTurnRef.current = true;
        captionRef.current = "";

        await session.start({ token, model, voice, systemInstruction });
        connected = true;
        applyMute();
        retryRef.current = 0;
        lessonTutorRef.current = tutorId;
        setLessonTutorId(tutorId);
        setAudioBlocked(session.audioBlocked);
        setStatus("live");

        // The learner may have switched pages while this was connecting: go by the script open now.
        const current = attachRef.current;
        const previousScript = lessonScriptRef.current;
        if (!handle) {
          // A brand-new conversation (or the old one could not be resumed): open the lesson.
          if (fresh && current) recordLessonVisit(current.script.id);
          send("start");
          if (current && attached && current.script.id !== attached.script.id) send("new_script", scriptEvent(current.script));
        } else if (current && current.script.id !== previousScript) {
          send("new_script", scriptEvent(current.script));
        }
        if (current) lessonScriptRef.current = current.script.id;
        else if (attached) lessonScriptRef.current = attached.script.id;
        persist();
      } catch (err) {
        if (live && sessionRef.current === live) {
          live.stop();
          sessionRef.current = null;
        }
        if (endedByUserRef.current) return;
        if (fresh) {
          activeRef.current = false;
          persist();
          setStatus("error");
          setError((err as Error).message);
        } else {
          // The saved conversation may have expired: the next try starts a new one.
          if (handle) handleRef.current = null;
          scheduleRetry();
        }
      } finally {
        startingRef.current = false;
      }
    },
    [applyMute, persist, scheduleRetry, send]
  );
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /** Starts a new lesson (the learner pressed Start). */
  const start = useCallback(async () => {
    if (sessionRef.current) return;
    handleRef.current = null;
    retryRef.current = 0;
    setLog([]);
    await connect({ fresh: true });
  }, [connect]);

  const end = useCallback(() => {
    endedByUserRef.current = true;
    activeRef.current = false;
    handleRef.current = null;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    sessionRef.current?.stop();
    sessionRef.current = null;
    setSpeaking(false);
    setAudioBlocked(false);
    setStatus("ended");
    persist();
  }, [persist]);

  const hold = useCallback(() => {
    holdsRef.current += 1;
    sessionRef.current?.interruptTutor();
    // The coach was cut off, so whatever they say next starts a new caption.
    newTurnRef.current = true;
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

  /** A practice page opened: teach its script (switching scripts mid-lesson if needed) and take the coach off hold. */
  const attach = useCallback(
    (a: Attachment) => {
      attachRef.current = a;
      setAttachedScriptId(a.script.id);
      // A fresh page has no exercise running, so no holds can be outstanding.
      holdsRef.current = 0;
      setHeld(false);
      awayRef.current = false;
      setAway(false);
      applyMute();
      if (sessionRef.current && !startingRef.current && lessonScriptRef.current !== a.script.id) {
        lessonScriptRef.current = a.script.id;
        send("new_script", scriptEvent(a.script));
        persist();
      }
    },
    [applyMute, persist, send]
  );

  /** The practice page closed: the lesson stays connected but on hold until the learner comes back. */
  const detach = useCallback(
    (scriptId: string) => {
      if (attachRef.current?.script.id !== scriptId) return;
      attachRef.current = null;
      setAttachedScriptId(null);
      awayRef.current = true;
      setAway(true);
      sessionRef.current?.interruptTutor();
      applyMute();
    },
    [applyMute]
  );

  // After a reload: carry on the lesson this tab was having.
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadLesson();
      restoredRef.current = true;
      if (!saved?.active || sessionRef.current) return;
      lessonTutorRef.current = saved.tutorId;
      setLessonTutorId(saved.tutorId);
      lessonScriptRef.current = saved.scriptId;
      const handle = usableHandle(saved, Date.now());
      handleRef.current = handle ? { handle, at: saved.handleAt ?? Date.now() } : null;
      setLog(saved.log);
      void connectRef.current({ fresh: false });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Browsers keep audio off until the page gets a click or key press; the first one turns it on.
  useEffect(() => {
    if (!audioBlocked) return;
    const unlock = () => {
      const session = sessionRef.current;
      if (!session) return setAudioBlocked(false);
      void session.resumeAudio().then(() => setAudioBlocked(sessionRef.current?.audioBlocked ?? false));
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [audioBlocked]);

  // Leaving the app (or a reload) closes the socket; the saved lesson lets the next page load carry on.
  useEffect(
    () => () => {
      endedByUserRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
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
    away,
    micMuted,
    error,
    audioBlocked,
    log,
    attachedScriptId,
    // During a lesson, the coach who joined; otherwise the one chosen in Settings.
    persona: getTutor(
      (status === "live" || status === "connecting" || status === "reconnecting") && lessonTutorId ? lessonTutorId : preferredTutorId
    ),
    start,
    end,
    send,
    hold,
    release,
    toggleMic,
    attach,
    detach,
  };
}

export type Tutor = ReturnType<typeof useCoachSession>;

const CoachContext = createContext<Tutor | null>(null);

export function CoachProvider({ children }: { children: ReactNode }) {
  const coach = useCoachSession();
  return <CoachContext.Provider value={coach}>{children}</CoachContext.Provider>;
}

export function useVoiceCoach(): Tutor {
  const coach = useContext(CoachContext);
  if (!coach) throw new Error("useVoiceCoach must be used inside <CoachProvider>");
  return coach;
}

/** Puts this practice page's script in front of the coach for as long as the page is open. */
export function useCoachForScript(script: ScriptItem, getContext: () => TutorContext): Tutor {
  const coach = useVoiceCoach();
  const latest = useRef({ script, getContext });
  useEffect(() => {
    latest.current = { script, getContext };
  });
  const { attach, detach } = coach;
  const scriptId = script.id;
  useEffect(() => {
    attach({ script: latest.current.script, getContext: () => latest.current.getContext() });
    return () => detach(scriptId);
  }, [scriptId, attach, detach]);
  return coach;
}
