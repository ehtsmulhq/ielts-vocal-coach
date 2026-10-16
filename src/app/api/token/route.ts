import { GoogleGenAI } from "@google/genai";
import { LIVE_MODEL, LIVE_VOICE } from "@/lib/models";

/**
 * Issues a single-use ephemeral token so the browser can open a Live API
 * WebSocket without ever seeing the real API key.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { model?: string; voice?: string };
    const chosenModel = body.model?.trim() || LIVE_MODEL;
    const chosenVoice = body.voice?.trim() || LIVE_VOICE;

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    return Response.json({ token: token.name, model: chosenModel, voice: chosenVoice });
  } catch (err) {
    console.error("[api/token]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
