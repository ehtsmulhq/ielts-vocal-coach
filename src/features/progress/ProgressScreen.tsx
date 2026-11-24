"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react";
import { Badge, ButtonLink, Card, ScoreBar, SectionLabel, scoreTone } from "@/ui/primitives";
import { useAttempts, useHasCaptured, useHydrated, useScriptVault, useTestHistory } from "@/features/shared/stores";
import { buildPacks, findScript, scriptLabel } from "@/features/library/catalog";
import { activeStreak } from "@/domain/stats";
import {
  ACCENT_AREAS,
  AREA_ADVICE,
  dailyActivity,
  recentAreaAverages,
  scoreSeries,
  weakestArea,
  weeklyTrend,
} from "@/domain/progress";
import { ScoreTrendChart } from "./ScoreTrendChart";

const SEQ = ["var(--seq-0)", "var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)"];
const seqStep = (reps: number) => SEQ[Math.min(reps, 4)];

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <SectionLabel>{label}</SectionLabel>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {children}
    </div>
  );
}

export function ProgressScreen() {
  const hydrated = useHydrated();
  const attempts = useAttempts();
  const vault = useScriptVault();
  const history = useTestHistory();
  const hasCaptured = useHasCaptured();
  const packs = useMemo(() => buildPacks(vault.items, hasCaptured), [vault.items, hasCaptured]);

  if (!hydrated) return <Card className="h-64 animate-pulse bg-surface-2" aria-busy="true" aria-label="Loading" />;

  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-semibold">Progress</h1>
        <Card className="space-y-3 text-center">
          <p className="text-lg font-medium">Your progress appears after your first scored rep</p>
          <p className="text-muted">Shadow a script and deliver it to get an accent score.</p>
          <ButtonLink href="/" variant="primary">
            Start today&apos;s rep
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const label = (id: string) => {
    const s = findScript(packs, id)?.script;
    return s ? scriptLabel(s) : "Removed script";
  };
  const streak = activeStreak(vault.lastPracticeDay, vault.dayStreak ?? 0, now);
  const trend = weeklyTrend(attempts, now.getTime());
  const areas = recentAreaAverages(attempts);
  const focus = weakestArea(areas);
  const series = scoreSeries(attempts).map((p) => ({ ...p, label: label(p.scriptId) }));
  const days = dailyActivity(attempts, now);
  const practised = Object.entries(vault.itemStats ?? {})
    .filter(([, s]) => s.reps > 0)
    .sort((a, b) => b[1].lastPracticedAt - a[1].lastPracticedAt);
  const delta = trend.thisWeek !== null && trend.lastWeek !== null ? Math.round(trend.thisWeek - trend.lastWeek) : null;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Progress</h1>

      <Card className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Day streak" value={String(streak)} />
        <Stat label="Total reps" value={String(vault.totalPracticeCount)} />
        <Stat label="Avg this week" value={trend.thisWeek === null ? "–" : String(Math.round(trend.thisWeek))}>
          {delta !== null && delta !== 0 && (
            <p className={`flex items-center gap-1 text-sm ${delta > 0 ? "text-success" : "text-danger"}`}>
              {delta > 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
              {delta > 0 ? "+" : ""}
              {delta} vs last week
            </p>
          )}
        </Stat>
        <Stat label="Scripts practised" value={String(practised.length)} />
      </Card>

      {areas && focus && (
        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <SectionLabel>Focus next on</SectionLabel>
              <p className="text-lg font-semibold capitalize">{focus}</p>
              <p className="text-sm text-muted">{AREA_ADVICE[focus]}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ACCENT_AREAS.map((a) => (
              <ScoreBar key={a} label={a} score={areas[a]} />
            ))}
          </div>
          <p className="text-xs text-subtle">Averages of your last 10 accent-scored reps. AI coach judgement: use as guidance.</p>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="font-semibold">Score over your last {series.length} reps</h2>
        <ScoreTrendChart points={series} />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Practice over the last 5 weeks</h2>
        <div className="grid w-fit grid-cols-7 gap-1.5" role="list" aria-label="Reps per day">
          {days.map((d) => (
            <div
              key={d.day}
              role="listitem"
              title={`${d.day}: ${d.reps} ${d.reps === 1 ? "rep" : "reps"}`}
              aria-label={`${d.day}: ${d.reps} reps`}
              className="h-6 w-6 rounded-[4px]"
              style={{ background: seqStep(d.reps) }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle" aria-hidden>
          Fewer
          {SEQ.map((c) => (
            <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
          ))}
          More
        </div>
      </Card>

      {practised.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Scripts</h2>
          <ul className="divide-y divide-line">
            {practised.map(([id, s]) => (
              <li key={id}>
                <Link href={`/practice/${id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-accent">
                  <span className="min-w-0 truncate">{label(id)}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
                    {s.reps} {s.reps === 1 ? "rep" : "reps"}
                    {s.bestAccentScore > 0 && <Badge tone={scoreTone(s.bestAccentScore)}>best {Math.round(s.bestAccentScore)}</Badge>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Capture interviews</h2>
          <ul className="divide-y divide-line">
            {[...history].reverse().map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">
                  {h.dateStr} · {h.cambridgeTopic}
                </span>
                <Badge tone="accent">Band {h.overallBand.toFixed(1)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
