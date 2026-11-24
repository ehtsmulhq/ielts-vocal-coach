import { GoogleGenAI, Modality } from "@google/genai";
import { LIVE_MODEL, getApiKey } from "@/server/config";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError, NotConfiguredError } from "@/server/errors";
import { tutorInstruction } from "@/server/tutor-prompt";
import { TutorTokenRequestSchema } from "@/domain/contracts";
import { getTutor } from "@/lib/tutors";

/**
 * Single-use Live token for the learner's personal coach, locked to the coach's
 * voice and a teaching prompt built here. The script comes from the browser
 * (personal scripts are stored there), so every field is length-capped and the
 * prompt treats it as data.
 */
export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "tutor-token", ...LIMITS.tutor }, TutorTokenRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new NotConfiguredError();

    const tutor = getTutor(guarded.data.tutorId);
    const systemInstruction = tutorInstruction(tutor, guarded.data);
    const model = LIVE_MODEL;

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: tutor.voice } } },
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        lockAdditionalFields: [],
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    return Response.json({ token: token.name, model, voice: tutor.voice, systemInstruction, tutor });
  } catch (err) {
    return handleRouteError("tutor-token", err);
  }
}
