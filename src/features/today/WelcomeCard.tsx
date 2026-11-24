"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Headphones, Mic, Repeat } from "lucide-react";
import { Button, Card, SectionLabel, cn } from "@/ui/primitives";
import { updatePreferences } from "@/storage/preferences";
import { saveProfile } from "@/lib/profile";
import type { CandidateProfile } from "@/lib/types";
import type { ScriptItem } from "@/domain/contracts";
import { CoachPicker, coachIntro } from "@/features/tutor/CoachPicker";
import { useModelPlayer } from "@/features/practice/useModelPlayer";
import { DEFAULT_TUTOR_ID } from "@/lib/tutors";

const STEPS = [
  { Icon: Headphones, title: "Listen", body: "Hear a British RP model read a short answer." },
  { Icon: Repeat, title: "Shadow", body: "Copy it phrase by phrase, straight after the model." },
  { Icon: Mic, title: "Deliver", body: "Say the whole answer and see what to fix." },
];

const PACES = [
  { rate: 0.75, label: "Slow", hint: "New to shadowing" },
  { rate: 0.85, label: "Relaxed", hint: "Recommended" },
  { rate: 1, label: "Natural", hint: "Already confident" },
] as const;

/** First-run welcome, inline on Today: explain the method, pick a pace, go straight to a first rep. */
export function WelcomeCard({ profile, firstScript }: { profile: CandidateProfile; firstScript?: ScriptItem }) {
  const router = useRouter();
  const [rate, setRate] = useState(0.85);
  const [name, setName] = useState("");
  const [tutorId, setTutorId] = useState(DEFAULT_TUTOR_ID);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const player = useModelPlayer();

  const start = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) saveProfile({ ...profile, preferredName: name.trim(), fullName: profile.hasCompletedGrill ? profile.fullName : name.trim() });
    player.stop();
    updatePreferences({ onboarded: true, modelRate: rate, tutorId });
    if (firstScript) router.push(`/practice/${firstScript.id}`);
  };

  return (
    <Card className="space-y-6 border-accent/40">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Build your accent by shadowing</h1>
        <p className="max-w-2xl text-muted">
          Shadowing means copying a fluent speaker straight after them, again and again, until their rhythm and sounds
          become your own. A few focused minutes a day is enough.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ Icon, title, body }, i) => (
          <li key={title} className="flex gap-3 rounded-[var(--radius-control)] bg-surface-2/60 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="font-medium">
                {i + 1}. {title}
              </p>
              <p className="text-sm text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={start} className="space-y-5">
        <div className="space-y-1">
          <SectionLabel>Accent</SectionLabel>
          <p className="text-sm">British (Received Pronunciation)</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Choose your coach</legend>
          <CoachPicker
            value={tutorId}
            onChange={setTutorId}
            previewingId={previewing}
            onPreview={(t) => {
              if (previewing === t.id) {
                player.stop();
                setPreviewing(null);
                return;
              }
              setTutorId(t.id);
              updatePreferences({ tutorId: t.id });
              setPreviewing(t.id);
              void player.playModel(coachIntro(t), 1).finally(() => setPreviewing((p) => (p === t.id ? null : p)));
            }}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Start at which pace?</legend>
          <div className="flex flex-wrap gap-2">
            {PACES.map((p) => (
              <label
                key={p.rate}
                className={cn(
                  "cursor-pointer rounded-[var(--radius-control)] border px-4 py-2 text-sm",
                  rate === p.rate ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
                )}
              >
                <input type="radio" name="pace" className="sr-only" checked={rate === p.rate} onChange={() => setRate(p.rate)} />
                <span className="block font-medium">
                  {p.label} · {p.rate}x
                </span>
                <span className="block text-xs">{p.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block max-w-sm space-y-1.5">
          <span className="text-sm font-medium">What should we call you? (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            className="h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" size="lg">
            Start my first rep <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" onClick={() => updatePreferences({ onboarded: true })}>
            Skip for now
          </Button>
          <p className="text-sm text-muted">You&apos;ll need headphones and a microphone.</p>
        </div>
      </form>
    </Card>
  );
}
