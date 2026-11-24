import { ArrowDownRight, ArrowUpRight, CheckCircle2, Info, Volume2 } from "lucide-react";
import { Badge, ButtonLink, Card, SectionLabel } from "@/ui/primitives";
import type { DailyImprovementDelta } from "@/domain/improvement";
import type { Feedback } from "@/lib/types";

const CRITERIA = [
  { key: "fluency", label: "Fluency & coherence" },
  { key: "lexical", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "pronunciation", label: "Pronunciation (estimate)" },
] as const;

function Delta({ value }: { value: number }) {
  if (!value) return null;
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-danger"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {value.toFixed(1)}
    </span>
  );
}

/**
 * IELTS band report for a capture interview. Graded from the transcript only,
 * so pronunciation is shown as an estimate and accent work points to practice.
 */
export function BandReport({
  feedback,
  delta,
  sessionNumber,
}: {
  feedback: Feedback;
  delta: DailyImprovementDelta | null;
  sessionNumber: number;
}) {
  const deltas: Record<(typeof CRITERIA)[number]["key"], number> = {
    fluency: delta?.fluencyDelta ?? 0,
    lexical: delta?.lexicalDelta ?? 0,
    grammar: delta?.grammarDelta ?? 0,
    pronunciation: delta?.pronunciationDelta ?? 0,
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel>Overall band · interview {sessionNumber}</SectionLabel>
          <p className="text-5xl font-semibold tabular-nums">
            {feedback.overall.toFixed(1)}
            <span className="text-xl text-subtle"> / 9</span>
          </p>
        </div>
        {delta && delta.overallDelta !== 0 && (
          <Badge tone={delta.overallDelta > 0 ? "success" : "danger"}>
            {delta.overallDelta > 0 ? "+" : ""}
            {delta.overallDelta.toFixed(1)} since last interview
          </Badge>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map(({ key, label }) => (
          <Card key={key} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{label}</h3>
              <span className="flex items-center gap-2">
                <Delta value={deltas[key]} />
                <span className="text-lg font-semibold tabular-nums">{feedback[key].band.toFixed(1)}</span>
              </span>
            </div>
            <p className="text-sm text-muted">{feedback[key].comment}</p>
          </Card>
        ))}
      </div>

      <p className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        This report is graded from a transcript of your answers, so pronunciation is an estimate. For feedback on your
        actual accent, shadow a script and deliver it in practice.
      </p>

      {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="font-medium">What went well</h3>
            <ul className="space-y-1.5 text-sm">
              {feedback.strengths.map((s) => (
                <li key={s} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="space-y-2">
            <h3 className="font-medium">What to work on</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {feedback.improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {feedback.wordsToPractice.length > 0 && (
        <Card className="space-y-3">
          <h3 className="flex items-center gap-2 font-medium">
            <Volume2 className="h-4 w-4 text-subtle" aria-hidden /> Words to practise
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {feedback.wordsToPractice.map((w) => (
              <li key={w.word} className="text-sm">
                <span className="font-serif font-semibold">{w.word}</span>
                <span className="text-muted"> · {w.tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {delta && (delta.keyWins.length > 0 || delta.focusAreasForTomorrow.length > 0) && (
        <Card className="space-y-3">
          <h3 className="font-medium">Since last time</h3>
          <ul className="space-y-1 text-sm">
            {delta.keyWins.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {delta.focusAreasForTomorrow.length > 0 && (
            <>
              <SectionLabel>Next</SectionLabel>
              <ul className="space-y-1 text-sm">
                {[...delta.focusAreasForTomorrow, feedback.nextDrill].filter(Boolean).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/library" variant="primary">
          Practise your scripts
        </ButtonLink>
        <ButtonLink href="/capture">New interview</ButtonLink>
      </div>
    </div>
  );
}
