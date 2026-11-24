import { CandidateProfile, DEFAULT_PROFILE } from "./types";
import { createStore } from "@/storage/store";
import { STORAGE_KEYS } from "@/storage/registry";

/** Merges any stored profile (legacy raw = v0, or envelope v1) onto the defaults. */
export function migrateProfile(data: unknown): CandidateProfile {
  const partial = typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Partial<CandidateProfile>) : {};
  return { ...DEFAULT_PROFILE, ...partial };
}

const profileStore = createStore<CandidateProfile>({
  key: STORAGE_KEYS.profile,
  version: 1,
  fallback: () => DEFAULT_PROFILE,
  migrate: (data) => migrateProfile(data),
});

export const subscribeProfile = profileStore.subscribe;
export const getProfileSnapshot = profileStore.get;
export const getProfileServerSnapshot = profileStore.getServerSnapshot;

/** Persists the profile and notifies subscribers. */
export function saveProfile(profile: CandidateProfile): void {
  profileStore.set({ ...profile, lastUpdated: Date.now() });
}

/** Removes the stored profile and returns to the defaults. */
export function resetProfile(): CandidateProfile {
  profileStore.reset();
  return profileStore.get();
}
