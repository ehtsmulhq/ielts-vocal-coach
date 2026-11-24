import { createStore } from "./store";
import { STORAGE_KEYS } from "./registry";

export type ThemePreference = "system" | "light" | "dark";

export interface Preferences {
  theme: ThemePreference;
  /** Default playback speed for the model voice. */
  modelRate: number;
}

export const DEFAULT_PREFERENCES: Preferences = { theme: "system", modelRate: 0.85 };

const RATES = [0.75, 0.85, 1];

export function migratePreferences(data: unknown): Preferences {
  const d = typeof data === "object" && data !== null ? (data as Partial<Preferences>) : {};
  return {
    theme: d.theme === "light" || d.theme === "dark" || d.theme === "system" ? d.theme : DEFAULT_PREFERENCES.theme,
    modelRate: typeof d.modelRate === "number" && RATES.includes(d.modelRate) ? d.modelRate : DEFAULT_PREFERENCES.modelRate,
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

export function updatePreferences(patch: Partial<Preferences>): void {
  preferencesStore.update((p) => ({ ...p, ...patch }));
}

/**
 * Inline script for <head>: applies the saved theme before first paint so there
 * is no flash of the wrong theme. Kept dependency-free and tiny on purpose.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t="system";var r=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.preferences
)});if(r){var p=JSON.parse(r);var d=p&&p.data?p.data:p;if(d&&d.theme)t=d.theme;}if(t==="system"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
