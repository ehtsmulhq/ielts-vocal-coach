import type { ScriptItem } from "@/domain/contracts";
import type { ItemStats } from "@/domain/stats";
import { SHADOWING_LIBRARY } from "@/lib/shadowing-library";
import { isStarterScript } from "@/domain/capture";

/** A named collection of shadowing scripts. */
export interface Pack {
  id: "mine" | "ielts-speaking";
  name: string;
  description: string;
  scripts: ScriptItem[];
}

/**
 * Until the learner has captured their own answers, the "mine" pack only holds
 * generic starter scripts, so the curated pack is listed (and suggested) first.
 */
export function buildPacks(myScripts: ScriptItem[], hasCaptured: boolean): Pack[] {
  // Personal scripts count even when the band report failed and no interview history was written.
  const personal = hasCaptured || myScripts.some((s) => !isStarterScript(s));
  const mine: Pack = personal || myScripts.length === 0
    ? {
        id: "mine",
        name: "My scripts",
        description: "Your own answers, rewritten into natural spoken English. Capture an interview to add more.",
        scripts: myScripts,
      }
    : {
        id: "mine",
        name: "Starter scripts",
        description: "Generic everyday answers. Capture an interview to replace them with your own story.",
        scripts: myScripts,
      };
  const ielts: Pack = {
    id: "ielts-speaking",
    name: "IELTS Speaking",
    description: "Original Cambridge-style model answers for Parts 1, 2 and 3.",
    scripts: SHADOWING_LIBRARY,
  };
  return personal ? [mine, ielts] : [ielts, mine];
}

export interface ScriptLocation {
  script: ScriptItem;
  pack: Pack;
  index: number;
}

export function findScript(packs: Pack[], scriptId: string): ScriptLocation | null {
  for (const pack of packs) {
    const index = pack.scripts.findIndex((s) => s.id === scriptId);
    if (index >= 0) return { script: pack.scripts[index], pack, index };
  }
  return null;
}

/** Neighbouring scripts in the same pack, for previous/next navigation. */
export function neighbours(loc: ScriptLocation): { prev?: ScriptItem; next?: ScriptItem } {
  return { prev: loc.pack.scripts[loc.index - 1], next: loc.pack.scripts[loc.index + 1] };
}

/**
 * Today's suggestion: a script never practised beats one practised before;
 * otherwise the one practised longest ago. Personal scripts come first on ties.
 */
export function suggestScript(packs: Pack[], stats: Record<string, ItemStats> | undefined): ScriptItem | undefined {
  const all = packs.flatMap((p) => p.scripts);
  let best: ScriptItem | undefined;
  let bestKey = Infinity;
  for (const script of all) {
    const last = stats?.[script.id]?.lastPracticedAt ?? 0;
    if (last < bestKey) {
      best = script;
      bestKey = last;
    }
  }
  return best;
}

export function scriptLabel(script: ScriptItem): string {
  return script.part ? `Part ${script.part} · ${script.topic ?? script.title}` : script.title;
}
