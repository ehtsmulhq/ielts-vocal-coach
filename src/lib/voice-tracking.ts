/**
 * Real-time Voice & Transcript Tracking Engine for Authentic Cambridge Hot Seat.
 *
 * Synchronizes the candidate UI with Dr. Jonathan Vance's live audio:
 * 1. Analyzes incoming tutor speech in real-time.
 * 2. Matches phonetic/lexical keyphrases against the active stage questions.
 * 3. Detects verbal stage transition cues ("concludes Part 1", "brings us to Part 3", "end of speaking test").
 */

import type { Stage } from "./types";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "being", "by", "for", "from",
  "has", "have", "had", "how", "i", "in", "is", "it", "its", "my", "of", "on", "or",
  "our", "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "those", "to", "us", "was", "we", "were", "what", "when", "where", "which", "who",
  "why", "will", "with", "would", "you", "your", "tell", "me", "some", "like", "do",
  "does", "did", "can", "could", "about", "more", "much", "many", "than"
]);

/**
 * Calculates a match score between the examiner's spoken utterance and an official inquiry.
 */
export function scoreQuestionMatch(tutorText: string, question: string, index: number): number {
  if (!tutorText || !question) return 0;

  const cleanTutor = tutorText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const cleanQ = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  let score = 0;

  // 1. Ordinal & sequencing cue boost in examiner's phrasing
  const ordinalCues = [
    ["first", "begin", "start", "one", "1st"],
    ["second", "next", "two", "2nd"],
    ["third", "three", "3rd"],
    ["fourth", "final", "last", "four", "4th"],
    ["fifth", "five", "5th"],
  ];

  if (ordinalCues[index]) {
    for (const cue of ordinalCues[index]) {
      const regex = new RegExp(`\\b${cue}\\b`);
      if (regex.test(cleanTutor)) {
        score += 6;
        break;
      }
    }
  }

  // 2. Distinctive content word tokens from the question (len >= 3, not stop word)
  const qWords = cleanQ.split(/\s+/).filter((w) => !STOP_WORDS.has(w) && w.length >= 3);

  // Bigram / phrase matching
  if (qWords.length >= 2) {
    for (let i = 0; i < qWords.length - 1; i++) {
      const bigram = `${qWords[i]} ${qWords[i + 1]}`;
      if (cleanTutor.includes(bigram)) {
        score += 10;
      }
    }
  }

  // Individual content word matches
  let wordMatches = 0;
  for (const word of qWords) {
    const regex = new RegExp(`\\b${word}\\b`);
    if (regex.test(cleanTutor)) {
      wordMatches++;
    }
  }

  score += wordMatches * 3;

  return score;
}

/**
 * Scans the tutor's speech and finds the best-matching question index.
 * Returns null if no question meets the confidence threshold.
 */
export function findSpokenQuestionIndex(
  tutorText: string,
  questions: string[]
): number | null {
  if (!tutorText || !questions || questions.length === 0) return null;

  // Use the recent portion of tutor speech (last 300 chars) if long, to avoid anchor bias
  const relevantText = tutorText.length > 300 ? tutorText.slice(-300) : tutorText;

  let bestIdx = -1;
  let highestScore = 0;

  questions.forEach((q, idx) => {
    const score = scoreQuestionMatch(relevantText, q, idx);
    if (score > highestScore) {
      highestScore = score;
      bestIdx = idx;
    }
  });

  // Confidence threshold: at least 6 points (e.g. 2 content words, or an ordinal cue, or 1 bigram)
  if (highestScore >= 6 && bestIdx !== -1) {
    // If the matched index is valid, return it
    return bestIdx;
  }

  return null;
}

/**
 * Detects verbal stage transition cues spoken by Dr. Jonathan Vance.
 */
export function detectSpokenStageTransition(tutorText: string): Stage | "finish" | null {
  if (!tutorText) return null;
  const clean = tutorText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  // Part 1 -> Part 2 verbal markers
  if (
    clean.includes("conclude part 1") ||
    clean.includes("concludes part 1") ||
    clean.includes("concluded part 1") ||
    clean.includes("end of part 1") ||
    clean.includes("move to part 2") ||
    clean.includes("moving on to part 2") ||
    clean.includes("move on to part 2") ||
    clean.includes("give you a topic") ||
    clean.includes("talk about it for one to two minutes") ||
    clean.includes("for one to two minutes") ||
    clean.includes("before you talk you will have one minute") ||
    clean.includes("here is your topic") ||
    clean.includes("cue card") ||
    clean.includes("task card")
  ) {
    return "part2";
  }

  // Part 2 -> Part 3 verbal markers
  if (
    clean.includes("conclude part 2") ||
    clean.includes("concludes part 2") ||
    clean.includes("end of part 2") ||
    clean.includes("brings us to part 3") ||
    clean.includes("bring us to part 3") ||
    clean.includes("move to part 3") ||
    clean.includes("moving on to part 3") ||
    clean.includes("move on to part 3") ||
    clean.includes("more analytical questions") ||
    clean.includes("broader questions") ||
    clean.includes("more general questions") ||
    clean.includes("part 3 discussion")
  ) {
    return "part3";
  }

  // Part 3 -> Test Conclusion verbal markers
  if (
    clean.includes("end of the speaking test") ||
    clean.includes("end of your speaking test") ||
    clean.includes("concludes the speaking test") ||
    clean.includes("concludes your speaking test") ||
    clean.includes("concludes our speaking test") ||
    clean.includes("concludes the test") ||
    clean.includes("concludes your test") ||
    clean.includes("that is the end of the test") ||
    (clean.includes("conclude") && clean.includes("speaking test")) ||
    (clean.includes("conclude") && clean.includes("ielts")) ||
    (clean.includes("end of") && (clean.includes("test") || clean.includes("speaking") || clean.includes("interview")))
  ) {
    return "finish";
  }

  return null;
}
