"use client";

import { useState } from "react";
import type { CandidateProfile } from "@/lib/types";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Flame,
  User,
  Briefcase,
  Compass,
  Home as HomeIcon,
} from "lucide-react";

interface CandidateGrillModalProps {
  initialProfile: CandidateProfile;
  onCompleteGrill: (completedProfile: CandidateProfile) => void;
  onSkip?: () => void;
}

export function CandidateGrillModal({
  initialProfile,
  onCompleteGrill,
  onSkip,
}: CandidateGrillModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [profile, setProfile] = useState<CandidateProfile>({
    ...initialProfile,
  });

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    } else {
      onCompleteGrill({
        ...profile,
        hasCompletedGrill: true,
        lastUpdated: Date.now(),
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300 font-sans">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Examiner Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="font-bold uppercase tracking-widest text-zinc-100">
              DR. JONATHAN VANCE • INTAKE GRILL
            </span>
            <span className="text-zinc-400 text-[10px] hidden sm:inline">[ CANDIDATE DISCOVERY ]</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400">
            <span>STEP 0{step} OF 04</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Candidate Profile Intake
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {step === 1 && "What is your official name and preferred examiner address?"}
              {step === 2 && "What is the real craft, problem, or technical duty you specialize in?"}
              {step === 3 && "Where are your roots, and what sensory detail defines your hometown?"}
              {step === 4 && "Describe your thinking sanctuary and your morning or unwinding ritual."}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              {step === 1 &&
                "The examiner will open Part 1 with a formal greeting and immediately pivot to addressing you naturally."}
              {step === 2 &&
                "Share the real problems, tools, or responsibilities that make your craft engaging so your practice answers feel authentic."}
              {step === 3 &&
                "Describe the atmosphere (e.g. green tea hills, coastal breeze, bustling markets) that characterizes your hometown."}
              {step === 4 &&
                "Describe where you think or how you recharge. These details help personalize your cue card practice."}
            </p>
          </div>

          {/* Step 1: Name & Address */}
          {step === 1 && (
            <div className="space-y-4 pt-2">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <User className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <p className="text-xs font-serif italic text-zinc-700 dark:text-zinc-300">
                  &ldquo;Good day. Could you tell me your full name, please? And what shall I call you?&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Full Name (as on Passport)
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="e.g. Alex Mercer"
                    className="w-full font-mono text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Preferred First Name (what Examiner calls you)
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.preferredName}
                    onChange={(e) => setProfile({ ...profile, preferredName: e.target.value })}
                    placeholder="e.g. Alex"
                    className="w-full font-mono text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="p-3 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 text-[11px] font-mono text-zinc-500">
                <span>BEAUTIFIED ANCHOR PREVIEW:</span>
                <span className="text-zinc-800 dark:text-zinc-200 block font-serif italic mt-0.5">
                  &ldquo;Examiner: It is a pleasure to meet you, {profile.preferredName || "Alex"}. Let&apos;s begin with your background.&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Craft & Real Responsibilities */}
          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <p className="text-xs font-serif italic text-zinc-700 dark:text-zinc-300">
                  &ldquo;Let&apos;s talk about what you do. Do you work or study, and what are your core technical responsibilities?&rdquo;
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Profession, Field, or Major
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.occupationOrMajor}
                    onChange={(e) => setProfile({ ...profile, occupationOrMajor: e.target.value })}
                    placeholder="e.g. Software Infrastructure Engineer / Data Scientist / Civil Architect"
                    className="w-full font-mono text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    The Concrete Problems, Systems, or Craft You Handle Daily
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={profile.fieldDetails}
                    onChange={(e) => setProfile({ ...profile, fieldDetails: e.target.value })}
                    placeholder="e.g. diagnosing distributed server bottlenecks, ensuring zero packet loss, and refactoring low-latency microservices"
                    className="w-full font-mono text-xs p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="p-3 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 text-[11px] font-mono text-zinc-500">
                <span>BEAUTIFIED CLEFT STRUCTURE PREVIEW:</span>
                <span className="text-zinc-800 dark:text-zinc-200 block font-serif italic mt-0.5">
                  &ldquo;What I find most invigorating about working as a {profile.occupationOrMajor} is {profile.fieldDetails}.&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Roots & Sensory Vibe */}
          {step === 3 && (
            <div className="space-y-4 pt-2">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <Compass className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <p className="text-xs font-serif italic text-zinc-700 dark:text-zinc-300">
                  &ldquo;Where are you originally from, and what gives your hometown its distinctive character?&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Hometown Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.hometownName}
                    onChange={(e) => setProfile({ ...profile, hometownName: e.target.value })}
                    placeholder="e.g. Chittagong / Sylhet / Rajshahi / Bristol"
                    className="w-full font-mono text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Atmospheric / Sensory Vibe
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.hometownVibe}
                    onChange={(e) => setProfile({ ...profile, hometownVibe: e.target.value })}
                    placeholder="e.g. coastal seaport with green hills and bustling maritime trade"
                    className="w-full font-mono text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="p-3 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 text-[11px] font-mono text-zinc-500">
                <span>BEAUTIFIED FRONTED ADVERBIAL PREVIEW:</span>
                <span className="text-zinc-800 dark:text-zinc-200 block font-serif italic mt-0.5">
                  &ldquo;Having grown up in {profile.hometownName}, a {profile.hometownVibe}, what strikes me most about my roots is the striking juxtaposition between historical heritage and rapid modern trade.&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Sanctuary & Rituals */}
          {step === 4 && (
            <div className="space-y-4 pt-2">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <HomeIcon className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <p className="text-xs font-serif italic text-zinc-700 dark:text-zinc-300">
                  &ldquo;Describe your home space and how you decompress or start your morning.&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    City of Residence
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.currentResidence}
                    onChange={(e) => setProfile({ ...profile, currentResidence: e.target.value })}
                    placeholder="e.g. Dhanmondi, Dhaka"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Favorite Room or Thinking Nook
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.favoriteRoom}
                    onChange={(e) => setProfile({ ...profile, favoriteRoom: e.target.value })}
                    placeholder="e.g. sunlit study nook with my espresso maker and dual monitors"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    Morning Energy Ritual
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.morningRoutine}
                    onChange={(e) => setProfile({ ...profile, morningRoutine: e.target.value })}
                    placeholder="e.g. early morning strength training and brewing filter coffee before screens"
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
                    value={profile.unwindingHabit}
                    onChange={(e) => setProfile({ ...profile, unwindingHabit: e.target.value })}
                    placeholder="e.g. cooking from scratch with fresh herbs and reading speculative fiction"
                    className="w-full font-mono text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="p-3 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  All details saved! Your practice responses will sound authentic and natural.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between font-mono text-xs">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-[11px] cursor-pointer"
              >
                Skip for now
              </button>
            ) : (
              <div />
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            {step < 4 ? (
              <>
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Save Profile & Start →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
