"use client";

import { Square, Volume2 } from "lucide-react";
import { Button, Card } from "@/ui/primitives";
import { useModelPlayer } from "@/features/practice/useModelPlayer";
import type { Tutor } from "@/lib/tutors";
import { TutorAvatar } from "./TutorAvatar";

/** The coach greets the learner on Today, in their own voice, on request. While the greeting is being written, the coach "types". */
export function CoachGreeting({ persona, text, loading = false }: { persona: Tutor; text: string; loading?: boolean }) {
  const player = useModelPlayer();
  const busy = player.isPlaying || player.isLoading;
  return (
    <Card className="flex flex-wrap items-start gap-4">
      <TutorAvatar persona={persona} speaking={player.isPlaying} />
      <div className="min-w-0 flex-1 space-y-3">
        {loading ? (
          <div className="flex h-7 items-center gap-1.5" role="status" aria-label={`${persona.name} is writing to you`}>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-2 w-2 rounded-full bg-subtle motion-safe:animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : (
          <p className="font-serif text-lg leading-relaxed">&ldquo;{text}&rdquo;</p>
        )}
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={loading} onClick={() => (busy ? player.stop() : void player.playModel(text, 1))}>
            {busy ? <Square className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            {player.isLoading ? "Loading…" : player.isPlaying ? "Stop" : `Hear ${persona.name}`}
          </Button>
          <span className="text-sm text-subtle">{persona.name}, your coach</span>
        </div>
      </div>
    </Card>
  );
}
