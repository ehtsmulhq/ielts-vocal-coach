import { getClient } from "@/lib/gemini";
import { TTS_MODELS, TTS_VOICE } from "@/lib/models";

/**
 * Renders a shadowing model clip with Gemini TTS and returns it as a WAV file.
 * Body: { text: string; voice?: string }
 */

const SAMPLE_RATE = 24000;

function pcm16ToWav(pcm: Buffer, sampleRate = SAMPLE_RATE): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Trims leading/trailing near-silence (keeps a short pad) so shadowing turns aren't stretched. */
function trimSilence(pcm: Buffer, sampleRate: number): Buffer {
  const samples = Math.floor(pcm.length / 2);
  const threshold = 600; // ~1.8% of full scale
  let first = 0;
  while (first < samples && Math.abs(pcm.readInt16LE(first * 2)) < threshold) first++;
  let last = samples - 1;
  while (last > first && Math.abs(pcm.readInt16LE(last * 2)) < threshold) last--;
  if (first >= last) return pcm;
  const pad = Math.floor(sampleRate * 0.15);
  const start = Math.max(0, first - pad);
  const end = Math.min(samples, last + pad);
  return pcm.subarray(start * 2, end * 2);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { text?: string; voice?: string };
    const text = body.text?.trim();
    if (!text) return Response.json({ error: "text is required" }, { status: 400 });
    if (text.length > 4000) return Response.json({ error: "text too long" }, { status: 400 });
    const voice = body.voice?.trim() || TTS_VOICE;

    const ai = getClient();
    // Strip breath-mark pipes so they are not read aloud; the model pauses naturally at punctuation.
    const spoken = text.replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
    // Keep the style cue short: long pacing instructions make the TTS model read several times slower.
    const prompt = `Say in a British accent at a brisk, natural conversational speed: ${spoken}`;

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
        const mime = part?.inlineData?.mimeType ?? "";
        const raw = Buffer.from(data, "base64");
        // Some TTS models return a complete WAV, others raw 16-bit PCM. Normalise to PCM first.
        let pcm = raw;
        let rate = Number(/rate=(\d+)/.exec(mime)?.[1]) || SAMPLE_RATE;
        if (raw.length > 44 && raw.toString("ascii", 0, 4) === "RIFF") {
          const dataAt = raw.indexOf("data", 12, "ascii");
          if (dataAt < 0) throw new Error("Malformed WAV from TTS");
          rate = raw.readUInt32LE(24) || rate;
          pcm = raw.subarray(dataAt + 8);
        }
        const wav = pcm16ToWav(trimSilence(pcm, rate), rate);
        return new Response(new Uint8Array(wav), {
          headers: { "Content-Type": "audio/wav", "X-TTS-Model": model, "Cache-Control": "no-store" },
        });
      } catch (err) {
        lastError = err;
        console.warn(`[model-audio] ${model} failed:`, (err as Error).message?.slice(0, 200));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("All TTS models failed");
  } catch (err) {
    console.error("[api/model-audio]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
