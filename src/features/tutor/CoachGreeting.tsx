"use client";

import { Square, Volume2 } from "lucide-react";
import { Button, Card } from "@/ui/primitives";
import { useModelPlayer } from "@/features/practice/useModelPlayer";
import type { Tutor } from "@/lib/tutors";
import { TutorAvatar } from "./TutorPanel";

/** The coach greets the learner on Today, in their own voice, on request. */
export function CoachGreeting({ persona, text }: { persona: Tutor; text: string }) {
  const player = useModelPlayer();
  const busy = player.isPlaying || player.isLoading;
  return (
    <Card className="flex flex-wrap items-start gap-4">
      <TutorAvatar persona={persona} speaking={player.isPlaying} />
      <div className="min-w-0 flex-1 space-y-3">
        <p className="font-serif text-lg leading-relaxed">&ldquo;{text}&rdquo;</p>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => (busy ? player.stop() : void player.playModel(text, 1))}>
            {busy ? <Square className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            {player.isLoading ? "Loading…" : player.isPlaying ? "Stop" : `Hear ${persona.name}`}
          </Button>
          <span className="text-sm text-subtle">{persona.name}, your coach</span>
        </div>
      </div>
    </Card>
  );
}
