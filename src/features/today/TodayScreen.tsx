"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Headphones, Mic, Repeat, Sparkles } from "lucide-react";
import { activeStreak } from "@/domain/stats";
import { headlineScore } from "@/domain/attempt";
import { Badge, ButtonLink, Card, SectionLabel, scoreTone } from "@/ui/primitives";
import { useAttempts, useHydrated, usePreferences, useProfile, useScriptVault, useHasCaptured } from "@/features/shared/stores";
import { WelcomeCard } from "./WelcomeCard";
import { CoachGreeting } from "@/features/tutor/CoachGreeting";
import { buildGreeting } from "@/domain/greeting";
import { recentAreaAverages, weakestArea } from "@/domain/progress";
import { getTutor } from "@/lib/tutors";
import { buildPacks, findScript, scriptLabel, suggestScript } from "@/features/library/catalog";

const STEPS = [
  { Icon: Headphones, title: "Listen", body: "Hear a British RP model read the script." },
  { Icon: Repeat, title: "Shadow", body: "Copy it phrase by phrase, straight after the model." },
  { Icon: Mic, title: "Deliver", body: "Say the whole answer and get accent feedback." },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <SectionLabel>{label}</SectionLabel>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function TodayScreen() {
  const hydrated = useHydrated();
  const vault = useScriptVault();
  const hasCaptured = useHasCaptured();
  const attempts = useAttempts();
  const profile = useProfile();
  const packs = useMemo(() => buildPacks(vault.items, hasCaptured), [vault.items, hasCaptured]);
  const suggestion = suggestScript(packs, vault.itemStats);
  const recent = [...attempts].reverse().slice(0, 5);
  const streak = hydrated ? activeStreak(vault.lastPracticeDay, vault.dayStreak ?? 0, new Date()) : 0;
  const isNew = hydrated && vault.totalPracticeCount === 0;
  const prefs = usePreferences();
  const name = profile.preferredName;

  if (isNew && !prefs.onboarded) return <WelcomeCard profile={profile} firstScript={suggestion} />;

  const persona = getTutor(prefs.tutorId);
  const lastAttempt = attempts[attempts.length - 1];
  const greeting = hydrated
    ? buildGreeting({
        learnerName: name,
        hour: new Date().getHours(),
        streak,
        totalReps: Math.max(vault.totalPracticeCount, attempts.length),
        lastScore: lastAttempt ? headlineScore(lastAttempt) : undefined,
        focusArea: weakestArea(recentAreaAverages(attempts)),
        scriptTopic: suggestion ? (suggestion.topic ?? suggestion.title).toLowerCase() : undefined,
      })
    : "";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {isNew ? "Build your accent by shadowing" : name ? `Welcome back, ${name}` : "Today's practice"}
        </h1>
        <p className="max-w-2xl text-muted">
          A few focused reps a day: listen to a British RP model, copy it phrase by phrase, then say it yourself and see
          what to fix.
        </p>
      </header>

      {greeting && <CoachGreeting persona={persona} text={greeting} />}

      {isNew && (
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="font-medium">
                  {i + 1}. {title}
                </p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {suggestion && (
        <Card className="space-y-4 border-accent/40">
          <div className="space-y-1">
            <SectionLabel>{isNew ? "Your first script" : "Today's script"}</SectionLabel>
            <p className="text-sm text-muted">{scriptLabel(suggestion)}</p>
            <p className="font-serif text-xl font-semibold">&ldquo;{suggestion.question}&rdquo;</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/practice/${suggestion.id}`} variant="primary" size="lg">
              Start today&apos;s rep <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/library" size="lg">
              Choose another
            </ButtonLink>
          </div>
        </Card>
      )}

      {!isNew && hydrated && (
        <Card className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-warning" aria-hidden />
            <Stat label="Day streak" value={String(streak)} />
          </div>
          <Stat label="Total reps" value={String(vault.totalPracticeCount)} />
          <Stat
            label="Best recent score"
            value={recent.length ? String(Math.round(Math.max(...recent.map(headlineScore)))) : "–"}
          />
        </Card>
      )}

      {recent.length > 0 && (
        <section className="space-y-3" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent reps
          </h2>
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {recent.map((a) => {
              const script = findScript(packs, a.scriptId)?.script;
              const score = Math.round(headlineScore(a));
              return (
                <li key={a.id}>
                  <Link
                    href={`/practice/${a.scriptId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{script ? scriptLabel(script) : "Removed script"}</span>
                      <span className="text-sm text-subtle">
                        {new Date(a.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ·{" "}
                        {Math.round(a.wpm)} wpm
                      </span>
                    </span>
                    <Badge tone={scoreTone(score)}>{score}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 bg-surface-2/60">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="font-medium">Shadow your own story</p>
            <p className="text-sm text-muted">
              Answer a short spoken interview and we&apos;ll turn your own answers into scripts to practise.
            </p>
          </div>
        </div>
        <ButtonLink href="/capture">Capture new scripts</ButtonLink>
      </Card>
    </div>
  );
}
