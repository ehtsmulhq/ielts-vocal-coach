"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
  studentWordCount = 0,
  onStartHotSeatRetake,
}: MasterMirrorGymProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [workoutRep, setWorkoutRep] = useState<"absorb" | "shadow" | "deliver">("absorb");
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [repJustLogged, setRepJustLogged] = useState(false);

  const items = repository.items;
  const currentItem: ScriptItem = items[activeIndex] || items[0];

  // Stopwatch for candidate shadowing
  useEffect(() => {
    const timer = setInterval(() => setReadingSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const words = currentItem.upgradedScript.split(/\s+/);
  const calculatedWpm =
    readingSeconds > 5 && studentWordCount > 0
      ? Math.round(studentWordCount / (readingSeconds / 60))
      : 0;

  const handleLogRep = () => {
    logRepetitionCompleted();
    setRepJustLogged(true);
    setTimeout(() => setRepJustLogged(false), 2000);
  };

  const handleNext = () => {
    if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
      setReadingSeconds(0);
      setWorkoutRep("absorb");
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      setReadingSeconds(0);
      setWorkoutRep("absorb");
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin select-none font-sans space-y-4 animate-in fade-in">
      {/* Header & Vault Status Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            MASTER SCRIPT APPRENTICESHIP GYM
          </span>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">[ NO RANDOM • DAILY REPETITION ]</span>
        </div>

        {/* Persistent Streak & Total Reps Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>TOTAL REPS: {repository.totalPracticeCount}</span>
          </div>

          {onStartHotSeatRetake && (
            <button
              type="button"
              onClick={onStartHotSeatRetake}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>[ RETAKE HOT SEAT ]</span>
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
                setActiveIndex(idx);
                setReadingSeconds(0);
                setWorkoutRep("absorb");
              }}
              className={`px-3 py-1 font-mono text-[10px] uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeIndex === idx
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold shadow-xs"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 bg-white dark:bg-zinc-950"
              }`}
            >
              0{idx + 1}. {item.category.toUpperCase()}
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
          <span>CANONICAL EXAM PROMPT</span>
        </div>
        <p className="font-serif font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-snug">
          &ldquo;{currentItem.question}&rdquo;
        </p>
      </div>

      {/* Step 1: Listen to the Master Model First */}
      <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
            STEP 1: THE MASTER EXEMPLAR (MIRROR FIRST)
          </span>
          <span className="text-zinc-400 text-[9px] hidden sm:inline">
            Absorb native British RP sentence melody
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-900">
          <p className="text-[11px] text-zinc-500 font-sans italic max-w-sm">
            Listen with eyes closed. Notice where the voice rises, lingers on stressed vowels, and settles with authority.
          </p>

          {onSpeakText && (
            <div className="flex items-center gap-2">
              {isCoachSpeaking ? (
                <button
                  type="button"
                  onClick={onStopSpeech}
                  className="px-3 py-1 border border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono text-[10px] uppercase font-bold cursor-pointer"
                >
                  STOP AUDIO
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSpeakText(currentItem.upgradedScript, 0.85)}
                    className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 cursor-pointer"
                  >
                    ARTICULATION 0.85X
                  </button>
                  <button
                    type="button"
                    onClick={() => onSpeakText(currentItem.upgradedScript, 1.0)}
                    className="px-3 py-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[10px] uppercase font-bold cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>MODEL 1.0X</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Visual Rhythm Teleprompter & Telemetry */}
      <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            STEP 2: RHYTHMIC TELEPROMPTER SHADOWING
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              <Activity className="w-3 h-3 text-zinc-500" />
              <span>
                CADENCE:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {calculatedWpm > 0 ? `${calculatedWpm} WPM` : `${currentItem.masterCadenceWpm} WPM (TARGET)`}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowOriginalComparison(!showOriginalComparison)}
              className="text-[9px] underline text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              {showOriginalComparison ? "[ HIDE ORIGINAL TAKE 1 ]" : "[ VIEW ORIGINAL TAKE 1 ]"}
            </button>
          </div>
        </div>

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
        <p className="text-base sm:text-lg leading-relaxed font-serif text-zinc-900 dark:text-zinc-100">
          {words.map((w, idx) => {
            const isSpoken = idx < studentWordCount;
            const isCurrent = idx === studentWordCount;
            const isStressed = currentItem.stressedWords.some((sw) =>
              w.toLowerCase().includes(sw.toLowerCase())
            );

            return (
              <span
                key={idx}
                className={`inline-block mr-1.5 transition-colors duration-150 ${
                  isCurrent
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold px-1"
                    : isSpoken
                    ? "text-zinc-400 dark:text-zinc-500 line-through"
                    : isStressed
                    ? "font-bold text-zinc-950 dark:text-zinc-50"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {w}
              </span>
            );
          })}
        </p>

        {/* Thought Chunks Breakdown with Pipe Breath Notation */}
        <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
          <div className="font-mono text-[10px] uppercase text-zinc-500 font-bold flex items-center justify-between">
            <span>Rhythmic Phrasing & Natural Breath Units:</span>
            <span className="text-[9px] text-zinc-400">INSUFLATE AT &apos;|&apos;</span>
          </div>
          <div className="space-y-1 font-serif text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
            {currentItem.thoughtChunks.map((chunk, cIdx) => (
              <div key={cIdx} className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-zinc-400">[{cIdx + 1}]</span>
                <span className="font-medium">
                  {chunk.endsWith("|") ? chunk : `${chunk} |`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Collocations Bank */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Band 8.5+ Collocation Anchors in This Answer</span>
          <span>Tap to Hear Model</span>
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
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
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
          <span className="text-[10px] uppercase text-zinc-400 font-bold mr-1">WORKOUT PHASE:</span>
          {(["absorb", "shadow", "deliver"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setWorkoutRep(mode)}
              className={`px-2.5 py-1 text-[10px] uppercase border cursor-pointer transition-all ${
                workoutRep === mode
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                  : "bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {mode === "absorb" && "1. ABSORB"}
              {mode === "shadow" && "2. SHADOW"}
              {mode === "deliver" && "3. DELIVER"}
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
              <span>REP LOGGED TO VAULT!</span>
            </>
          ) : (
            <>
              <Award className="w-3.5 h-3.5" />
              <span>[ LOG REPETITION COMPLETED ✅ ]</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
