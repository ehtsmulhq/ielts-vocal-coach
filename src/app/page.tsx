"use client";

import { useState, useRef, useEffect } from "react";
import type { Lesson, Stage, TargetBand, TranscriptEntry, Feedback, NetworkTelemetry } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { LIVE_MODEL } from "@/lib/models";
import { examinerInstruction, STAGE_CUES } from "@/lib/prompts";
import { LiveSession, type LiveStatus, type MicMode } from "@/lib/live-session";
import { SpeechEngine } from "@/lib/speech-engine";
import { SetupCard } from "@/components/SetupCard";
import { VoiceOrb } from "@/components/VoiceOrb";
import { LessonCard } from "@/components/LessonCard";
import { TranscriptFeed } from "@/components/TranscriptFeed";
import { FeedbackReport } from "@/components/FeedbackReport";
import { LatencyHUD } from "@/components/LatencyHUD";
import {
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Dumbbell,
  Clock,
} from "lucide-react";

export default function Home() {
  const [view, setView] = useState<"setup" | "session" | "feedback">("setup");
  const [band, setBand] = useState<TargetBand>("6.5");
  const [activeModel, setActiveModel] = useState<string>(LIVE_MODEL);

  // Lesson generation
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Live session
  const sessionRef = useRef<LiveSession | null>(null);
  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [currentStage, setCurrentStage] = useState<Stage>("motor_warmup");
  const currentStageRef = useRef<Stage>("motor_warmup");
  const [isMuted, setIsMuted] = useState(false);
  const [micMode, setMicMode] = useState<MicMode>("continuous");
  const [micVolume, setMicVolume] = useState(0);
  const [tutorSpeaking, setTutorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Teleprompter words count for student in long reading
  const [studentWordCount, setStudentWordCount] = useState(0);
  const [isCoachTtsSpeaking, setIsCoachTtsSpeaking] = useState(false);

  // Right card tab: "lesson" | "transcript"
  const [activeRightTab, setActiveRightTab] = useState<"lesson" | "transcript">("lesson");

  // Session duration timer
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Analysers for VoiceOrb
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
  const [tutorAnalyser, setTutorAnalyser] = useState<AnalyserNode | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);
  const [telemetry, setTelemetry] = useState<NetworkTelemetry | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speechProtection, setSpeechProtection] = useState<"protected" | "barge-in">("protected");

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
    focusArea?: "full" | "consonants" | "reading" | "speed",
    voiceId?: string
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    setBand(chosenBand);
    const selectedLive = liveModelId || activeModel;
    setActiveModel(selectedLive);

    try {
      // Step 1: Generate dynamic vocal workout curriculum
      setLoadingStep("Curating customized Long Reading & Vocal Gym drills...");
      const lessonRes = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band: chosenBand, topic, focusArea }),
      });
      if (!lessonRes.ok) {
        const err = await lessonRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate vocal routine");
      }
      const { lesson: generatedLesson } = (await lessonRes.json()) as { lesson: Lesson };
      setLesson(generatedLesson);

      // Step 2: Request single-use ephemeral token
      setLoadingStep("Authorizing ultra-fast Live Coach session...");
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
      setLoadingStep("Starting audio graph & microphone worklet...");
      setTranscript([]);
      currentStageRef.current = "motor_warmup";
      setCurrentStage("motor_warmup");
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

            // Calculate running student words for the active stage (especially long_reading teleprompter)
            if (role === "student") {
              const activeStageStudentWords = nextEntries
                .filter((t) => t.role === "student" && t.stage === activeStage)
                .reduce((acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length, 0);
              setStudentWordCount(activeStageStudentWords);
            }

            return nextEntries;
          });
        },
        onTurnComplete: () => {
          setTutorSpeaking(false);
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
        systemInstruction: examinerInstruction(generatedLesson),
      });

      // Link analysers for VoiceOrb
      setMicAnalyser(live.micAnalyser);
      setTutorAnalyser(live.tutorAnalyser);

      // Trigger initial motor drill greeting
      live.sendText(STAGE_CUES.motor_warmup);

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
    // If live tutor was speaking, interrupt it
    sessionRef.current?.interruptTutor();
    speechEngineRef.current?.speak(text, { rate });
  };

  const handleStopCoachText = () => {
    speechEngineRef.current?.stopSpeaking();
  };

  const handleNextStage = () => {
    speechEngineRef.current?.stopSpeaking();
    const curIdx = STAGES.findIndex((s) => s.id === currentStageRef.current);
    if (curIdx < STAGES.length - 1) {
      const nextStage = STAGES[curIdx + 1].id;
      currentStageRef.current = nextStage;
      setCurrentStage(nextStage);
      setStudentWordCount(0);
      sessionRef.current?.sendText(STAGE_CUES[nextStage]);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    sessionRef.current?.stop();
    speechEngineRef.current?.cleanup();
    setLiveStatus("closed");
    setView("feedback");
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
      setFeedback(null);
      setNoSpeechDetected(true);
      setIsGrading(false);
      return;
    }

    setNoSpeechDetected(false);
    setIsGrading(true);

    try {
      if (!lesson) throw new Error("No active lesson");
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson,
          transcript,
          band,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to grade transcript");
      }
      const data = await res.json();
      if (data.noSpeech) {
        setFeedback(null);
        setNoSpeechDetected(true);
        return;
      }
      setFeedback(data.feedback);
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message);
    } finally {
      setIsGrading(false);
    }
  };

  const handleRestart = () => {
    sessionRef.current?.stop();
    speechEngineRef.current?.cleanup();
    sessionRef.current = null;
    currentStageRef.current = "motor_warmup";
    setLesson(null);
    setTranscript([]);
    setFeedback(null);
    setNoSpeechDetected(false);
    setLiveStatus("idle");
    setCurrentStage("motor_warmup");
    setSessionSeconds(0);
    setStudentWordCount(0);
    setView("setup");
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
              PHONETICS LAB
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">[ IELTS-ACADEMIC ]</span>
          </div>

          {/* Protocol Stepper in Header */}
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
        </div>

        {/* Right header telemetry controls */}
        <div className="flex items-center gap-2">
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

          {view === "feedback" && (
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-xs uppercase font-bold transition-all cursor-pointer border border-zinc-900 dark:border-zinc-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>NEW PROTOCOL</span>
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

        {/* View 1: Minimalist Setup */}
        {view === "setup" && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4">
            <SetupCard
              onStart={handleStartSession}
              isLoading={isLoading}
              loadingStep={loadingStep}
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
                      ? "[ GENERATE DIAGNOSTIC REPORT ]"
                      : `[ ADVANCE TO ${STAGES[currentStageIndex + 1]?.label.toUpperCase() || "NEXT PROTOCOL"} → ]`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Display (Academic Journal Material & Transcript) - 7 Columns */}
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
                    LABORATORY MATERIAL
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
                  {STAGES[currentStageIndex].label}
                </div>
              </div>

              {/* Scrollable Container (internal only) */}
              <div className="flex-1 overflow-hidden">
                {activeRightTab === "lesson" ? (
                  <LessonCard
                    lesson={lesson}
                    currentStage={currentStage}
                    onSpeakText={handleSpeakCoachText}
                    onStopSpeech={handleStopCoachText}
                    isCoachSpeaking={isCoachTtsSpeaking}
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

        {/* View 3: Diagnostic Feedback */}
        {view === "feedback" && (
          <div className="h-full w-full overflow-y-auto p-2 scrollbar-thin">
            {isGrading ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 max-w-md mx-auto my-auto font-mono">
                <div className="w-12 h-12 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 animate-pulse">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  COMPUTING PHONETIC DIAGNOSTICS...
                </h3>
                <p className="text-xs text-zinc-500 font-sans max-w-xs mx-auto leading-relaxed">
                  Evaluating motor articulation, jaw tension, cadence WPM, and IELTS communicative descriptors.
                </p>
              </div>
            ) : feedback || noSpeechDetected ? (
              <FeedbackReport
                feedback={feedback}
                noSpeechDetected={noSpeechDetected}
                onRestart={handleRestart}
              />
            ) : (
              <div className="text-center p-8 font-mono text-xs text-zinc-500">
                [ NO FEEDBACK DATA AVAILABLE ]
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
