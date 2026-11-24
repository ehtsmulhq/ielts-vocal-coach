import { generateJson } from "@/server/gemini";
import { guardJson, LIMITS } from "@/server/guard";
import { handleRouteError } from "@/server/errors";
import { greetingPrompt, isUsableGreeting } from "@/server/greeting-prompt";
import { GreetingRequestSchema, GreetingResponseSchema, toGeminiSchema, type GreetingResponse } from "@/domain/contracts";
import { getTutor } from "@/lib/tutors";

export const maxDuration = 30;

const responseSchema = toGeminiSchema(GreetingResponseSchema);
// A reply that quotes numbers broke the brief, so it counts as a bad answer (the next model gets a try).
const validate = GreetingResponseSchema.refine((r) => isUsableGreeting(r.text), "greeting must not contain numbers");

/** The coach's personal greeting on Today, written fresh from the learner's situation. */
export async function POST(request: Request) {
  const guarded = await guardJson(request, { route: "greeting", ...LIMITS.greeting }, GreetingRequestSchema);
  if (!guarded.ok) return guarded.response;
  try {
    const tutor = getTutor(guarded.data.tutorId);
    const { data } = await generateJson<GreetingResponse>({
      contents: greetingPrompt(tutor, guarded.data),
      schema: responseSchema,
      mode: "creative",
      validate,
    });
    return Response.json({ text: data.text.trim() });
  } catch (err) {
    return handleRouteError("greeting", err);
  }
}
