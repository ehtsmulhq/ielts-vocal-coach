"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Mic, Pencil, UserRound } from "lucide-react";
import { Alert, Button, Card, SectionLabel } from "@/ui/primitives";
import { CAMBRIDGE_TEST_MODULES } from "@/lib/cambridge-materials";
import { MOST_ASKED_PART2_SCENES } from "@/lib/ielts-question-knowledge-graph";
import { DEFAULT_LIVE_MODEL, DEFAULT_VOICE, LIVE_MODELS, LIVE_VOICES } from "@/lib/models";
import type { CandidateProfile, TargetBand } from "@/lib/types";
import type { CaptureState as StoredCapture } from "@/storage/capture";
import type { CaptureConfig } from "../useCaptureSession";

const BANDS: { id: TargetBand; label: string }[] = [
  { id: "5.5", label: "5.5" },
  { id: "6.5", label: "6.5" },
  { id: "7.5", label: "7.5+" },
];

const FIELD = "h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm";

function toConfig(topic: string): Pick<CaptureConfig, "cambridgeTestId" | "sceneId"> {
  const [kind, id] = topic.split(":");
  return kind === "scene" ? { sceneId: id } : { cambridgeTestId: id };
}

export function CaptureSetup({
  profile,
  stored,
  preparing,
  loadingStep,
  error,
  onStart,
  onEditProfile,
  onGradeDraft,
  onDiscardDraft,
}: {
  profile: CandidateProfile;
  stored: StoredCapture;
  preparing: boolean;
  loadingStep: string;
  error: string | null;
  onStart: (config: CaptureConfig) => void;
  onEditProfile: () => void;
  onGradeDraft: () => void;
  onDiscardDraft: () => void;
}) {
  const [band, setBand] = useState<TargetBand>(profile.targetBand ?? "7.5");
  const [topic, setTopic] = useState(`test:${CAMBRIDGE_TEST_MODULES[0].id}`);
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE);
  const [model, setModel] = useState<string>(DEFAULT_LIVE_MODEL);
  const ready = Boolean(profile.hasCompletedGrill);
  const draft = stored.draft;
  const pendingReport = stored.report && !stored.report.decision && stored.report.proposedScripts.length > 0;

  const start = () => {
    if (!ready) return onEditProfile();
    onStart({ band, model, voice, ...toConfig(topic) });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold">Capture new scripts</h1>
        <p className="max-w-2xl text-muted">
          Answer a short spoken interview (about 10 minutes, in three parts). We turn your own answers into natural
          spoken English so you can shadow your own story.
        </p>
      </header>

      {draft && (
        <Card className="space-y-3 border-warning/50">
          <div className="flex items-start gap-3">
            <History className="mt-0.5 h-5 w-5 text-warning" aria-hidden />
            <div>
              <p className="font-medium">You have an unfinished interview</p>
              <p className="text-sm text-muted">
                Started {new Date(draft.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{" "}
                · {draft.transcript.filter((e) => e.role === "student").length} answers saved
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onGradeDraft}>
              Get my report from what I said
            </Button>
            <Button variant="ghost" onClick={onDiscardDraft}>
              Discard it
            </Button>
          </div>
        </Card>
      )}

      {pendingReport && (
        <Alert tone="accent">
          Your last interview has scripts waiting for review.{" "}
          <Link href="/capture/report" className="font-medium underline underline-offset-4">
            Review them
          </Link>
        </Alert>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <SectionLabel>About you</SectionLabel>
              {ready ? (
                <p className="text-sm">
                  {profile.preferredName} · {profile.occupationOrMajor} · from {profile.hometownName}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Tell us a little about yourself first, so the examiner&apos;s questions and your scripts are about your
                  life.
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={onEditProfile}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {ready ? "Edit" : "Set up"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Target band</legend>
          <div className="flex gap-2">
            {BANDS.map((b) => (
              <label
                key={b.id}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${
                  band === b.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted"
                }`}
              >
                <input type="radio" name="band" value={b.id} checked={band === b.id} onChange={() => setBand(b.id)} className="sr-only" />
                {b.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Interview topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={FIELD}>
            <optgroup label="Cambridge-style practice tests">
              {CAMBRIDGE_TEST_MODULES.map((m) => (
                <option key={m.id} value={`test:${m.id}`}>
                  {m.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Popular Part 2 topics">
              {MOST_ASKED_PART2_SCENES.map((s) => (
                <option key={s.id} value={`scene:${s.id}`}>
                  {s.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Examiner voice</span>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className={FIELD}>
              {LIVE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Examiner model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)} className={FIELD}>
              {LIVE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button variant="primary" size="lg" onClick={start} disabled={preparing}>
            <Mic className="h-4 w-4" aria-hidden />
            {preparing ? loadingStep || "Starting…" : ready ? "Start the interview" : "Set up your profile to start"}
          </Button>
          <p className="text-sm text-muted">Use headphones and allow the microphone when asked.</p>
        </div>
      </Card>

      <p className="text-sm text-muted">
        Your interviews and scripts stay in this browser. Back them up or erase them in{" "}
        <Link href="/settings" className="text-accent underline-offset-4 hover:underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
