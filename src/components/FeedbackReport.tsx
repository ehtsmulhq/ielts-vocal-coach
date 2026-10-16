"use client";

import type { Feedback } from "@/lib/types";
import { RotateCcw, Activity, MicOff, Terminal } from "lucide-react";

interface FeedbackReportProps {
  feedback: Feedback | null;
  noSpeechDetected?: boolean;
  onRestart: () => void;
}

export function FeedbackReport({ feedback, noSpeechDetected, onRestart }: FeedbackReportProps) {
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
              No candidate speech or sight-reading utterance was detected during this session.
            </p>
          </div>

          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left space-y-2 text-xs font-mono">
            <span className="font-bold uppercase text-[10px] text-zinc-500 block">
              SYSTEM DIAGNOSIS & TROUBLESHOOTING:
            </span>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px]">
              <li>• Ensure microphone permission is granted in the browser header.</li>
              <li>• In Push-to-Talk mode, hold [ SPACEBAR ] while speaking.</li>
              <li>• Verify input audio levels register on the Oscilloscope monitor.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-6 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-900 dark:border-zinc-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ RE-INITIALIZE WORKOUT PROTOCOL ]</span>
          </button>
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
            OFFICIAL DIAGNOSTIC EVALUATION REPORT
          </span>
          <span>REF: IELTS-BAND-DESCRIPTORS</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Communicative Band Evaluation
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Diagnostic assessment of speech motor articulation, cadence, and fluency.
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

      {/* Vocal Habits & Biomechanics Cards */}
      {feedback.vocalHabits && (
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            VOCAL BIOMECHANICS & MOTOR OBSERVATIONS
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
            className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
          >
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="font-bold">{item.label}</span>
              <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                BAND {item.data.band.toFixed(1)}
              </span>
            </div>
            <p className="font-serif text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {item.data.comment}
            </p>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            [ DEMONSTRATED STRENGTHS ]
          </div>
          <ul className="space-y-1.5 font-serif text-xs text-zinc-800 dark:text-zinc-200">
            {feedback.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="font-mono text-zinc-400">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            [ ARTICULATORY PRIORITIES ]
          </div>
          <ul className="space-y-1.5 font-serif text-xs text-zinc-800 dark:text-zinc-200">
            {feedback.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="font-mono text-zinc-400">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Practice Words */}
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

      {/* Next Drill Prescription */}
      <div className="p-4 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 space-y-1">
        <div className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">
          RECOMMENDED 5-MINUTE DAILY VOCAL PRESCRIPTION
        </div>
        <p className="font-serif text-sm leading-relaxed">
          {feedback.nextDrill}
        </p>
      </div>

      {/* Restart Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="px-6 py-3 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-zinc-900 dark:border-zinc-100 flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>[ INITIALIZE NEW WORKOUT PROTOCOL ]</span>
        </button>
      </div>
    </div>
  );
}
