import { CandidateProfile, DEFAULT_PROFILE } from "./types";
import { createStore } from "@/storage/store";
import { STORAGE_KEYS } from "@/storage/registry";
import { applyRep, localDay, nextDayStreak, type ItemStats } from "@/domain/stats";
import { mergeAcceptedScripts } from "@/domain/capture";

export type { ItemStats };

export type { ScriptItem, TargetCollocation } from "@/domain/contracts";
import type { ScriptItem } from "@/domain/contracts";

export interface MasterScriptRepository {
  id: string;
  candidateName: string;
  preferredName: string;
  targetBand: string;
  createdAt: number;
  lastPracticedAt: number;
  totalPracticeCount: number; // Increments with each repetition session
  streakReps: number; // Legacy counter, kept for backwards compatibility
  dayStreak?: number; // Consecutive calendar days with at least one rep
  lastPracticeDay?: string; // YYYY-MM-DD (local)
  itemStats?: Record<string, ItemStats>; // Keyed by ScriptItem.id; survives script upgrades
  items: ScriptItem[];
}

/**
 * Generates an initial canonical starter vault based on candidate profile.
 * These serve as the baseline templates before the first Hot Seat upgrade.
 */
export function createDefaultMasterRepository(profile: CandidateProfile = DEFAULT_PROFILE): MasterScriptRepository {
  return {
    id: "repo-default",
    candidateName: profile.fullName,
    preferredName: profile.preferredName,
    targetBand: profile.targetBand || "7.5",
    createdAt: Date.now(),
    lastPracticedAt: Date.now(),
    totalPracticeCount: 0,
    streakReps: 0,
    items: [
      {
        id: "canonical-work",
        category: "work",
        title: "Work & Professional Specialization",
        question: "Do you work or are you currently studying? What are your main responsibilities?",
        originalRawSpoken: `I work as a ${profile.occupationOrMajor}. I do ${profile.fieldDetails} every day. It is quite busy but I find it interesting.`,
        upgradedScript: `At the moment, I'm primarily responsible for ${profile.fieldDetails}. Much as the technical demands can be rigorous, what I find most invigorating about my field is diagnosing complex bottlenecks and engineering resilient solutions.`,
        thoughtChunks: [
          "At the moment, |",
          `I'm primarily responsible for ${profile.fieldDetails}. |`,
          "Much as the technical demands can be rigorous, |",
          "what I find most invigorating about my field |",
          "is diagnosing complex bottlenecks |",
          "and engineering resilient solutions. |",
        ],
        stressedWords: ["primarily", "responsible", "rigorous", "invigorating", "bottlenecks", "resilient"],
        targetCollocations: [
          {
            phrase: "primarily responsible for",
            meaning: "having the main duty or charge",
            phoneticTip: "Weak form 'for' (/fə/) with crisp primary stress on 'primarily'",
          },
          {
            phrase: "rigorous technical demands",
            meaning: "challenging and thorough requirements",
            phoneticTip: "Tap alveolar /r/ softly; clean stop /t/ on 'demands'",
          },
          {
            phrase: "diagnosing complex bottlenecks",
            meaning: "identifying critical slowdowns in a system",
            phoneticTip: "Crisp bilabial /b/ and voiceless velar /k/ on 'complex'",
          },
        ],
        masterCadenceWpm: 130,
      },
      {
        id: "canonical-hometown",
        category: "hometown",
        title: "Hometown Roots & Maritime/Urban Character",
        question: "Let's talk about your hometown. Where are you from, and what makes it special?",
        originalRawSpoken: `I am from ${profile.hometownName}. It has ${profile.hometownVibe}. People are friendly and there is a lot of trade.`,
        upgradedScript: `I was actually born and bred in ${profile.hometownName}, which is celebrated for its ${profile.hometownVibe}. What strikes me most about my roots is the striking juxtaposition between historic heritage and rapid modern commercial development.`,
        thoughtChunks: [
          `I was actually born and bred in ${profile.hometownName}, |`,
          `which is celebrated for its ${profile.hometownVibe}. |`,
          "What strikes me most about my roots |",
          "is the striking juxtaposition |",
          "between historic maritime heritage |",
          "and rapid modern commercial development. |",
        ],
        stressedWords: ["born and bred", "celebrated", "strikes me", "juxtaposition", "heritage", "commercial"],
        targetCollocations: [
          {
            phrase: "born and bred in",
            meaning: "born and grown up in a specific location",
            phoneticTip: "Link 'born and' smoothly without pausing between words",
          },
          {
            phrase: "striking juxtaposition",
            meaning: "contrast of two opposite things side by side",
            phoneticTip: "Crisp affricate /dʒ/ in 'juxtaposition' (/ˌdʒʌkstəpəˈzɪʃən/)",
          },
          {
            phrase: "historic maritime heritage",
            meaning: "long cultural tradition connected to the sea",
            phoneticTip: "Slight aspiration on /h/ in 'historic' and 'heritage'",
          },
        ],
        masterCadenceWpm: 128,
      },
      {
        id: "canonical-living",
        category: "living",
        title: "Residential Space & Study Ergonomics",
        question: "Can you describe the place you are currently living in? What is your favorite area?",
        originalRawSpoken: `I currently live in ${profile.currentResidence} in an ${profile.livingSetup}. My favorite room is the ${profile.favoriteRoom}.`,
        upgradedScript: `Presently, I reside in a ${profile.livingSetup} situated in ${profile.currentResidence}. Without a doubt, my sanctuary is my ${profile.favoriteRoom}, as it affords me ample natural light and an ergonomic environment tailored for deep, uninterrupted creative focus.`,
        thoughtChunks: [
          `Presently, I reside in a ${profile.livingSetup} |`,
          `situated in ${profile.currentResidence}. |`,
          `Without a doubt, my sanctuary is my ${profile.favoriteRoom}, |`,
          "as it affords me ample natural light |",
          "and an ergonomic environment |",
          "tailored for deep, uninterrupted creative focus. |",
        ],
        stressedWords: ["reside", "sanctuary", "affords", "ergonomic", "uninterrupted", "focus"],
        targetCollocations: [
          {
            phrase: "personal sanctuary",
            meaning: "a peaceful, sacred personal haven",
            phoneticTip: "Soft sibilant /s/ followed by open back vowel /æ/ in 'sanctuary'",
          },
          {
            phrase: "ergonomic environment",
            meaning: "physical space designed for human health and comfort",
            phoneticTip: "Elide syllables cleanly: /ˌɜːɡəˈnɒmɪk/",
          },
          {
            phrase: "uninterrupted focus",
            meaning: "continuous deep concentration without distractions",
            phoneticTip: "Stressed second syllable on 'interrupted'",
          },
        ],
        masterCadenceWpm: 125,
      },
      {
        id: "canonical-habits",
        category: "habits",
        title: "Daily Rhythms & Evening Unwinding",
        question: "What does your typical morning routine look like, and how do you unwind in the evenings?",
        originalRawSpoken: `In the morning I do ${profile.morningRoutine}. And in the evening I like ${profile.unwindingHabit} to relax.`,
        upgradedScript: `As a rule of thumb, my mornings commence with ${profile.morningRoutine}, which sets a grounded cognitive baseline for the hours ahead. Come evening, my non-negotiable unwinding ritual revolves around ${profile.unwindingHabit}, allowing me to completely decompress from screen fatigue.`,
        thoughtChunks: [
          "As a rule of thumb, |",
          `my mornings commence with ${profile.morningRoutine}, |`,
          "which sets a grounded cognitive baseline |",
          "for the hours ahead. |",
          "Come evening, |",
          `my non-negotiable unwinding ritual revolves around ${profile.unwindingHabit}, |`,
          "allowing me to completely decompress from screen fatigue. |",
        ],
        stressedWords: ["rule of thumb", "commence", "cognitive baseline", "non-negotiable", "decompress", "fatigue"],
        targetCollocations: [
          {
            phrase: "as a rule of thumb",
            meaning: "generally speaking or as a standard principle",
            phoneticTip: "Voiceless dental fricative /θ/ on 'thumb' with silent /b/",
          },
          {
            phrase: "grounded cognitive baseline",
            meaning: "calm and focused mental state",
            phoneticTip: "Crisp release on final /d/ in 'grounded'",
          },
          {
            phrase: "decompress from screen fatigue",
            meaning: "relax and release exhaustion caused by digital displays",
            phoneticTip: "Primary stress on /pres/ in 'decompress'",
          },
        ],
        masterCadenceWpm: 132,
      },
      {
        id: "canonical-cuecard",
        category: "cuecard",
        title: "Part 2 Master Monologue: A Defining Professional Challenge",
        question: "Describe an important project or challenge you tackled successfully.",
        originalRawSpoken: `I want to describe a project where we had system latency issues. It took several weeks of debugging and optimization. We resolved it by refactoring the pipeline.`,
        upgradedScript: `I would like to recount an ambitious engineering initiative where our primary architecture faced acute latency bottlenecks. Given the critical client deadlines, I spearheaded a root-cause diagnostic audit. What struck me as most transformative was how methodical code refactoring and database indexing dramatically reduced response latency by over forty percent. It reaffirmed my conviction that resilience and calm analytical triage are paramount under pressure.`,
        thoughtChunks: [
          "I would like to recount an ambitious engineering initiative |",
          "where our primary architecture faced acute latency bottlenecks. |",
          "Given the critical client deadlines, |",
          "I spearheaded a root-cause diagnostic audit. |",
          "What struck me as most transformative |",
          "was how methodical code refactoring and database indexing |",
          "dramatically reduced response latency by over forty percent. |",
          "It reaffirmed my conviction |",
          "that resilience and calm analytical triage |",
          "are paramount under pressure. |",
        ],
        stressedWords: ["recount", "acute", "spearheaded", "transformative", "methodical", "refactoring", "paramount"],
        targetCollocations: [
          {
            phrase: "spearhead an initiative",
            meaning: "lead an organized project or effort",
            phoneticTip: "Crisp /p/ aspiration followed by diphthong /ɪə/ in 'spearhead'",
          },
          {
            phrase: "acute latency bottlenecks",
            meaning: "severe and urgent delays in system performance",
            phoneticTip: "Rising pitch on 'acute'; falling cadence on 'bottlenecks'",
          },
          {
            phrase: "paramount under pressure",
            meaning: "more important than anything else in stressful times",
            phoneticTip: "Clean bilabial plosives /p/ on both 'paramount' and 'pressure'",
          },
        ],
        masterCadenceWpm: 135,
      },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalises any stored vault (legacy raw JSON = version 0, or envelope v1).
 * Unknown or broken data falls back to the starter vault rather than crashing.
 */
export function migrateScriptVault(data: unknown): MasterScriptRepository {
  if (!isRecord(data) || !Array.isArray(data.items)) return createDefaultMasterRepository();
  const fallback = createDefaultMasterRepository();
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    ...fallback,
    ...(data as Partial<MasterScriptRepository>),
    totalPracticeCount: num(data.totalPracticeCount, 0),
    streakReps: num(data.streakReps, 0),
    dayStreak: num(data.dayStreak, 0),
    itemStats: isRecord(data.itemStats) ? (data.itemStats as Record<string, ItemStats>) : {},
    items: (data.items as unknown[]).filter(
      (i): i is ScriptItem => isRecord(i) && typeof i.id === "string" && typeof i.upgradedScript === "string"
    ),
  };
}

const vaultStore = createStore<MasterScriptRepository>({
  key: STORAGE_KEYS.scriptVault,
  version: 1,
  fallback: () => createDefaultMasterRepository(),
  migrate: (data) => migrateScriptVault(data),
});

export const subscribeMasterScript = vaultStore.subscribe;
export const getMasterScriptSnapshot = vaultStore.get;
export const getMasterScriptServerSnapshot = vaultStore.getServerSnapshot;

/** Persists the vault and notifies subscribers. */
export function saveMasterScript(repository: MasterScriptRepository): void {
  vaultStore.set(repository);
}

/**
 * Logs a completed repetition: bumps totals, the per-item stats, and the day streak.
 * @param itemId      the script item practised
 * @param accentScore optional 0-100 accent score from the coach
 */
export function logRepetitionCompleted(itemId?: string, accentScore?: number): void {
  const now = new Date();
  vaultStore.update((current) => {
    const itemStats = { ...(current.itemStats ?? {}) };
    if (itemId) itemStats[itemId] = applyRep(itemStats[itemId], accentScore, now.getTime());
    return {
      ...current,
      totalPracticeCount: current.totalPracticeCount + 1,
      streakReps: current.streakReps + 1,
      dayStreak: nextDayStreak(current.lastPracticeDay, current.dayStreak ?? 0, now),
      lastPracticeDay: localDay(now),
      itemStats,
      lastPracticedAt: now.getTime(),
    };
  });
}

/**
 * Rebuilds the generic starter scripts from an updated profile. Personal
 * scripts and practice stats are left alone (starter ids are stable, so their
 * stats carry over).
 */
export function refreshStarterScripts(profile: CandidateProfile): void {
  const fresh = createDefaultMasterRepository(profile).items;
  const byId = new Map(fresh.map((s) => [s.id, s]));
  vaultStore.update((current) => ({
    ...current,
    candidateName: profile.fullName,
    preferredName: profile.preferredName,
    items: current.items.map((s) => byId.get(s.id) ?? s),
  }));
}

/** Adds accepted capture scripts (see `mergeAcceptedScripts`) and records the learner's band. */
export function addPersonalScripts(accepted: ScriptItem[], targetBand?: string): void {
  vaultStore.update((current) => ({
    ...current,
    targetBand: targetBand ?? current.targetBand,
    items: mergeAcceptedScripts(current.items, accepted, current.itemStats),
  }));
}

/** Resets the vault to starter scripts built from `profile`. */
export function resetMasterScript(profile?: CandidateProfile): MasterScriptRepository {
  const fresh = createDefaultMasterRepository(profile);
  vaultStore.set(fresh);
  return fresh;
}
