import type { Lesson, TargetBand } from "@/lib/types";
import {
  MOST_ASKED_PART2_SCENES,
  REAL_PART1_CLUSTERS,
  getPart2Scene,
  type Part2MostAskedScene,
} from "@/lib/ielts-question-knowledge-graph";
import { CAMBRIDGE_TEST_MODULES } from "@/lib/cambridge-materials";

/**
 * Deterministic interview builders from the built-in, Cambridge-style question
 * banks. Shared by /api/lesson (to show the questions) and /api/token (to build
 * the examiner prompt server-side), so both always agree.
 */

function part1For(scene: Part2MostAskedScene): string[] {
  const cluster =
    scene.category === "objects_tech"
      ? REAL_PART1_CLUSTERS[5]
      : scene.category === "places"
        ? REAL_PART1_CLUSTERS[1]
        : scene.category === "habits_decisions"
          ? REAL_PART1_CLUSTERS[3]
          : REAL_PART1_CLUSTERS[0];
  return cluster.standardQuestions.slice(0, 4);
}

export function sceneLesson(scene: Part2MostAskedScene, band: TargetBand): Lesson {
  return {
    topic: scene.title,
    band,
    hotSeatTest: {
      theme: scene.title,
      cambridgeRef: "Cambridge-style practice test",
      part1Questions: part1For(scene),
      part2CueCard: scene.cueCard,
      part3Questions: scene.part3Questions,
      recommendedVocabulary: scene.recommendedVocabulary,
      bandFocusNotes: "A commonly reported Part 2 topic",
    },
  };
}

export function moduleLesson(moduleId: string, band: TargetBand): Lesson | null {
  const mod = CAMBRIDGE_TEST_MODULES.find((m) => m.id === moduleId);
  if (!mod) return null;
  return {
    topic: mod.title,
    band,
    hotSeatTest: {
      theme: mod.theme,
      cambridgeRef: `Cambridge-style practice test · ${mod.theme}`,
      part1Questions: mod.part1Questions,
      part2CueCard: mod.part2CueCard,
      part3Questions: mod.part3Questions,
      recommendedVocabulary: mod.recommendedVocabulary,
      bandFocusNotes: "Questions written in the style of the IELTS Speaking test",
    },
  };
}

export function sceneById(sceneId: string): Part2MostAskedScene | null {
  return MOST_ASKED_PART2_SCENES.some((s) => s.id === sceneId) ? getPart2Scene(sceneId) : null;
}

export function matchTopic(topic: string): Part2MostAskedScene | null {
  const t = topic.toLowerCase();
  return (
    MOST_ASKED_PART2_SCENES.find(
      (s) => t.includes(s.title.toLowerCase()) || t.includes(s.category.toLowerCase()) || s.title.toLowerCase().includes(t)
    ) ?? null
  );
}

export function fallbackLesson(band: TargetBand): Lesson {
  return sceneLesson(MOST_ASKED_PART2_SCENES[0], band);
}

/** Resolves a lesson from built-in banks only (no AI): scene id, then test id. */
export function resolveBuiltInLesson(opts: { band: TargetBand; sceneId?: string; cambridgeTestId?: string }): Lesson | null {
  if (opts.sceneId) {
    const scene = sceneById(opts.sceneId);
    if (scene) return sceneLesson(scene, opts.band);
  }
  if (opts.cambridgeTestId) return moduleLesson(opts.cambridgeTestId, opts.band);
  return null;
}
