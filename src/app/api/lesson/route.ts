import { generateJson } from "@/server/gemini";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError } from "@/server/errors";
import { fallbackLesson, matchTopic, resolveBuiltInLesson, sceneLesson } from "@/server/lessons";
import { LessonRequestSchema } from "@/domain/contracts";
import { lessonPrompt, lessonSchema } from "@/lib/prompts";
import { REAL_PART1_CLUSTERS } from "@/lib/ielts-question-knowledge-graph";
import type { Lesson } from "@/lib/types";

/** Replaces over-long or personalised Part 1 questions the model sometimes writes. */
function sanitizePart1Questions(questions: string[]): string[] {
  const fallback = REAL_PART1_CLUSTERS[0].standardQuestions;
  const forbidden = ["given your", "demanding schedule", "balance your", "commitments", "infrastructure", "microservices", "distributed", "engineering", "training with your", "professional commitments"];
  return questions.map((q, idx) => {
    const lower = q.toLowerCase();
    return q.trim().split(/\s+/).length > 16 || forbidden.some((kw) => lower.includes(kw)) ? fallback[idx % fallback.length] : q;
  });
}

export const maxDuration = 60;

export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "lesson", ...LIMITS.lesson }, LessonRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const { band, cambridgeTestId, sceneId } = guarded.data;
    const topic = guarded.data.topic?.trim().slice(0, 120) || undefined;

    // 1-2. Built-in question banks (no AI call)
    const builtIn = resolveBuiltInLesson({ band, sceneId, cambridgeTestId });
    if (builtIn) return Response.json({ lesson: builtIn, model: "built-in" });

    // 3. A free-text topic that matches a known Part 2 scene
    const matched = topic ? matchTopic(topic) : null;
    if (matched) return Response.json({ lesson: sceneLesson(matched, band), model: "built-in" });

    // 4. Generate a fresh Cambridge-style test, falling back to the most common topic
    try {
      const { data, model } = await generateJson<Lesson>({
        contents: lessonPrompt({ band, topic, cambridgeTestId }),
        schema: lessonSchema,
        mode: "creative",
      });
      if (Array.isArray(data?.hotSeatTest?.part1Questions)) {
        data.hotSeatTest.part1Questions = sanitizePart1Questions(data.hotSeatTest.part1Questions);
      }
      return Response.json({ lesson: data, model });
    } catch {
      return Response.json({ lesson: fallbackLesson(band), model: "built-in-fallback" });
    }
  } catch (err) {
    return handleRouteError("lesson", err);
  }
}
