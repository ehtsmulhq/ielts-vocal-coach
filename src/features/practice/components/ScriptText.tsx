import { cn } from "@/ui/primitives";

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Renders a script with stressed words underlined. When `spoken` is given,
 * words the learner has already said are highlighted (live teleprompter).
 */
export function ScriptText({
  text,
  stressedWords,
  spoken,
  className,
}: {
  text: string;
  stressedWords: string[];
  spoken?: string;
  className?: string;
}) {
  const spokenSet = new Set((spoken ?? "").split(/\s+/).map(clean).filter(Boolean));
  const stressed = stressedWords.map((s) => s.toLowerCase());
  return (
    <p className={cn("font-serif text-lg leading-relaxed sm:text-xl", className)}>
      {text.split(/\s+/).map((word, i) => {
        const c = clean(word);
        const isStressed = stressed.some((s) => c && s.split(/\s+/).some((part) => clean(part) === c));
        const isSpoken = spokenSet.has(c);
        return (
          <span key={i}>
            <span
              className={cn(
                "transition-colors",
                isStressed && "font-semibold underline decoration-warning decoration-2 underline-offset-4",
                isSpoken && "text-success"
              )}
            >
              {word}
            </span>{" "}
          </span>
        );
      })}
    </p>
  );
}
