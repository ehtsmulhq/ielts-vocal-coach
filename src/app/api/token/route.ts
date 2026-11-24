import { GoogleGenAI } from "@google/genai";
import { LIVE_VOICE, getApiKey, resolveLiveModel, resolveVoice } from "@/server/config";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError, NotConfiguredError } from "@/server/errors";
import { TokenRequestSchema } from "@/domain/contracts";

/**
 * Issues a single-use ephemeral token so the browser can open a Live API
 * WebSocket without ever seeing the real API key. Model and voice are
 * allowlisted server-side; anything else falls back to the configured default.
 */
export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "token", ...LIMITS.token }, TokenRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new NotConfiguredError();
    const model = resolveLiveModel(guarded.data.model);
    const voice = resolveVoice(guarded.data.voice, LIVE_VOICE);

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
    return Response.json({ token: token.name, model, voice });
  } catch (err) {
    return handleRouteError("token", err);
  }
}
