"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getModelAudio } from "@/lib/model-audio";
import { SpeechEngine } from "@/lib/speech-engine";
import { getPreferencesSnapshot } from "@/storage/preferences";

/**
 * Plays the British RP model clip (Gemini TTS, cached), local takes, and
 * falls back to the browser's speech voice when TTS is unavailable.
 */
export function useModelPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallbackVoice, setUsingFallbackVoice] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const doneRef = useRef<(() => void) | null>(null);
  const speechRef = useRef<SpeechEngine | null>(null);

  const speech = useCallback(() => {
    speechRef.current ??= new SpeechEngine({ onCoachSpeaking: (on) => setIsPlaying(on) });
    return speechRef.current;
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    doneRef.current?.();
    doneRef.current = null;
    speechRef.current?.stopSpeaking();
    setIsPlaying(false);
  }, []);

  /** Plays a URL and resolves when it ends or is stopped. */
  const playUrl = useCallback(
    (url: string, rate = 1, revokeAfter = false) =>
      new Promise<void>((resolve) => {
        stop();
        const audio = new Audio(url);
        audio.playbackRate = rate;
        audioRef.current = audio;
        setIsPlaying(true);
        const done = () => {
          if (revokeAfter) URL.revokeObjectURL(url);
          if (audioRef.current === audio) {
            audioRef.current = null;
            setIsPlaying(false);
          }
          doneRef.current = null;
          resolve();
        };
        doneRef.current = done;
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      }),
    [stop]
  );

  /** Speaks text in the browser voice (coach comments, fallback model). */
  const speak = useCallback(
    (text: string, rate = 1) => {
      stop();
      speech().speak(text, { rate });
    },
    [speech, stop]
  );

  /**
   * Plays the RP model reading `text`. Returns roughly how long playback took,
   * which the shadow loop uses to size the learner's turn.
   */
  const playModel = useCallback(
    async (text: string, rate: number): Promise<{ ok: boolean; ms: number }> => {
      try {
        setIsLoading(true);
        const blob = await getModelAudio(text, getPreferencesSnapshot().modelVoice);
        setIsLoading(false);
        setUsingFallbackVoice(false);
        const started = performance.now();
        await playUrl(URL.createObjectURL(blob), rate, true);
        return { ok: true, ms: performance.now() - started };
      } catch (err) {
        setIsLoading(false);
        console.warn("[practice] Model audio unavailable, using browser voice:", err);
        setUsingFallbackVoice(true);
        speak(text, rate);
        return { ok: false, ms: (text.split(/\s+/).length * 420) / rate };
      }
    },
    [playUrl, speak]
  );

  useEffect(
    () => () => {
      audioRef.current?.pause();
      speechRef.current?.cleanup();
    },
    []
  );

  return { isPlaying, isLoading, usingFallbackVoice, playModel, playUrl, speak, stop };
}

export type ModelPlayer = ReturnType<typeof useModelPlayer>;
