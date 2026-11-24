import { ApiError } from "@google/genai";
import { getClient, isRetryable } from "@/server/gemini";
import { TTS_MODELS, TTS_VOICE, resolveVoice } from "@/server/config";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError, UpstreamError } from "@/server/errors";
import { ttsToWav } from "@/server/wav";
import { ModelAudioRequestSchema } from "@/domain/contracts";

/**
 * Renders a shadowing model clip with Gemini TTS and returns it as a WAV file.
 * Body: { text: string; voice?: string }
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "model-audio", ...LIMITS.modelAudio }, ModelAudioRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const voice = resolveVoice(guarded.data.voice, TTS_VOICE);
    // Strip breath-mark pipes so they are not read aloud; the model pauses naturally at punctuation.
    const spoken = guarded.data.text.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
    // Keep the style cue short: long pacing instructions make the TTS model read several times slower.
    const prompt = `Say in a British accent at a brisk, natural conversational speed: ${spoken}`;

    const ai = getClient();
    let lastError: unknown;
    for (const model of TTS_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        });
        const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const data = part?.inlineData?.data;
        if (!data) throw new Error("No audio returned");
        const wav = ttsToWav(Buffer.from(data, "base64"), part?.inlineData?.mimeType ?? "");
        return new Response(new Uint8Array(wav), {
          headers: { "Content-Type": "audio/wav", "X-TTS-Model": model, "Cache-Control": "no-store" },
        });
      } catch (err) {
        lastError = err;
        console.warn(`[model-audio] ${model} failed:`, (err as Error).message?.slice(0, 200));
        if (!isRetryable(err)) break;
      }
    }
    throw new UpstreamError(
      lastError instanceof Error ? lastError.message : "All TTS models failed",
      lastError instanceof ApiError ? lastError.status : undefined
    );
  } catch (err) {
    return handleRouteError("model-audio", err);
  }
}
