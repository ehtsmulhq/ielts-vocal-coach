import { ApiError } from "@google/genai";
import { getClient, isRetryable } from "@/server/gemini";
import { LIVE_RENDER_MODEL, MODEL_AUDIO_ENGINE, TTS_MODELS, TTS_VOICE, resolveVoice } from "@/server/config";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError, UpstreamError } from "@/server/errors";
import { renderWithLive } from "@/server/live-render";
import { pcm16ToWav, trimSilence, ttsToWav } from "@/server/wav";
import { isFaithfulReading } from "@/domain/reading";
import { ModelAudioRequestSchema } from "@/domain/contracts";

/**
 * Renders a shadowing model clip as WAV. By default the tutor's Gemini Live
 * voice reads it (so the voice you copy is the voice that teaches you); the
 * reading is checked against the script and retried once, then Gemini TTS is
 * used as a fallback. Clips are cached by the browser, so each is rendered once.
 */
export const maxDuration = 60;

/** Live gets at most this long in total (both attempts), leaving the rest of the 60 s for the TTS fallback. */
const LIVE_BUDGET_MS = 32_000;
/** A second Live attempt is only worth starting with at least this much of the budget left. */
const MIN_ATTEMPT_MS = 10_000;

function wavResponse(wav: Buffer, engine: string, model: string, fallback = false): Response {
  const headers: Record<string, string> = {
    "Content-Type": "audio/wav",
    "X-Voice-Engine": engine,
    "X-Voice-Model": model,
    "Cache-Control": "no-store",
  };
  // Tells the browser this clip is a stand-in (Live failed), so it must not be cached as the real reading.
  if (fallback) headers["X-Voice-Fallback"] = "1";
  return new Response(new Uint8Array(wav), { headers });
}

async function renderLive(text: string, voice: string): Promise<Buffer | null> {
  const deadline = Date.now() + LIVE_BUDGET_MS;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;
    try {
      const r = await renderWithLive(text, voice, LIVE_RENDER_MODEL, Math.min(25_000, remaining));
      if (isFaithfulReading(text, r.transcript)) return pcm16ToWav(trimSilence(r.pcm, r.sampleRate), r.sampleRate);
      console.warn("[model-audio] Live reading was not verbatim, retrying:", r.transcript.slice(0, 120));
    } catch (err) {
      console.warn("[model-audio] Live reading failed:", (err as Error).message?.slice(0, 200));
      if (err instanceof UpstreamError && err.status === 429) break;
    }
  }
  return null;
}

async function renderTts(spoken: string, voice: string): Promise<{ wav: Buffer; model: string }> {
  // Keep the style cue short: long pacing instructions make TTS models read several times slower.
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
      return { wav: ttsToWav(Buffer.from(data, "base64"), part?.inlineData?.mimeType ?? ""), model };
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
}

export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "model-audio", ...LIMITS.modelAudio }, ModelAudioRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const voice = resolveVoice(guarded.data.voice, TTS_VOICE);
    // Breath-mark pipes are for the learner's eyes; the voice pauses naturally at punctuation.
    const spoken = guarded.data.text.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();

    if (MODEL_AUDIO_ENGINE === "live") {
      const wav = await renderLive(spoken, voice);
      if (wav) return wavResponse(wav, "live", LIVE_RENDER_MODEL);
    }
    const { wav, model } = await renderTts(spoken, voice);
    return wavResponse(wav, "tts", model, MODEL_AUDIO_ENGINE === "live");
  } catch (err) {
    return handleRouteError("model-audio", err);
  }
}
