/**
 * The coach's greeting on Today when the AI-written one isn't available
 * (offline, or the AI is busy). It talks about progress in words, never in
 * scores, and varies its wording from day to day.
 */
import type { AccentArea } from "./progress";

export interface GreetingInput {
  learnerName: string;
  hour: number; // 0-23, local time
  streak: number;
  totalReps: number;
  lastScore?: number;
  previousScore?: number;
  daysSinceLastPractice?: number;
  focusArea?: AccentArea | null;
  scriptTopic?: string;
  /** Picks among equivalent phrasings (pass something that changes daily, like the day of the month). */
  seed?: number;
}

const FOCUS_PHRASE: Record<AccentArea, string> = {
  sounds: "getting individual sounds really crisp",
  stress: "landing on the stressed words",
  rhythm: "your rhythm and linking",
  intonation: "the rise and fall of your voice",
};

export function timeOfDay(hour: number): "morning" | "afternoon" | "evening" {
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

const pick = (options: string[], seed: number) => options[Math.abs(Math.trunc(seed)) % options.length];

export function buildGreeting(g: GreetingInput): string {
  const name = g.learnerName.trim();
  const seed = g.seed ?? 0;
  const isFirstTime = g.totalReps === 0 && g.lastScore === undefined;
  if (isFirstTime) {
    return `${name ? `Hello, ${name}. ` : ""}Let's get started with your very first rep.`;
  }

  const opener = (() => {
    if (g.daysSinceLastPractice !== undefined && g.daysSinceLastPractice >= 3)
      return pick(["Lovely to have you back", "There you are, it's good to see you again", "Nice to pick this up again"], seed);
    if (g.daysSinceLastPractice === 0) return pick(["Back for more today, brilliant", "Another session today, I like it"], seed);
    if (g.streak >= 2) return pick(["You're keeping a lovely habit going", "Day after day, you're showing up"], seed);
    return pick([`Good ${timeOfDay(g.hour)}`, "Hello again", "Nice to see you"], seed);
  })();

  const progress =
    g.lastScore !== undefined && g.previousScore !== undefined
      ? g.lastScore > g.previousScore + 2
        ? "Your last take was a real step up."
        : g.lastScore < g.previousScore - 2
          ? "Last time was a bit bumpy, which is completely normal."
          : "You've been nicely consistent."
      : "";

  const parts = [`${opener}${name ? `, ${name}` : ""}.`];
  if (progress) parts.push(progress);
  if (g.focusArea) parts.push(`Let's keep working on ${FOCUS_PHRASE[g.focusArea]}.`);
  if (g.scriptTopic) parts.push(`I've picked ${g.scriptTopic} for today. Shall we start?`);
  return parts.join(" ");
}
