import { CandidateProfile, DEFAULT_PROFILE } from "./types";

export interface TargetCollocation {
  phrase: string;
  meaning: string;
  phoneticTip: string;
}

export interface ScriptItem {
  id: string; // e.g. "canonical-work", "canonical-hometown", "canonical-habits", "canonical-cuecard"
  category: "work" | "hometown" | "living" | "habits" | "cuecard" | "abstract";
  title: string;
  question: string;
  originalRawSpoken: string; // Captured from Take 1
  upgradedScript: string; // Band 8.5+ native spoken rewrite of candidate's thoughts
  thoughtChunks: string[]; // Rhythmic breath units ending with '|'
  stressedWords: string[]; // Key tonic stress words
  targetCollocations: TargetCollocation[];
  masterCadenceWpm: number; // e.g. 130
  part?: 1 | 2 | 3; // IELTS Speaking part (library scripts)
  topic?: string; // Short topic label (library scripts)
}

export interface ItemStats {
  reps: number;
  bestAccentScore: number; // 0-100, 0 if never scored
  lastPracticedAt: number;
}

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

const MASTER_SCRIPT_STORAGE_KEY = "vocal_lab_master_script_v2";

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

let cachedRepository: MasterScriptRepository | null = null;
const listeners = new Set<() => void>();

/**
 * Loads the master script repository from localStorage.
 */
export function loadMasterScript(): MasterScriptRepository {
  if (typeof window === "undefined") {
    return createDefaultMasterRepository();
  }

  try {
    const raw = window.localStorage.getItem(MASTER_SCRIPT_STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultMasterRepository();
      saveMasterScript(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as MasterScriptRepository;
    return parsed;
  } catch (err) {
    console.warn("[master-script] Error reading from localStorage, using default:", err);
    return createDefaultMasterRepository();
  }
}

/**
 * useSyncExternalStore subscription for tear-free, hydration-safe reactive script updates.
 */
export function subscribeMasterScript(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMasterScriptSnapshot(): MasterScriptRepository {
  if (!cachedRepository) {
    cachedRepository = loadMasterScript();
  }
  return cachedRepository;
}

export function getMasterScriptServerSnapshot(): MasterScriptRepository {
  return createDefaultMasterRepository();
}

/**
 * Persists the master script repository and notifies reactive subscribers.
 */
export function saveMasterScript(repository: MasterScriptRepository): void {
  cachedRepository = {
    ...repository,
    lastPracticedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MASTER_SCRIPT_STORAGE_KEY, JSON.stringify(cachedRepository));
    } catch (err) {
      console.error("[master-script] Failed to save to localStorage:", err);
    }
  }

  listeners.forEach((listener) => listener());
}

function localDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Logs a completed repetition rep: bumps totals, the per-item stats, and the day streak.
 * @param itemId   the script item practised
 * @param accentScore optional 0-100 accent score from the coach
 */
export function logRepetitionCompleted(itemId?: string, accentScore?: number): void {
  const current = getMasterScriptSnapshot();
  const now = new Date();
  const today = localDay(now);
  const yesterday = localDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  let dayStreak = current.dayStreak ?? 0;
  if (current.lastPracticeDay !== today) {
    dayStreak = current.lastPracticeDay === yesterday ? dayStreak + 1 : 1;
  }

  const itemStats = { ...(current.itemStats ?? {}) };
  if (itemId) {
    const prev = itemStats[itemId] ?? { reps: 0, bestAccentScore: 0, lastPracticedAt: 0 };
    itemStats[itemId] = {
      reps: prev.reps + 1,
      bestAccentScore: Math.max(prev.bestAccentScore, accentScore ?? 0),
      lastPracticedAt: now.getTime(),
    };
  }

  saveMasterScript({
    ...current,
    totalPracticeCount: current.totalPracticeCount + 1,
    streakReps: current.streakReps + 1,
    dayStreak,
    lastPracticeDay: today,
    itemStats,
    lastPracticedAt: now.getTime(),
  });
}

/**
 * Resets the master script repository to defaults.
 */
export function resetMasterScript(profile?: CandidateProfile): MasterScriptRepository {
  const fresh = createDefaultMasterRepository(profile);
  saveMasterScript(fresh);
  return fresh;
}
