import "server-only";
import { GoogleGenAI } from "@google/genai";
import { TEXT_MODELS } from "./models";

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Safely extracts and parses JSON from model responses, handling markdown
 * fences (```json ... ```), leading/trailing conversational text, and syntax quirks.
 */
export function safeParseJson<T>(raw: string): T {
  let text = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  // Attempt direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // If direct parse failed, isolate the outermost JSON structure ({ ... } or [ ... ])
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = text.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = text.lastIndexOf("]");
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const extracted = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch {
        // Strip trailing commas before closing braces/brackets and clean stray non-printable controls
        const sanitized = extracted
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
        return JSON.parse(sanitized) as T;
      }
    }

    throw new Error(`Failed to parse structured JSON from model response: ${text.slice(0, 150)}...`);
  }
}

/**
 * Generates structured JSON, trying each free-tier text model in order so a
 * rate-limited (429) or unavailable model doesn't break the app.
 */
export async function generateJson<T>(prompt: string, schema: object): Promise<{ data: T; model: string }> {
  const ai = getClient();
  let lastError: unknown;
  for (const model of TEXT_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          temperature: 1.15,
          systemInstruction: `You are an imaginative vocal coach. Always produce distinct, varied topics, prose, and vocabulary. Seed: ${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        },
      });
      if (!res.text) throw new Error("Empty response");
      return { data: safeParseJson<T>(res.text), model };
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] ${model} failed, trying next model:`, (err as Error).message?.slice(0, 200));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All text models failed");
}
