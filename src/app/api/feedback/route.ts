import { generateJson } from "@/lib/gemini";
import { feedbackPrompt, feedbackSchema } from "@/lib/prompts";
import type { Feedback, Lesson, TranscriptEntry } from "@/lib/types";

interface FeedbackRequest {
  lesson: Lesson;
  transcript: TranscriptEntry[];
  band: string;
}

export async function POST(request: Request) {
  try {
    const { lesson, transcript, band } = (await request.json()) as FeedbackRequest;
    if (!lesson || !Array.isArray(transcript)) {
      return Response.json({ error: "lesson and transcript are required" }, { status: 400 });
    }

    const studentEntries = transcript.filter(
      (t) => t.role === "student" && t.text.trim().length > 0
    );
    const totalStudentWords = studentEntries.reduce(
      (acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length,
      0
    );

    if (totalStudentWords === 0) {
      return Response.json({ noSpeech: true, message: "No candidate speech detected in transcript." });
    }
    const { data, model } = await generateJson<Feedback>(
      feedbackPrompt(lesson, transcript.slice(-400), band ?? "6.5"),
      feedbackSchema,
    );
    return Response.json({ feedback: data, model });
  } catch (err) {
    console.error("[api/feedback]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
