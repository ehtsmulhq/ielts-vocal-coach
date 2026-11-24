"use client";

import { Mic, MicOff, PhoneOff, Sparkles } from "lucide-react";
import { Alert, Button, Card, cn } from "@/ui/primitives";
import type { Tutor as TutorPersona } from "@/lib/tutors";
import type { Tutor } from "./useTutor";

/** The coach's face on the page: who they are, what they're doing, and what they just said. */
export function TutorAvatar({ persona, speaking, size = "md" }: { persona: TutorPersona; speaking?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full bg-accent font-serif font-semibold text-on-accent",
        size === "md" ? "h-12 w-12 text-xl" : "h-9 w-9 text-base",
        speaking && "ring-4 ring-accent/30 motion-safe:animate-pulse"
      )}
    >
      {persona.name[0]}
    </span>
  );
}

export function TutorPanel({ tutor, persona }: { tutor: Tutor; persona: TutorPersona }) {
  if (tutor.status === "idle" || tutor.status === "ended" || tutor.status === "error") {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TutorAvatar persona={persona} />
          <div>
            <p className="font-medium">
              {tutor.status === "ended" ? `Lesson with ${persona.name} ended` : `Practise with ${persona.name}`}
            </p>
            <p className="text-sm text-muted">
              {persona.name} talks you through this script and you can ask questions any time, out loud. Headphones help.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Button variant="primary" onClick={() => void tutor.start()}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {tutor.status === "ended" ? "Start again" : `Start lesson with ${persona.name}`}
          </Button>
        </div>
        {tutor.error && (
          <Alert tone="warning" className="w-full">
            {tutor.error}
          </Alert>
        )}
      </Card>
    );
  }

  if (tutor.status === "connecting") {
    return (
      <Card className="flex items-center gap-3" aria-busy="true">
        <TutorAvatar persona={persona} speaking />
        <p className="text-muted">Connecting to {persona.name}…</p>
      </Card>
    );
  }

  const state = tutor.speaking
    ? `${persona.name} is speaking`
    : tutor.held
      ? "Paused while you practise"
      : tutor.micMuted
        ? "Your mic is muted"
        : `${persona.name} is listening. Ask anything`;

  return (
    <Card className="space-y-3 border-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TutorAvatar persona={persona} speaking={tutor.speaking} />
          <div>
            <p className="font-medium">{persona.name}</p>
            <p className="text-sm text-muted" aria-live="polite">
              {state}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={tutor.toggleMic} aria-pressed={tutor.micMuted}>
            {tutor.micMuted ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
            {tutor.micMuted ? "Unmute" : "Mute"}
          </Button>
          <Button size="sm" variant="ghost" onClick={tutor.end}>
            <PhoneOff className="h-4 w-4" aria-hidden /> End lesson
          </Button>
        </div>
      </div>
      {tutor.caption && (
        <p className="font-serif text-lg leading-relaxed" aria-live="polite">
          &ldquo;{tutor.caption}&rdquo;
        </p>
      )}
      {tutor.learnerCaption && <p className="text-sm text-subtle">You: {tutor.learnerCaption}</p>}
    </Card>
  );
}
