import { resetProfile } from "./profile";
import { resetMasterScript } from "./master-script";

export interface DailyImprovementDelta {
  overallDelta: number; // e.g. +0.5
  fluencyDelta: number;
  lexicalDelta: number;
  grammarDelta: number;
  pronunciationDelta: number;
  wpmDelta: number;
  keyWins: string[];
  focusAreasForTomorrow: string[];
}

export interface HotSeatSessionRecord {
  id: string;
  dayNumber: number;
  timestamp: number;
  dateStr: string; // e.g. "29 Oct 2026"
  targetBand: string;
  overallBand: number;
  subScores: {
    pronunciation: number;
    fluency: number;
    lexical: number;
    grammar: number;
  };
  metrics: {
    wpm: number;
    totalStudentWords: number;
    durationSeconds: number;
    turnCount: number;
  };
  cambridgeTopic: string;
  improvementDelta?: DailyImprovementDelta;
}

const TEST_HISTORY_STORAGE_KEY = "vocal_lab_test_history_v2";

let cachedHistory: HotSeatSessionRecord[] | null = null;
const listeners = new Set<() => void>();

export function loadTestHistory(): HotSeatSessionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TEST_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HotSeatSessionRecord[];
  } catch (err) {
    console.warn("[test-history] Failed to parse history:", err);
    return [];
  }
}

export function subscribeTestHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTestHistorySnapshot(): HotSeatSessionRecord[] {
  if (!cachedHistory) {
    cachedHistory = loadTestHistory();
  }
  return cachedHistory;
}

export function getTestHistoryServerSnapshot(): HotSeatSessionRecord[] {
  return [];
}

export function saveTestSession(record: Omit<HotSeatSessionRecord, "id" | "dayNumber" | "dateStr">): HotSeatSessionRecord {
  const current = getTestHistorySnapshot();
  const nextDayNumber = current.length + 1;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate improvement delta vs previous session
  let improvementDelta: DailyImprovementDelta | undefined;
  if (current.length > 0) {
    const prev = current[current.length - 1];
    const overallDelta = Number((record.overallBand - prev.overallBand).toFixed(1));
    const fluencyDelta = Number((record.subScores.fluency - prev.subScores.fluency).toFixed(1));
    const lexicalDelta = Number((record.subScores.lexical - prev.subScores.lexical).toFixed(1));
    const grammarDelta = Number((record.subScores.grammar - prev.subScores.grammar).toFixed(1));
    const pronunciationDelta = Number((record.subScores.pronunciation - prev.subScores.pronunciation).toFixed(1));
    const wpmDelta = Math.round(record.metrics.wpm - prev.metrics.wpm);

    const keyWins: string[] = [];
    if (overallDelta > 0) keyWins.push(`+${overallDelta} Overall Band Improvement from previous Hot Seat`);
    if (fluencyDelta > 0) keyWins.push(`Smoother flow: +${fluencyDelta} Fluency Descriptor increase`);
    if (grammarDelta > 0) keyWins.push(`Higher syntactic complexity: +${grammarDelta} in Grammar`);
    if (lexicalDelta > 0) keyWins.push(`Expanded vocabulary range: +${lexicalDelta} in Lexical precision`);
    if (wpmDelta > 5) keyWins.push(`Natural cadence pace accelerated by +${wpmDelta} WPM`);
    if (record.metrics.totalStudentWords > prev.metrics.totalStudentWords) {
      keyWins.push(`Spoke ${record.metrics.totalStudentWords - prev.metrics.totalStudentWords} more words with zero stalling`);
    }

    if (keyWins.length === 0) {
      keyWins.push("Maintained consistent baseline cadence under examiner pressure");
      keyWins.push("Completed all three Cambridge interview stages with high acoustic clarity");
    }

    const focusAreasForTomorrow: string[] = [];
    if (record.subScores.fluency < 7.0) {
      focusAreasForTomorrow.push("Practice 0.85x mirror shadowing to smooth mid-clause hesitation gaps");
    }
    if (record.subScores.grammar < 7.0) {
      focusAreasForTomorrow.push("Deploy cleft structures ('What strikes me is...') in Part 1 answers");
    }
    if (record.subScores.lexical < 7.0) {
      focusAreasForTomorrow.push("Integrate 2-3 topic collocations into Part 3 abstract reasoning");
    }
    if (focusAreasForTomorrow.length === 0) {
      focusAreasForTomorrow.push("Master subtle pitch modulation and syllable tonic stress in Cue Card");
    }

    improvementDelta = {
      overallDelta,
      fluencyDelta,
      lexicalDelta,
      grammarDelta,
      pronunciationDelta,
      wpmDelta,
      keyWins,
      focusAreasForTomorrow,
    };
  } else {
    // First session baseline
    improvementDelta = {
      overallDelta: 0,
      fluencyDelta: 0,
      lexicalDelta: 0,
      grammarDelta: 0,
      pronunciationDelta: 0,
      wpmDelta: 0,
      keyWins: [
        `Established official Day 1 Diagnostic Baseline (${record.overallBand.toFixed(1)} Band)`,
        `Successfully logged ${record.metrics.totalStudentWords} authentic spoken words`,
        "Baseline answers captured into Master Script Vault for daily acoustic repetition",
      ],
      focusAreasForTomorrow: [
        "Practice in the Mirror Gym with your upgraded script 3 times today",
        "Target zero hesitation pauses in tomorrow's Part 1 interview",
      ],
    };
  }

  const fullRecord: HotSeatSessionRecord = {
    ...record,
    id: `hotseat-${Date.now()}`,
    dayNumber: nextDayNumber,
    dateStr,
    improvementDelta,
  };

  const updatedHistory = [...current, fullRecord];
  cachedHistory = updatedHistory;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TEST_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("[test-history] Failed to save session:", err);
    }
  }

  listeners.forEach((listener) => listener());
  return fullRecord;
}

/**
 * Completely erases all user data across all stores:
 * - Candidate profile
 * - Master script vault
 * - Hot seat test history
 * Resets to clean slate Day 1.
 */
export function wipeAllUserData(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("vocal_lab_candidate_profile_v1");
      window.localStorage.removeItem("vocal_lab_master_script_v2");
      window.localStorage.removeItem(TEST_HISTORY_STORAGE_KEY);
      // Clean any legacy keys
      window.localStorage.removeItem("vocal_lab_master_script_v1");
      window.localStorage.removeItem("vocal_lab_history");
    } catch (err) {
      console.warn("[test-history] Error clearing localStorage:", err);
    }
  }

  cachedHistory = [];
  listeners.forEach((listener) => listener());

  // Reset profile and master script
  resetProfile();
  resetMasterScript();
}
