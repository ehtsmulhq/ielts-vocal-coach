import "server-only";
import { GoogleGenAI, ApiError } from "@google/genai";
import type { z } from "zod";
import { safeParseJson } from "@/domain/json";
import { TEXT_MODELS, getApiKey } from "./config";
import { NotConfiguredError, UpstreamError } from "./errors";

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) throw new NotConfiguredError();
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Whether to try the next model. Rate limits, server errors, timeouts, an
 * unknown model id, network failures and unparseable output are worth retrying
 * elsewhere; a 400/401/403 means the request itself is wrong, so fail fast.
 */
export function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return [404, 408, 429].includes(err.status) || err.status >= 500;
  return true;
}

/**
 * - `scoring`: grading and coaching. Low temperature and a fixed instruction so
 *   the same take gets a consistent score.
 * - `creative`: content generation. Higher temperature and a random seed so
 *   lessons and scripts vary.
 */
export type GenerationMode = "scoring" | "creative";

const MODE_CONFIG: Record<GenerationMode, { temperature: number; systemInstruction: () => string }> = {
  scoring: {
    temperature: 0.2,
    systemInstruction: () =>
      "You are a precise, encouraging British English pronunciation coach and IELTS Speaking examiner. Score consistently and only from the evidence given.",
  },
  creative: {
    temperature: 1.0,
    systemInstruction: () =>
      `You are an imaginative English speaking coach. Produce varied, natural content. Seed: ${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
  },
};

export interface GenerateJsonOptions<T> {
  /** A prompt string or multimodal content parts. */
  contents: string | unknown[];
  /** JSON Schema passed to Gemini as `responseJsonSchema`. */
  schema: object;
  mode: GenerationMode;
  systemInstruction?: string;
  /** Optional runtime check; output that fails it is treated as a bad model response. */
  validate?: z.ZodType<T>;
  models?: readonly string[];
}

/** Generates structured JSON, falling back across configured models on retryable failures. */
export async function generateJson<T>(opts: GenerateJsonOptions<T>): Promise<{ data: T; model: string }> {
  const ai = getClient();
  const mode = MODE_CONFIG[opts.mode];
  const models = opts.models ?? TEXT_MODELS;
  let lastError: unknown;

  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        // The SDK accepts strings and part arrays; the union is wider than its exported type.
        contents: opts.contents as Parameters<typeof ai.models.generateContent>[0]["contents"],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: opts.schema,
          temperature: mode.temperature,
          systemInstruction: opts.systemInstruction ?? mode.systemInstruction(),
        },
      });
      if (!res.text) throw new Error("Empty response");
      const raw = safeParseJson<unknown>(res.text);
      if (opts.validate) {
        const checked = opts.validate.safeParse(raw);
        if (!checked.success) throw new Error(`Response failed validation: ${checked.error.issues[0]?.message}`);
        return { data: checked.data, model };
      }
      return { data: raw as T, model };
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] ${model} failed:`, (err as Error).message?.slice(0, 200));
      if (!isRetryable(err)) break;
    }
  }

  const status = lastError instanceof ApiError ? lastError.status : undefined;
  throw new UpstreamError(lastError instanceof Error ? lastError.message : "All models failed", status);
}
