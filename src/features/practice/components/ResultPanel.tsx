import { ArrowDownRight, ArrowUpRight, CheckCircle2, Play, RotateCcw, Volume2 } from "lucide-react";
import type { ScriptItem } from "@/domain/contracts";
import { headlineScore } from "@/domain/attempt";
import { Badge, Button, ButtonLink, Card, ScoreBar, SectionLabel, scoreTone } from "@/ui/primitives";
import type { ModelPlayer } from "../useModelPlayer";
import type { CoachResult } from "../useCoach";

function Delta({ now, before }: { now: number; before: number }) {
  const diff = Math.round(now - before);
  if (diff === 0) return <span className="text-sm text-muted">Same as last time ({Math.round(before)})</span>;
  const up = diff > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${up ? "text-success" : "text-danger"}`}>
      <Icon className="h-4 w-4" aria-hidden />
      {up ? "+" : ""}
      {diff} since last time ({Math.round(before)})
    </span>
  );
}

export function ResultPanel({
  script,
  result,
  takeUrl,
  player,
  nextHref,
  onRetry,
}: {
  script: ScriptItem;
  result: CoachResult;
  takeUrl: string | null;
  player: ModelPlayer;
  nextHref?: string;
  onRetry: () => void;
}) {
  const { analysis, attempt, previous } = result;
  const headline = attempt ? headlineScore(attempt) : analysis.accent?.overall ?? analysis.accuracyScore;

  return (
    <Card className="space-y-6" aria-labelledby="result-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel>{analysis.accent ? "Accent match vs British RP" : "Accuracy"}</SectionLabel>
          <h2 id="result-heading" className="text-4xl font-semibold tabular-nums">
            {Math.round(headline)}
            <span className="text-lg text-subtle">/100</span>
          </h2>
          {previous && <Delta now={headline} before={headlineScore(previous)} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={scoreTone(analysis.accuracyScore)}>Words {Math.round(analysis.accuracyScore)}%</Badge>
          <Badge>Pace {Math.round(analysis.actualWpm)} wpm</Badge>
          <Badge tone="accent">{analysis.fluencyRating}</Badge>
        </div>
      </div>

      {analysis.accent && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["sounds", "stress", "rhythm", "intonation"] as const).map((k) => (
              <ScoreBar key={k} label={k} score={analysis.accent![k]} />
            ))}
          </div>
          <p className="rounded-[var(--radius-control)] bg-accent-soft px-4 py-3 text-sm">
            <strong>Next rep, focus on:</strong> {analysis.accent.focusTip}
          </p>
          <p className="text-xs text-subtle">
            Scores are the AI coach&apos;s judgement from listening to both clips. Use them as guidance, not a measurement.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Compare:</span>
        <Button size="sm" onClick={() => void player.playModel(script.upgradedScript, 1)}>
          <Volume2 className="h-3.5 w-3.5" aria-hidden />
          Model
        </Button>
        {takeUrl && (
          <Button size="sm" onClick={() => void player.playUrl(takeUrl)}>
            <Play className="h-3.5 w-3.5" aria-hidden />
            Your take
          </Button>
        )}
        {player.isPlaying && (
          <Button size="sm" variant="ghost" onClick={player.stop}>
            Stop
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <SectionLabel>Coach</SectionLabel>
        <p className="font-serif text-lg italic">&ldquo;{analysis.drVanceSpokenFeedback}&rdquo;</p>
        {analysis.praise && <p className="text-sm text-muted">{analysis.praise}</p>}
      </div>

      <div className="space-y-3">
        <SectionLabel>What to fix</SectionLabel>
        {analysis.mistakes.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            No significant mistakes. Every clean rep strengthens the habit.
          </p>
        ) : (
          <ul className="space-y-3">
            {analysis.mistakes.map((m, i) => (
              <li key={i} className="space-y-2 rounded-[var(--radius-control)] border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="danger" className="capitalize">
                    {m.type}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => void player.playModel(m.targetPhrase, 0.9)}>
                    <Volume2 className="h-3.5 w-3.5" aria-hidden />
                    Hear model
                  </Button>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="block text-xs text-subtle">You said</span>
                    <span className="font-serif italic text-danger">&ldquo;{m.userSaid}&rdquo;</span>
                  </p>
                  <p>
                    <span className="block text-xs text-subtle">Target</span>
                    <span className="font-serif font-semibold text-success">&ldquo;{m.targetPhrase}&rdquo;</span>
                  </p>
                </div>
                <p className="text-sm">{m.coachCorrection}</p>
                {m.phoneticTip && (
                  <p className="text-sm text-muted">
                    <span className="font-medium text-fg">Sound / stress:</span>{" "}
                    <span className="break-words font-mono">{m.phoneticTip}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          {attempt ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> Rep saved
            </>
          ) : (
            "This take wasn't scored, so it isn't counted."
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Another rep
          </Button>
          {nextHref && <ButtonLink href={nextHref}>Next script</ButtonLink>}
        </div>
      </div>
    </Card>
  );
}
