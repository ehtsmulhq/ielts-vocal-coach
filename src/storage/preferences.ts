import { createStore } from "./store";
import { STORAGE_KEYS } from "./registry";
import { DEFAULT_TUTOR_ID, getTutor, tutorForVoice } from "@/lib/tutors";

export type ThemePreference = "system" | "light" | "dark";

export interface Preferences {
  theme: ThemePreference;
  /** Default playback speed for the model voice. */
  modelRate: number;
  /** The learner's coach (see lib/tutors.ts). */
  tutorId: string;
  /** Voice for model clips: always the coach's voice, kept in sync with tutorId. */
  modelVoice: string;
  /** Whether the first-run welcome has been completed or skipped. */
  onboarded: boolean;
  /** Where the learner dragged the floating coach window (px from the top-left), or null for the default spot. */
  coachPosition: { x: number; y: number } | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  modelRate: 0.85,
  tutorId: DEFAULT_TUTOR_ID,
  modelVoice: getTutor(DEFAULT_TUTOR_ID).voice,
  onboarded: false,
  coachPosition: null,
};

function migratePosition(v: unknown): Preferences["coachPosition"] {
  if (typeof v !== "object" || v === null) return null;
  const { x, y } = v as { x?: unknown; y?: unknown };
  return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y)
    ? { x: Math.round(x), y: Math.round(y) }
    : null;
}

const RATES = [0.75, 0.85, 1];

export function migratePreferences(data: unknown): Preferences {
  const d = typeof data === "object" && data !== null ? (data as Partial<Preferences>) : {};
  return {
    theme: d.theme === "light" || d.theme === "dark" || d.theme === "system" ? d.theme : DEFAULT_PREFERENCES.theme,
    modelRate: typeof d.modelRate === "number" && RATES.includes(d.modelRate) ? d.modelRate : DEFAULT_PREFERENCES.modelRate,
    // Older versions stored only a voice; map it to the coach who speaks with it.
    ...(() => {
      const tutor = getTutor(typeof d.tutorId === "string" ? d.tutorId : tutorForVoice(d.modelVoice)?.id);
      return { tutorId: tutor.id, modelVoice: tutor.voice };
    })(),
    onboarded: d.onboarded === true,
    coachPosition: migratePosition(d.coachPosition),
  };
}

const preferencesStore = createStore<Preferences>({
  key: STORAGE_KEYS.preferences,
  version: 1,
  fallback: () => DEFAULT_PREFERENCES,
  migrate: (data) => migratePreferences(data),
});

export const subscribePreferences = preferencesStore.subscribe;
export const getPreferencesSnapshot = preferencesStore.get;
export const getPreferencesServerSnapshot = preferencesStore.getServerSnapshot;

export function updatePreferences(patch: Partial<Omit<Preferences, "modelVoice">>): void {
  preferencesStore.update((p) => {
    const next = { ...p, ...patch };
    return { ...next, modelVoice: getTutor(next.tutorId).voice };
  });
}

/**
 * Inline script for <head>: applies the saved theme before first paint so there
 * is no flash of the wrong theme. Kept dependency-free and tiny on purpose.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t="system";var r=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.preferences
)});if(r){var p=JSON.parse(r);var d=p&&p.data?p.data:p;if(d&&d.theme)t=d.theme;}if(t==="system"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
