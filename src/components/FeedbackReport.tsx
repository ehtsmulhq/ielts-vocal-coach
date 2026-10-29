"use client";

import type { Feedback } from "@/lib/types";
import type { DailyImprovementDelta } from "@/lib/test-history";
import {
  RotateCcw,
  Activity,
  MicOff,
  Terminal,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Flame,
} from "lucide-react";

interface FeedbackReportProps {
  feedback: Feedback | null;
  improvementDelta?: DailyImprovementDelta;
  dayNumber?: number;
  noSpeechDetected?: boolean;
  onRestart: () => void;
  onEnterMirrorGym?: () => void;
}

export function FeedbackReport({
  feedback,
  improvementDelta,
  dayNumber,
  noSpeechDetected,
  onRestart,
  onEnterMirrorGym,
}: FeedbackReportProps) {
  if (noSpeechDetected || !feedback) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 py-6 font-sans animate-in fade-in duration-300">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
            <MicOff className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-zinc-900 dark:text-zinc-100">
              No Spoken Audio Recorded
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              No candidate speech was captured during this Cambridge Hot Seat interview session.
            </p>
          </div>

          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left space-y-2 text-xs font-mono">
            <span className="font-bold uppercase text-[10px] text-zinc-500 block">
              SYSTEM DIAGNOSIS & TROUBLESHOOTING:
            </span>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px]">
              <li>• Ensure microphone permission is granted in the browser.</li>
              <li>• In Push-to-Talk mode, hold [ SPACEBAR ] while speaking.</li>
              <li>• Verify input audio levels register on the Oscilloscope monitor.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            {onEnterMirrorGym && (
              <button
                type="button"
                onClick={onEnterMirrorGym}
                className="w-full sm:w-auto py-3 px-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-900 dark:border-zinc-100"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>[ ENTER MASTER MIRROR GYM ]</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="w-full sm:w-auto py-3 px-4 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-300 dark:border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>[ START NEW HOT SEAT ]</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const criteria = [
    { label: "PRONUNCIATION & ARTICULATION", data: feedback.pronunciation },
    { label: "FLUENCY & CADENCE COHERENCE", data: feedback.fluency },
    { label: "LEXICAL RANGE & PRECISION", data: feedback.lexical },
    { label: "GRAMMATICAL STRUCTURE ACCURACY", data: feedback.grammar },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 py-4 font-sans animate-in fade-in duration-300">
      {/* Official Diagnostic Score Banner */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-950 text-white p-6 sm:p-8 space-y-3 shadow-sm">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-800">
          <span className="flex items-center gap-1.5 font-bold">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            CAMBRIDGE IELTS HOT SEAT DIAGNOSTIC EVALUATION
          </span>
          <span className="bg-zinc-800 px-2 py-0.5 border border-zinc-700 text-zinc-300">
            {dayNumber ? `DAY ${dayNumber} HOT SEAT` : "AUTHENTIC TEST"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Communicative Band Evaluation
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Diagnostic assessment of speech cadence, syntax maturity, and lexical precision.
            </p>
          </div>

          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-4xl sm:text-5xl font-bold text-white">
              {feedback.overall.toFixed(1)}
            </span>
            <span className="text-zinc-500 text-sm">/ 9.0</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DAY-OVER-DAY IMPROVEMENT DELTA & CONCRETE WINS */}
      {/* ============================================================== */}
      {improvementDelta && (
        <div className="p-5 border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              MEASURABLE DAILY IMPROVEMENTS & MILESTONES
            </span>
            <span className="text-zinc-500">
              {improvementDelta.overallDelta > 0
                ? `+${improvementDelta.overallDelta} OVERALL BAND GAIN`
                : "PROGRESS HIGHLIGHTS"}
            </span>
          </div>

          {/* Key Concrete Wins */}
          <div className="space-y-1.5">
            {improvementDelta.keyWins.map((win, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-serif text-zinc-800 dark:text-zinc-200 font-medium">
                  {win}
                </span>
              </div>
            ))}
          </div>

          {/* Tomorrow's Deliberate Focus */}
          {improvementDelta.focusAreasForTomorrow && improvementDelta.focusAreasForTomorrow.length > 0 && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                DELIBERATE TARGET FOR TOMORROW:
              </span>
              <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 font-sans">
                {improvementDelta.focusAreasForTomorrow.map((target, idx) => (
                  <li key={idx}>→ {target}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Vocal Habits & Articulation Observations */}
      {feedback.vocalHabits && (
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            VOCAL BIOMECHANICS & CADENCE OBSERVATIONS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-serif">
            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                JAW & LIP ARTICULATION
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed">
                {feedback.vocalHabits.jawTension}
              </p>
            </div>
            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                BREATH & PHRASING CADENCE
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed">
                {feedback.vocalHabits.breathPacing}
              </p>
            </div>
            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                CONSONANT CLARITY
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed">
                {feedback.vocalHabits.soundClarity}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Criteria Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5"
          >
            <div className="flex items-center justify-between font-mono text-[10px] uppercase">
              <span className="text-zinc-500 font-bold">{item.label}</span>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                BAND {item.data.band.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              {item.data.comment}
            </p>
          </div>
        ))}
      </div>

      {/* Recommended Phonetic Repetition Words */}
      {feedback.wordsToPractice && feedback.wordsToPractice.length > 0 && (
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            RECOMMENDED PHONETIC REPETITION WORDS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {feedback.wordsToPractice.map((w, idx) => (
              <div
                key={idx}
                className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-0.5"
              >
                <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {w.word}
                </span>
                <p className="font-sans text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                  {w.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onEnterMirrorGym && (
          <button
            type="button"
            onClick={onEnterMirrorGym}
            className="w-full sm:w-auto px-6 py-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-zinc-900 dark:border-zinc-100 flex items-center justify-center gap-2 shadow-sm"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>[ ENTER MASTER MIRROR GYM (DRILL TODAY&apos;S UPGRADED SCRIPT) → ]</span>
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>[ TAKE ANOTHER TEST ]</span>
        </button>
      </div>
    </div>
  );
}
