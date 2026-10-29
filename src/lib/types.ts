export type TargetBand = "5.5" | "6.5" | "7.5";

export type Stage = "motor_warmup" | "long_reading" | "speed_drill" | "ielts_test";

export const STAGES: {
  id: Stage;
  label: string;
  hint: string;
  category: "vocal" | "exam";
  badge: string;
}[] = [
  { id: "motor_warmup", label: "Opener Priming", hint: "Formulaic Chunk Reflexes", category: "vocal", badge: "Stage 1" },
  { id: "long_reading", label: "Story Shadowing", hint: "Tarteel Teleprompter & WPM", category: "vocal", badge: "Stage 2 • Core" },
  { id: "speed_drill", label: "Reflex Sprint", hint: "1.5s Zero-Hesitation Starter", category: "vocal", badge: "Stage 3" },
  { id: "ielts_test", label: "Exam Capstone", hint: "Full IELTS Speaking Simulation", category: "exam", badge: "Stage 4" },
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
  lastUpdated: Date.now(),
};

export interface MotorDrill {
  soundSymbol?: string;
  soundName?: string;
  physicalTip?: string;
  practiceWords?: string[];
  challengeSentence?: string;
  // V2 Chunk Extensions
  chunkPhrase: string;
  category: "career" | "hometown" | "habit" | "general";
  phoneticFocus: string;
  usageContext: string;
  sampleSentence: string;
}

export interface LongReadingPassage {
  title: string;
  theme: string;
  wordCount: number;
  fullText: string;
  targetWpmRange: string; // e.g. "120 - 140 WPM"
  thoughtChunks: string[];
  keyDifficultWords: { word: string; phonetic: string; tip: string }[];
  storyContext?: string;
}

export interface SpeedDrill {
  title: string;
  targetSound?: string;
  twister?: string;
  goalPace?: string;
  // V2 Reflex Sprint Extensions
  questionPrompt: string;
  aerScaffolding: {
    anchor: string;
    reason: string;
    detail: string;
  };
  starterChunk: string;
}

export interface IeltsExam {
  theme: string;
  part1Questions: string[];
  part2CueCard: {
    title: string;
    bullets: string[];
    closing: string;
  };
  part3Questions: string[];
}

export interface Lesson {
  topic: string;
  vocalWorkout: {
    motorDrills: MotorDrill[];
    longReading: LongReadingPassage;
    speedDrills: SpeedDrill[];
  };
  ieltsExam: IeltsExam;
}

export interface LessonRequest {
  band: TargetBand;
  topic?: string;
  focusArea?: "full" | "career" | "hometown" | "habits" | "consonants" | "reading" | "speed";
  profile?: CandidateProfile;
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
