"use client";

import { useState, useEffect, useRef } from "react";
import type { MasterScriptRepository, ScriptItem } from "@/lib/master-script";
import { logRepetitionCompleted } from "@/lib/master-script";
import {
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Award,
  Mic,
  MicOff,
  AlertCircle,
  Square,
  RefreshCw,
} from "lucide-react";

interface MirrorMistake {
  type: "syntax" | "collocation" | "hesitation" | "pronunciation" | "substitution";
  userSaid: string;
  targetPhrase: string;
  coachCorrection: string;
  phoneticTip?: string;
}

interface MirrorCoachResponse {
  transcribedSpokenText?: string;
  accuracyScore: number;
  actualWpm: number;
  fluencyRating: "Needs Polish" | "Solid Cadence" | "Master Level Band 9";
  mistakes: MirrorMistake[];
  praise: string;
  drVanceSpokenFeedback: string;
  matchedWordsCount: number;
  totalWordsCount: number;
}

interface MasterMirrorGymProps {
  repository: MasterScriptRepository;
  onSpeakText?: (text: string, rate?: number) => void;
  onStopSpeech?: () => void;
  isCoachSpeaking?: boolean;
  studentWordCount?: number;
  onStartHotSeatRetake?: () => void;
}

export function MasterMirrorGym({
  repository,
  onSpeakText,
  onStopSpeech,
  isCoachSpeaking,
  onStartHotSeatRetake,
}: MasterMirrorGymProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [workoutRep, setWorkoutRep] = useState<"absorb" | "shadow" | "deliver">("absorb");
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [repJustLogged, setRepJustLogged] = useState(false);

  // Live AI Coach Listening & Audio Telemetry State
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [micVolume, setMicVolume] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState<MirrorCoachResponse | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const items = repository.items;
  const currentItem: ScriptItem = items[activeIndex] || items[0];

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setMicVolume(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
  };

  // Stopwatch for candidate shadowing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isListening) {
      timer = setInterval(() => setReadingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isListening]);

  // Cleanup mic & audio on unmount or tab switch
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [activeIndex]);

  const words = currentItem.upgradedScript.split(/\s+/);
  const spokenWords = spokenTranscript.trim().split(/\s+/).filter(Boolean);
  const calculatedWpm =
    readingSeconds > 3 && spokenWords.length > 0
      ? Math.round(spokenWords.length / (readingSeconds / 60))
      : 0;

  // Start Universal Audio Recording + Web Speech API (if supported)
  const startListening = async () => {
    setMicError(null);
    setSpokenTranscript("");
    setCoachAnalysis(null);
    setReadingSeconds(0);
    audioChunksRef.current = [];
    onStopSpeech?.();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
    } catch (err) {
      console.error("Microphone access error:", err);
      setMicError("Microphone access denied or unavailable. Please grant microphone permission in your browser settings.");
      return;
    }

    // 1. AudioContext volume meter for live visual feedback
    try {
      const audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setMicVolume(Math.min(1, avg / 128));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn("Could not start AudioContext volume meter:", err);
    }

    // 2. Start MediaRecorder (universal audio capture supporting Brave, Chrome, Safari, Edge, Firefox)
    try {
      const mimeType =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = chunks;
    } catch (err) {
      console.warn("MediaRecorder start error:", err);
    }

    // 3. Optional Web Speech API Recognition for real-time live words preview
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          let fullText = "";
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + " ";
          }
          setSpokenTranscript(fullText.trim());
        };

        recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.warn("Speech recognition notice (MediaRecorder active):", event.error);
        };

        recognition.onend = () => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("SpeechRecognition start error:", err);
      }
    }

    isListeningRef.current = true;
    setIsListening(true);
  };

  // Submit Spoken Delivery to AI Coach for Diagnostic Mistakes & Fixes
  const handleAnalyzeDelivery = async () => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsAnalyzing(true);
    setMicError(null);

    // Stop MediaRecorder and collect final chunks
    let audioBase64: string | undefined;
    let audioMimeType = "audio/webm";

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        audioMimeType = mediaRecorderRef.current.mimeType || "audio/webm";
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
        });
      } catch {}
    }

    // Convert recorded audio chunks to base64 for Gemini multimodal transcription & analysis
    if (audioChunksRef.current.length > 0) {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: audioMimeType });
        if (audioBlob.size > 200) {
          const buffer = await audioBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          }
          audioBase64 = btoa(binary);
        }
      } catch (err) {
        console.warn("Could not encode audio blob to base64:", err);
      }
    }

    stopListening();

    try {
      const res = await fetch("/api/mirror-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetScript: currentItem.upgradedScript,
          candidateSpokenText: spokenTranscript,
          audioBase64,
          audioMimeType,
          targetCollocations: currentItem.targetCollocations,
          thoughtChunks: currentItem.thoughtChunks,
          durationSeconds: readingSeconds || 10,
          category: currentItem.category,
          targetBand: repository.targetBand || "7.5",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze delivery with AI Coach.");
      }

      const data: MirrorCoachResponse = await res.json();
      setCoachAnalysis(data);

      if (data.transcribedSpokenText && !spokenTranscript) {
        setSpokenTranscript(data.transcribedSpokenText);
      }

      // Automatically speak Dr. Vance's spoken feedback aloud!
      if (data.drVanceSpokenFeedback && onSpeakText) {
        onSpeakText(data.drVanceSpokenFeedback, 1.0);
      }
    } catch (err) {
      console.error("AI Coach Analysis error:", err);
      setMicError((err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogRep = () => {
    logRepetitionCompleted();
    setRepJustLogged(true);
    setTimeout(() => setRepJustLogged(false), 2000);
  };

  const handleNext = () => {
    if (activeIndex < items.length - 1) {
      stopListening();
      setActiveIndex(activeIndex + 1);
      setReadingSeconds(0);
      setSpokenTranscript("");
      setCoachAnalysis(null);
      setWorkoutRep("absorb");
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      stopListening();
      setActiveIndex(activeIndex - 1);
      setReadingSeconds(0);
      setSpokenTranscript("");
      setCoachAnalysis(null);
      setWorkoutRep("absorb");
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin select-none font-sans space-y-4 animate-in fade-in">
      {/* Header & Vault Status Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Mirror Practice Gym
          </span>
        </div>

        {/* Persistent Streak & Total Reps Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Total Reps: {repository.totalPracticeCount}</span>
          </div>

          {onStartHotSeatRetake && (
            <button
              type="button"
              onClick={onStartHotSeatRetake}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retake Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Item Selector Tabs (01. Work -> 05. Cue Card) */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                stopListening();
                setActiveIndex(idx);
                setReadingSeconds(0);
                setSpokenTranscript("");
                setCoachAnalysis(null);
                setWorkoutRep("absorb");
              }}
              className={`px-3 py-1 font-mono text-[10px] uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeIndex === idx
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold shadow-xs"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 bg-white dark:bg-zinc-950"
              }`}
            >
              0{idx + 1}. {item.category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={handlePrev}
            className="p-1 border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={activeIndex === items.length - 1}
            onClick={handleNext}
            className="p-1 border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canonical Question Spotlight */}
      <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500">
          <span className="font-bold">{currentItem.title}</span>
          <span>Examiner Prompt</span>
        </div>
        <p className="font-serif font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-snug">
          &ldquo;{currentItem.question}&rdquo;
        </p>
      </div>

      {/* Step 1: Model Exemplar */}
      <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
            1. Model Answer
          </span>
        </div>

        {onSpeakText && (
          <div className="flex items-center gap-2">
            {isCoachSpeaking ? (
              <button
                type="button"
                onClick={onStopSpeech}
                className="px-3 py-1 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono text-[10px] uppercase font-bold cursor-pointer"
              >
                Stop Audio
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSpeakText(currentItem.upgradedScript, 0.85)}
                  className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 cursor-pointer"
                >
                  0.85x
                </button>
                <button
                  type="button"
                  onClick={() => onSpeakText(currentItem.upgradedScript, 1.0)}
                  className="px-3 py-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[10px] uppercase font-bold cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Model (1.0x)</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Live AI Coach Interactive Listening & Teleprompter */}
      <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              2. Deliver & Check Feedback
            </span>
            {isListening && (
              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Listening...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              <Activity className="w-3 h-3 text-zinc-500" />
              <span>
                Cadence:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {calculatedWpm > 0 ? `${calculatedWpm} WPM` : `${currentItem.masterCadenceWpm} WPM (target)`}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowOriginalComparison(!showOriginalComparison)}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              {showOriginalComparison ? "Hide Original Take" : "View Original Take"}
            </button>
          </div>
        </div>

        {/* Speech Input & Control Bar */}
        <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="py-2 px-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Mic className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnalyzeDelivery}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Review</span>
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  className="p-2 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  title="Cancel listening"
                >
                  <MicOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Live Volume Meter Bar */}
            {isListening && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Mic Active:
                </span>
                <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.max(6, Math.round(micVolume * 100))}%` }}
                  />
                </div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{readingSeconds}s</span>
              </div>
            )}
          </div>

          {/* Quick Guidance */}
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans italic">
            {isListening
              ? "Read aloud with natural pacing. Tap Stop when finished."
              : "Tap Start Recording, read aloud with natural rhythm, then tap Stop."}
          </div>
        </div>

        {/* Listening Active Banner (when waiting for speech or on browsers without live ASR) */}
        {isListening && !spokenTranscript && (
          <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 flex items-center justify-between text-xs font-mono animate-pulse">
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>RECORDING YOUR VOICE... READ THE SCRIPT ALOUD</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold">{readingSeconds}s</span>
          </div>
        )}

        {/* Live Audio Transcript Streaming Display */}
        {spokenTranscript && (
          <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200 space-y-1 font-sans text-xs animate-in fade-in">
            <div className="font-mono text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Mic className="w-3 h-3" />
              <span>YOUR SPOKEN DELIVERY DETECTED ({spokenWords.length} words):</span>
            </div>
            <p className="font-serif italic text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              &ldquo;{spokenTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Error message */}
        {micError && (
          <div className="p-3 border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Original Take 1 vs Upgraded Script Comparison Drawer */}
        {showOriginalComparison && (
          <div className="p-3.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 space-y-2 animate-in fade-in">
            <div className="font-mono text-[10px] uppercase text-zinc-400 font-bold">
              Your Raw Take 1 Spoken Baseline:
            </div>
            <p className="font-serif italic text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              &ldquo;{currentItem.originalRawSpoken}&rdquo;
            </p>
          </div>
        )}

        {/* Dynamic Teleprompter Words */}
        <p className="text-base sm:text-lg leading-relaxed font-serif text-zinc-900 dark:text-zinc-100 py-1">
          {words.map((w, idx) => {
            const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
            const isSpokenByCandidate = spokenWords.some(
              (sw) => sw.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanWord
            );
            const isStressed = currentItem.stressedWords.some((sw) =>
              cleanWord.includes(sw.toLowerCase())
            );

            return (
              <span
                key={idx}
                className={`inline-block mr-1.5 transition-colors duration-150 ${
                  isSpokenByCandidate
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : isStressed
                    ? "font-bold text-zinc-950 dark:text-zinc-50 border-b border-amber-500"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {w}
              </span>
            );
          })}
        </p>
      </div>

      {/* ============================================================== */}
      {/* AI COACH DIAGNOSTIC FEEDBACK & MISTAKE FIXING CONSOLE */}
      {/* ============================================================== */}
      {isAnalyzing && (
        <div className="p-6 border border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 text-center font-mono space-y-3 animate-in fade-in">
          <div className="w-8 h-8 mx-auto border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin" />
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
            Analyzing delivery and pronunciation...
          </div>
          <p className="text-[11px] text-zinc-500 font-sans max-w-sm mx-auto">
            Comparing spoken delivery with target pacing and collocations...
          </p>
        </div>
      )}

      {coachAnalysis && (
        <div className="p-5 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 animate-in fade-in shadow-md">
          {/* Diagnostic Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Delivery & Accuracy Feedback
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold">
                Accuracy: {coachAnalysis.accuracyScore}%
              </span>
              <span className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold">
                Pacing: {coachAnalysis.actualWpm} WPM
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30">
                {coachAnalysis.fluencyRating}
              </span>
            </div>
          </div>

          {/* Coach Spoken Assessment */}
          <div className="p-3.5 border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Coach Commentary:
              </span>
              {onSpeakText && (
                <button
                  type="button"
                  onClick={() => onSpeakText(coachAnalysis.drVanceSpokenFeedback, 1.0)}
                  className="hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Hear Again</span>
                </button>
              )}
            </div>
            <p className="font-serif italic text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
              &ldquo;{coachAnalysis.drVanceSpokenFeedback}&rdquo;
            </p>
          </div>

          {/* Specific Mistakes Detected & Exact Fixes */}
          <div className="space-y-2.5">
            <div className="font-mono text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Suggested Corrections:
            </div>

            {coachAnalysis.mistakes.length === 0 ? (
              <div className="p-3 border border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Flawless delivery! No significant mistakes or omissions detected. Repetition counts toward muscle memory.</span>
              </div>
            ) : (
              <div className="space-y-2 font-sans text-xs">
                {coachAnalysis.mistakes.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="px-1.5 py-0.2 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 uppercase font-bold">
                        {m.type}
                      </span>
                      {onSpeakText && (
                        <button
                          type="button"
                          onClick={() => onSpeakText(m.targetPhrase, 0.9)}
                          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer font-mono text-[10px]"
                          title="Listen to model articulation"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Hear Model</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <span className="text-zinc-400 font-mono text-[9px] uppercase block">You Said:</span>
                        <span className="font-serif italic text-rose-600 dark:text-rose-400 font-medium">
                          &ldquo;{m.userSaid}&rdquo;
                        </span>
                      </div>
                      <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <span className="text-zinc-400 font-mono text-[9px] uppercase block">Target Phrase:</span>
                        <span className="font-serif text-emerald-700 dark:text-emerald-400 font-bold">
                          &ldquo;{m.targetPhrase}&rdquo;
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono text-[10px] uppercase">Correction: </strong>
                      {m.coachCorrection}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
            <button
              type="button"
              onClick={startListening}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase font-bold text-[11px] cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Rep</span>
            </button>

            <button
              type="button"
              onClick={handleLogRep}
              className={`px-4 py-2 font-mono font-bold text-xs uppercase cursor-pointer flex items-center gap-1.5 border ${
                repJustLogged
                  ? "bg-emerald-900 text-emerald-100 border-emerald-700"
                  : "bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
              }`}
            >
              {repJustLogged ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rep Logged!</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>Save Practice Rep</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Target Collocations Bank */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Key Collocations & Phrases</span>
          <span>Listen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {currentItem.targetCollocations.map((colloc, cIdx) => (
            <div
              key={cIdx}
              className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {colloc.phrase}
                </span>
                {onSpeakText && (
                  <button
                    type="button"
                    onClick={() => onSpeakText(colloc.phrase, 0.9)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 font-sans">{colloc.meaning}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{colloc.phoneticTip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Repetition Logging & Workout Cycle Tracker */}
      <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-zinc-400 font-bold mr-1">Mode:</span>
          {(["absorb", "shadow", "deliver"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setWorkoutRep(mode);
                if (mode === "shadow" || mode === "deliver") {
                  if (!isListening) startListening();
                } else {
                  stopListening();
                }
              }}
              className={`px-2.5 py-1 text-[10px] uppercase border cursor-pointer transition-all ${
                workoutRep === mode
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                  : "bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {mode === "absorb" && "1. Listen"}
              {mode === "shadow" && "2. Shadow"}
              {mode === "deliver" && "3. Deliver"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogRep}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border ${
            repJustLogged
              ? "bg-emerald-900 text-emerald-100 border-emerald-700"
              : "bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
          }`}
        >
          {repJustLogged ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rep Logged!</span>
            </>
          ) : (
            <>
              <Award className="w-3.5 h-3.5" />
              <span>Save Practice Rep</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
