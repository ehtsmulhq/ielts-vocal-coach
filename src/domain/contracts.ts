/**
 * Shared client/server API contracts. Each schema is the single definition of a
 * request or response shape: routes validate input with it, the client validates
 * responses with it, and Gemini response schemas are derived from it.
 */
import { z } from "zod";

// ---------------------------------------------------------------- primitives
export const TargetBandSchema = z.enum(["5.5", "6.5", "7.5"]);
export const StageSchema = z.enum(["part1", "part2", "part3"]);

/**
 * Names are interpolated into prompts, so only plain name characters survive.
 * Anything else the profile form allows (digits, brackets, typographic
 * apostrophes) is normalised away rather than rejected, so a saved profile can
 * never make an interview or lesson fail.
 */
export function cleanName(raw: string): string {
  return raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{M} .'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

const PersonName = z.string().max(200).transform(cleanName);

/** ~7.5 MB of base64 ≈ 5.6 MB of audio: about 3 minutes of WAV or far longer as Opus. */
export const MAX_AUDIO_BASE64_CHARS = 7_500_000;
export const MAX_SCRIPT_CHARS = 4_000;

export const TranscriptEntrySchema = z.object({
  id: z.number(),
  role: z.enum(["tutor", "student"]),
  text: z.string().max(5_000),
  stage: StageSchema,
});

const AudioBase64 = z.string().max(MAX_AUDIO_BASE64_CHARS).regex(/^[A-Za-z0-9+/=]*$/, "must be base64");
const AudioMime = z
  .string()
  .max(80)
  .regex(/^audio\/[a-z0-9.+-]+(;\s*codecs=[a-z0-9.,-]+)?$/i, "must be an audio MIME type");

// ---------------------------------------------------------------- scripts
export const TargetCollocationSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  phoneticTip: z.string(),
});

export const ScriptCategorySchema = z.enum(["work", "hometown", "living", "habits", "cuecard", "abstract"]);

/** A shadowing script: the unit learners practise (library, starter or personal). */
export const ScriptItemSchema = z.object({
  id: z.string(),
  category: ScriptCategorySchema,
  title: z.string(),
  question: z.string(),
  originalRawSpoken: z.string(), // learner's own words from Capture ("" for library scripts)
  upgradedScript: z.string(),
  thoughtChunks: z.array(z.string()), // breath groups ending with "|"
  stressedWords: z.array(z.string()),
  targetCollocations: z.array(TargetCollocationSchema),
  masterCadenceWpm: z.number(),
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  topic: z.string().optional(),
});

export type TargetCollocation = z.infer<typeof TargetCollocationSchema>;
export type ScriptItem = z.infer<typeof ScriptItemSchema>;

export const UpgradeResponseSchema = z.object({ items: z.array(ScriptItemSchema).min(1).max(12) });

// ---------------------------------------------------------------- mirror coach
export const MistakeTypeSchema = z.enum(["syntax", "collocation", "hesitation", "pronunciation", "substitution"]);

export const MirrorMistakeSchema = z.object({
  type: MistakeTypeSchema,
  userSaid: z.string(),
  targetPhrase: z.string(),
  coachCorrection: z.string(),
  phoneticTip: z.string().optional(),
});

export const AccentScoresSchema = z.object({
  overall: z.number(),
  stress: z.number(),
  rhythm: z.number(),
  intonation: z.number(),
  sounds: z.number(),
  focusTip: z.string(),
});

export const MirrorCoachResponseSchema = z.object({
  transcribedSpokenText: z.string().optional(),
  accuracyScore: z.number(),
  actualWpm: z.number(),
  fluencyRating: z.enum(["Needs Polish", "Solid Cadence", "Master Level Band 9"]),
  mistakes: z.array(MirrorMistakeSchema),
  praise: z.string(),
  drVanceSpokenFeedback: z.string(),
  matchedWordsCount: z.number(),
  totalWordsCount: z.number(),
  accent: AccentScoresSchema.optional(),
});

export const MirrorCoachRequestSchema = z.object({
  targetScript: z.string().min(1).max(MAX_SCRIPT_CHARS),
  candidateSpokenText: z.string().max(MAX_SCRIPT_CHARS * 2).default(""),
  audioBase64: AudioBase64.optional(),
  audioMimeType: AudioMime.default("audio/webm"),
  modelAudioBase64: AudioBase64.optional(),
  modelAudioMimeType: AudioMime.default("audio/wav"),
  targetCollocations: z
    .array(z.object({ phrase: z.string().max(200), meaning: z.string().max(300) }).loose())
    .max(20)
    .default([]),
  thoughtChunks: z.array(z.string().max(500)).max(60).default([]),
  durationSeconds: z.number().min(0).max(900).default(10),
  category: z.string().max(40).default("General"),
  targetBand: z.string().max(8).default("7.5"),
});

export type MirrorMistake = z.infer<typeof MirrorMistakeSchema>;
export type AccentScores = z.infer<typeof AccentScoresSchema>;
export type MirrorCoachResponse = z.infer<typeof MirrorCoachResponseSchema>;
export type MirrorCoachRequest = z.input<typeof MirrorCoachRequestSchema>;

// ---------------------------------------------------------------- model audio
export const ModelAudioRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_SCRIPT_CHARS),
  voice: z.string().max(40).optional(),
});
export type ModelAudioRequest = z.infer<typeof ModelAudioRequestSchema>;

// ---------------------------------------------------------------- live token
export const TokenRequestSchema = z.object({
  model: z.string().max(80).optional(),
  voice: z.string().max(40).optional(),
  band: TargetBandSchema.catch("7.5"),
  cambridgeTestId: z.string().max(80).optional(),
  sceneId: z.string().max(80).optional(),
  candidate: z.object({ preferredName: PersonName.default(""), fullName: PersonName.default("") }).default({ preferredName: "", fullName: "" }),
});

// ---------------------------------------------------------------- tutor
const Capped = (n: number) => z.string().max(n);

/** What the tutor needs to know about the script (personal scripts live only in the browser). */
export const TutorScriptSchema = z.object({
  title: Capped(120),
  question: Capped(300),
  // A spoken answer is well under 1,500 characters; a short cap limits what a caller can put in the prompt.
  upgradedScript: z.string().min(1).max(1500),
  thoughtChunks: z.array(Capped(300)).max(30),
  stressedWords: z.array(Capped(40)).max(12),
  targetCollocations: z.array(z.object({ phrase: Capped(100), meaning: Capped(200), phoneticTip: Capped(200) })).max(6),
});

const Count = z.number().int().min(0).max(100_000);
const Score = z.number().min(0).max(100);

/** What the coach knows about the learner when a lesson starts. Every field is optional. */
export const TutorContextSchema = z.object({
  // This script
  focusArea: z.enum(["sounds", "stress", "rhythm", "intonation"]).optional(),
  lastScore: Score.optional(),
  previousScore: Score.optional(),
  bestScore: Score.optional(),
  reps: Count.optional(),
  daysSinceScriptPractice: Count.optional(),
  lastFocusTip: z.string().max(300).optional(),
  // Right now
  phase: z.enum(["listen", "shadow", "deliver", "result"]).optional(),
  partOfDay: z.enum(["morning", "afternoon", "evening", "night"]).optional(),
  // Habits
  lessonsToday: Count.optional(),
  minutesSinceLastLesson: Count.optional(),
  daysSinceLastPractice: Count.optional(),
  repsToday: Count.optional(),
  streakDays: Count.optional(),
  totalLessons: Count.optional(),
  totalReps: Count.optional(),
});
export type TutorContext = z.output<typeof TutorContextSchema>;

export const TutorTokenRequestSchema = z.object({
  tutorId: z.string().max(20),
  learnerName: PersonName.default(""),
  /** Absent when the lesson (re)connects while the learner is away from a practice page. */
  script: TutorScriptSchema.optional(),
  context: TutorContextSchema.default({}),
  /** Continues an earlier conversation (Gemini Live session resumption). */
  resumeHandle: z
    .string()
    .max(512)
    .regex(/^[A-Za-z0-9_\-./=+]+$/, "invalid handle")
    .optional(),
});
export type TutorTokenRequest = z.output<typeof TutorTokenRequestSchema>;

// ---------------------------------------------------------------- greeting
/** The coach's short spoken greeting on Today, written from the learner's situation. */
export const GreetingRequestSchema = z.object({
  tutorId: z.string().max(20),
  learnerName: PersonName.default(""),
  context: TutorContextSchema.default({}),
  suggestion: z.object({ topic: Capped(120), question: Capped(300) }).optional(),
});
export type GreetingRequest = z.output<typeof GreetingRequestSchema>;

export const GreetingResponseSchema = z.object({
  text: z.string().min(1).max(400),
});
export type GreetingResponse = z.output<typeof GreetingResponseSchema>;

// ---------------------------------------------------------------- lesson
export const LessonRequestSchema = z.object({
  band: TargetBandSchema.catch("7.5"),
  topic: z.string().max(500).optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  cambridgeTestId: z.string().max(80).optional(),
  sceneId: z.string().max(80).optional(),
});

// ---------------------------------------------------------------- feedback / upgrade
export const MAX_TRANSCRIPT_ENTRIES = 2_000;

export const FeedbackRequestSchema = z.object({
  // The lesson is produced by our own /api/lesson; only its outline is checked here.
  lesson: z.record(z.string(), z.unknown()),
  transcript: z.array(TranscriptEntrySchema).max(MAX_TRANSCRIPT_ENTRIES),
  band: z.string().max(8).default("6.5"),
});

export const UpgradeRequestSchema = z.object({
  transcript: z.array(TranscriptEntrySchema).max(MAX_TRANSCRIPT_ENTRIES).default([]),
  profile: z.record(z.string(), z.unknown()).optional(),
  targetBand: z.string().max(8).optional(),
});

// ---------------------------------------------------------------- errors
export const ApiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;

/**
 * Converts a Zod schema to the JSON Schema subset Gemini accepts for
 * `responseJsonSchema` (drops the `$schema` marker Zod adds).
 */
export function toGeminiSchema(schema: z.ZodType): object {
  const json = z.toJSONSchema(schema, { target: "draft-7", io: "output" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
