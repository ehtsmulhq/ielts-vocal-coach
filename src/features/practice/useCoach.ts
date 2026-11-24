"use client";

import { useCallback, useState } from "react";
import type { ScriptItem } from "@/domain/contracts";
import { MirrorCoachResponseSchema, type MirrorCoachResponse } from "@/domain/contracts";
import type { Attempt } from "@/domain/attempt";
import { postJson } from "@/lib/api-client";
import { blobToBase64, getModelAudio } from "@/lib/model-audio";
import { logRepetitionCompleted } from "@/lib/master-script";
import { getPreviousAttempt, recordAttempt } from "@/storage/attempts";
import type { Take } from "./useRecorder";
import { getPreferencesSnapshot } from "@/storage/preferences";

export interface CoachResult {
  analysis: MirrorCoachResponse;
  attempt: Attempt | null;
  previous: Attempt | null;
}

/**
 * Sends a take (plus the RP reference clip) to the coach, then records the
 * attempt and the rep so progress and before/after comparisons stay current.
 */
export function useCoach() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoachResult | null>(null);

  const analyze = useCallback(async (script: ScriptItem, take: Take, targetBand: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const audioBase64 = take.blob.size > 200 ? await blobToBase64(take.blob) : undefined;
      let modelAudioBase64: string | undefined;
      if (audioBase64) {
        try {
          modelAudioBase64 = await blobToBase64(await getModelAudio(script.upgradedScript, getPreferencesSnapshot().modelVoice));
        } catch {
          // Without the reference clip the coach still scores words and pacing.
        }
      }

      const analysis = await postJson(
        "/api/mirror-coach",
        {
          targetScript: script.upgradedScript,
          candidateSpokenText: take.transcript,
          audioBase64,
          audioMimeType: take.mimeType || "audio/webm",
          modelAudioBase64,
          modelAudioMimeType: "audio/wav",
          targetCollocations: script.targetCollocations,
          thoughtChunks: script.thoughtChunks,
          durationSeconds: Math.max(1, take.seconds),
          category: script.category,
          targetBand,
        },
        { schema: MirrorCoachResponseSchema, fallbackError: "The coach could not analyse that take. Please try again." }
      );

      let attempt: Attempt | null = null;
      let previous: Attempt | null = null;
      if (analysis.accuracyScore > 0) {
        logRepetitionCompleted(script.id, analysis.accent?.overall ?? analysis.accuracyScore);
        attempt = recordAttempt({
          scriptId: script.id,
          accuracy: analysis.accuracyScore,
          wpm: analysis.actualWpm,
          accent: analysis.accent && {
            overall: analysis.accent.overall,
            stress: analysis.accent.stress,
            rhythm: analysis.accent.rhythm,
            intonation: analysis.accent.intonation,
            sounds: analysis.accent.sounds,
          },
          focusTip: analysis.accent?.focusTip?.slice(0, 300) || undefined,
        });
        previous = getPreviousAttempt(attempt.id) ?? null;
      }
      const next = { analysis, attempt, previous };
      setResult(next);
      return next;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isAnalyzing, error, result, analyze, reset };
}
