"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/api-client";
import { GreetingResponseSchema, type GreetingRequest } from "@/domain/contracts";
import { SESSION_KEYS } from "@/storage/registry";

/** How long the coach "types" before the built-in greeting is shown instead. */
export const GREETING_WAIT_MS = 3000;

interface Cached {
  key: string;
  text: string;
}

function readCache(key: string): string | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(SESSION_KEYS.coachGreeting) ?? "null") as Cached | null;
    return v && v.key === key && typeof v.text === "string" ? v.text : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, text: string) {
  try {
    sessionStorage.setItem(SESSION_KEYS.coachGreeting, JSON.stringify({ key, text }));
  } catch {
    /* storage blocked: the greeting is simply written again next visit */
  }
}

/**
 * The coach's greeting on Today, written by the AI from the learner's
 * situation. While it loads the coach is "typing"; if it takes longer than a
 * few seconds (or fails) the built-in greeting is shown, and a late answer
 * never replaces text the learner is already reading. A greeting is kept for
 * the rest of the browser session until the learner practises again
 * (`cacheKey` changes).
 */
export function useCoachGreeting(opts: {
  ready: boolean;
  cacheKey: string;
  request: () => GreetingRequest;
  /** The built-in greeting, built only if it's needed. */
  fallback: () => string;
}): { text: string; loading: boolean } {
  const [result, setResult] = useState<{ key: string; text: string | null }>({ key: "", text: null });
  const latest = useRef(opts);
  useEffect(() => {
    latest.current = opts;
  });

  const { ready, cacheKey } = opts;
  useEffect(() => {
    if (!ready) return;
    const cached = readCache(cacheKey);
    if (cached) {
      const t = setTimeout(() => setResult({ key: cacheKey, text: cached }), 0);
      return () => clearTimeout(t);
    }

    const controller = new AbortController();
    let shown = false;
    const show = (text: string) => {
      if (shown) return;
      shown = true;
      setResult({ key: cacheKey, text });
    };
    const timer = setTimeout(() => show(latest.current.fallback()), GREETING_WAIT_MS);
    postJson("/api/greeting", latest.current.request(), { schema: GreetingResponseSchema, signal: controller.signal })
      .then(({ text }) => {
        // Kept for next time even if it arrived late, so the next visit this session is personal.
        writeCache(cacheKey, text);
        show(text);
      })
      .catch(() => show(latest.current.fallback()))
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, cacheKey]);

  const settled = result.key === cacheKey ? result.text : null;
  return { text: settled ?? "", loading: ready && settled === null };
}
