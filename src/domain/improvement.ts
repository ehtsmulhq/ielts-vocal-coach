/** Capture-interview history types and the session-to-session improvement summary. */

export interface DailyImprovementDelta {
  overallDelta: number;
  fluencyDelta: number;
  lexicalDelta: number;
  grammarDelta: number;
  pronunciationDelta: number;
  wpmDelta: number;
  keyWins: string[];
  focusAreasForTomorrow: string[];
}

export interface HotSeatSessionRecord {
  id: string;
  dayNumber: number; // sequential session number
  timestamp: number;
  dateStr: string; // e.g. "29 Oct 2026"
  targetBand: string;
  overallBand: number;
  subScores: {
    pronunciation: number;
    fluency: number;
    lexical: number;
    grammar: number;
  };
  metrics: {
    wpm: number;
    totalStudentWords: number;
    durationSeconds: number;
    turnCount: number;
  };
  cambridgeTopic: string;
  improvementDelta?: DailyImprovementDelta;
}

export type NewSessionRecord = Omit<HotSeatSessionRecord, "id" | "dayNumber" | "dateStr">;

const round1 = (n: number) => Number(n.toFixed(1));

export function computeImprovementDelta(
  prev: HotSeatSessionRecord | undefined,
  record: NewSessionRecord
): DailyImprovementDelta {
  if (!prev) {
    return {
      overallDelta: 0,
      fluencyDelta: 0,
      lexicalDelta: 0,
      grammarDelta: 0,
      pronunciationDelta: 0,
      wpmDelta: 0,
      keyWins: [
        `Recorded your first baseline (${record.overallBand.toFixed(1)} band)`,
        `Spoke ${record.metrics.totalStudentWords} words of your own English`,
        "Your answers became personal scripts for shadowing",
      ],
      focusAreasForTomorrow: [
        "Shadow one of your new scripts three times today",
        "Aim for fewer hesitation pauses in your next capture",
      ],
    };
  }

  const overallDelta = round1(record.overallBand - prev.overallBand);
  const fluencyDelta = round1(record.subScores.fluency - prev.subScores.fluency);
  const lexicalDelta = round1(record.subScores.lexical - prev.subScores.lexical);
  const grammarDelta = round1(record.subScores.grammar - prev.subScores.grammar);
  const pronunciationDelta = round1(record.subScores.pronunciation - prev.subScores.pronunciation);
  const wpmDelta = Math.round(record.metrics.wpm - prev.metrics.wpm);

  const keyWins: string[] = [];
  if (overallDelta > 0) keyWins.push(`+${overallDelta} overall band since your last capture`);
  if (pronunciationDelta > 0) keyWins.push(`Clearer pronunciation: +${pronunciationDelta}`);
  if (fluencyDelta > 0) keyWins.push(`Smoother flow: +${fluencyDelta} in fluency`);
  if (grammarDelta > 0) keyWins.push(`More varied grammar: +${grammarDelta}`);
  if (lexicalDelta > 0) keyWins.push(`Wider vocabulary: +${lexicalDelta}`);
  if (wpmDelta > 5) keyWins.push(`Speaking pace up by ${wpmDelta} words per minute`);
  if (record.metrics.totalStudentWords > prev.metrics.totalStudentWords) {
    keyWins.push(`Spoke ${record.metrics.totalStudentWords - prev.metrics.totalStudentWords} more words than last time`);
  }
  if (keyWins.length === 0) {
    keyWins.push("Held a steady baseline under interview pressure");
  }

  const focusAreasForTomorrow: string[] = [];
  if (record.subScores.pronunciation < 7) focusAreasForTomorrow.push("Shadow at 0.85x and copy the stressed words exactly");
  if (record.subScores.fluency < 7) focusAreasForTomorrow.push("Shadow chunk by chunk to smooth mid-sentence pauses");
  if (record.subScores.grammar < 7) focusAreasForTomorrow.push("Reuse one complex sentence pattern from your scripts");
  if (record.subScores.lexical < 7) focusAreasForTomorrow.push("Work two collocations from your scripts into new answers");
  if (focusAreasForTomorrow.length === 0) focusAreasForTomorrow.push("Polish intonation: copy the model's rises and falls");

  return {
    overallDelta,
    fluencyDelta,
    lexicalDelta,
    grammarDelta,
    pronunciationDelta,
    wpmDelta,
    keyWins,
    focusAreasForTomorrow,
  };
}

export function isSessionRecord(value: unknown): value is HotSeatSessionRecord {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.timestamp === "number" &&
    typeof v.overallBand === "number" &&
    typeof v.subScores === "object" &&
    v.subScores !== null &&
    typeof v.metrics === "object" &&
    v.metrics !== null
  );
}
