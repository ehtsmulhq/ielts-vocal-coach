"use client";

import { useState, useEffect } from "react";
import type { Lesson, Stage } from "@/lib/types";
import { Volume2, Eye, Activity, Play, Pause, Award, BookOpen, Sliders, Zap } from "lucide-react";

interface LessonCardProps {
  lesson: Lesson;
  currentStage: Stage;
  onSpeakText?: (text: string, rate?: number) => void;
  onStopSpeech?: () => void;
  isCoachSpeaking?: boolean;
  studentWordCount?: number;
}

export function LessonCard({
  lesson,
  currentStage,
  onSpeakText,
  onStopSpeech,
  isCoachSpeaking,
  studentWordCount = 0,
}: LessonCardProps) {
  // Stage 1 active drill tab
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);

  // Stage 2 (Long Reading) states
  const [showBreathMarks, setShowBreathMarks] = useState(false);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [activeWordTipIndex, setActiveWordTipIndex] = useState<number | null>(null);

  // Stage 4 active IELTS part
  const [activeExamPart, setActiveExamPart] = useState<"part1" | "part2" | "part3">("part1");

  // Part 2 prep & speak timer
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const [speakSeconds, setSpeakSeconds] = useState(120);
  const [isSpeakRunning, setIsSpeakRunning] = useState(false);

  // Reading stopwatch ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStage === "long_reading") {
      interval = setInterval(() => setReadingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

  // Part 2 Prep timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrepRunning && prepSeconds > 0) {
      interval = setInterval(() => {
        setPrepSeconds((s) => {
          if (s <= 1) {
            setIsPrepRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPrepRunning, prepSeconds]);

  // Part 2 Speak timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeakRunning && speakSeconds > 0) {
      interval = setInterval(() => {
        setSpeakSeconds((s) => {
          if (s <= 1) {
            setIsSpeakRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSpeakRunning, speakSeconds]);

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentDrill =
    lesson.vocalWorkout.motorDrills[activeDrillIndex] || lesson.vocalWorkout.motorDrills[0];
  const longReading = lesson.vocalWorkout.longReading;
  const currentSpeed = lesson.vocalWorkout.speedDrills[0];

  // Real-time WPM calculation
  const calculatedWpm =
    readingSeconds > 5 && studentWordCount > 0
      ? Math.round(studentWordCount / (readingSeconds / 60))
      : 0;

  const words = longReading.fullText.split(/\s+/);

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin select-none font-sans space-y-4">
      {/* ============================================================== */}
      {/* STAGE 1: MOTOR DRILLS (Jaw & Lip Articulation) */}
      {/* ============================================================== */}
      {currentStage === "motor_warmup" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              SECTION I: MOTOR ARTICULATION DRILLS
            </span>

            <div className="flex items-center gap-1">
              {lesson.vocalWorkout.motorDrills.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveDrillIndex(idx)}
                  className={`px-2 py-0.5 font-mono text-[10px] uppercase border transition-all cursor-pointer ${
                    activeDrillIndex === idx
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {d.soundSymbol}
                </button>
              ))}
            </div>
          </div>

          {/* Active Drill Details */}
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                {currentDrill.soundSymbol}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {currentDrill.soundName}
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              <strong>Phonetic Placement Tip:</strong> {currentDrill.physicalTip}
            </p>
          </div>

          {/* Target Practice Words */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Target Phonetic Placement Words</span>
              {onSpeakText && (
                <button
                  type="button"
                  onClick={() => onSpeakText(currentDrill.practiceWords.join(", "), 0.9)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>[ AUDIO DEMONSTRATION ]</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentDrill.practiceWords.map((word, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 font-serif text-xs font-semibold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Alliterative Sentence */}
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Articulation Challenge Sentence</span>
              {onSpeakText && (
                <button
                  type="button"
                  onClick={() => onSpeakText(currentDrill.challengeSentence, 0.9)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>[ HEAR MODEL ]</span>
                </button>
              )}
            </div>
            <p className="text-base sm:text-lg font-serif italic text-zinc-900 dark:text-zinc-100 leading-relaxed">
              “{currentDrill.challengeSentence}”
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 2: LONG PARAGRAPH READING (Stamina & Cadence Gym) */}
      {/* ============================================================== */}
      {currentStage === "long_reading" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              SECTION II: ACADEMIC SIGHT-READING & WPM CADENCE
            </span>

            <span className="font-mono text-[10px] border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400">
              {longReading.wordCount} WORDS • TARGET: {longReading.targetWpmRange}
            </span>
          </div>

          {/* Reading Metrics Bar */}
          <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span>TIME:</span>
                <span className="font-bold">{formatTime(readingSeconds)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Activity className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  CADENCE:{" "}
                  <strong className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">
                    {calculatedWpm > 0 ? `${calculatedWpm} WPM` : "CALCULATING..."}
                  </strong>
                </span>
              </div>
            </div>

            {/* Coach Voice Model Demonstrations */}
            {onSpeakText && (
              <div className="flex items-center gap-2">
                {isCoachSpeaking ? (
                  <button
                    type="button"
                    onClick={onStopSpeech}
                    className="px-2.5 py-1 border border-rose-600 bg-rose-50 text-rose-700 font-mono text-[10px] uppercase font-bold"
                  >
                    STOP AUDIO
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSpeakText(longReading.fullText, 0.85)}
                      className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 cursor-pointer"
                    >
                      MODEL 0.85X
                    </button>
                    <button
                      type="button"
                      onClick={() => onSpeakText(longReading.fullText, 1.05)}
                      className="px-2.5 py-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[10px] uppercase font-bold cursor-pointer"
                    >
                      MODEL 1.0X
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowBreathMarks(!showBreathMarks)}
                  className={`px-2 py-1 border font-mono text-[10px] uppercase transition-colors cursor-pointer ${
                    showBreathMarks
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                      : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <Eye className="w-3 h-3 inline mr-1" />
                  <span>BREATH PAUSES</span>
                </button>
              </div>
            )}
          </div>

          {/* Continuous Long Reading Teleprompter Card */}
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-serif font-bold text-zinc-900 dark:text-zinc-100">{longReading.title}</span>
              <span>THEME: {longReading.theme}</span>
            </div>

            <p className="text-lg leading-relaxed font-serif text-zinc-900 dark:text-zinc-100">
              {words.map((w, idx) => {
                const isSpoken = idx < studentWordCount;
                const isCurrent = idx === studentWordCount;

                return (
                  <span
                    key={idx}
                    className={`inline-block mr-1.5 transition-colors duration-150 ${
                      isCurrent
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold px-1"
                        : isSpoken
                        ? "text-zinc-400 dark:text-zinc-500 line-through"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {w}
                  </span>
                );
              })}
            </p>

            {/* Breath marks breakdown if toggled */}
            {showBreathMarks && (
              <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  Rhythmic Phrasing & Natural Breath Units:
                </div>
                <div className="space-y-1 font-serif text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {longReading.thoughtChunks.map((chunk, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-zinc-500">[{idx + 1}]</span>
                      <span>{chunk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Difficult Vocabulary Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span>High-Density Articulation Phonemes</span>
              <span>Tap for Phonetic Tip</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {longReading.keyDifficultWords.map((item, idx) => {
                const isSelected = activeWordTipIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveWordTipIndex(isSelected ? null : idx)}
                    className={`p-2.5 border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400"
                    }`}
                  >
                    <div className="font-serif font-bold text-xs truncate">{item.word}</div>
                    <div className="text-[10px] font-mono opacity-70 truncate mt-0.5">{item.phonetic}</div>
                  </button>
                );
              })}
            </div>

            {activeWordTipIndex !== null && longReading.keyDifficultWords[activeWordTipIndex] && (
              <div className="p-3 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-sans text-xs space-y-1">
                <div className="font-mono text-[10px] uppercase font-bold">
                  {longReading.keyDifficultWords[activeWordTipIndex].word} •{" "}
                  {longReading.keyDifficultWords[activeWordTipIndex].phonetic}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed font-serif">
                  {longReading.keyDifficultWords[activeWordTipIndex].tip}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 3: SPEED & TONGUE TWISTERS (Motor Muscle Reflexes) */}
      {/* ============================================================== */}
      {currentStage === "speed_drill" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              SECTION III: SPEECH REFLEX VELOCITY DRILLS
            </span>
            <span className="font-mono text-[10px] border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-zinc-500">
              AGILITY & REPETITION
            </span>
          </div>

          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              {currentSpeed.title} • TARGET: {currentSpeed.targetSound}
            </div>

            <p className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed px-2">
              “{currentSpeed.twister}”
            </p>

            <div className="inline-block px-3 py-1 font-mono text-[10px] uppercase border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              GOAL: {currentSpeed.goalPace}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[10px]">
            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="text-zinc-400 uppercase">REP 01</div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">SLOW EXAGGERATED</div>
            </div>
            <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="text-zinc-400 uppercase">REP 02</div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">NATURAL RHYTHM</div>
            </div>
            <div className="p-3 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <div className="opacity-80 uppercase">REP 03</div>
              <div className="font-bold mt-0.5">MAXIMUM VELOCITY</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 4: IELTS SPEAKING EXAM (Secondary Application) */}
      {/* ============================================================== */}
      {currentStage === "ielts_test" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-zinc-400" />
              SECTION IV: IELTS SPEAKING EXAM EVALUATION
            </span>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setActiveExamPart("part1")}
                className={`px-2.5 py-0.5 border uppercase transition-all cursor-pointer ${
                  activeExamPart === "part1"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                }`}
              >
                PART 1
              </button>
              <button
                type="button"
                onClick={() => setActiveExamPart("part2")}
                className={`px-2.5 py-0.5 border uppercase transition-all cursor-pointer ${
                  activeExamPart === "part2"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                }`}
              >
                PART 2 CARD
              </button>
              <button
                type="button"
                onClick={() => setActiveExamPart("part3")}
                className={`px-2.5 py-0.5 border uppercase transition-all cursor-pointer ${
                  activeExamPart === "part3"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                }`}
              >
                PART 3
              </button>
            </div>
          </div>

          {activeExamPart === "part1" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <span>Part 1 Interview Questions</span>
                <span>THEME: {lesson.ieltsExam.theme}</span>
              </div>
              {lesson.ieltsExam.part1Questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-3 font-serif text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <span className="font-mono text-xs font-bold text-zinc-500">[{idx + 1}]</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          )}

          {activeExamPart === "part2" && (
            <div className="space-y-3">
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
                <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {lesson.ieltsExam.part2CueCard.title}
                </h4>
                <ul className="space-y-1 font-serif text-xs text-zinc-700 dark:text-zinc-300">
                  {lesson.ieltsExam.part2CueCard.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-mono text-zinc-400">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2 text-xs font-sans text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                  {lesson.ieltsExam.part2CueCard.closing}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">PREP TIMER (1M)</div>
                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatTime(prepSeconds)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrepRunning(!isPrepRunning)}
                    className="p-1.5 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    {isPrepRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">TALK TIMER (2M)</div>
                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatTime(speakSeconds)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSpeakRunning(!isSpeakRunning)}
                    className="p-1.5 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    {isSpeakRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeExamPart === "part3" && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Part 3 Abstract Discussion Questions
              </div>
              {lesson.ieltsExam.part3Questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-3 font-serif text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <span className="font-mono text-xs font-bold text-zinc-500">[{idx + 1}]</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
