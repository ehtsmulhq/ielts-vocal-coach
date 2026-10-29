"use client";

import { useState } from "react";
import type { CandidateProfile, TargetBand } from "@/lib/types";
import { LIVE_MODELS, LIVE_VOICES } from "@/lib/models";
import { CURATED_THEMES } from "@/lib/prompts";
import { resetProfile } from "@/lib/profile";
import {
  ArrowRight,
  Loader2,
  Shuffle,
  Activity,
  Sliders,
  Cpu,
  Mic,
  User,
  Edit3,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface SetupCardProps {
  onStart: (
    band: TargetBand,
    topic?: string,
    liveModel?: string,
    focusArea?: "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed",
    voice?: string
  ) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
  profile: CandidateProfile;
  onProfileChange: (p: CandidateProfile) => void;
}

export function SetupCard({
  onStart,
  isLoading,
  loadingStep,
  profile,
  onProfileChange,
}: SetupCardProps) {
  const [band, setBand] = useState<TargetBand>(profile.targetBand || "6.5");
  const [focusArea, setFocusArea] = useState<
    "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed"
  >("full");
  const [selectedModel, setSelectedModel] = useState(LIVE_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(LIVE_VOICES[0].id);
  const [customTopic, setCustomTopic] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState<CandidateProfile>({ ...profile });

  const handleRandomizeTopic = () => {
    const next = CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];
    setCustomTopic(next);
  };

  const focusModes: {
    id: "full" | "career" | "hometown" | "habits";
    code: string;
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      id: "full",
      code: "PROTOCOL 01",
      title: "Comprehensive Mastery",
      desc: "Opener Chunks → Personal Story Shadowing → 1.5s Reflex Sprint → Cambridge Exam",
      badge: "Full Protocol",
    },
    {
      id: "career",
      code: "PROTOCOL 02",
      title: "Work & Career Reflexes",
      desc: `Specialized drills on ${profile.occupationOrMajor}, daily duties, and technical problem-solving`,
      badge: "Career & Tech",
    },
    {
      id: "hometown",
      code: "PROTOCOL 03",
      title: "Hometown Roots & Living Space",
      desc: `Rapid reflexes describing ${profile.hometownName}, residential layout, and neighborhood atmosphere`,
      badge: "Roots & Space",
    },
    {
      id: "habits",
      code: "PROTOCOL 04",
      title: "Daily Habits & Energy Rhythms",
      desc: "Morning routines, deep focus practices, and evening unwinding rituals",
      badge: "Habit Reflexes",
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileChange(draftProfile);
    if (draftProfile.targetBand) {
      setBand(draftProfile.targetBand);
    }
    setIsProfileModalOpen(false);
  };

  const handleResetProfile = () => {
    const fresh = resetProfile();
    setDraftProfile(fresh);
    onProfileChange(fresh);
    if (fresh.targetBand) {
      setBand(fresh.targetBand);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onStart(band, customTopic.trim() || undefined, selectedModel, focusArea, selectedVoice);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          <span>[ VOCAL LABORATORY CONFIGURATION ]</span>
          <span>REF: IELTS-ACADEMIC-V4.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-zinc-900 dark:text-zinc-50">
          English Phonetics & Vocal Laboratory
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
          Grounded Spoken Memory, Formulaic Chunking, and Zero-Hesitation Direct Answer Reflexes.
        </p>

        {/* Candidate Profile Pill Banner */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-mono text-[10px] uppercase text-zinc-400 block leading-none">
                CANDIDATE MEMORY
              </span>
              <span className="font-serif font-bold text-zinc-900 dark:text-zinc-100">
                {profile.preferredName || profile.fullName}
              </span>{" "}
              <span className="text-[11px] text-zinc-500 font-sans">
                • {profile.occupationOrMajor} ({profile.hometownName})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftProfile({ ...profile });
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>[ EDIT PROFILE MEMORY ]</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workout Focus Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              I. Select Pedagogical Protocol
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {focusModes.map((mode) => {
              const isSelected = focusArea === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFocusArea(mode.id)}
                  className={`flex flex-col p-3 text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                      {mode.code}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 border ${
                        isSelected
                          ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                      }`}
                    >
                      {mode.badge}
                    </span>
                  </div>
                  <span className="font-serif font-semibold text-xs text-zinc-900 dark:text-zinc-100 mb-0.5">
                    {mode.title}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug font-sans">
                    {mode.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading & Drill Theme Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              II. Drill Material Theme
            </span>
            <button
              type="button"
              onClick={handleRandomizeTopic}
              className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>[ ROLL RANDOM ]</span>
            </button>
          </div>

          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={`e.g. ${profile.occupationOrMajor} Architecture, ${profile.hometownName} Seaport Roots, Morning Rhythms...`}
            className="w-full text-xs font-mono px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
          />

          {/* Quick preset chips personalized to profile */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              `${profile.occupationOrMajor} Trajectory`,
              `${profile.hometownName} Roots & Evolution`,
              "Morning Rhythms & Focus",
              "Home Workspace Ergonomics",
              "Evening Unwinding & Culinary Art",
              "International Academic Relocation",
            ].map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => setCustomTopic(theme)}
                className={`text-[10px] font-mono px-2.5 py-1 border transition-all cursor-pointer ${
                  customTopic === theme
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Target Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <span className="font-bold">III. Target Fluency Benchmark</span>
            <span className="text-[10px] text-zinc-400">CEFR Benchmark</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "5.5", label: "Band 5.5", sub: "Foundational B2" },
              { id: "6.5", label: "Band 6.5", sub: "Competent C1" },
              { id: "7.5", label: "Band 7.5+", sub: "Advanced C2" },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(b.id as TargetBand)}
                className={`p-2.5 border text-center transition-all cursor-pointer ${
                  band === b.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                <div className="text-xs font-bold font-mono">{b.label}</div>
                <div className="text-[10px] opacity-80">{b.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Persona & Live Engine Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Coach Voice Persona */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1 font-bold">
              <Mic className="w-3 h-3 text-zinc-500" />
              Acoustic Voice Model
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 cursor-pointer"
            >
              {LIVE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Engine Model */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1 font-bold">
              <Cpu className="w-3 h-3 text-zinc-500" />
              Live Telemetry Engine
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 cursor-pointer"
            >
              {LIVE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-900 dark:border-zinc-100 shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span>{loadingStep || "INITIALIZING ACOUSTIC PROTOCOL..."}</span>
            </>
          ) : (
            <>
              <span>[ INITIALIZE ACOUSTIC PROTOCOL ]</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* ============================================================== */}
      {/* CANDIDATE PROFILE MEMORY MODAL / DRAWER */}
      {/* ============================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden font-sans">
            {/* Modal Header */}
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
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                Your profile facts are stored locally in your browser. All drills, story shadowing,
                and examiner questions will be customized to your real life so your vocal muscles
                condition for the real test.
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
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Preferred First Name (for Examiner)
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.preferredName}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, preferredName: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Current Status
                  </label>
                  <select
                    value={draftProfile.status}
                    onChange={(e) =>
                      setDraftProfile({
                        ...draftProfile,
                        status: e.target.value as CandidateProfile["status"],
                      })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="working">Currently Working</option>
                    <option value="studying">Full-Time Student</option>
                    <option value="both">Working & Studying</option>
                    <option value="transitioning">Career Transition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Occupation or Major
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.occupationOrMajor}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, occupationOrMajor: e.target.value })
                    }
                    placeholder="e.g. Software Engineer, Medical Researcher"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  Field Details / Primary Responsibilities
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.fieldDetails}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, fieldDetails: e.target.value })
                  }
                  placeholder="e.g. building distributed web applications and cloud backend pipelines"
                  className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="e.g. Chittagong, Manchester, Kyoto"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Hometown Atmosphere & Vibe
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.hometownVibe}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, hometownVibe: e.target.value })
                    }
                    placeholder="e.g. busy maritime seaport nestled between green hills and coastline"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Current Residence
                  </label>
                  <input
                    type="text"
                    required
                    value={draftProfile.currentResidence}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, currentResidence: e.target.value })
                    }
                    placeholder="e.g. Dhanmondi, Dhaka"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Living Setup
                  </label>
                  <select
                    value={draftProfile.livingSetup}
                    onChange={(e) =>
                      setDraftProfile({
                        ...draftProfile,
                        livingSetup: e.target.value as CandidateProfile["livingSetup"],
                      })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="apartment">Apartment / Flat</option>
                    <option value="house">Detached House</option>
                    <option value="shared_flat">Shared Flat</option>
                    <option value="dormitory">Dormitory</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  Favorite Room or Space at Home
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.favoriteRoom}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, favoriteRoom: e.target.value })
                  }
                  placeholder="e.g. sunlit study nook with dual monitors and an espresso maker"
                  className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  Morning Routine
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.morningRoutine}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, morningRoutine: e.target.value })
                  }
                  placeholder="e.g. 30-minute bodyweight workout and brewing pour-over coffee before checking notifications"
                  className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  Evening Unwinding Habit
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.unwindingHabit}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, unwindingHabit: e.target.value })
                  }
                  placeholder="e.g. preparing home-cooked meals from scratch and reading speculative sci-fi novels"
                  className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  Exam Purpose / Ambition
                </label>
                <input
                  type="text"
                  required
                  value={draftProfile.examPurpose}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, examPurpose: e.target.value })
                  }
                  placeholder="e.g. postgraduate scholarship admission and international career mobility"
                  className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="flex items-center gap-1.5 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-mono text-xs border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET TO DEFAULT</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-3 py-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>SAVE PROFILE</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
