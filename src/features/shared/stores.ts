"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeMasterScript,
  getMasterScriptSnapshot,
  getMasterScriptServerSnapshot,
} from "@/lib/master-script";
import { subscribeProfile, getProfileSnapshot, getProfileServerSnapshot } from "@/lib/profile";
import { subscribeTestHistory, getTestHistorySnapshot, getTestHistoryServerSnapshot } from "@/lib/test-history";
import { subscribeAttempts, getAttemptsSnapshot, getAttemptsServerSnapshot } from "@/storage/attempts";
import {
  subscribePreferences,
  getPreferencesSnapshot,
  getPreferencesServerSnapshot,
} from "@/storage/preferences";

/** React bindings for the local-first stores. */

export function useScriptVault() {
  return useSyncExternalStore(subscribeMasterScript, getMasterScriptSnapshot, getMasterScriptServerSnapshot);
}

export function useProfile() {
  return useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileServerSnapshot);
}

export function useTestHistory() {
  return useSyncExternalStore(subscribeTestHistory, getTestHistorySnapshot, getTestHistoryServerSnapshot);
}

/** True once the learner has captured at least one interview (so "mine" holds their own scripts). */
export function useHasCaptured(): boolean {
  return useTestHistory().length > 0;
}

export function useAttempts() {
  return useSyncExternalStore(subscribeAttempts, getAttemptsSnapshot, getAttemptsServerSnapshot);
}

export function usePreferences() {
  return useSyncExternalStore(subscribePreferences, getPreferencesSnapshot, getPreferencesServerSnapshot);
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards: for UI that depends on local data. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
