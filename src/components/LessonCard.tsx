"use client";

import { useState, useEffect, useRef } from "react";
import type { Lesson, Stage } from "@/lib/types";
import {
  Volume2,
  Clock,
  Sparkles,
  BookOpen,
  Play,
  RotateCcw,
  Pause,
  MessageSquare,
  Award,
  CheckCircle2,
} from "lucide-react";

interface LessonCardProps {
  lesson: Lesson;
  currentStage: Stage;
  activeQuestionIdx?: number;
  autoAdvanceNotice?: string | null;
  onSelectQuestion?: (idx: number) => void;
  onSpeakText?: (text: string, rate?: number) => void;
  onStopSpeech?: () => void;
  isCoachSpeaking?: boolean;
  isTutorSpeaking?: boolean;
  studentWordCount?: number;
}

export function LessonCard({
  lesson,
  currentStage,
  activeQuestionIdx = 0,
  autoAdvanceNotice,
  onSelectQuestion,
  onSpeakText,
  onStopSpeech,
  isCoachSpeaking,
  isTutorSpeaking,
  studentWordCount = 0,
}: LessonCardProps) {
  const exam = lesson.hotSeatTest || lesson.ieltsExam;

  // Part 2 Preparation timer (60s)
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepActive, setIsPrepActive] = useState(false);

  // Part 2 Speaking Stopwatch
  const [speechSeconds, setSpeechSeconds] = useState(0);

  // Active question highlight for Part 1 & Part 3 (voice leads, manual overrides only for current turn)
  const [userSelectedIdx, setUserSelectedIdx] = useState<{ idx: number; forActive: number } | null>(null);
  const effectiveQuestionIdx =
    userSelectedIdx && userSelectedIdx.forActive === activeQuestionIdx
      ? userSelectedIdx.idx
      : activeQuestionIdx;
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Automatically scroll into view alongside the examiner's voice
  useEffect(() => {
    const el = questionRefs.current[activeQuestionIdx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeQuestionIdx]);

  // Prep timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrepActive && prepSeconds > 0) {
      interval = setInterval(() => {
        setPrepSeconds((prev) => {
          if (prev <= 1) {
            setIsPrepActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPrepActive, prepSeconds]);

  // Speaking timer ticker for Part 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStage === "part2") {
      interval = setInterval(() => setSpeechSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

  const calculatedWpm =
    speechSeconds > 5 && studentWordCount > 0
      ? Math.round(studentWordCount / (speechSeconds / 60))
      : 0;

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin select-none font-sans space-y-4 animate-in fade-in">
      {/* Official Cambridge Examination Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
            {exam.cambridgeRef || "CAMBRIDGE IELTS SPEAKING"}
          </span>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">[ LIVE HOT SEAT ]</span>
        </div>

        <div className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 border border-zinc-200 dark:border-zinc-800">
          THEME: {lesson.topic.toUpperCase().slice(0, 40)}
        </div>
      </div>

      {/* Auto-Advance Notification Banner */}
      {autoAdvanceNotice && (
        <div className="p-3 border border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold uppercase tracking-wider">{autoAdvanceNotice}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 1: INTRODUCTION & IDENTITY INTERVIEW */}
      {/* ============================================================== */}
      {currentStage === "part1" && (
        <div className="space-y-4">
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500">
              <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                Part 1 • Identity, Roots & Familiar Everyday Life
              </span>
              <span>4–5 MINUTES</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              The examiner will start with your identity, work or studies, hometown, and living space before branching into everyday topics.
            </p>
          </div>

          {/* Official Inquiries List with Dynamic Highlighting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
              <span>OFFICIAL EXAMINER INQUIRIES:</span>
              <span>QUESTION {effectiveQuestionIdx + 1} OF {exam.part1Questions.length}</span>
            </div>
            {exam.part1Questions.map((q, idx) => {
              const isActive = effectiveQuestionIdx === idx;
              const isPast = idx < effectiveQuestionIdx;
              const isFuture = idx > effectiveQuestionIdx;

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    questionRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    setUserSelectedIdx({ idx, forActive: activeQuestionIdx });
                    onSelectQuestion?.(idx);
                  }}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    isActive
                      ? "border-amber-500 dark:border-amber-400 bg-white dark:bg-zinc-950 ring-2 ring-amber-500/30 dark:ring-amber-400/30 shadow-md scale-[1.01]"
                      : isPast
                      ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 opacity-55 hover:opacity-85"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="font-mono text-xs font-bold text-zinc-400 mt-0.5">
                        0{idx + 1}.
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="font-serif text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-medium leading-snug">
                          &ldquo;{q}&rdquo;
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          {isActive && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9px] uppercase font-bold flex items-center gap-1.5 border border-amber-500/30">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span>{isTutorSpeaking ? "🎙️ EXAMINER ASKING THIS INQUIRY" : "🎙️ CURRENT INQUIRY • YOUR TURN"}</span>
                            </span>
                          )}
                          {isPast && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] uppercase font-bold flex items-center gap-1 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>COMPLETED</span>
                            </span>
                          )}
                          {isFuture && (
                            <span className="font-mono text-[9px] text-zinc-400">
                              [ UPCOMING ]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onSpeakText && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserSelectedIdx({ idx, forActive: activeQuestionIdx });
                          onSelectQuestion?.(idx);
                          if (isCoachSpeaking) {
                            onStopSpeech?.();
                          } else {
                            onSpeakText?.(q, 1.0);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
                        title="Examiner audio model"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Band 8.5 Syntactic Anchor Tips */}
          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2 text-xs font-sans">
            <div className="font-mono text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              BAND 8.5+ SPOKEN SYNTAX ANCHORS (NO DELAYS)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                  Cleft Emphasis:
                </span>
                <span className="font-serif italic text-zinc-600 dark:text-zinc-400">
                  &ldquo;What strikes me most about my field is...&rdquo;
                </span>
              </div>
              <div className="p-2 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                  Fronted Adverbial:
                </span>
                <span className="font-serif italic text-zinc-600 dark:text-zinc-400">
                  &ldquo;Having lived in my city for over a decade...&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 2: THE INDIVIDUAL LONG TURN (CUE CARD) */}
      {/* ============================================================== */}
      {currentStage === "part2" && (
        <div className="space-y-4">
          {/* Preparation & Monologue HUD */}
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-bold">1-MIN PREPARATION:</span>
                <span
                  className={`font-bold px-2 py-0.5 border ${
                    prepSeconds <= 10 && prepSeconds > 0
                      ? "bg-rose-900 text-white border-rose-900 animate-pulse"
                      : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {prepSeconds}s
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPrepActive(!isPrepActive)}
                className="px-2 py-0.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 uppercase text-[10px] font-bold cursor-pointer hover:opacity-90 flex items-center gap-1"
              >
                {isPrepActive ? (
                  <>
                    <Pause className="w-2.5 h-2.5" /> PAUSE
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5" /> START PREP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPrepActive(false);
                  setPrepSeconds(60);
                }}
                className="p-1 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Speaking Stats */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
              <span>SPEAKING: {Math.floor(speechSeconds / 60)}m {speechSeconds % 60}s</span>
              <span>•</span>
              <span>WORDS: {studentWordCount}</span>
              {calculatedWpm > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    CADENCE: {calculatedWpm} WPM
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Official Candidate Task Card */}
          <div className="p-5 sm:p-6 border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 text-[10px] font-mono uppercase text-zinc-500 font-bold">
              <span>CANDIDATE TASK CARD • PART 2</span>
              <span>1 TO 2 MINUTES UNINTERRUPTED</span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-500 font-mono">
                You should speak for 1 to 2 minutes on this topic:
              </p>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                {exam.part2CueCard.title}
              </h3>
            </div>

            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">
                You should say:
              </span>
              <ul className="space-y-1.5 font-serif text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 pl-1">
                {exam.part2CueCard.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-400 font-mono mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-serif italic text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-900 pt-2">
              {exam.part2CueCard.closing}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 3: TWO-WAY ANALYTICAL DISCUSSION */}
      {/* ============================================================== */}
      {currentStage === "part3" && (
        <div className="space-y-4">
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500">
              <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <Award className="w-3.5 h-3.5 text-zinc-500" />
                Part 3 • Two-Way Analytical & Societal Discussion
              </span>
              <span>4–5 MINUTES</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              Explore broader societal, conceptual, and philosophical dimensions of the topic. The examiner will test your communicative ceiling.
            </p>
          </div>

          {/* Deep Analytical Inquiries with Dynamic Highlighting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
              <span>ANALYTICAL DISCUSSION PROMPTS:</span>
              <span>QUESTION {effectiveQuestionIdx + 1} OF {exam.part3Questions.length}</span>
            </div>
            {exam.part3Questions.map((q, idx) => {
              const isActive = effectiveQuestionIdx === idx;
              const isPast = idx < effectiveQuestionIdx;
              const isFuture = idx > effectiveQuestionIdx;

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    questionRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    setUserSelectedIdx({ idx, forActive: activeQuestionIdx });
                    onSelectQuestion?.(idx);
                  }}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    isActive
                      ? "border-amber-500 dark:border-amber-400 bg-white dark:bg-zinc-950 ring-2 ring-amber-500/30 dark:ring-amber-400/30 shadow-md scale-[1.01]"
                      : isPast
                      ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 opacity-55 hover:opacity-85"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="font-mono text-xs font-bold text-zinc-400 mt-0.5">
                        0{idx + 1}.
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="font-serif text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-medium leading-snug">
                          &ldquo;{q}&rdquo;
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          {isActive && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9px] uppercase font-bold flex items-center gap-1.5 border border-amber-500/30">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span>{isTutorSpeaking ? "🎙️ EXAMINER ASKING THIS INQUIRY" : "🎙️ CURRENT INQUIRY • YOUR TURN"}</span>
                            </span>
                          )}
                          {isPast && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] uppercase font-bold flex items-center gap-1 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>COMPLETED</span>
                            </span>
                          )}
                          {isFuture && (
                            <span className="font-mono text-[9px] text-zinc-400">
                              [ UPCOMING ]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onSpeakText && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserSelectedIdx({ idx, forActive: activeQuestionIdx });
                          onSelectQuestion?.(idx);
                          if (isCoachSpeaking) {
                            onStopSpeech?.();
                          } else {
                            onSpeakText?.(q, 1.0);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
                        title="Examiner audio model"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommended Cambridge Lexical Collocations Bank */}
          {exam.recommendedVocabulary && exam.recommendedVocabulary.length > 0 && (
            <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5">
              <div className="font-mono text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                CAMBRIDGE BAND 8.5+ LEXICAL COLLOCATIONS TO DEPLOY
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {exam.recommendedVocabulary.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-0.5"
                  >
                    <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                      {v.phrase}
                    </span>
                    <p className="font-sans text-[11px] text-zinc-500 leading-snug">
                      {v.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage Progression Guidance Footer */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>CURRENT PROTOCOL: {currentStage.toUpperCase()}</span>
        <span>SPEAK CLEARLY INTO THE MICROPHONE</span>
      </div>
    </div>
  );
}
