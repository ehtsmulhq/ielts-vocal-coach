export type TargetBand = "5.5" | "6.5" | "7.5";

export type Stage = "part1" | "part2" | "part3";

export const STAGES: {
  id: Stage;
  label: string;
  hint: string;
  category: "exam";
  badge: string;
}[] = [
  {
    id: "part1",
    label: "Part 1: Identity & Everyday Life",
    hint: "Authentic Interview (Work, Roots, Habits)",
    category: "exam",
    badge: "Part 1 • 4-5 min",
  },
  {
    id: "part2",
    label: "Part 2: Individual Long Turn",
    hint: "Official Cue Card Monologue (1-2 min)",
    category: "exam",
    badge: "Part 2 • 3-4 min",
  },
  {
    id: "part3",
    label: "Part 3: Two-Way Discussion",
    hint: "Deep Analytical & Abstract Exchange",
    category: "exam",
    badge: "Part 3 • 4-5 min",
  },
];

export interface CandidateProfile {
  fullName: string;
  preferredName: string;
  status: "working" | "studying" | "both" | "transitioning";
  occupationOrMajor: string;
  fieldDetails: string;
  hometownName: string;
  hometownVibe: string;
  currentResidence: string;
  livingSetup: "apartment" | "house" | "shared_flat" | "dormitory";
  favoriteRoom: string;
  morningRoutine: string;
  unwindingHabit: string;
  targetBand: TargetBand;
  examPurpose: string;
  hasCompletedGrill?: boolean;
  lastUpdated?: number;
}

export const DEFAULT_PROFILE: CandidateProfile = {
  fullName: "Alex Mercer",
  preferredName: "Alex",
  status: "working",
  occupationOrMajor: "Software Engineer",
  fieldDetails: "building distributed web and cloud infrastructure",
  hometownName: "Chittagong",
  hometownVibe: "coastal seaport with green hills and maritime trade",
  currentResidence: "Dhanmondi, Dhaka",
  livingSetup: "apartment",
  favoriteRoom: "sunlit study nook with my dual monitors and espresso maker",
  morningRoutine: "early morning strength training and brewing filter coffee before checking screens",
  unwindingHabit: "cooking from scratch with fresh produce and reading speculative fiction",
  targetBand: "7.5",
  examPurpose: "postgraduate study admission and professional international relocation",
  hasCompletedGrill: false,
  lastUpdated: Date.now(),
};

export interface CueCard {
  title: string;
  bullets: string[];
  closing: string;
}

export interface RecommendedCollocation {
  phrase: string;
  meaning: string;
  example: string;
  phoneticTip?: string;
}

export interface CambridgeHotSeatTest {
  theme: string;
  cambridgeRef?: string;
  part1Questions: string[];
  part2CueCard: CueCard;
  part3Questions: string[];
  recommendedVocabulary: RecommendedCollocation[];
  bandFocusNotes?: string;
}

export interface Lesson {
  topic: string;
  band: TargetBand;
  hotSeatTest: CambridgeHotSeatTest;
  // Deprecated alias for backwards-compatibility
  ieltsExam?: CambridgeHotSeatTest;
}

export interface LessonRequest {
  band: TargetBand;
  topic?: string;
  focusArea?: "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed";
  profile?: CandidateProfile;
  cambridgeTestId?: string;
}

export interface TranscriptEntry {
  id: number;
  role: "tutor" | "student";
  text: string;
  stage: Stage;
}

export interface CriterionScore {
  band: number;
  comment: string;
}

export interface Feedback {
  overall: number;
  fluency: CriterionScore;
  lexical: CriterionScore;
  grammar: CriterionScore;
  pronunciation: CriterionScore;
  vocalHabits: {
    readingStamina: string;
    speakingWpm: string;
    jawTension: string;
    breathPacing: string;
    soundClarity: string;
  };
  strengths: string[];
  improvements: string[];
  wordsToPractice: { word: string; tip: string }[];
  nextDrill: string;
}

export interface NetworkTelemetry {
  pingMs: number;
  googleRttMs: number | null;
  ttfbMs: number | null;
  packetsSent: number;
  packetsReceived: number;
  bufferUnderruns: number;
  jitterMs: number;
  lossRatePercent: number;
  wsBufferedAmount: number;
  quality: "excellent" | "good" | "fair" | "poor";
  diagnosis: string;
}
