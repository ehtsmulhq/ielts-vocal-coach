"use client";

import { useSyncExternalStore } from "react";

/** Phones: below Tailwind's `sm` breakpoint (640px). The bottom tab bar shows at this size. */
export const PHONE_QUERY = "(max-width: 639px)";
/** Phones held sideways: wide enough for the desktop layout, but too short for floating windows. */
export const SHORT_QUERY = "(max-height: 500px)";

/** True while the CSS media query matches. False during SSR and hydration, then follows the viewport live. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
