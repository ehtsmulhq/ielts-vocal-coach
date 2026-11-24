"use client";

import { Volume2 } from "lucide-react";
import { useVoiceCoach } from "./CoachProvider";

/**
 * Shown on a practice step while the coach is giving their tip. The exercise
 * button stays available: starting it cuts the coach off, so nobody talks over
 * the model voice, and this line says so.
 */
export function CoachSpeakingHint() {
  const coach = useVoiceCoach();
  const talking = coach.status === "live" && coach.speaking && !coach.held && !coach.away;
  // Rendered only while talking, so it takes no space (and adds no page gap) the rest of the time.
  if (!talking) return null;
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-[var(--radius-control)] bg-accent-soft px-4 py-2.5 text-sm text-accent"
    >
      <Volume2 className="h-4 w-4 shrink-0 motion-safe:animate-pulse" aria-hidden />
      {coach.persona.name} is giving you a tip. Start whenever you&apos;re ready and they&apos;ll stop.
    </p>
  );
}
