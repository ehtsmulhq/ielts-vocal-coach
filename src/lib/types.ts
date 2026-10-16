export type TargetBand = "5.5" | "6.5" | "7.5";

export type Stage = "motor_warmup" | "long_reading" | "speed_drill" | "ielts_test";

export const STAGES: {
  id: Stage;
  label: string;
  hint: string;
  category: "vocal" | "exam";
  badge: string;
}[] = [
  { id: "motor_warmup", label: "Motor Drills", hint: "Jaw & Lip Articulation", category: "vocal", badge: "Stage 1" },
  { id: "long_reading", label: "Long Reading Gym", hint: "Stamina, WPM & Pacing", category: "vocal", badge: "Stage 2 • Core" },
  { id: "speed_drill", label: "Speed & Reflexes", hint: "Tongue Twisters & Velocity", category: "vocal", badge: "Stage 3" },
  { id: "ielts_test", label: "Exam Capstone", hint: "Optional IELTS Speaking Test", category: "exam", badge: "Secondary" },
];

export interface MotorDrill {
  soundSymbol: string;
  soundName: string;
  physicalTip: string;
  practiceWords: string[];
  challengeSentence: string;
}

export interface LongReadingPassage {
  title: string;
  theme: string;
  wordCount: number;
  fullText: string;
  targetWpmRange: string; // e.g. "120 - 140 WPM"
  thoughtChunks: string[];
  keyDifficultWords: { word: string; phonetic: string; tip: string }[];
}

export interface SpeedDrill {
  title: string;
  targetSound: string;
  twister: string;
  goalPace: string;
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
  focusArea?: "full" | "consonants" | "reading" | "speed";
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
