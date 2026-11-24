/**
 * Client-safe model and voice catalogue. Nothing here reads environment
 * variables; server-side overrides and allowlisting live in `src/server/config.ts`.
 *
 * Latency notes:
 * - gemini-3.1-flash-live-preview: ~0.9s time to first byte
 * - gemini-3.8-live: stronger reasoning, ~2.7s time to first byte
 */
export const LIVE_MODELS = [
  { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live (fastest, ~0.9s)", recommended: true },
  { id: "gemini-3.8-live", name: "Gemini 3.8 Live (deeper reasoning)", recommended: false },
  { id: "gemini-2.5-flash-native-audio-latest", name: "Gemini 2.5 Flash Native Audio", recommended: false },
] as const;

export const DEFAULT_LIVE_MODEL: string = LIVE_MODELS.find((m) => m.recommended)?.id ?? LIVE_MODELS[0].id;

/** Prebuilt Gemini voices. Accent comes from the prompt, not the voice name. */
export const LIVE_VOICES = [
  { id: "Puck", name: "Puck (upbeat)", desc: "Clear articulation, encouraging coach" },
  { id: "Charon", name: "Charon (deep)", desc: "Calm, authoritative examiner" },
  { id: "Kore", name: "Kore (warm)", desc: "Gentle, measured delivery" },
  { id: "Fenrir", name: "Fenrir (crisp)", desc: "Direct, confident delivery" },
  { id: "Aoede", name: "Aoede (lively)", desc: "Melodic, expressive pacing" },
  { id: "Zephyr", name: "Zephyr (bright)", desc: "Crisp, high clarity" },
  { id: "Orion", name: "Orion (rich)", desc: "Sophisticated cadence" },
] as const;

export const DEFAULT_VOICE = "Puck";

// Fastest first. The Gemini 2.5 models were retired for new users (404), so they are not listed.
export const DEFAULT_TEXT_MODELS = "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.5-flash";
export const DEFAULT_TTS_MODELS = "gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-3.8-flash-lite-tts";
