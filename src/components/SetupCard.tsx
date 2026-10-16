"use client";

import { useState } from "react";
import type { TargetBand } from "@/lib/types";
import { LIVE_MODELS, LIVE_VOICES } from "@/lib/models";
import { CURATED_THEMES } from "@/lib/prompts";
import { ArrowRight, Loader2, Shuffle, Activity, Sliders, Cpu, Mic } from "lucide-react";

interface SetupCardProps {
  onStart: (
    band: TargetBand,
    topic?: string,
    liveModel?: string,
    focusArea?: "full" | "consonants" | "reading" | "speed",
    voice?: string
  ) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
}

export function SetupCard({ onStart, isLoading, loadingStep }: SetupCardProps) {
  const [band, setBand] = useState<TargetBand>("6.5");
  const [focusArea, setFocusArea] = useState<"full" | "consonants" | "reading" | "speed">("full");
  const [selectedModel, setSelectedModel] = useState(LIVE_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(LIVE_VOICES[0].id);
  const [customTopic, setCustomTopic] = useState("");

  const handleRandomizeTopic = () => {
    const next = CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];
    setCustomTopic(next);
  };

  const focusModes: {
    id: "full" | "consonants" | "reading" | "speed";
    code: string;
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      id: "full",
      code: "PROTOCOL 01",
      title: "Comprehensive Vocal Routine",
      desc: "Motor Articulation → Long Sight-Reading → Speed Twisters → Exam Evaluation",
      badge: "Full Protocol",
    },
    {
      id: "consonants",
      code: "PROTOCOL 02",
      title: "Consonant & Dental Lab",
      desc: "Targeted drills for /θ/, /ð/, /v/-/w/, /r/-/l/, and ending clusters (-sts, -dth, -lved)",
      badge: "Phonetics",
    },
    {
      id: "reading",
      code: "PROTOCOL 03",
      title: "Sight-Reading & Stamina",
      desc: "150–220 word academic passages, WPM cadence tracking, and breath phrasing",
      badge: "Cadence & WPM",
    },
    {
      id: "speed",
      code: "PROTOCOL 04",
      title: "Reflex Velocity Agility",
      desc: "High-density tongue twisters to eliminate speech hesitation and vocal locking",
      badge: "Agility",
    },
  ];

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
          <span>[ LABORATORY SYSTEM CONFIGURATION ]</span>
          <span>REF: IELTS-ACADEMIC-V3.8</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-zinc-900 dark:text-zinc-50">
          English Phonetics & Vocal Laboratory
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
          Minimalist Motor Articulation, Sight Reading Telemetry, and Real-Time Spoken Fluency Diagnostics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workout Focus Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              I. Select Laboratory Protocol
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
                          ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
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
            placeholder="e.g. Deep Ocean Bathymetry, High-Altitude Physiology (or blank)..."
            className="w-full text-xs font-mono px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Deep Ocean Bathymetry",
              "Cosmology & Dark Matter",
              "Neurobiology of Memory",
              "High-Altitude Physiology",
              "Acoustic Hall Resonance",
              "Architectural Acoustics",
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
            <span className="font-bold">III. Target Fluency Criterion</span>
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
              <span>[ INITIALIZE ACOUSTIC SESSION ]</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
