import { describe, expect, it } from "vitest";
import { buildPacks, findScript, neighbours, suggestScript } from "./catalog";
import { createDefaultMasterRepository } from "@/lib/master-script";
import { SHADOWING_LIBRARY } from "@/lib/shadowing-library";

const starters = createDefaultMasterRepository().items;

describe("catalog", () => {
  it("lists the curated pack first until the learner has captured their own scripts", () => {
    expect(buildPacks(starters, false).map((p) => p.id)).toEqual(["ielts-speaking", "mine"]);
    expect(buildPacks(starters, false)[1].name).toBe("Starter scripts");
    expect(buildPacks(starters, true).map((p) => p.id)).toEqual(["mine", "ielts-speaking"]);
  });

  it("finds scripts and their neighbours", () => {
    const packs = buildPacks(starters, false);
    const loc = findScript(packs, SHADOWING_LIBRARY[1].id)!;
    expect(loc.pack.id).toBe("ielts-speaking");
    expect(neighbours(loc).prev?.id).toBe(SHADOWING_LIBRARY[0].id);
    expect(neighbours(loc).next?.id).toBe(SHADOWING_LIBRARY[2].id);
    expect(findScript(packs, "missing")).toBeNull();
  });

  it("suggests an unpractised script first, then the one practised longest ago", () => {
    const packs = buildPacks(starters, false);
    expect(suggestScript(packs, {})?.id).toBe(SHADOWING_LIBRARY[0].id);

    const all = packs.flatMap((p) => p.scripts);
    const stats = Object.fromEntries(
      all.map((s, i) => [s.id, { reps: 1, bestAccentScore: 50, lastPracticedAt: 1000 + i }])
    );
    stats[all[5].id].lastPracticedAt = 1;
    expect(suggestScript(packs, stats)?.id).toBe(all[5].id);
  });
});
