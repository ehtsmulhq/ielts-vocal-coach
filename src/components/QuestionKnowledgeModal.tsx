"use client";

import { useState } from "react";
import {
  MOST_ASKED_PART2_SCENES,
  REAL_PART1_CLUSTERS,
  REAL_EXAMINER_QUESTION_PATTERNS,
  type Part2Category,
  type Part2MostAskedScene,
} from "@/lib/ielts-question-knowledge-graph";
import {
  X,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  Video,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface QuestionKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScene: (scene: Part2MostAskedScene) => void;
}

export function QuestionKnowledgeModal({
  isOpen,
  onClose,
  onSelectScene,
}: QuestionKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<"part2" | "part1" | "patterns">("part2");
  const [categoryFilter, setCategoryFilter] = useState<Part2Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredScenes = MOST_ASKED_PART2_SCENES.filter((scene) => {
    const matchesCat = categoryFilter === "all" || scene.category === categoryFilter;
    const matchesQuery =
      searchQuery === "" ||
      scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.cueCard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.youtubeSource.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-zinc-500">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>IELTS Question Pattern Knowledge Graph</span>
              <span className="hidden sm:inline text-zinc-400">• YouTube & Cambridge Verified</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Real Test Question Patterns & High-Frequency Scenes
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-2xl">
              Extracted from official Cambridge IELTS 15–19 examiner booklets & hundreds of real-test YouTube mock transcripts.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Test Principle Banner */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-sans flex items-start gap-2.5 text-zinc-600 dark:text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="leading-snug text-[11px]">
            <strong className="text-zinc-900 dark:text-zinc-100">Official Examiner Rule:</strong> Real IELTS examiners ask direct, accessible, everyday questions. They never ask compound, convoluted personal inquiries. It is the <span className="underline decoration-amber-500 font-semibold">candidate</span> who produces sophisticated Band 8.5/9.0 answers!
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-5 gap-2 pt-2 bg-zinc-50/50 dark:bg-zinc-900/20">
          <button
            type="button"
            onClick={() => setActiveTab("part2")}
            className={`px-3 py-2 font-mono text-xs uppercase font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "part2"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Most-Asked Part 2 Scenes ({MOST_ASKED_PART2_SCENES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("part1")}
            className={`px-3 py-2 font-mono text-xs uppercase font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "part1"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Part 1 Real Question Clusters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("patterns")}
            className={`px-3 py-2 font-mono text-xs uppercase font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "patterns"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Question Pattern Formulas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin space-y-4">
          {/* TAB 1: MOST-ASKED PART 2 SCENES */}
          {activeTab === "part2" && (
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-[10px] uppercase">
                  {(["all", "objects_tech", "places", "people", "experiences", "habits_decisions"] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 border transition-all cursor-pointer whitespace-nowrap ${
                          categoryFilter === cat
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-bold"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        {cat === "all"
                          ? "All Categories"
                          : cat === "objects_tech"
                          ? "Tech & Tools"
                          : cat === "places"
                          ? "Places & Nooks"
                          : cat === "people"
                          ? "Mentors & People"
                          : cat === "experiences"
                          ? "Journeys & Events"
                          : "Habits & Decisions"}
                      </button>
                    )
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scenes or topics..."
                    className="w-full sm:w-48 pl-8 pr-3 py-1 font-mono text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Grid of Scenes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase">
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                          {scene.frequencyTier}
                        </span>
                        <span className="text-zinc-400 truncate max-w-[180px]">
                          {scene.youtubeSource}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                        {scene.cueCard.title}
                      </h3>

                      <ul className="space-y-0.5 text-[11px] font-sans text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                        {scene.cueCard.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>

                      <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Collocations: {scene.recommendedVocabulary.map((v) => v.phrase).join(", ")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectScene(scene);
                        onClose();
                      }}
                      className="w-full py-2 px-3 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-[11px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <span>[ PRACTICE THIS SCENE IN HOT SEAT ]</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PART 1 REAL QUESTION CLUSTERS */}
          {activeTab === "part1" && (
            <div className="space-y-4">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-sans text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Examiners in real IELTS tests and YouTube mock interviews draw strictly from standard Part 1 pools. Notice how every question is simple and conversational. The candidate’s task is to provide Band 8.5/9.0 answers with cleft sentences and fronted adverbials.
              </div>

              <div className="space-y-3">
                {REAL_PART1_CLUSTERS.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {cluster.category}
                      </span>
                      <span className="text-zinc-400">{cluster.youtubeTag}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                      {cluster.standardQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-2 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-2"
                        >
                          <span className="font-mono text-zinc-400 text-[10px] mt-0.5">0{idx + 1}.</span>
                          <p className="text-zinc-800 dark:text-zinc-200 font-serif">&ldquo;{q}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REAL EXAMINER QUESTION PATTERNS */}
          {activeTab === "patterns" && (
            <div className="space-y-4">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-sans text-zinc-600 dark:text-zinc-400 leading-relaxed">
                By mastering these 5 core question formulas used by Cambridge examiners, you eliminate surprises and can instantly structure high-scoring answers.
              </div>

              <div className="space-y-3">
                {REAL_EXAMINER_QUESTION_PATTERNS.map((pat, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {idx + 1}. {pat.type}
                      </span>
                      <span className="text-[10px] text-zinc-400">Formula</span>
                    </div>

                    <div className="p-2 border border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200 font-mono text-xs">
                      {pat.formula}
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase block font-bold">
                        Examiner Inquiries in Real Tests:
                      </span>
                      <ul className="text-xs font-serif text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-0.5">
                        {pat.realExaminerExamples.map((ex, i) => (
                          <li key={i}>&ldquo;{ex}&rdquo;</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[11px] font-sans text-zinc-600 dark:text-zinc-400">
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono text-[10px] uppercase">
                        Band 9.0 Candidate Response Strategy:{" "}
                      </strong>
                      {pat.candidateBand9Strategy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-500 text-[10px]">
            100% GROUNDED IN CAMBRIDGE 15–19 & OFFICIAL YOUTUBE MOCK POOLS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors uppercase text-[11px] font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
