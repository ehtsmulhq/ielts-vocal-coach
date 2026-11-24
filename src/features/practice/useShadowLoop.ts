"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordFor, waitMs } from "./audio";
import type { ModelPlayer } from "./useModelPlayer";

/**
 * Phrase-by-phrase shadowing: the model speaks a breath group, then the
 * learner's mic opens for about as long (plus a margin) to repeat it.
 * Each repeat is kept in memory (never stored) for A/B playback.
 */
export function useShadowLoop(chunks: string[], player: ModelPlayer, rate: number) {
  const [running, setRunning] = useState(false);
  const [activeChunk, setActiveChunk] = useState(-1);
  const [turnActive, setTurnActive] = useState(false);
  const [takes, setTakes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef(false);
  const runningRef = useRef(false);
  const takesRef = useRef<Record<number, string>>({});

  const stop = useCallback(() => {
    abortRef.current = true;
    player.stop();
  }, [player]);

  const run = useCallback(
    async (startAt = 0, onlyOne = false) => {
      if (runningRef.current) return;
      runningRef.current = true;
      abortRef.current = false;
      setError(null);
      setRunning(true);
      try {
        for (let i = startAt; i < chunks.length; i++) {
          if (abortRef.current) break;
          setActiveChunk(i);
          const { ok, ms } = await player.playModel(chunks[i], rate);
          // The browser-voice fallback returns before it has finished speaking: wait it out so the
          // mic doesn't record the model.
          if (!ok) await waitMs(ms, () => abortRef.current);
          if (abortRef.current) break;
          setTurnActive(true);
          const blob = await recordFor(Math.max(1500, ms * 1.25 + 600), () => abortRef.current);
          setTurnActive(false);
          if (blob) {
            const old = takesRef.current[i];
            if (old) URL.revokeObjectURL(old);
            takesRef.current = { ...takesRef.current, [i]: URL.createObjectURL(blob) };
            setTakes(takesRef.current);
          }
          if (onlyOne) break;
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        runningRef.current = false;
        setTurnActive(false);
        setActiveChunk(-1);
        setRunning(false);
      }
    },
    [chunks, player, rate]
  );

  useEffect(
    () => () => {
      abortRef.current = true;
      Object.values(takesRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  return { running, activeChunk, turnActive, takes, error, run, stop };
}
