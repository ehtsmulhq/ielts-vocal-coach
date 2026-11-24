import { generateJson } from "@/server/gemini";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError } from "@/server/errors";
import {
  MirrorCoachRequestSchema,
  MirrorCoachResponseSchema,
  toGeminiSchema,
  type MirrorCoachResponse,
} from "@/domain/contracts";
import { countWords, cadenceWpm } from "@/domain/transcript";

export const maxDuration = 60;

const responseSchema = toGeminiSchema(MirrorCoachResponseSchema);

export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "mirror-coach", ...LIMITS.coach }, MirrorCoachRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const {
      targetScript,
      candidateSpokenText,
      audioBase64,
      audioMimeType,
      modelAudioBase64,
      modelAudioMimeType,
      targetCollocations,
      thoughtChunks,
      durationSeconds,
      category,
      targetBand,
    } = guarded.data;

    const spokenWordCount = countWords(candidateSpokenText);
    const targetWordCount = countWords(targetScript);
    const calculatedWpm = cadenceWpm(spokenWordCount, durationSeconds, 0, 0);

    // Nothing to assess: no audio and almost no recognised words.
    if (!audioBase64 && spokenWordCount < 3) {
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
            coachCorrection: "I didn't catch your voice clearly. Check your microphone and speak the words with conviction.",
          },
        ],
        praise: "Take a deep breath and start again when you are ready.",
        drVanceSpokenFeedback: "I couldn't hear you clearly. Let's try that again. Take a breath and speak up.",
        matchedWordsCount: 0,
        totalWordsCount: targetWordCount,
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
    ? `CLIENT BROWSER ASR TRANSCRIPTION DRAFT (${spokenWordCount} words, ${calculatedWpm} WPM):\n"${candidateSpokenText}"\n`
    : ""
}
DELIVERY DURATION: ${durationSeconds} seconds.

${
  audioBase64 && modelAudioBase64
    ? `ACCENT SHADOWING COMPARISON:
Two audio clips are attached, in this order: (1) the BRITISH RP MODEL reference, (2) the CANDIDATE'S shadowing attempt of the same script.
Compare the candidate against the model on accent, scoring each 0-100 in the \`accent\` object:
- sounds: RP vowel quality (e.g. TRAP vs BATH, non-rhotic /r/, linking r), /t/ release, /θ/ and /ð/, /v/ vs /w/.
- stress: word stress and sentence stress / nuclear stress on key content words; weak forms of function words.
- rhythm: stress-timed rhythm, linking, pauses at the thought chunks.
- intonation: falling/rising pitch contour, emphasis.
- overall: your holistic accent-match score.
- focusTip: ONE specific, doable thing to fix on the next rep.
Use the \`pronunciation\` mistake type and \`phoneticTip\` (give the sound or stress pattern, e.g. "/ˈɪn.tər.nɛt/") for accent errors.
`
    : ""
}COACHING GUIDELINES:
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

    const contents = audioBase64
      ? [
          {
            role: "user",
            parts: [
              ...(modelAudioBase64 ? [{ inlineData: { mimeType: modelAudioMimeType, data: modelAudioBase64 } }] : []),
              { inlineData: { mimeType: audioMimeType, data: audioBase64 } },
              { text: prompt },
            ],
          },
        ]
      : prompt;

    const { data } = await generateJson<MirrorCoachResponse>({
      contents,
      schema: responseSchema,
      mode: "scoring",
      validate: MirrorCoachResponseSchema,
    });
    // Accent scores only mean something when the model actually heard the learner's audio.
    if (!audioBase64) delete data.accent;
    return Response.json(data);
  } catch (err) {
    return handleRouteError("mirror-coach", err);
  }
}
