"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ScriptItem } from "@/domain/contracts";
import { Alert, ButtonLink, Card, cn, SectionLabel } from "@/ui/primitives";
import { useHydrated, usePreferences, useScriptVault, useHasCaptured } from "@/features/shared/stores";
import { buildPacks, findScript, neighbours, type ScriptLocation } from "@/features/library/catalog";
import { updatePreferences } from "@/storage/preferences";
import { cleanChunks } from "./audio";
import { useModelPlayer } from "./useModelPlayer";
import { useShadowLoop } from "./useShadowLoop";
import { useRecorder } from "./useRecorder";
import { useCoach } from "./useCoach";
import { ListenPanel } from "./components/ListenPanel";
import { ShadowPanel } from "./components/ShadowPanel";
import { DeliverPanel } from "./components/DeliverPanel";
import { ResultPanel } from "./components/ResultPanel";
import { CollocationList } from "./components/CollocationList";

type Phase = "listen" | "shadow" | "deliver" | "result";
const PHASES: { id: Phase; label: string }[] = [
  { id: "listen", label: "1. Listen" },
  { id: "shadow", label: "2. Shadow" },
  { id: "deliver", label: "3. Deliver" },
  { id: "result", label: "4. Feedback" },
];
const RATES = [0.75, 0.85, 1] as const;

export function PracticeScreen({ scriptId }: { scriptId: string }) {
  const hydrated = useHydrated();
  const vault = useScriptVault();
  const hasCaptured = useHasCaptured();
  const packs = useMemo(() => buildPacks(vault.items, hasCaptured), [vault.items, hasCaptured]);
  const loc = findScript(packs, scriptId);

  if (!hydrated) {
    return <Card className="h-64 animate-pulse bg-surface-2" aria-busy="true" aria-label="Loading script" />;
  }
  if (!loc) {
    return (
      <Card className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">Script not found</h1>
        <p className="text-muted">It may have been replaced by a newer capture, or the link is wrong.</p>
        <ButtonLink href="/library" variant="primary">
          Browse the library
        </ButtonLink>
      </Card>
    );
  }
  // Keyed so every piece of practice state resets when the script changes.
  return <PracticeSession key={loc.script.id} loc={loc} targetBand={vault.targetBand || "7.5"} reps={vault.itemStats?.[loc.script.id]} />;
}

function PracticeSession({
  loc,
  targetBand,
  reps,
}: {
  loc: ScriptLocation;
  targetBand: string;
  reps?: { reps: number; bestAccentScore: number };
}) {
  const script: ScriptItem = loc.script;
  const { prev, next } = neighbours(loc);
  const { modelRate } = usePreferences();

  const [phase, setPhase] = useState<Phase>("listen");
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const takeUrlRef = useRef<string | null>(null);

  const player = useModelPlayer();
  const chunks = useMemo(() => cleanChunks(script.thoughtChunks), [script.thoughtChunks]);
  const loop = useShadowLoop(chunks, player, modelRate);
  const recorder = useRecorder();
  const coach = useCoach();
  const [deliverError, setDeliverError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    },
    []
  );

  const goTo = (p: Phase) => {
    if (p === phase) return;
    loop.stop();
    player.stop();
    if (recorder.isRecording) recorder.cancel();
    setPhase(p);
  };

  const startDelivery = async () => {
    loop.stop();
    player.stop();
    coach.reset();
    setDeliverError(null);
    await recorder.start();
  };

  const finishDelivery = async () => {
    const take = await recorder.stop();
    if (!take) {
      setDeliverError("No audio was captured. Check your microphone and try again.");
      return;
    }
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = URL.createObjectURL(take.blob);
    setTakeUrl(takeUrlRef.current);
    const result = await coach.analyze(script, take, targetBand);
    if (result) setPhase("result");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/library" className="flex items-center gap-1 text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" aria-hidden /> {loc.pack.name}
        </Link>
        <div className="flex items-center gap-3 text-muted">
          {reps && reps.reps > 0 && (
            <span>
              {reps.reps} {reps.reps === 1 ? "rep" : "reps"}
              {reps.bestAccentScore > 0 && ` · best ${Math.round(reps.bestAccentScore)}`}
            </span>
          )}
          {prev && (
            <Link href={`/practice/${prev.id}`} aria-label="Previous script" className="hover:text-fg">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
          )}
          {next && (
            <Link href={`/practice/${next.id}`} aria-label="Next script" className="hover:text-fg">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <header className="space-y-2">
        <SectionLabel>{script.part ? `IELTS Part ${script.part} · ${script.topic}` : script.title}</SectionLabel>
        <h1 className="font-serif text-2xl font-semibold leading-snug sm:text-3xl">&ldquo;{script.question}&rdquo;</h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Practice steps">
          <ol className="flex flex-wrap gap-1.5">
            {PHASES.map((p) => {
              const disabled = p.id === "result" && !coach.result;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-current={phase === p.id ? "step" : undefined}
                    onClick={() => goTo(p.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                      phase === p.id ? "bg-fg text-bg font-medium" : "border border-line text-muted hover:text-fg"
                    )}
                  >
                    {p.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div role="radiogroup" aria-label="Model speed" className="flex items-center gap-1 text-sm">
          <span className="mr-1 text-muted">Speed</span>
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={modelRate === r}
              onClick={() => updatePreferences({ modelRate: r })}
              className={cn(
                "rounded-full px-2.5 py-1 tabular-nums cursor-pointer",
                modelRate === r ? "bg-surface-2 font-medium text-fg" : "text-muted hover:text-fg"
              )}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      {player.usingFallbackVoice && (
        <Alert tone="warning">
          The British RP model voice is unavailable right now, so your browser&apos;s voice is standing in. It may not
          be a British accent.
        </Alert>
      )}

      {phase === "listen" && (
        <ListenPanel script={script} player={player} rate={modelRate} onNext={() => goTo("shadow")} />
      )}
      {phase === "shadow" && (
        <ShadowPanel chunks={chunks} loop={loop} player={player} rate={modelRate} onNext={() => goTo("deliver")} />
      )}
      {phase === "deliver" && (
        <DeliverPanel
          script={script}
          recorder={recorder}
          isAnalyzing={coach.isAnalyzing}
          error={deliverError ?? coach.error}
          onStart={() => void startDelivery()}
          onFinish={() => void finishDelivery()}
        />
      )}
      {phase === "result" && coach.result && (
        <ResultPanel
          script={script}
          result={coach.result}
          takeUrl={takeUrl}
          player={player}
          nextHref={next ? `/practice/${next.id}` : undefined}
          onRetry={() => {
            coach.reset();
            setPhase("deliver");
          }}
        />
      )}

      <CollocationList items={script.targetCollocations} player={player} />
    </div>
  );
}
