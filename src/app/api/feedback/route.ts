import { generateJson } from "@/server/gemini";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError } from "@/server/errors";
import { FeedbackRequestSchema } from "@/domain/contracts";
import { studentWordCount } from "@/domain/transcript";
import { feedbackPrompt, feedbackSchema } from "@/lib/prompts";
import type { Feedback, Lesson } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "feedback", ...LIMITS.feedback }, FeedbackRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const { lesson, transcript, band } = guarded.data;
    if (studentWordCount(transcript) === 0) {
      return Response.json({ noSpeech: true, message: "No candidate speech detected in transcript." });
    }
    const { data, model } = await generateJson<Feedback>({
      contents: feedbackPrompt(lesson as unknown as Lesson, transcript.slice(-400), band),
      schema: feedbackSchema,
      mode: "scoring",
    });
    return Response.json({ feedback: data, model });
  } catch (err) {
    return handleRouteError("feedback", err);
  }
}
