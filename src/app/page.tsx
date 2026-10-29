"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import type {
  Lesson,
  Stage,
  TargetBand,
  TranscriptEntry,
  Feedback,
  NetworkTelemetry,
} from "@/lib/types";
import { STAGES } from "@/lib/types";
import {
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
  saveProfile,
} from "@/lib/profile";
import {
  subscribeMasterScript,
  getMasterScriptSnapshot,
  getMasterScriptServerSnapshot,
  saveMasterScript,
  resetMasterScript,
  type MasterScriptRepository,
} from "@/lib/master-script";
import {
  subscribeTestHistory,
  getTestHistorySnapshot,
  getTestHistoryServerSnapshot,
  saveTestSession,
  wipeAllUserData,
  type DailyImprovementDelta,
} from "@/lib/test-history";
import { LIVE_MODEL } from "@/lib/models";
import { examinerInstruction, STAGE_CUES } from "@/lib/prompts";
import { findSpokenQuestionIndex, detectSpokenStageTransition } from "@/lib/voice-tracking";
import { LiveSession, type LiveStatus, type MicMode } from "@/lib/live-session";
import { SpeechEngine } from "@/lib/speech-engine";
import { SetupCard } from "@/components/SetupCard";
import { VoiceOrb } from "@/components/VoiceOrb";
import { LessonCard } from "@/components/LessonCard";
import { TranscriptFeed } from "@/components/TranscriptFeed";
import { FeedbackReport } from "@/components/FeedbackReport";
import { LatencyHUD } from "@/components/LatencyHUD";
import { MasterMirrorGym } from "@/components/MasterMirrorGym";
import { CandidateGrillModal } from "@/components/CandidateGrillModal";
import {
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Dumbbell,
  Clock,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function Home() {
  const [view, setView] = useState<"setup" | "session" | "mirrorgym" | "upgrading" | "feedback">("setup");
  const [band, setBand] = useState<TargetBand>("7.5");
  const [activeModel, setActiveModel] = useState<string>(LIVE_MODEL);
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );
  const masterScript = useSyncExternalStore(
    subscribeMasterScript,
    getMasterScriptSnapshot,
    getMasterScriptServerSnapshot
  );
  const testHistory = useSyncExternalStore(
    subscribeTestHistory,
    getTestHistorySnapshot,
    getTestHistoryServerSnapshot
  );

  // Lesson generation
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Live session
  const sessionRef = useRef<LiveSession | null>(null);
  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [currentStage, setCurrentStage] = useState<Stage>("part1");
  const currentStageRef = useRef<Stage>("part1");
  const [isMuted, setIsMuted] = useState(false);
  const [micMode, setMicMode] = useState<MicMode>("continuous");
  const [micVolume, setMicVolume] = useState(0);
  const [tutorSpeaking, setTutorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Words count for student in long reading / Cue Card
  const [studentWordCount, setStudentWordCount] = useState(0);
  const [isCoachTtsSpeaking, setIsCoachTtsSpeaking] = useState(false);

  // Right card tab: "lesson" | "transcript"
  const [activeRightTab, setActiveRightTab] = useState<"lesson" | "transcript">("lesson");

  // Dynamic question highlight & Auto-advance stage management
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [autoAdvanceNotice, setAutoAdvanceNotice] = useState<string | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const handleNextStageRef = useRef<() => void>(() => {});
  const handleFinishSessionRef = useRef<() => void>(() => {});

  // First-time interactive candidate grill intake modal (derived state, no effect)
  const [isGrillDismissed, setIsGrillDismissed] = useState(false);
  const [isGrillManuallyOpen, setIsGrillManuallyOpen] = useState(false);
  const shouldShowGrill = isGrillManuallyOpen || (!profile.hasCompletedGrill && !isGrillDismissed);

  // Session duration timer
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Analysers for VoiceOrb
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
  const [tutorAnalyser, setTutorAnalyser] = useState<AnalyserNode | null>(null);

  // Feedback & Daily Improvement Delta
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [improvementDelta, setImprovementDelta] = useState<DailyImprovementDelta | null>(null);
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);
  const [telemetry, setTelemetry] = useState<NetworkTelemetry | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speechProtection, setSpeechProtection] = useState<"protected" | "barge-in">("protected");

  // One-time auto reset on client if previous legacy methodology is detected
  useEffect(() => {
    if (typeof window !== "undefined") {
      const version = window.localStorage.getItem("vocal_lab_app_version");
      if (version !== "v3_authentic_hotseat") {
        wipeAllUserData();
        window.localStorage.setItem("vocal_lab_app_version", "v3_authentic_hotseat");
      }
    }
  }, []);

  // Initialize SpeechEngine on client with teardown guard
  useEffect(() => {
    speechEngineRef.current = new SpeechEngine({
      onCoachSpeaking: (speaking) => {
        setIsCoachTtsSpeaking(speaking);
      },
    });

    const handleBeforeUnload = () => {
      speechEngineRef.current?.cleanup();
      sessionRef.current?.stop();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      speechEngineRef.current?.cleanup();
      sessionRef.current?.stop();
    };
  }, []);

  // Session timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === "session" && liveStatus === "live") {
      timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [view, liveStatus]);

  const formatSessionTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleStartSession = async (
    chosenBand: TargetBand,
    topic?: string,
    liveModelId?: string,
    focusArea?: "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed",
    voiceId?: string,
    cambridgeTestId?: string,
    sceneId?: string
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    setBand(chosenBand);
    const selectedLive = liveModelId || activeModel;
    setActiveModel(selectedLive);

    try {
      // Step 1: Generate authentic Cambridge Hot Seat test grounded in Knowledge Graph
      setLoadingStep("Loading Cambridge IELTS Official Hot Seat Test...");
      const lessonRes = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band: chosenBand, topic, focusArea, profile, cambridgeTestId, sceneId }),
      });
      if (!lessonRes.ok) {
        const err = await lessonRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate Cambridge test");
      }
      const { lesson: generatedLesson } = (await lessonRes.json()) as { lesson: Lesson };
      setLesson(generatedLesson);

      // Step 2: Request single-use ephemeral token
      setLoadingStep("Authorizing Cambridge Examiner audio session...");
      const tokenRes = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedLive, voice: voiceId }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get ephemeral token");
      }
      const { token, model, voice } = await tokenRes.json();

      // Step 3: Instantiate LiveSession
      setLoadingStep("Connecting live British RP Examiner...");
      setTranscript([]);
      transcriptRef.current = [];
      setActiveQuestionIdx(0);
      setAutoAdvanceNotice(null);
      currentStageRef.current = "part1";
      setCurrentStage("part1");
      setSessionSeconds(0);
      setStudentWordCount(0);
      setActiveRightTab("lesson");

      let entryCounter = 0;

      const live = new LiveSession({
        onStatus: (st) => {
          setLiveStatus(st);
        },
        onTranscript: (role, text) => {
          const activeStage = currentStageRef.current;
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            let nextEntries: TranscriptEntry[];
            if (last && last.role === role && last.stage === activeStage) {
              nextEntries = [
                ...prev.slice(0, -1),
                { ...last, text: `${last.text} ${text}`.trim() },
              ];
            } else {
              nextEntries = [
                ...prev,
                { id: ++entryCounter, role, text, stage: activeStage },
              ];
            }

            transcriptRef.current = nextEntries;
            return nextEntries;
          });

          // Running word count for candidate in active stage
          if (role === "student") {
            const activeStageStudentWords = transcriptRef.current
              .filter((t) => t.role === "student" && t.stage === activeStage)
              .reduce((acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length, 0);
            setStudentWordCount(activeStageStudentWords);
          }

          // REAL-TIME VOICE TRACKING: Move alongside Dr. Jonathan Vance's speech
          if (role === "tutor") {
            const currentEntries = transcriptRef.current;
            const lastEntry = currentEntries[currentEntries.length - 1];
            const fullTutorSpeech = (lastEntry && lastEntry.role === "tutor") ? lastEntry.text : text;

            // 1. Spoken verbal stage transition detection
            const spokenTransition = detectSpokenStageTransition(fullTutorSpeech);
            if (spokenTransition === "part2" && currentStageRef.current === "part1") {
              if (!autoAdvanceTimerRef.current) {
                setAutoAdvanceNotice("DR. VANCE ADVANCING TO PART 2 CUE CARD...");
                autoAdvanceTimerRef.current = setTimeout(() => {
                  autoAdvanceTimerRef.current = null;
                  setAutoAdvanceNotice(null);
                  handleNextStageRef.current();
                }, 1500);
              }
            } else if (spokenTransition === "part3" && currentStageRef.current === "part2") {
              if (!autoAdvanceTimerRef.current) {
                setAutoAdvanceNotice("DR. VANCE ADVANCING TO PART 3 DISCUSSION...");
                autoAdvanceTimerRef.current = setTimeout(() => {
                  autoAdvanceTimerRef.current = null;
                  setAutoAdvanceNotice(null);
                  handleNextStageRef.current();
                }, 1500);
              }
            } else if (spokenTransition === "finish" && currentStageRef.current === "part3") {
              if (!autoAdvanceTimerRef.current) {
                setAutoAdvanceNotice("DR. VANCE CONCLUDING INTERVIEW • EVALUATING...");
                autoAdvanceTimerRef.current = setTimeout(() => {
                  autoAdvanceTimerRef.current = null;
                  setAutoAdvanceNotice(null);
                  handleFinishSessionRef.current();
                }, 1500);
              }
            }

            // 2. Real-time spoken question detection (synchronizes visual card with audio)
            if (activeStage === "part1") {
              const questions = generatedLesson.hotSeatTest?.part1Questions || [];
              const matchedIdx = findSpokenQuestionIndex(fullTutorSpeech, questions);
              if (matchedIdx !== null) {
                setActiveQuestionIdx((curr) => (curr !== matchedIdx ? matchedIdx : curr));
              }
            } else if (activeStage === "part3") {
              const questions = generatedLesson.hotSeatTest?.part3Questions || [];
              const matchedIdx = findSpokenQuestionIndex(fullTutorSpeech, questions);
              if (matchedIdx !== null) {
                setActiveQuestionIdx((curr) => (curr !== matchedIdx ? matchedIdx : curr));
              }
            }
          }
        },
        onTurnComplete: () => {
          setTutorSpeaking(false);

          // Fallback turn counter & automatic progression
          const activeStage = currentStageRef.current;
          const currentEntries = transcriptRef.current;

          const studentTurns = currentEntries.filter(
            (t) => t.role === "student" && t.stage === activeStage && t.text.trim().split(/\s+/).length >= 4
          );
          const studentTurnCount = studentTurns.length;

          if (activeStage === "part1") {
            const totalPart1 = generatedLesson.hotSeatTest?.part1Questions?.length || 3;
            setActiveQuestionIdx((curr) => Math.max(curr, Math.min(studentTurnCount, totalPart1 - 1)));

            if (studentTurnCount >= totalPart1 && !autoAdvanceTimerRef.current) {
              setAutoAdvanceNotice("PART 1 COMPLETE • ADVANCING TO PART 2 CUE CARD IN 3s...");
              autoAdvanceTimerRef.current = setTimeout(() => {
                autoAdvanceTimerRef.current = null;
                setAutoAdvanceNotice(null);
                handleNextStageRef.current();
              }, 2500);
            }
          } else if (activeStage === "part2") {
            const studentPart2Words = currentEntries
              .filter((t) => t.role === "student" && t.stage === "part2")
              .reduce((acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length, 0);

            if (studentPart2Words >= 50 && !autoAdvanceTimerRef.current) {
              setAutoAdvanceNotice("PART 2 MONOLOGUE COMPLETE • ADVANCING TO PART 3 DISCUSSION IN 3s...");
              autoAdvanceTimerRef.current = setTimeout(() => {
                autoAdvanceTimerRef.current = null;
                setAutoAdvanceNotice(null);
                handleNextStageRef.current();
              }, 2500);
            }
          } else if (activeStage === "part3") {
            const totalPart3 = generatedLesson.hotSeatTest?.part3Questions?.length || 3;
            setActiveQuestionIdx((curr) => Math.max(curr, Math.min(studentTurnCount, totalPart3 - 1)));

            if (studentTurnCount >= totalPart3 && !autoAdvanceTimerRef.current) {
              setAutoAdvanceNotice("CAMBRIDGE INTERVIEW CONCLUDED • EVALUATING PERFORMANCE IN 2s...");
              autoAdvanceTimerRef.current = setTimeout(() => {
                autoAdvanceTimerRef.current = null;
                setAutoAdvanceNotice(null);
                handleFinishSessionRef.current();
              }, 2000);
            }
          }
        },
        onMicVolume: (vol) => {
          setMicVolume(vol);
        },
        onTutorSpeaking: (spk) => {
          setTutorSpeaking(spk);
        },
        onTelemetry: (tel) => {
          setTelemetry(tel);
        },
      });

      sessionRef.current = live;
      live.setMicMode(micMode);
      live.setSpeechProtection(speechProtection);

      await live.start({
        token,
        model,
        voice,
        systemInstruction: examinerInstruction(generatedLesson, profile),
      });

      // Link analysers for VoiceOrb
      setMicAnalyser(live.micAnalyser);
      setTutorAnalyser(live.tutorAnalyser);

      // Trigger initial Part 1 greeting
      live.sendText(STAGE_CUES.part1);

      setView("session");
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleToggleMute = () => {
    if (!sessionRef.current) return;
    const next = !isMuted;
    sessionRef.current.setMuted(next);
    setIsMuted(next);
  };

  const handleChangeMicMode = (mode: MicMode) => {
    setMicMode(mode);
    sessionRef.current?.setMicMode(mode);
  };

  const handlePushToTalkChange = (active: boolean) => {
    sessionRef.current?.setPushToTalkActive(active);
  };

  const handleToggleSpeechProtection = () => {
    const next = speechProtection === "protected" ? "barge-in" : "protected";
    setSpeechProtection(next);
    sessionRef.current?.setSpeechProtection(next);
  };

  const handleReplayCorrection = (text: string) => {
    sessionRef.current?.interruptTutor();
    speechEngineRef.current?.stopSpeaking();
    setIsCoachTtsSpeaking(true);
    speechEngineRef.current?.speak(text, { rate: 0.95 });
  };

  const handleStopReplay = () => {
    speechEngineRef.current?.stopSpeaking();
    setIsCoachTtsSpeaking(false);
  };

  const handleInterruptTutor = () => {
    sessionRef.current?.interruptTutor();
    speechEngineRef.current?.stopSpeaking();
    setTutorSpeaking(false);
    setIsCoachTtsSpeaking(false);
  };

  const handleSpeakCoachText = (text: string, rate: number = 1.0) => {
    sessionRef.current?.interruptTutor();
    speechEngineRef.current?.speak(text, { rate });
  };

  const handleStopCoachText = () => {
    speechEngineRef.current?.stopSpeaking();
  };

  const handleNextStage = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceNotice(null);
    speechEngineRef.current?.stopSpeaking();
    setActiveQuestionIdx(0);
    setStudentWordCount(0);

    const curIdx = STAGES.findIndex((s) => s.id === currentStageRef.current);
    if (curIdx < STAGES.length - 1) {
      const nextStage = STAGES[curIdx + 1].id;
      currentStageRef.current = nextStage;
      setCurrentStage(nextStage);
      sessionRef.current?.sendText(STAGE_CUES[nextStage]);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceNotice(null);
    sessionRef.current?.stop();
    speechEngineRef.current?.cleanup();
    setLiveStatus("closed");
    setErrorMsg(null);

    // Verify if candidate spoke any words
    const studentEntries = transcript.filter(
      (t) => t.role === "student" && t.text.trim().length > 0
    );
    const totalStudentWords = studentEntries.reduce(
      (acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length,
      0
    );

    if (totalStudentWords === 0) {
      setView("feedback");
      setFeedback(null);
      setImprovementDelta(null);
      setNoSpeechDetected(true);
      setIsGrading(false);
      return;
    }

    // Candidate spoke! Enter upgrade & evaluation pipeline
    setView("upgrading");
    setNoSpeechDetected(false);
    setIsGrading(true);

    try {
      if (!lesson) throw new Error("No active lesson");

      // Run feedback diagnostic scoring and Band 8.5 Master Script transformation in parallel
      const [feedbackResult, upgradeResult] = await Promise.allSettled([
        fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lesson,
            transcript,
            band,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to grade transcript");
          return res.json();
        }),
        fetch("/api/upgrade-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            profile,
            targetBand: band,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to upgrade master script");
          return res.json();
        }),
      ]);

      if (feedbackResult.status === "fulfilled" && feedbackResult.value) {
        if (feedbackResult.value.noSpeech) {
          setFeedback(null);
          setImprovementDelta(null);
          setNoSpeechDetected(true);
        } else {
          const feedbackData: Feedback = feedbackResult.value.feedback;
          setFeedback(feedbackData);

          // Calculate cadence and save session to history
          const calculatedWpm =
            sessionSeconds > 5 && totalStudentWords > 0
              ? Math.round(totalStudentWords / (sessionSeconds / 60))
              : 125;

          const savedRecord = saveTestSession({
            timestamp: Date.now(),
            targetBand: band,
            overallBand: feedbackData.overall,
            subScores: {
              pronunciation: feedbackData.pronunciation.band,
              fluency: feedbackData.fluency.band,
              lexical: feedbackData.lexical.band,
              grammar: feedbackData.grammar.band,
            },
            metrics: {
              wpm: calculatedWpm,
              totalStudentWords,
              durationSeconds: sessionSeconds,
              turnCount: studentEntries.length,
            },
            cambridgeTopic: lesson.topic,
          });

          setImprovementDelta(savedRecord.improvementDelta || null);
        }
      }

      if (upgradeResult.status === "fulfilled" && upgradeResult.value?.items?.length) {
        const updatedRepo: MasterScriptRepository = {
          ...masterScript,
          candidateName: profile.fullName,
          preferredName: profile.preferredName,
          targetBand: band,
          lastPracticedAt: Date.now(),
          items: upgradeResult.value.items,
        };
        saveMasterScript(updatedRepo);
      }

      setView("feedback");
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message);
      setView("feedback");
    } finally {
      setIsGrading(false);
    }
  };

  useEffect(() => {
    handleNextStageRef.current = handleNextStage;
    handleFinishSessionRef.current = handleFinishSession;
  });

  const handleRestart = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceNotice(null);
    setActiveQuestionIdx(0);
    sessionRef.current?.stop();
    speechEngineRef.current?.cleanup();
    sessionRef.current = null;
    currentStageRef.current = "part1";
    setLesson(null);
    setTranscript([]);
    transcriptRef.current = [];
    setFeedback(null);
    setImprovementDelta(null);
    setNoSpeechDetected(false);
    setLiveStatus("idle");
    setCurrentStage("part1");
    setSessionSeconds(0);
    setStudentWordCount(0);
    setView("setup");
  };

  const handleWipeAllData = () => {
    wipeAllUserData();
    setFeedback(null);
    setImprovementDelta(null);
    handleRestart();
  };

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const isLastStage = currentStageIndex === STAGES.length - 1;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-screen overflow-y-auto lg:overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Minimalist Academic Header */}
      <header className="h-14 flex-shrink-0 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 font-mono">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              CAMBRIDGE HOT SEAT
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">[ IELTS-ACADEMIC ]</span>
          </div>

          {/* Stepper in Header for Live Session */}
          {view === "session" && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase">
              {STAGES.map((s, idx) => {
                const isCurrent = s.id === currentStage;
                const isPast = idx < currentStageIndex;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1 px-2 py-0.5 border transition-all ${
                      isCurrent
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                        : isPast
                        ? "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                        : "border-transparent text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    <span>0{idx + 1}.</span>
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {view === "mirrorgym" && (
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider hidden sm:inline">ACOUSTIC APPRENTICESHIP GYM</span>
            </div>
          )}
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-2">
          {view === "setup" && (
            <button
              type="button"
              onClick={handleWipeAllData}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Erase all local storage data and start over"
            >
              <Trash2 className="w-3 h-3" />
              <span>[ ERASE DATA & START OVER ]</span>
            </button>
          )}

          {view === "session" && (
            <>
              <div className="flex items-center gap-1 px-2 py-1 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{formatSessionTime(sessionSeconds)}</span>
              </div>

              <LatencyHUD telemetry={telemetry} activeModelName={activeModel} />

              <button
                type="button"
                onClick={handleFinishSession}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-950 text-white border border-rose-900 font-mono text-xs uppercase font-bold transition-all cursor-pointer"
              >
                END & REPORT
              </button>
            </>
          )}

          {view === "mirrorgym" && (
            <button
              type="button"
              onClick={() => setView("setup")}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-xs uppercase font-bold transition-all cursor-pointer border border-zinc-900 dark:border-zinc-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>EXIT TO DASHBOARD</span>
            </button>
          )}

          {view === "feedback" && (
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-xs uppercase font-bold transition-all cursor-pointer border border-zinc-900 dark:border-zinc-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>NEW HOT SEAT</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Cockpit */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col justify-start lg:justify-center overflow-y-auto lg:overflow-hidden">
        {errorMsg && (
          <div className="mb-3 p-3 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs font-mono flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">SYSTEM WARNING:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* View 1: Authentic Setup */}
        {view === "setup" && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4">
            <SetupCard
              onStartHotSeat={handleStartSession}
              onEnterMirrorGym={() => setView("mirrorgym")}
              onWipeAllData={handleWipeAllData}
              onOpenGrill={() => setIsGrillManuallyOpen(true)}
              masterPracticeCount={masterScript.totalPracticeCount}
              testHistory={testHistory}
              isLoading={isLoading}
              loadingStep={loadingStep}
              profile={profile}
              onProfileChange={(updatedProfile) => {
                saveProfile(updatedProfile);
              }}
            />
          </div>
        )}

        {/* View 2: Zero-Scroll Academic Cockpit (Desktop) / Scrollable (Mobile) */}
        {view === "session" && lesson && (
          <div className="w-full lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
            {/* Left Console (Oscilloscope & Controls) - 5 Columns */}
            <div className="lg:col-span-5 min-h-[460px] lg:h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between overflow-hidden shadow-xs">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {STAGES[currentStageIndex]?.badge}: {STAGES[currentStageIndex]?.label}
                </span>
                <span>{STAGES[currentStageIndex]?.hint}</span>
              </div>

              <div className="my-auto w-full">
                <VoiceOrb
                  status={liveStatus}
                  micAnalyser={micAnalyser}
                  tutorAnalyser={tutorAnalyser}
                  isMuted={isMuted}
                  micMode={micMode}
                  micVolume={micVolume}
                  tutorSpeaking={tutorSpeaking || isCoachTtsSpeaking}
                  speechProtection={speechProtection}
                  onToggleMute={handleToggleMute}
                  onChangeMicMode={handleChangeMicMode}
                  onToggleSpeechProtection={handleToggleSpeechProtection}
                  onPushToTalkChange={handlePushToTalkChange}
                  onInterruptTutor={handleInterruptTutor}
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-900 dark:border-zinc-100"
                >
                  <span>
                    {isLastStage
                      ? "[ GENERATE OFFICIAL DIAGNOSTIC REPORT ]"
                      : `[ ADVANCE TO ${STAGES[currentStageIndex + 1]?.label.toUpperCase() || "NEXT PART"} → ]`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Display (Cambridge Task Material & Transcript) - 7 Columns */}
            <div className="lg:col-span-7 min-h-[500px] lg:h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col overflow-hidden shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 font-mono text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("lesson")}
                    className={`px-3 py-1 uppercase border font-bold transition-all cursor-pointer ${
                      activeRightTab === "lesson"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    EXAM MATERIALS
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("transcript")}
                    className={`px-3 py-1 uppercase border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRightTab === "transcript"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span>TRANSCRIPT LOG</span>
                    {transcript.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-700 text-white font-mono">
                        {transcript.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-[10px] uppercase text-zinc-500 hidden sm:block">
                  {STAGES[currentStageIndex]?.label}
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-hidden">
                {activeRightTab === "lesson" ? (
                  <LessonCard
                    key={currentStage}
                    lesson={lesson}
                    currentStage={currentStage}
                    activeQuestionIdx={activeQuestionIdx}
                    autoAdvanceNotice={autoAdvanceNotice}
                    onSelectQuestion={(idx) => setActiveQuestionIdx(idx)}
                    onSpeakText={handleSpeakCoachText}
                    onStopSpeech={handleStopCoachText}
                    isCoachSpeaking={isCoachTtsSpeaking}
                    isTutorSpeaking={tutorSpeaking}
                    studentWordCount={studentWordCount}
                  />
                ) : (
                  <TranscriptFeed
                    entries={transcript}
                    onReplay={handleReplayCorrection}
                    onStopReplay={handleStopReplay}
                    isCoachSpeaking={isCoachTtsSpeaking}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 3: Master Script Upgrade Pipeline */}
        {view === "upgrading" && (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto font-mono space-y-5 animate-in fade-in">
            <div className="w-14 h-14 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 animate-pulse">
              <Sparkles className="w-7 h-7 text-amber-500" />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                [ AUTHENTIC HOT SEAT COMPLETE • UPGRADE PIPELINE ]
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                Evaluating Spoken Turns & Elevating Master Script
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                Comparing today&apos;s interview with your previous sessions, calculating fluency delta, and structuring your personal Band 8.5 Master Script...
              </p>
            </div>

            <div className="w-full p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-mono">
                <span>EVALUATION & TRANSFORMATION PIPELINE:</span>
                <span className="animate-spin text-amber-500">◒</span>
              </div>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 font-mono">
                <li>✓ Objectively grading recorded speech against IELTS descriptors</li>
                <li>✓ Calculating day-over-day cadence WPM and fluency improvements</li>
                <li>✓ Preserving your authentic personal facts & opinions</li>
                <li>✓ Structuring Band 8.5 cleft sentences & concessive clauses</li>
                <li>✓ Locking upgraded answers into Master Vault for daily repetition</li>
              </ul>
            </div>
          </div>
        )}

        {/* View 4: Master Script Mirror Gym (Acoustic Apprenticeship) */}
        {view === "mirrorgym" && (
          <div className="h-full w-full overflow-hidden p-2 sm:p-4">
            <div className="h-full max-w-4xl mx-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col overflow-hidden">
              <MasterMirrorGym
                repository={masterScript}
                onSpeakText={handleSpeakCoachText}
                onStopSpeech={handleStopCoachText}
                isCoachSpeaking={isCoachTtsSpeaking}
                studentWordCount={studentWordCount}
                onStartHotSeatRetake={() => {
                  handleRestart();
                }}
              />
            </div>
          </div>
        )}

        {/* View 5: Diagnostic Feedback & Daily Progress */}
        {view === "feedback" && (
          <div className="h-full w-full overflow-y-auto p-2 scrollbar-thin">
            {isGrading ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 max-w-md mx-auto my-auto font-mono">
                <div className="w-12 h-12 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 animate-pulse">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  COMPUTING PHONETIC DIAGNOSTICS & DELTA...
                </h3>
                <p className="text-xs text-zinc-500 font-sans max-w-xs mx-auto leading-relaxed">
                  Evaluating motor articulation, jaw tension, cadence WPM, and IELTS communicative descriptors.
                </p>
              </div>
            ) : feedback || noSpeechDetected ? (
              <FeedbackReport
                feedback={feedback}
                improvementDelta={improvementDelta || undefined}
                dayNumber={testHistory.length}
                noSpeechDetected={noSpeechDetected}
                onRestart={handleRestart}
                onEnterMirrorGym={() => setView("mirrorgym")}
              />
            ) : (
              <div className="text-center p-8 font-mono text-xs text-zinc-500">
                [ NO FEEDBACK DATA AVAILABLE ]
              </div>
            )}
          </div>
        )}

        {/* First-Time Interactive Candidate Grill Modal */}
        {shouldShowGrill && (
          <CandidateGrillModal
            initialProfile={profile}
            onCompleteGrill={(completedProfile) => {
              saveProfile(completedProfile);
              resetMasterScript(completedProfile);
              setIsGrillManuallyOpen(false);
            }}
            onSkip={() => {
              setIsGrillDismissed(true);
              setIsGrillManuallyOpen(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
