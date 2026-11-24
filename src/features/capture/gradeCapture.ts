import { postJson } from "@/lib/api-client";
import { saveTestSession, getTestHistorySnapshot } from "@/lib/test-history";
import { assignScriptIds, hasStudentSpeech } from "@/domain/capture";
import { cadenceWpm, studentTurnCount, studentWordCount } from "@/domain/transcript";
import { UpgradeResponseSchema } from "@/domain/contracts";
import type { CandidateProfile, Feedback, Lesson, TargetBand, TranscriptEntry } from "@/lib/types";
import type { CaptureReport } from "@/storage/capture";

export interface GradeInput {
  lesson: Lesson;
  band: TargetBand;
  transcript: TranscriptEntry[];
  seconds: number;
  profile: CandidateProfile;
}

/**
 * Grades an interview and proposes personal scripts, in parallel. Either half
 * may fail independently; whatever succeeded is kept and the failure is listed.
 * Nothing is added to the learner's scripts here: they choose on the report page.
 */
export async function gradeCapture({ lesson, band, transcript, seconds, profile }: GradeInput): Promise<CaptureReport> {
  const createdAt = Date.now();
  const base: CaptureReport = {
    id: `capture-${createdAt}`,
    createdAt,
    topic: lesson.topic,
    band,
    feedback: null,
    noSpeech: false,
    improvementDelta: null,
    sessionNumber: getTestHistorySnapshot().length,
    proposedScripts: [],
    decision: null,
    errors: [],
  };

  if (!hasStudentSpeech(transcript)) return { ...base, noSpeech: true };

  const [graded, upgraded] = await Promise.allSettled([
    postJson<{ feedback?: Feedback; noSpeech?: boolean }>(
      "/api/feedback",
      { lesson, transcript, band },
      { fallbackError: "Could not grade this interview." }
    ),
    postJson("/api/upgrade-script", { transcript, profile, targetBand: band }, {
      schema: UpgradeResponseSchema,
      fallbackError: "Could not turn your answers into scripts.",
    }),
  ]);

  const report: CaptureReport = { ...base };

  if (graded.status === "fulfilled") {
    if (graded.value.noSpeech) {
      report.noSpeech = true;
    } else if (graded.value.feedback) {
      const feedback = graded.value.feedback;
      const words = studentWordCount(transcript);
      const record = saveTestSession({
        timestamp: createdAt,
        targetBand: band,
        overallBand: feedback.overall,
        subScores: {
          pronunciation: feedback.pronunciation.band,
          fluency: feedback.fluency.band,
          lexical: feedback.lexical.band,
          grammar: feedback.grammar.band,
        },
        metrics: {
          wpm: cadenceWpm(words, seconds, 125),
          totalStudentWords: words,
          durationSeconds: seconds,
          turnCount: studentTurnCount(transcript),
        },
        cambridgeTopic: lesson.topic,
      });
      report.feedback = feedback;
      report.improvementDelta = record.improvementDelta ?? null;
      report.sessionNumber = record.dayNumber;
    }
  } else {
    report.errors.push((graded.reason as Error)?.message ?? "Could not grade this interview.");
  }

  if (upgraded.status === "fulfilled") {
    report.proposedScripts = assignScriptIds(upgraded.value.items, createdAt);
  } else {
    report.errors.push((upgraded.reason as Error)?.message ?? "Could not turn your answers into scripts.");
  }

  return report;
}
