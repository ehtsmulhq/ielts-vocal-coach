import { generateJson } from "@/lib/gemini";
import { lessonPrompt, lessonSchema } from "@/lib/prompts";
import type { Lesson, LessonRequest, TargetBand } from "@/lib/types";

const BANDS: TargetBand[] = ["5.5", "6.5", "7.5"];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<LessonRequest>;
    const band = BANDS.includes(body.band as TargetBand) ? (body.band as TargetBand) : "6.5";
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 80) : undefined;
    const focusArea = body.focusArea;

    const { data, model } = await generateJson<Lesson>(
      lessonPrompt({ band, topic, focusArea }),
      lessonSchema
    );
    return Response.json({ lesson: data, model });
  } catch (err) {
    console.error("[api/lesson]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
