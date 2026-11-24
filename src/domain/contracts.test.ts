import { describe, expect, it } from "vitest";
import {
  MirrorCoachRequestSchema,
  MirrorCoachResponseSchema,
  ModelAudioRequestSchema,
  ScriptItemSchema,
  toGeminiSchema,
} from "./contracts";
import { SHADOWING_LIBRARY } from "@/lib/shadowing-library";

describe("contracts", () => {
  it("applies request defaults and rejects non-audio MIME types", () => {
    const parsed = MirrorCoachRequestSchema.parse({ targetScript: "Hello there." });
    expect(parsed.audioMimeType).toBe("audio/webm");
    expect(parsed.targetCollocations).toEqual([]);
    expect(MirrorCoachRequestSchema.safeParse({ targetScript: "x", audioMimeType: "text/html" }).success).toBe(false);
    expect(MirrorCoachRequestSchema.safeParse({ targetScript: "x", audioBase64: "not base64!" }).success).toBe(false);
  });

  it("caps model-audio text", () => {
    expect(ModelAudioRequestSchema.safeParse({ text: "   " }).success).toBe(false);
    expect(ModelAudioRequestSchema.safeParse({ text: "x".repeat(4001) }).success).toBe(false);
  });

  it("every built-in script satisfies the shared ScriptItem contract", () => {
    for (const item of SHADOWING_LIBRARY) {
      const res = ScriptItemSchema.safeParse(item);
      expect(res.success, `${item.id}: ${res.error?.issues[0]?.message}`).toBe(true);
    }
  });

  it("derives a Gemini response schema without the $schema marker", () => {
    const json = toGeminiSchema(MirrorCoachResponseSchema) as Record<string, unknown>;
    expect(json.$schema).toBeUndefined();
    expect(json.type).toBe("object");
    expect(json.required).toEqual(expect.arrayContaining(["accuracyScore", "mistakes"]));
  });
});
