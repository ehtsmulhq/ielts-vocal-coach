/**
 * Single source of truth for every key the app persists in the browser.
 * Anything that reads, writes, exports or wipes user data goes through these names.
 */
export const STORAGE_KEYS = {
  profile: "vocal_lab_candidate_profile_v1",
  scriptVault: "vocal_lab_master_script_v2",
  testHistory: "vocal_lab_test_history_v2",
  attempts: "vocal_lab_attempts_v1",
  preferences: "vocal_lab_preferences_v1",
  capture: "vocal_lab_capture_v1",
  lessons: "vocal_lab_lessons_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Per-tab session storage: the live coach lesson (resume handle and chat), so a
 * reload carries on the same conversation. Not exported in backups.
 */
export const SESSION_KEYS = {
  coachLesson: "vocal_lab_coach_lesson_v1",
  /** Today's coach greeting, so it stays the same while the learner browses this session. */
  coachGreeting: "vocal_lab_coach_greeting_v1",
} as const;

/** Keys from earlier app versions. They are removed on startup and never read. */
export const LEGACY_KEYS = ["vocal_lab_master_script_v1", "vocal_lab_history", "vocal_lab_app_version"] as const;

/** IndexedDB database holding cached RP model clips (regenerable, so not exported). */
export const AUDIO_CACHE_DB = "vocal_lab_model_audio_v1";
