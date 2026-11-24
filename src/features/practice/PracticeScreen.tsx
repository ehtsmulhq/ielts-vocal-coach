"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ScriptItem } from "@/domain/contracts";
import { Alert, ButtonLink, Card, cn, SectionLabel } from "@/ui/primitives";
import { useAttempts, useHydrated, usePreferences, useScriptVault, useHasCaptured } from "@/features/shared/stores";
import { buildPacks, findScript, neighbours, type ScriptLocation } from "@/features/library/catalog";
import { updatePreferences } from "@/storage/preferences";
import { cleanChunks } from "./audio";
import { useModelPlayer, type ModelPlayer } from "./useModelPlayer";
import { prefetchModelAudio } from "@/lib/model-audio";
import { headlineScore } from "@/domain/attempt";
import { recentAreaAverages, weakestArea } from "@/domain/progress";
import { buildLearnerContext } from "@/domain/learner-context";
import { getLessonsSnapshot } from "@/storage/lessons";
import { useCoachForScript } from "@/features/tutor/CoachProvider";
import { CoachSpeakingHint } from "@/features/tutor/CoachSpeakingHint";
import type { CoachResult } from "./useCoach";
import { useShadowLoop } from "./useShadowLoop";
import { useRecorder } from "./useRecorder";
import { useCoach } from "./useCoach";
import { ListenPanel } from "./components/ListenPanel";
import { ShadowPanel } from "./components/ShadowPanel";
import { DeliverPanel } from "./components/DeliverPanel";
import { ResultPanel } from "./components/ResultPanel";
import { CollocationList } from "./components/CollocationList";

type Phase = "listen" | "shadow" | "deliver" | "result";

/** A compact, factual summary the coach turns into spoken feedback. */
function resultForTutor({ analysis, attempt, previous }: CoachResult) {
  return {
    score: Math.round(attempt ? headlineScore(attempt) : (analysis.accent?.overall ?? analysis.accuracyScore)),
    previousScore: previous ? Math.round(headlineScore(previous)) : null,
    accent: analysis.accent
      ? {
          sounds: Math.round(analysis.accent.sounds),
          stress: Math.round(analysis.accent.stress),
          rhythm: Math.round(analysis.accent.rhythm),
          intonation: Math.round(analysis.accent.intonation),
          focusTip: analysis.accent.focusTip,
        }
      : null,
    wordsCorrectPercent: Math.round(analysis.accuracyScore),
    paceWpm: Math.round(analysis.actualWpm),
    topMistakes: analysis.mistakes.slice(0, 2).map((m) => ({
      type: m.type,
      said: m.userSaid,
      target: m.targetPhrase,
      tip: m.phoneticTip ?? m.coachCorrection,
    })),
  };
}
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
  const { modelRate, modelVoice } = usePreferences();
  const attempts = useAttempts();
  const vault = useScriptVault();
  const [phase, setPhase] = useState<Phase>("listen");
  // The coach is one lesson for the whole app; this page just puts its script in front of them.
  // The context is built at the moment a lesson connects, so "back after 5 minutes" and "back after 4 days" sound different.
  const tutor = useCoachForScript(script, () =>
    buildLearnerContext({
      now: new Date(),
      scriptId: script.id,
      phase,
      attempts,
      lessons: getLessonsSnapshot(),
      focusArea: weakestArea(recentAreaAverages(attempts)),
      streak: vault.dayStreak ?? 0,
      lastPracticeDay: vault.lastPracticeDay,
    })
  );

  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const takeUrlRef = useRef<string | null>(null);

  const rawPlayer = useModelPlayer();
  // During a lesson the coach pauses (and stops listening) whenever the model plays or the learner records.
  const player: ModelPlayer = {
    ...rawPlayer,
    playModel: async (text, rate) => {
      tutor.hold();
      try {
        return await rawPlayer.playModel(text, rate);
      } finally {
        tutor.release();
      }
    },
    playUrl: async (url, rate, revoke) => {
      tutor.hold();
      try {
        await rawPlayer.playUrl(url, rate, revoke);
      } finally {
        tutor.release();
      }
    },
  };
  const chunks = useMemo(() => cleanChunks(script.thoughtChunks), [script.thoughtChunks]);
  const rawLoop = useShadowLoop(chunks, player, modelRate);
  const loop = {
    ...rawLoop,
    run: async (startAt = 0, onlyOne = false) => {
      tutor.hold();
      try {
        await rawLoop.run(startAt, onlyOne);
      } finally {
        tutor.release();
      }
      if (!onlyOne && tutor.live) tutor.send("shadow_done");
    },
  };
  const recorder = useRecorder();
  const deliveryHeld = useRef(false);
  const holdForDelivery = () => {
    if (!deliveryHeld.current) {
      deliveryHeld.current = true;
      tutor.hold();
    }
  };
  const releaseDelivery = () => {
    if (deliveryHeld.current) {
      deliveryHeld.current = false;
      tutor.release();
    }
  };
  const cancelDelivery = () => {
    recorder.cancel();
    releaseDelivery();
  };

  // Prepare the coach's readings in the background: the whole script, then each phrase.
  useEffect(() => {
    let cancelled = false;
    void prefetchModelAudio([script.upgradedScript, ...chunks], modelVoice, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [script.upgradedScript, chunks, modelVoice]);
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
    if (recorder.isRecording) cancelDelivery();
    setPhase(p);
    if (tutor.live && p !== "result") tutor.send(`phase ${p}`);
  };

  const startDelivery = async () => {
    loop.stop();
    player.stop();
    coach.reset();
    setDeliverError(null);
    holdForDelivery();
    if (!(await recorder.start())) releaseDelivery();
  };

  const finishDelivery = async () => {
    const take = await recorder.stop();
    if (!take) {
      releaseDelivery();
      setDeliverError("No audio was captured. Check your microphone and try again.");
      return;
    }
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = URL.createObjectURL(take.blob);
    setTakeUrl(takeUrlRef.current);
    const result = await coach.analyze(script, take, targetBand);
    releaseDelivery();
    if (result) {
      setPhase("result");
      if (tutor.live) tutor.send("result", resultForTutor(result));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/library" className="-my-2.5 flex items-center gap-1 py-2.5 text-muted hover:text-fg">
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
            <Link href={`/practice/${prev.id}`} aria-label="Previous script" className="-m-2 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 hover:text-fg">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
          )}
          {next && (
            <Link href={`/practice/${next.id}`} aria-label="Next script" className="-m-2 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 hover:text-fg">
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
                      "rounded-full px-3.5 py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5",
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
                "rounded-full px-3 py-2.5 tabular-nums cursor-pointer sm:px-2.5 sm:py-1",
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

      <CoachSpeakingHint />

      {phase === "listen" && (
        <ListenPanel script={script} player={player} rate={modelRate} onNext={() => goTo("shadow")} />
      )}
      {phase === "shadow" && (
        <ShadowPanel chunks={chunks} loop={loop} player={player} rate={modelRate} onNext={() => goTo("deliver")} />
      )}
      {phase === "deliver" && (
        <DeliverPanel
          script={script}
          recorder={{ ...recorder, cancel: cancelDelivery }}
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
