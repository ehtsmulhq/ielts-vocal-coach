import { generateJson } from "@/lib/gemini";
import { lessonPrompt, lessonSchema } from "@/lib/prompts";
import type { Lesson, LessonRequest, TargetBand } from "@/lib/types";
import {
  MOST_ASKED_PART2_SCENES,
  REAL_PART1_CLUSTERS,
  getPart2Scene,
} from "@/lib/ielts-question-knowledge-graph";
import { CAMBRIDGE_TEST_MODULES } from "@/lib/cambridge-materials";

const BANDS: TargetBand[] = ["5.5", "6.5", "7.5"];

function sanitizePart1Questions(questions: string[]): string[] {
  const fallback = REAL_PART1_CLUSTERS[0].standardQuestions;
  const forbiddenKeywords = [
    "given your",
    "demanding schedule",
    "balance your",
    "commitments",
    "infrastructure",
    "microservices",
    "distributed",
    "engineering",
    "training with your",
    "professional commitments",
  ];

  return questions.map((q, idx) => {
    const wordCount = q.trim().split(/\s+/).length;
    const lower = q.toLowerCase();
    const hasForbidden = forbiddenKeywords.some((kw) => lower.includes(kw));
    if (wordCount > 16 || hasForbidden) {
      return fallback[idx % fallback.length];
    }
    return q;
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<LessonRequest>;
    const band = BANDS.includes(body.band as TargetBand) ? (body.band as TargetBand) : "7.5";
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : undefined;
    const focusArea = body.focusArea;
    const cambridgeTestId = typeof body.cambridgeTestId === "string" ? body.cambridgeTestId : undefined;
    const sceneId = typeof body.sceneId === "string" ? body.sceneId : undefined;

    // 1. Direct Knowledge Graph resolution: User selected a specific high-frequency Part 2 Scene
    if (sceneId) {
      const scene = getPart2Scene(sceneId);
      const part1Cluster =
        scene.category === "objects_tech"
          ? REAL_PART1_CLUSTERS[5] // Technology & digital navigation
          : scene.category === "places"
          ? REAL_PART1_CLUSTERS[1] // Hometown roots
          : scene.category === "habits_decisions"
          ? REAL_PART1_CLUSTERS[3] // Daily routines & habits
          : REAL_PART1_CLUSTERS[0]; // Work & professional field

      const lesson: Lesson = {
        topic: scene.title,
        band,
        hotSeatTest: {
          theme: scene.title,
          cambridgeRef: `Real YouTube Mock & Cambridge Standard • ${scene.frequencyTier}`,
          part1Questions: part1Cluster.standardQuestions.slice(0, 4),
          part2CueCard: scene.cueCard,
          part3Questions: scene.part3Questions,
          recommendedVocabulary: scene.recommendedVocabulary,
          bandFocusNotes: `Grounded in ${scene.youtubeSource}`,
        },
      };
      return Response.json({ lesson, model: "knowledge-graph" });
    }

    // 2. Direct Official Cambridge Test Module resolution
    if (cambridgeTestId) {
      const mod = CAMBRIDGE_TEST_MODULES.find((m) => m.id === cambridgeTestId);
      if (mod) {
        const lesson: Lesson = {
          topic: mod.title,
          band,
          hotSeatTest: {
            theme: mod.theme,
            cambridgeRef: `${mod.book} • Test ${mod.testNumber}`,
            part1Questions: mod.part1Questions,
            part2CueCard: mod.part2CueCard,
            part3Questions: mod.part3Questions,
            recommendedVocabulary: mod.recommendedVocabulary,
            bandFocusNotes: `Official Cambridge IELTS standard`,
          },
        };
        return Response.json({ lesson, model: "cambridge-official" });
      }
    }

    // 3. Thematic matching against Real Knowledge Graph scenes
    if (topic) {
      const matchedScene = MOST_ASKED_PART2_SCENES.find(
        (s) =>
          topic.toLowerCase().includes(s.title.toLowerCase()) ||
          topic.toLowerCase().includes(s.category.toLowerCase()) ||
          s.title.toLowerCase().includes(topic.toLowerCase())
      );
      if (matchedScene) {
        const part1Cluster =
          matchedScene.category === "objects_tech"
            ? REAL_PART1_CLUSTERS[5]
            : matchedScene.category === "places"
            ? REAL_PART1_CLUSTERS[1]
            : REAL_PART1_CLUSTERS[0];

        const lesson: Lesson = {
          topic: matchedScene.title,
          band,
          hotSeatTest: {
            theme: matchedScene.title,
            cambridgeRef: `Real YouTube Mock & Cambridge Standard • ${matchedScene.frequencyTier}`,
            part1Questions: part1Cluster.standardQuestions.slice(0, 4),
            part2CueCard: matchedScene.cueCard,
            part3Questions: matchedScene.part3Questions,
            recommendedVocabulary: matchedScene.recommendedVocabulary,
            bandFocusNotes: `Grounded in ${matchedScene.youtubeSource}`,
          },
        };
        return Response.json({ lesson, model: "knowledge-graph" });
      }
    }

    // 4. Default: Generate via Gemini strictly bound to Cambridge IELTS rules
    try {
      const { data, model } = await generateJson<Lesson>(
        lessonPrompt({ band, topic, focusArea, cambridgeTestId }),
        lessonSchema
      );
      if (data?.hotSeatTest?.part1Questions && Array.isArray(data.hotSeatTest.part1Questions)) {
        data.hotSeatTest.part1Questions = sanitizePart1Questions(data.hotSeatTest.part1Questions);
      }
      return Response.json({ lesson: data, model });
    } catch {
      // Fallback: Return top real-world YouTube mock scene from Knowledge Graph
      const fallbackScene = MOST_ASKED_PART2_SCENES[0];
      const fallbackLesson: Lesson = {
        topic: fallbackScene.title,
        band,
        hotSeatTest: {
          theme: fallbackScene.title,
          cambridgeRef: `Real YouTube Mock & Cambridge Standard • ${fallbackScene.frequencyTier}`,
          part1Questions: REAL_PART1_CLUSTERS[0].standardQuestions.slice(0, 4),
          part2CueCard: fallbackScene.cueCard,
          part3Questions: fallbackScene.part3Questions,
          recommendedVocabulary: fallbackScene.recommendedVocabulary,
          bandFocusNotes: `Grounded in ${fallbackScene.youtubeSource}`,
        },
      };
      return Response.json({ lesson: fallbackLesson, model: "knowledge-graph-fallback" });
    }
  } catch (err) {
    console.error("[api/lesson]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
