import { GoogleGenAI, Modality } from "@google/genai";
import { LIVE_VOICE, getApiKey, resolveLiveModel, resolveVoice } from "@/server/config";
import { guardJson, LIMITS } from "@/server/guard";
import { apiError, handleRouteError, NotConfiguredError } from "@/server/errors";
import { resolveBuiltInLesson } from "@/server/lessons";
import { TokenRequestSchema } from "@/domain/contracts";
import { examinerInstruction } from "@/lib/prompts";

/**
 * Issues a single-use ephemeral token for the live examiner. The browser never
 * sees the API key, and the token is locked to:
 * - an allowlisted model and voice, and
 * - an examiner prompt built here from a built-in question bank,
 * so a leaked token can't be used as a general-purpose voice assistant.
 */
export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "token", ...LIMITS.token }, TokenRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new NotConfiguredError();

    const { band, sceneId, cambridgeTestId, candidate } = guarded.data;
    const lesson = resolveBuiltInLesson({ band, sceneId, cambridgeTestId });
    if (!lesson) return apiError("bad_request", 400, "Choose one of the built-in interview topics.");

    const model = resolveLiveModel(guarded.data.model);
    const voice = resolveVoice(guarded.data.voice, LIVE_VOICE);
    const systemInstruction = examinerInstruction(lesson, { ...candidate, targetBand: band });

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
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        // Empty list = lock every field set above; the client can't override them.
        lockAdditionalFields: [],
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    return Response.json({ token: token.name, model, voice, systemInstruction, lesson });
  } catch (err) {
    return handleRouteError("token", err);
  }
}
