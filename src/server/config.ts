import "server-only";
import {
  DEFAULT_LIVE_MODEL,
  DEFAULT_TEXT_MODELS,
  DEFAULT_TTS_MODELS,
  DEFAULT_VOICE,
  LIVE_MODELS,
  LIVE_VOICES,
} from "@/lib/models";

/**
 * Server configuration read once from the environment. Client-supplied model and
 * voice names are never trusted directly: they are checked against these allowlists.
 */

function list(value: string | undefined, fallback: string): string[] {
  return (value?.trim() ? value : fallback)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

const VOICE_IDS = new Set<string>(LIVE_VOICES.map((v) => v.id));

function validVoice(v: string | undefined): string | undefined {
  return v && VOICE_IDS.has(v) ? v : undefined;
}

export const TEXT_MODELS = list(process.env.TEXT_MODELS, DEFAULT_TEXT_MODELS);
export const TTS_MODELS = list(process.env.TTS_MODELS, DEFAULT_TTS_MODELS);
export const TTS_VOICE = validVoice(process.env.TTS_VOICE) ?? DEFAULT_VOICE;
export const LIVE_VOICE = validVoice(process.env.LIVE_VOICE) ?? DEFAULT_VOICE;
export const LIVE_MODEL = process.env.LIVE_MODEL?.trim() || DEFAULT_LIVE_MODEL;

/** The operator's LIVE_MODEL override is allowed alongside the built-in catalogue. */
const LIVE_MODEL_IDS = new Set<string>([...LIVE_MODELS.map((m) => m.id), LIVE_MODEL]);

/** Extra origins allowed to call the API (comma-separated), e.g. a staging domain. */
export const ALLOWED_ORIGINS = list(process.env.ALLOWED_ORIGINS, "");

export function resolveVoice(requested: string | undefined, fallback = DEFAULT_VOICE): string {
  return validVoice(requested) ?? fallback;
}

export function resolveLiveModel(requested: string | undefined): string {
  return requested && LIVE_MODEL_IDS.has(requested) ? requested : LIVE_MODEL;
}

export function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}
