import { cn } from "@/ui/primitives";
import type { Tutor as TutorPersona } from "@/lib/tutors";

/** The coach's face: their initial, with a soft ring while they speak. */
const SIZES = { sm: "h-9 w-9 text-base", md: "h-12 w-12 text-xl", lg: "h-20 w-20 text-3xl" } as const;

export function TutorAvatar({ persona, speaking, size = "md" }: { persona: TutorPersona; speaking?: boolean; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full bg-accent font-serif font-semibold text-on-accent transition-shadow",
        SIZES[size],
        speaking && (size === "lg" ? "ring-8 ring-accent/25 motion-safe:animate-pulse" : "ring-4 ring-accent/30 motion-safe:animate-pulse")
      )}
    >
      {persona.name[0]}
    </span>
  );
}
