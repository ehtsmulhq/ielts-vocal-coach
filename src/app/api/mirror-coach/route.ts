import { generateJson, generateJsonWithMedia } from "@/lib/gemini";

interface MirrorCoachRequest {
  targetScript: string;
  candidateSpokenText?: string;
  audioBase64?: string;
  audioMimeType?: string;
  targetCollocations: { phrase: string; meaning: string }[];
  thoughtChunks: string[];
  durationSeconds: number;
  category: string;
  targetBand: string;
}

interface MirrorMistake {
  type: "syntax" | "collocation" | "hesitation" | "pronunciation" | "substitution";
  userSaid: string;
  targetPhrase: string;
  coachCorrection: string;
  phoneticTip?: string;
}

interface MirrorCoachResponse {
  transcribedSpokenText?: string;
  accuracyScore: number;
  actualWpm: number;
  fluencyRating: "Needs Polish" | "Solid Cadence" | "Master Level Band 9";
  mistakes: MirrorMistake[];
  praise: string;
  drVanceSpokenFeedback: string;
  matchedWordsCount: number;
  totalWordsCount: number;
}

const mirrorCoachSchema = {
  type: "object",
  properties: {
    transcribedSpokenText: { type: "string" },
    accuracyScore: { type: "number" },
    actualWpm: { type: "number" },
    fluencyRating: {
      type: "string",
      enum: ["Needs Polish", "Solid Cadence", "Master Level Band 9"],
    },
    mistakes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["syntax", "collocation", "hesitation", "pronunciation", "substitution"],
          },
          userSaid: { type: "string" },
          targetPhrase: { type: "string" },
          coachCorrection: { type: "string" },
          phoneticTip: { type: "string" },
        },
        required: ["type", "userSaid", "targetPhrase", "coachCorrection"],
      },
    },
    praise: { type: "string" },
    drVanceSpokenFeedback: { type: "string" },
    matchedWordsCount: { type: "number" },
    totalWordsCount: { type: "number" },
  },
  required: [
    "accuracyScore",
    "actualWpm",
    "fluencyRating",
    "mistakes",
    "praise",
    "drVanceSpokenFeedback",
    "matchedWordsCount",
    "totalWordsCount",
  ],
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<MirrorCoachRequest>;
    const {
      targetScript = "",
      candidateSpokenText = "",
      audioBase64,
      audioMimeType = "audio/webm",
      targetCollocations = [],
      thoughtChunks = [],
      durationSeconds = 10,
      category = "General",
      targetBand = "7.5",
    } = body;

    const spokenWords = candidateSpokenText.trim().split(/\s+/).filter(Boolean);
    const targetWords = targetScript.trim().split(/\s+/).filter(Boolean);
    const durationMin = Math.max(0.1, durationSeconds / 60);
    const calculatedWpm = Math.round(spokenWords.length / durationMin);

    // If candidate said almost nothing and no audio is present
    if (!audioBase64 && spokenWords.length < 3) {
      const emptyResponse: MirrorCoachResponse = {
        transcribedSpokenText: candidateSpokenText,
        accuracyScore: 0,
        actualWpm: 0,
        fluencyRating: "Needs Polish",
        mistakes: [
          {
            type: "hesitation",
            userSaid: "(Silence or unintelligible audio)",
            targetPhrase: targetScript.slice(0, 50) + "...",
            coachCorrection: "I didn't catch your voice clearly. Ensure your microphone is active and articulate the words with conviction.",
          },
        ],
        praise: "Take a deep breath and start again when you are ready.",
        drVanceSpokenFeedback: "I couldn't hear you clearly. Let us try that again together. Take a breath and speak up.",
        matchedWordsCount: 0,
        totalWordsCount: targetWords.length,
      };
      return Response.json(emptyResponse);
    }

    const prompt = `You are Dr. Jonathan Vance, a Senior British Vocal Coach and Speech Pathologist.
You are listening to an IELTS candidate who is shadowing their upgraded Band 8.5/9.0 Master Script in the Mirror Gym.

TASK:
${
  audioBase64
    ? "Listen directly to the CANDIDATE'S RECORDED SPOKEN AUDIO. Transcribe their exact spoken words into `transcribedSpokenText`, then compare their spoken delivery against the TARGET MASTER SCRIPT."
    : "Compare the CANDIDATE'S ACTUAL SPOKEN WORDS against the TARGET MASTER SCRIPT."
}

Identify specific mistakes the user made (missed collocations, lost cleft structures, omitted breath groups, mispronunciations, or robotic hesitations) and provide targeted vocal coach remediation.

CATEGORY: ${category}
TARGET IELTS BAND: ${targetBand}
TARGET SCRIPT TO DELIVER:
"${targetScript}"

MANDATORY COLLOCATIONS EXPECTED:
${targetCollocations.map((c) => `- "${c.phrase}" (${c.meaning})`).join("\n")}

RHYTHMIC THOUGHT CHUNKS (NATURAL BREATH UNITS):
${thoughtChunks.map((chunk, i) => `[${i + 1}] "${chunk}"`).join("\n")}

${
  candidateSpokenText
    ? `CLIENT BROWSER ASR TRANSCRIPTION DRAFT (${spokenWords.length} words, ${calculatedWpm} WPM):\n"${candidateSpokenText}"\n`
    : ""
}
DELIVERY DURATION: ${durationSeconds} seconds.

COACHING GUIDELINES:
1. Objectively compare candidate's delivery with target script:
   - Check if they deployed the mandatory collocations.
   - Check if they preserved Band 8.5 grammatical structures (cleft sentences, fronted adverbials, concessive clauses).
   - Check cadence and fluency (Ideal cadence: 125-155 WPM).
2. For each mistake found (up to 3-4 key high-impact mistakes):
   - userSaid: what the candidate actually uttered (or "(Omitted)").
   - targetPhrase: what the master script required.
   - coachCorrection: precise, encouraging explanation of how to fix it (e.g. "Do not omit the cleft opening; saying 'What strikes me most...' establishes instant Cambridge Band 8 authority.").
   - phoneticTip: optional phonetic/rhythm advice.
3. drVanceSpokenFeedback:
   - A concise, authoritative, warm 2-3 sentence vocal coach spoken response that Dr. Vance will speak aloud to the candidate right now.
   - Example: "Well done on keeping the cadence at 135 words per minute. Notice that you omitted 'indispensable asset' and rushed through the second breath chunk. Listen to my rhythm and take it from the top."`;

    if (audioBase64) {
      const contents = [
        {
          inlineData: {
            mimeType: audioMimeType,
            data: audioBase64,
          },
        },
        {
          text: prompt,
        },
      ];
      const { data } = await generateJsonWithMedia<MirrorCoachResponse>(contents, mirrorCoachSchema);
      return Response.json(data);
    } else {
      const { data } = await generateJson<MirrorCoachResponse>(prompt, mirrorCoachSchema);
      return Response.json(data);
    }
  } catch (err) {
    console.error("[api/mirror-coach]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
