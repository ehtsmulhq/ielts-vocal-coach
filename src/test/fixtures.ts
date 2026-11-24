import type { ScriptItem } from "@/domain/contracts";
import { SHADOWING_LIBRARY } from "@/lib/shadowing-library";

/** Starter scripts as older versions stored them ("canonical-*" ids). */
export const LEGACY_STARTERS: ScriptItem[] = SHADOWING_LIBRARY.slice(0, 3).map((s, i) => ({
  ...s,
  id: ["canonical-work", "canonical-hometown", "canonical-habits"][i],
  part: undefined,
  topic: undefined,
}));
