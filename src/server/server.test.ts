import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkRateLimit, guardJson, isAllowedOrigin } from "./guard";
import { extractPcm, pcm16ToWav, trimSilence, ttsToWav } from "./wav";
import { resolveLiveModel, resolveVoice } from "./config";
import { isRetryable } from "./gemini";
import { ApiError } from "@google/genai";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/x", {
    method: "POST",
    headers: { host: "localhost:3000", "content-type": "application/json", ...headers },
    body,
  });

describe("rate limiting", () => {
  it("allows up to the limit per window, then reports retry time", () => {
    const store = new Map();
    const limit = { max: 2, windowMs: 10_000 };
    expect(checkRateLimit("k", limit, 0, store)).toEqual({ ok: true });
    expect(checkRateLimit("k", limit, 1, store)).toEqual({ ok: true });
    expect(checkRateLimit("k", limit, 2_000, store)).toEqual({ ok: false, retryAfterSec: 8 });
    expect(checkRateLimit("other", limit, 2_000, store)).toEqual({ ok: true });
    expect(checkRateLimit("k", limit, 10_001, store)).toEqual({ ok: true });
  });
});

describe("origin check", () => {
  it("allows same-origin and missing Origin, blocks other sites", () => {
    expect(isAllowedOrigin(post("{}", { origin: "http://localhost:3000" }))).toBe(true);
    expect(isAllowedOrigin(post("{}"))).toBe(true);
    expect(isAllowedOrigin(post("{}", { origin: "https://evil.example" }))).toBe(false);
    expect(isAllowedOrigin(post("{}", { origin: "https://staging.example" }), ["https://staging.example"])).toBe(true);
  });
});

describe("guardJson", () => {
  const schema = z.object({ text: z.string().min(1) });
  const opts = (route: string) => ({ route, maxBytes: 100, rateLimit: { max: 100, windowMs: 60_000 } });

  it("returns validated data", async () => {
    const res = await guardJson(post('{"text":"hi"}'), opts("ok"), schema);
    expect(res).toEqual({ ok: true, data: { text: "hi" } });
  });

  it("rejects oversized bodies with 413", async () => {
    const res = await guardJson(post(JSON.stringify({ text: "x".repeat(200) })), opts("big"), schema);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(413);
  });

  it("rejects invalid JSON and schema violations with a structured 400", async () => {
    const bad = await guardJson(post("{oops"), opts("bad"), schema);
    expect(!bad.ok && bad.response.status).toBe(400);
    const invalid = await guardJson(post('{"text":""}'), opts("invalid"), schema);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      const body = await invalid.response.json();
      expect(body.error.code).toBe("bad_request");
      expect(body.error.message).toMatch(/text/);
    }
  });

  it("rejects cross-site requests with 403 and floods with 429", async () => {
    const cross = await guardJson(post('{"text":"hi"}', { origin: "https://evil.example" }), opts("x"), schema);
    expect(!cross.ok && cross.response.status).toBe(403);

    const tight = { route: "tight", maxBytes: 100, rateLimit: { max: 1, windowMs: 60_000 } };
    await guardJson(post('{"text":"hi"}', { "x-forwarded-for": "9.9.9.9" }), tight, schema);
    const second = await guardJson(post('{"text":"hi"}', { "x-forwarded-for": "9.9.9.9" }), tight, schema);
    expect(!second.ok && second.response.status).toBe(429);
    if (!second.ok) expect(second.response.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("config allowlists", () => {
  it("only accepts known voices and live models", () => {
    expect(resolveVoice("Kore")).toBe("Kore");
    expect(resolveVoice("NotAVoice")).toBe("Puck");
    expect(resolveVoice(undefined, "Charon")).toBe("Charon");
    expect(resolveLiveModel("gemini-3.8-live")).toBe("gemini-3.8-live");
    expect(resolveLiveModel("some-expensive-model")).not.toBe("some-expensive-model");
  });
});

describe("model fallback policy", () => {
  it("retries on rate limits, server errors and unknown models, not on bad requests", () => {
    expect(isRetryable(new ApiError({ message: "rate", status: 429 }))).toBe(true);
    expect(isRetryable(new ApiError({ message: "down", status: 503 }))).toBe(true);
    expect(isRetryable(new ApiError({ message: "no model", status: 404 }))).toBe(true);
    expect(isRetryable(new ApiError({ message: "bad", status: 400 }))).toBe(false);
    expect(isRetryable(new ApiError({ message: "key", status: 403 }))).toBe(false);
    expect(isRetryable(new Error("network"))).toBe(true);
  });
});

describe("wav helpers", () => {
  const tone = (samples: number, amp: number) => {
    const b = Buffer.alloc(samples * 2);
    for (let i = 0; i < samples; i++) b.writeInt16LE(i % 2 ? amp : -amp, i * 2);
    return b;
  };

  it("writes a valid single header", () => {
    const wav = pcm16ToWav(tone(10, 1000), 24000);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.length).toBe(44 + 20);
  });

  it("unwraps WAV input instead of double-wrapping it", () => {
    const inner = pcm16ToWav(tone(100, 5000), 16000);
    const { pcm, sampleRate } = extractPcm(inner, "audio/wav");
    expect(sampleRate).toBe(16000);
    expect(pcm.length).toBe(200);
    const out = ttsToWav(inner, "audio/wav");
    expect(out.toString("ascii", 0, 4)).toBe("RIFF");
    expect(out.indexOf("RIFF", 4)).toBe(-1);
  });

  it("reads the sample rate from raw PCM MIME types", () => {
    expect(extractPcm(tone(4, 1), "audio/L16;rate=22050").sampleRate).toBe(22050);
  });

  it("trims long silences but keeps a short pad", () => {
    const rate = 1000;
    const pcm = Buffer.concat([tone(1000, 0), tone(500, 8000), tone(1000, 0)]);
    const trimmed = trimSilence(pcm, rate);
    const keptSamples = trimmed.length / 2;
    expect(keptSamples).toBeGreaterThanOrEqual(500);
    expect(keptSamples).toBeLessThanOrEqual(500 + 2 * 150 + 2);
  });
});
