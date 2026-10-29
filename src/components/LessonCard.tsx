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
  const [candidateNotes, setCandidateNotes] = useState("");
  const [showSyntaxTips, setShowSyntaxTips] = useState(false);
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
    <div className="h-full flex flex-col overflow-y-auto pr-1 scrollbar-thin select-none font-sans space-y-4 animate-in fade-in">
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
        <div className="p-3 border border-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-mono flex items-center justify-between animate-pulse">
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
        <div className="space-y-3.5">
          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold uppercase tracking-wider">
                Part 1 • Identity, Roots & Everyday Life
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5">
              4–5 MINS
            </span>
          </div>

          {/* Official Inquiries List with Sleek Left Accent Highlighting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider px-0.5">
              <span>Official Examiner Inquiries:</span>
              <span>Question {effectiveQuestionIdx + 1} of {exam.part1Questions.length}</span>
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
                      ? "border-l-4 border-l-amber-500 dark:border-l-amber-400 border-zinc-300 dark:border-zinc-700 bg-amber-500/[0.04] dark:bg-amber-400/[0.05] shadow-sm"
                      : isPast
                      ? "border-l-4 border-l-emerald-500/50 border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30"
                      : "border-l-4 border-l-transparent border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <p className={`font-serif text-sm sm:text-base leading-relaxed ${
                          isActive
                            ? "text-zinc-950 dark:text-zinc-50 font-medium"
                            : isPast
                            ? "text-zinc-600 dark:text-zinc-400"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {q}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          {isActive && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                              </span>
                              <span>{isTutorSpeaking ? "Examiner Inquiring" : "Your Turn to Respond"}</span>
                            </div>
                          )}
                          {isPast && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Completed</span>
                            </div>
                          )}
                          {isFuture && (
                            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Upcoming
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
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xs cursor-pointer transition-colors"
                        title="Replay examiner inquiry"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Band 8.5 Syntactic Anchor Tips (Collapsible for Clean UX) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSyntaxTips(!showSyntaxTips)}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between font-mono text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Band 8.5+ Spoken Syntax Anchors (Reference)</span>
              </div>
              <span className="text-zinc-400">{showSyntaxTips ? "▲ HIDE" : "▼ VIEW"}</span>
            </button>

            {showSyntaxTips && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <div className="p-2 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                    Cleft Emphasis Formula:
                  </span>
                  <span className="font-serif italic text-zinc-600 dark:text-zinc-400">
                    &ldquo;What strikes me most about this is...&rdquo;
                  </span>
                </div>
                <div className="p-2 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                    Fronted Adverbial Formula:
                  </span>
                  <span className="font-serif italic text-zinc-600 dark:text-zinc-400">
                    &ldquo;Having experienced this firsthand...&rdquo;
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 2: THE INDIVIDUAL LONG TURN (CUE CARD) */}
      {/* ============================================================== */}
      {currentStage === "part2" && (
        <div className="space-y-4">
          {/* Preparation & Monologue HUD */}
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-zinc-700 dark:text-zinc-300">1-MIN PREP:</span>
                <span
                  className={`font-bold px-2 py-0.5 border ${
                    prepSeconds <= 10 && prepSeconds > 0
                      ? "bg-rose-900 text-white border-rose-900 animate-pulse"
                      : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {prepSeconds}s
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPrepActive(!isPrepActive)}
                className="px-2.5 py-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 uppercase text-[10px] font-bold cursor-pointer hover:opacity-90 flex items-center gap-1.5 transition-all"
              >
                {isPrepActive ? (
                  <>
                    <Pause className="w-2.5 h-2.5" /> PAUSE
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5" /> START 60S PREP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPrepActive(false);
                  setPrepSeconds(60);
                }}
                className="p-1 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
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
          <div className="p-5 sm:p-6 border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
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

            <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">
                You should say:
              </span>
              <ul className="space-y-1.5 font-serif text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 pl-1">
                {exam.part2CueCard.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-mono mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-serif italic text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 pt-2">
              {exam.part2CueCard.closing}
            </p>

            {/* Candidate Digital Prep Scratchpad (Module 1 Blueprint) */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Candidate 60-Second Scratchpad (Notes & Keywords)
                </span>
                <span className="text-zinc-400 font-normal">Optional</span>
              </div>
              <textarea
                value={candidateNotes}
                onChange={(e) => setCandidateNotes(e.target.value)}
                placeholder="Jot down quick WH- hooks (What, When, Who, Why) to guide your 2-minute narrative..."
                rows={3}
                className="w-full font-mono text-xs p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 3: TWO-WAY ANALYTICAL DISCUSSION */}
      {/* ============================================================== */}
      {currentStage === "part3" && (
        <div className="space-y-3.5">
          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold uppercase tracking-wider">
                Part 3 • Two-Way Analytical & Societal Discussion
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5">
              4–5 MINS
            </span>
          </div>

          {/* Deep Analytical Inquiries with Sleek Left Accent Highlighting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider px-0.5">
              <span>Analytical Discussion Prompts:</span>
              <span>Prompt {effectiveQuestionIdx + 1} of {exam.part3Questions.length}</span>
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
                      ? "border-l-4 border-l-amber-500 dark:border-l-amber-400 border-zinc-300 dark:border-zinc-700 bg-amber-500/[0.04] dark:bg-amber-400/[0.05] shadow-sm"
                      : isPast
                      ? "border-l-4 border-l-emerald-500/50 border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30"
                      : "border-l-4 border-l-transparent border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <p className={`font-serif text-sm sm:text-base leading-relaxed ${
                          isActive
                            ? "text-zinc-950 dark:text-zinc-50 font-medium"
                            : isPast
                            ? "text-zinc-600 dark:text-zinc-400"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {q}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          {isActive && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                              </span>
                              <span>{isTutorSpeaking ? "Examiner Inquiring" : "Your Turn to Respond"}</span>
                            </div>
                          )}
                          {isPast && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs font-mono text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Completed</span>
                            </div>
                          )}
                          {isFuture && (
                            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Upcoming
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
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xs cursor-pointer transition-colors"
                        title="Replay examiner inquiry"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommended Cambridge Lexical Collocations Bank (Collapsible) */}
          {exam.recommendedVocabulary && exam.recommendedVocabulary.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans text-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSyntaxTips(!showSyntaxTips)}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between font-mono text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Band 8.5+ Lexical Collocations ({exam.recommendedVocabulary.length} Recommended)</span>
                </div>
                <span className="text-zinc-400">{showSyntaxTips ? "▲ HIDE" : "▼ VIEW"}</span>
              </button>

              {showSyntaxTips && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                  {exam.recommendedVocabulary.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-0.5"
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
              )}
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
