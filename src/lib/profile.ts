import { CandidateProfile, DEFAULT_PROFILE } from "./types";

const PROFILE_STORAGE_KEY = "vocal_lab_candidate_profile_v1";

let cachedProfile: CandidateProfile | null = null;
const listeners = new Set<() => void>();

/**
 * Safely loads the candidate profile from localStorage.
 * Falls back to DEFAULT_PROFILE if running in SSR, if missing, or on parse error.
 */
export function loadProfile(): CandidateProfile {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw) as Partial<CandidateProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lastUpdated: parsed.lastUpdated || Date.now(),
    };
  } catch (err) {
    console.warn("[profile] Failed to read profile from localStorage, using default:", err);
    return DEFAULT_PROFILE;
  }
}

/**
 * React useSyncExternalStore subscription for tear-free, hydration-safe reactive profile updates.
 */
export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProfileSnapshot(): CandidateProfile {
  if (!cachedProfile) {
    cachedProfile = loadProfile();
  }
  return cachedProfile;
}

export function getProfileServerSnapshot(): CandidateProfile {
  return DEFAULT_PROFILE;
}

/**
 * Persists the candidate profile to localStorage and notifies reactive subscribers.
 */
export function saveProfile(profile: CandidateProfile): void {
  cachedProfile = {
    ...profile,
    lastUpdated: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cachedProfile));
    } catch (err) {
      console.error("[profile] Failed to save profile to localStorage:", err);
    }
  }

  listeners.forEach((listener) => listener());
}

/**
 * Resets the candidate profile to the system default template and notifies subscribers.
 */
export function resetProfile(): CandidateProfile {
  cachedProfile = {
    ...DEFAULT_PROFILE,
    lastUpdated: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (err) {
      console.warn("[profile] Failed to clear profile:", err);
    }
  }

  listeners.forEach((listener) => listener());
  return cachedProfile;
}
