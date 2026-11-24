"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, MicOff } from "lucide-react";
import { Alert, Badge, Button, ButtonLink, Card, SectionLabel, cn } from "@/ui/primitives";
import { BandReport } from "./components/BandReport";
import { useCaptureStore, useHydrated } from "@/features/shared/stores";
import { addPersonalScripts } from "@/lib/master-script";
import { recordScriptDecision, type CaptureReport } from "@/storage/capture";
import type { ScriptItem } from "@/domain/contracts";

function ScriptChoice({
  script,
  selected,
  onToggle,
}: {
  script: ScriptItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer gap-3 rounded-[var(--radius-card)] border p-4 transition-colors",
          selected ? "border-accent bg-accent-soft/40" : "border-line bg-surface"
        )}
      >
        <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span className="min-w-0 space-y-2">
          <span className="block text-xs font-medium uppercase tracking-wider text-subtle">{script.title}</span>
          <span className="block font-serif font-semibold">{script.question}</span>
          {script.originalRawSpoken && (
            <span className="block text-sm text-muted">
              <span className="font-medium text-fg">You said:</span> &ldquo;{script.originalRawSpoken}&rdquo;
            </span>
          )}
          <span className="block text-sm">
            <span className="font-medium">Your script:</span> {script.upgradedScript}
          </span>
        </span>
      </label>
    </li>
  );
}

function ScriptReview({ report }: { report: CaptureReport }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(report.proposedScripts.map((s) => s.id)));

  if (report.decision) {
    const accepted = report.proposedScripts.filter((s) => report.decision!.acceptedIds.includes(s.id));
    return accepted.length > 0 ? (
      <Card className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {accepted.length} {accepted.length === 1 ? "script" : "scripts"} added to My scripts
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/practice/${accepted[0].id}`} variant="primary">
            Start practising <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/library">Open library</ButtonLink>
        </div>
      </Card>
    ) : (
      <Card>
        <p className="text-muted">You skipped these scripts. Your existing scripts are unchanged.</p>
      </Card>
    );
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const accept = () => {
    const chosen = report.proposedScripts.filter((s) => selected.has(s.id));
    addPersonalScripts(chosen, report.band);
    recordScriptDecision(chosen.map((s) => s.id));
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {report.proposedScripts.map((s) => (
          <ScriptChoice key={s.id} script={s} selected={selected.has(s.id)} onToggle={() => toggle(s.id)} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={accept} disabled={selected.size === 0}>
          Add {selected.size} {selected.size === 1 ? "script" : "scripts"} to My scripts
        </Button>
        <Button variant="ghost" onClick={() => recordScriptDecision([])}>
          Skip these
        </Button>
        <p className="text-sm text-muted">Nothing you already have is replaced.</p>
      </div>
    </div>
  );
}

export function CaptureReportScreen() {
  const hydrated = useHydrated();
  const { report } = useCaptureStore();

  if (!hydrated) return <Card className="h-64 animate-pulse bg-surface-2" aria-busy="true" aria-label="Loading" />;
  if (!report) {
    return (
      <Card className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">No interview report yet</h1>
        <p className="text-muted">Finish a capture interview to see your report and new scripts here.</p>
        <ButtonLink href="/capture" variant="primary">
          Start a capture
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <SectionLabel>
          Interview · {new Date(report.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
        </SectionLabel>
        <h1 className="font-serif text-3xl font-semibold">{report.topic}</h1>
        {report.feedback && <Badge tone="accent">Overall band {report.feedback.overall.toFixed(1)}</Badge>}
      </header>

      {report.errors.map((e) => (
        <Alert key={e} tone="warning">
          {e}
        </Alert>
      ))}

      {report.noSpeech ? (
        <Card className="space-y-3 text-center">
          <MicOff className="mx-auto h-8 w-8 text-subtle" aria-hidden />
          <h2 className="text-xl font-semibold">We didn&apos;t hear any answers</h2>
          <p className="text-muted">Check that your microphone is allowed and working, then try again.</p>
          <ButtonLink href="/capture" variant="primary">
            Try again
          </ButtonLink>
        </Card>
      ) : (
        <>
          {report.proposedScripts.length > 0 && (
            <section className="space-y-3" aria-labelledby="scripts-heading">
              <h2 id="scripts-heading" className="text-xl font-semibold">
                Your new scripts
              </h2>
              <p className="text-muted">
                Your own answers, rewritten into natural spoken English. Choose the ones you want to shadow.
              </p>
              <ScriptReview report={report} />
            </section>
          )}

          {report.feedback && (
            <section className="space-y-3" aria-labelledby="band-heading">
              <h2 id="band-heading" className="text-xl font-semibold">
                Band report
              </h2>
              <BandReport feedback={report.feedback} delta={report.improvementDelta} sessionNumber={report.sessionNumber} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
