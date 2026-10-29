"use client";

import { useState } from "react";
import type { CandidateProfile, TargetBand } from "@/lib/types";
import { LIVE_MODELS, LIVE_VOICES } from "@/lib/models";
import { CURATED_THEMES } from "@/lib/prompts";
import { CAMBRIDGE_TEST_MODULES } from "@/lib/cambridge-materials";
import type { HotSeatSessionRecord } from "@/lib/test-history";
import {
  ArrowRight,
  Loader2,
  Shuffle,
  Sliders,
  Cpu,
  Mic,
  User,
  Edit3,
  X,
  Sparkles,
  BookOpen,
  Flame,
  Trash2,
  Calendar,
  Award,
  Compass,
} from "lucide-react";
import { QuestionKnowledgeModal } from "@/components/QuestionKnowledgeModal";

interface SetupCardProps {
  onStartHotSeat: (
    band: TargetBand,
    topic?: string,
    liveModel?: string,
    focusArea?: "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed",
    voice?: string,
    cambridgeTestId?: string,
    sceneId?: string
  ) => Promise<void>;
  onEnterMirrorGym: () => void;
  onWipeAllData: () => void;
  onOpenGrill?: () => void;
  masterPracticeCount: number;
  testHistory: HotSeatSessionRecord[];
  isLoading: boolean;
  loadingStep: string;
  profile: CandidateProfile;
  onProfileChange: (p: CandidateProfile) => void;
}

export function SetupCard({
  onStartHotSeat,
  onEnterMirrorGym,
  onWipeAllData,
  onOpenGrill,
  masterPracticeCount,
  testHistory,
  isLoading,
  loadingStep,
  profile,
  onProfileChange,
}: SetupCardProps) {
  const [band, setBand] = useState<TargetBand>(profile.targetBand || "7.5");
  const [selectedModel, setSelectedModel] = useState(LIVE_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(LIVE_VOICES[0].id);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedCambridgeId, setSelectedCambridgeId] = useState<string>("cam-19-test-1");
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState<CandidateProfile>({ ...profile });

  const currentDay = testHistory.length + 1;
  const lastSession = testHistory.length > 0 ? testHistory[testHistory.length - 1] : null;

  const handleRandomizeTopic = () => {
    const next = CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];
    setCustomTopic(next);
    setSelectedCambridgeId("");
    setSelectedSceneId("");
  };

  const handleSelectCambridgeTest = (testId: string) => {
    setSelectedCambridgeId(testId);
    setSelectedSceneId("");
    if (!testId) {
      setCustomTopic("");
      return;
    }
    const found = CAMBRIDGE_TEST_MODULES.find((m) => m.id === testId);
    if (found) {
      setCustomTopic(`${found.book} Test ${found.testNumber}: ${found.title}`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileChange(draftProfile);
    if (draftProfile.targetBand) {
      setBand(draftProfile.targetBand);
    }
    setIsProfileModalOpen(false);
  };

  const handleConfirmWipe = () => {
    onWipeAllData();
    setIsResetConfirmOpen(false);
    setCustomTopic("");
    setSelectedCambridgeId("cam-19-test-1");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onStartHotSeat(
      band,
      customTopic.trim() || undefined,
      selectedModel,
      "full",
      selectedVoice,
      selectedCambridgeId || undefined,
      selectedSceneId || undefined
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          <span className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
            <Award className="w-3.5 h-3.5 text-zinc-500" />
            AUTHENTIC CAMBRIDGE IELTS HOT SEAT
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 font-bold">
            {testHistory.length === 0 ? "DAY 1 • BASELINE TEST" : `DAY ${currentDay} • PROGRESS TRACKER`}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-zinc-900 dark:text-zinc-50">
          Daily Authentic Speaking Hot Seat
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
          Take the unscripted 3-part Cambridge test daily. Point out measurable improvements in fluency, grammar, and vocabulary across every session.
        </p>

        {/* Previous Session Improvement Snapshot (If tests have been taken) */}
        {lastSession && (
          <div className="pt-2">
            <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>LAST SESSION (DAY {lastSession.dayNumber} • {lastSession.dateStr})</span>
                </div>
                <p className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Overall Band: {lastSession.overallBand.toFixed(1)} / 9.0 • {lastSession.metrics.wpm} WPM
                </p>
                <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-2">
                  <span>Fluency: {lastSession.subScores.fluency.toFixed(1)}</span>
                  <span>•</span>
                  <span>Grammar: {lastSession.subScores.grammar.toFixed(1)}</span>
                  <span>•</span>
                  <span>Lexical: {lastSession.subScores.lexical.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onEnterMirrorGym}
                  className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold uppercase cursor-pointer hover:bg-zinc-100 transition-colors flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>MIRROR GYM ({masterPracticeCount} REPS)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Profile Pill Banner */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-mono text-[10px] uppercase text-zinc-400 block leading-none">
                CANDIDATE IDENTITY
              </span>
              <span className="font-serif font-bold text-zinc-900 dark:text-zinc-100">
                {profile.preferredName || profile.fullName}
              </span>{" "}
              <span className="text-[11px] text-zinc-500 font-sans">
                • {profile.occupationOrMajor} ({profile.hometownName})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGrill && (
              <button
                type="button"
                onClick={onOpenGrill}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Re-run the intake grill to extract fresh personal anchors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>[ CANDIDATE GRILL ]</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDraftProfile({ ...profile });
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>[ EDIT ]</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              title="Wipe all local data and start fresh"
            >
              <Trash2 className="w-3 h-3" />
              <span>RESET ALL</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Cambridge Official Test Bank & Real YouTube Mock Scenes */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 gap-1.5">
            <span className="flex items-center gap-1.5 font-bold">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              I. Official Test Material & Knowledge Graph
            </span>
            <button
              type="button"
              onClick={() => setIsKnowledgeModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3 text-amber-500" />
              <span>[ BROWSE YOUTUBE TEST PATTERNS & SCENES ]</span>
            </button>
          </div>

          {/* Active Knowledge Graph Scene Banner */}
          {selectedSceneId && (
            <div className="p-2.5 border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs font-mono flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-bold uppercase text-[10px] text-amber-600 dark:text-amber-400 flex-shrink-0">
                  [ REAL YOUTUBE SCENE ]:
                </span>
                <span className="truncate max-w-sm font-sans font-medium text-zinc-900 dark:text-zinc-100">{customTopic}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSceneId("");
                  setSelectedCambridgeId("cam-19-test-1");
                  setCustomTopic("");
                }}
                className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer ml-2 flex-shrink-0"
              >
                Reset
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAMBRIDGE_TEST_MODULES.slice(0, 4).map((mod) => {
              const isSelected = selectedCambridgeId === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectCambridgeTest(mod.id)}
                  className={`p-3 border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase text-zinc-500 mb-0.5">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {mod.book} • TEST {mod.testNumber}
                    </span>
                    {isSelected && <span className="font-bold text-zinc-900 dark:text-zinc-100">[ SELECTED ]</span>}
                  </div>
                  <h4 className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1">
                    {mod.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-sans line-clamp-1 mt-0.5">
                    {mod.theme}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Topic Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                setSelectedCambridgeId("");
              }}
              placeholder="Or enter a custom Cambridge topic / theme..."
              className="flex-1 font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
            <button
              type="button"
              onClick={handleRandomizeTopic}
              className="p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              title="Pick random Cambridge theme"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step 2: Target Band Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              II. Target IELTS Communicative Band
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "5.5" as TargetBand, title: "Band 5.5", subtitle: "Zero Hesitation Flow" },
              { id: "6.5" as TargetBand, title: "Band 6.5", subtitle: "Syntactic Coherence" },
              { id: "7.5" as TargetBand, title: "Band 7.5 - 9.0", subtitle: "Effortless RP Articulation" },
            ].map((b) => {
              const isSelected = band === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBand(b.id)}
                  className={`p-2.5 border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <div className="font-serif text-sm font-bold">{b.title}</div>
                  <div className="font-mono text-[9px] opacity-80 uppercase mt-0.5">{b.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: British Examiner Audio Engine */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-zinc-400" /> Live Reasoning Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
            >
              {LIVE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Mic className="w-3 h-3 text-zinc-400" /> Examiner Voice Timbre
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
            >
              {LIVE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.desc})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-900 dark:border-zinc-100 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span>{loadingStep || "COMMENCING AUTHENTIC HOT SEAT INTERVIEW..."}</span>
              </>
            ) : (
              <>
                <span>[ 🎙️ ENTER TODAY&apos;S AUTHENTIC HOT SEAT TEST ]</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Secondary Action: Direct Mirror Gym */}
          <button
            type="button"
            onClick={onEnterMirrorGym}
            className="w-full py-2.5 px-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200 dark:border-zinc-800"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>[ 🔁 ENTER DAILY MIRROR GYM (DELIBERATE REPETITION) ]</span>
          </button>
        </div>
      </form>

      {/* ============================================================== */}
      {/* CANDIDATE PROFILE MEMORY MODAL */}
      {/* ============================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden font-sans">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Candidate Local Profile Memory
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                Your profile facts are stored locally. The British examiner will adapt Part 1 and Part 2 questions to your genuine identity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.fullName}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, fullName: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Preferred Name (for Examiner)
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.preferredName}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, preferredName: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Profession / Major
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.occupationOrMajor}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, occupationOrMajor: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Hometown Name
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.hometownName}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, hometownName: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 cursor-pointer text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase cursor-pointer"
                >
                  SAVE PROFILE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESET & ERASE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-rose-300 dark:border-rose-900/80 w-full max-w-md p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold uppercase">
              <Trash2 className="w-4 h-4" />
              <span>ERASE ALL LOCAL DATA & START OVER?</span>
            </div>

            <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              This will completely wipe your candidate profile, previous test history scores, and master script vault from your browser. You will start over fresh on Day 1.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase text-xs cursor-pointer"
              >
                CONFIRM & ERASE EVERYTHING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REAL TEST QUESTION PATTERNS & KNOWLEDGE GRAPH MODAL */}
      {/* ============================================================== */}
      <QuestionKnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        onSelectScene={(scene) => {
          setSelectedSceneId(scene.id);
          setSelectedCambridgeId("");
          setCustomTopic(scene.cueCard.title);
        }}
      />
    </div>
  );
}
