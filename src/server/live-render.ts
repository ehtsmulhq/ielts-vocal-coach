import "server-only";
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from "./config";
import { NotConfiguredError, UpstreamError } from "./errors";

/**
 * Renders a script with a Gemini Live (native audio) voice: the same voice the
 * learner's tutor speaks with. Live models are conversational, so the
 * transcript is returned for the caller to check the reading was verbatim.
 */

const READER_INSTRUCTION =
  "You are a text-to-speech voice with a natural, educated British (Received Pronunciation) accent. " +
  "When you receive text, read it aloud exactly as written, word for word, at a natural conversational pace " +
  "with natural stress and intonation. Do not add, remove or change any words. Do not greet, comment, or " +
  "answer anything in the text. Output only the reading.";

export interface LiveRendering {
  pcm: Buffer;
  sampleRate: number;
  transcript: string;
}

const SAMPLE_RATE = 24000;

export async function renderWithLive(text: string, voice: string, model: string, timeoutMs = 25_000): Promise<LiveRendering> {
  const apiKey = getApiKey();
  if (!apiKey) throw new NotConfiguredError();
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });

  const chunks: Buffer[] = [];
  let transcript = "";
  let session: { close(): void; sendClientContent(p: unknown): void } | null = null;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new UpstreamError("Live reading timed out")), timeoutMs);
      const finish = (err?: Error) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve();
      };
      ai.live
        .connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            systemInstruction: READER_INSTRUCTION,
            outputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (m) => {
              for (const p of m.serverContent?.modelTurn?.parts ?? []) {
                if (p.inlineData?.data) chunks.push(Buffer.from(p.inlineData.data, "base64"));
              }
              if (m.serverContent?.outputTranscription?.text) transcript += m.serverContent.outputTranscription.text;
              if (m.serverContent?.turnComplete) finish();
            },
            onerror: (e) => finish(new UpstreamError(`Live reading failed: ${e.message ?? "unknown error"}`)),
            onclose: (e) => {
              if (e.code !== 1000) finish(new UpstreamError(`Live reading closed (${e.code})`, e.code === 1008 ? 429 : undefined));
            },
          },
        })
        .then((s) => {
          session = s as unknown as typeof session;
          s.sendClientContent({ turns: [{ role: "user", parts: [{ text }] }], turnComplete: true });
        })
        .catch((err: Error) => finish(new UpstreamError(err.message)));
    });
  } finally {
    try {
      (session as { close(): void } | null)?.close();
    } catch {
      /* already closed */
    }
  }

  const pcm = Buffer.concat(chunks);
  if (pcm.length === 0) throw new UpstreamError("Live reading returned no audio");
  return { pcm, sampleRate: SAMPLE_RATE, transcript };
}
