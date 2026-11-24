"use client";

import { Play, Square } from "lucide-react";
import { cn } from "@/ui/primitives";
import { TUTORS, type Tutor } from "@/lib/tutors";
import { TutorAvatar } from "./TutorAvatar";

export const coachIntro = (t: Tutor) =>
  `Hello, I'm ${t.name}. I'll be your coach. Let's make your English sound natural and confident.`;

/**
 * Choose your coach. Selecting a card makes that coach yours (their voice also
 * reads the model clips); the play button lets the learner hear them first.
 */
export function CoachPicker({
  value,
  onChange,
  onPreview,
  previewingId,
}: {
  value: string;
  onChange: (id: string) => void;
  onPreview?: (tutor: Tutor) => void;
  previewingId?: string | null;
}) {
  return (
    <div role="radiogroup" aria-label="Your coach" className="grid gap-2 sm:grid-cols-2">
      {TUTORS.map((t) => {
        const selected = value === t.id;
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-control)] border p-3 transition-colors",
              selected ? "border-accent bg-accent-soft/50" : "border-line"
            )}
          >
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input type="radio" name="coach" className="sr-only" checked={selected} onChange={() => onChange(t.id)} />
              <TutorAvatar persona={t} size="sm" />
              <span>
                <span className="block font-medium">{t.name}</span>
                <span className="block text-sm text-muted">{t.style}</span>
              </span>
            </label>
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(t)}
                aria-label={previewingId === t.id ? `Stop ${t.name}'s preview` : `Hear ${t.name}`}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg cursor-pointer"
              >
                {previewingId === t.id ? <Square className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
