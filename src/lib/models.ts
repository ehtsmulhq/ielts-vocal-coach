/**
 * Central model configuration.
 *
 * Latency optimization:
 * - gemini-3.1-flash-live-preview: ~0.92s TTFB (3x faster response than 3.8-live)
 * - gemini-3.8-live: high reasoning capability, higher latency (~2.7s TTFB)
 * - gemini-2.5-flash-native-audio-latest: native audio model
 */
export const TEXT_MODELS: string[] = (
  process.env.TEXT_MODELS ?? "gemini-3.5-flash-lite,gemini-2.5-flash-lite,gemini-2.5-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export const LIVE_MODELS = [
  { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live (Ultra-Fast ~0.9s)", recommended: true },
  { id: "gemini-3.8-live", name: "Gemini 3.8 Live (Deep Reasoning)", recommended: false },
  { id: "gemini-2.5-flash-native-audio-latest", name: "Gemini 2.5 Flash Native Audio", recommended: false },
];

export const LIVE_MODEL = process.env.LIVE_MODEL ?? "gemini-3.1-flash-live-preview";
export const LIVE_VOICE = process.env.LIVE_VOICE ?? "Puck";

export const LIVE_VOICES = [
  { id: "Puck", name: "Puck (Upbeat British RP)", desc: "Clear articulation, encouraging coach" },
  { id: "Charon", name: "Charon (Deep Baritone)", desc: "Calm, authoritative examiner" },
  { id: "Kore", name: "Kore (Warm Female)", desc: "Gentle, measured therapist" },
  { id: "Fenrir", name: "Fenrir (Crisp Male)", desc: "Direct, confident vocal delivery" },
  { id: "Aoede", name: "Aoede (Lively Female)", desc: "Melodic, expressive pacing" },
  { id: "Zephyr", name: "Zephyr (Bright)", desc: "Crisp, high clarity projection" },
  { id: "Orion", name: "Orion (Rich Baritone)", desc: "Sophisticated cadence" },
];
