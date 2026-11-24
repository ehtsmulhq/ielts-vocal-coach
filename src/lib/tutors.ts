/**
 * The learner's personal coach. Each coach is a Gemini Live prebuilt voice with
 * a name and character; the same voice reads the model clips you shadow, so
 * the voice you copy is the voice that teaches you.
 */
export interface Tutor {
  id: string;
  name: string;
  voice: string;
  style: string;
}

export const TUTORS: readonly Tutor[] = [
  { id: "olivia", name: "Olivia", voice: "Aoede", style: "Warm and lively" },
  { id: "james", name: "James", voice: "Charon", style: "Calm and steady" },
  { id: "amelia", name: "Amelia", voice: "Kore", style: "Gentle and patient" },
  { id: "harry", name: "Harry", voice: "Puck", style: "Upbeat and encouraging" },
] as const;

export const DEFAULT_TUTOR_ID = "olivia";

export function getTutor(id: string | undefined): Tutor {
  return TUTORS.find((t) => t.id === id) ?? TUTORS[0];
}

export function tutorForVoice(voice: string | undefined): Tutor | undefined {
  return TUTORS.find((t) => t.voice === voice);
}
