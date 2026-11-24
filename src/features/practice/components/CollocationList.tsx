import { Volume2 } from "lucide-react";
import type { TargetCollocation } from "@/domain/contracts";
import { SectionLabel } from "@/ui/primitives";
import type { ModelPlayer } from "../useModelPlayer";

export function CollocationList({ items, player }: { items: TargetCollocation[]; player: ModelPlayer }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="collocations-heading">
      <SectionLabel>
        <span id="collocations-heading">Key phrases</span>
      </SectionLabel>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((c) => (
          <li key={c.phrase} className="space-y-1 rounded-[var(--radius-control)] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="font-serif font-semibold">{c.phrase}</span>
              <button
                type="button"
                onClick={() => void player.playModel(c.phrase, 0.9)}
                className="-m-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-fg cursor-pointer"
                aria-label={`Hear the model say "${c.phrase}"`}
              >
                <Volume2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="text-sm text-muted">{c.meaning}</p>
            <p className="text-xs text-subtle">{c.phoneticTip}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
