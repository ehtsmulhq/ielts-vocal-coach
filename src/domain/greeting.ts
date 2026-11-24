/** The coach's short spoken greeting on Today, built from the learner's own progress. */
import type { AccentArea } from "./progress";

export interface GreetingInput {
  learnerName: string;
  hour: number; // 0-23, local time
  streak: number;
  totalReps: number;
  lastScore?: number;
  focusArea?: AccentArea | null;
  scriptTopic?: string;
}

const FOCUS_PHRASE: Record<AccentArea, string> = {
  sounds: "getting individual sounds really crisp",
  stress: "hitting the stressed words",
  rhythm: "your rhythm and linking",
  intonation: "the rise and fall of your voice",
};

export function timeOfDay(hour: number): "morning" | "afternoon" | "evening" {
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export function buildGreeting(g: GreetingInput): string {
  const name = g.learnerName.trim();
  const parts = [`Good ${timeOfDay(g.hour)}${name ? `, ${name}` : ""}.`];

  const isFirstTime = g.totalReps === 0 && g.lastScore === undefined;
  if (isFirstTime) {
    parts.push("Let's get started with your very first rep.");
  } else if (g.streak >= 2) {
    parts.push(`That's ${g.streak} days in a row. Brilliant.`);
  } else if (g.streak === 1) {
    parts.push("Lovely to see you again.");
  } else {
    parts.push("Welcome back. Let's pick up where we left off.");
  }

  if (g.lastScore !== undefined) parts.push(`Last time you scored ${Math.round(g.lastScore)}.`);
  if (g.focusArea) parts.push(`Today let's work on ${FOCUS_PHRASE[g.focusArea]}.`);
  if (g.scriptTopic) parts.push(`I've picked ${g.scriptTopic} for you. Shall we start?`);
  return parts.join(" ");
}
