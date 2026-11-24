"use client";

import { useState } from "react";
import { ArrowRight, Flag, X } from "lucide-react";
import { Alert, Button, Card, cn } from "@/ui/primitives";
import { VoiceOrb } from "@/components/VoiceOrb";
import { LessonCard } from "@/components/LessonCard";
import { TranscriptFeed } from "@/components/TranscriptFeed";
import { LatencyHUD } from "@/components/LatencyHUD";
import { STAGE_ORDER } from "@/domain/capture";
import { studentWordCount } from "@/domain/transcript";
import type { CaptureSession } from "../useCaptureSession";

const STAGE_LABELS = { part1: "Part 1 · Interview", part2: "Part 2 · Long turn", part3: "Part 3 · Discussion" } as const;

function clock(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

export function LiveInterview({ session }: { session: CaptureSession }) {
  const { state } = session;
  const [tab, setTab] = useState<"questions" | "transcript">("questions");
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const isLast = state.stage === "part3";
  const stageIndex = STAGE_ORDER.indexOf(state.stage);
  if (!state.lesson) return null;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Interview progress">
          {STAGE_ORDER.map((s, i) => (
            <li
              key={s}
              aria-current={s === state.stage ? "step" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                s === state.stage ? "bg-fg font-medium text-bg" : i < stageIndex ? "text-muted line-through" : "text-subtle"
              )}
            >
              {STAGE_LABELS[s]}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums text-sm text-muted" aria-label="Interview time">
            {clock(state.seconds)}
          </span>
          <LatencyHUD telemetry={state.telemetry} activeModelName={state.model} />
          <Button variant="primary" onClick={isLast ? session.finish : session.next}>
            {isLast ? (
              <>
                <Flag className="h-4 w-4" aria-hidden /> Finish &amp; get report
              </>
            ) : (
              <>
                Next part <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
          {!isLast && (
            <Button onClick={session.finish}>
              <Flag className="h-4 w-4" aria-hidden /> Finish now
            </Button>
          )}
          {confirmAbandon ? (
            <span className="flex items-center gap-1">
              <Button variant="danger" size="sm" onClick={session.abandon}>
                Discard interview
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmAbandon(false)}>
                Keep going
              </Button>
            </span>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmAbandon(true)} aria-label="Abandon interview">
              <X className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </Card>

      <div aria-live="polite" className="space-y-2">
        {state.notice && <Alert tone="accent">{state.notice}</Alert>}
        {state.error && <Alert tone="warning">{state.error}</Alert>}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="flex min-h-[420px] flex-col justify-center lg:col-span-2">
          <VoiceOrb
            status={state.liveStatus}
            micAnalyser={state.micAnalyser}
            tutorAnalyser={state.tutorAnalyser}
            isMuted={state.muted}
            micMode={state.micMode}
            micVolume={state.micVolume}
            tutorSpeaking={state.tutorSpeaking || session.coachSpeaking}
            speechProtection={state.protection}
            onToggleMute={() => session.setMuted(!state.muted)}
            onChangeMicMode={session.setMicMode}
            onToggleSpeechProtection={session.toggleProtection}
            onPushToTalkChange={session.setPushToTalk}
            onInterruptTutor={session.interrupt}
          />
        </Card>

        <Card className="flex h-[560px] flex-col gap-3 lg:col-span-3">
          <div role="tablist" aria-label="Interview panels" className="flex gap-1">
            {(["questions", "transcript"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm capitalize cursor-pointer",
                  tab === t ? "bg-surface-2 font-medium text-fg" : "text-muted hover:text-fg"
                )}
              >
                {t}
                {t === "transcript" && state.transcript.length > 0 && ` (${state.transcript.length})`}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden" role="tabpanel">
            {tab === "questions" ? (
              <LessonCard
                key={state.stage}
                lesson={state.lesson}
                currentStage={state.stage}
                activeQuestionIdx={state.activeQuestionIdx}
                autoAdvanceNotice={state.notice}
                onSelectQuestion={session.selectQuestion}
                onSpeakText={session.speak}
                onStopSpeech={session.stopSpeaking}
                isCoachSpeaking={session.coachSpeaking}
                isTutorSpeaking={state.tutorSpeaking}
                studentWordCount={studentWordCount(state.transcript, state.stage)}
              />
            ) : (
              <TranscriptFeed
                entries={state.transcript}
                onReplay={(text) => session.speak(text, 0.95)}
                onStopReplay={session.stopSpeaking}
                isCoachSpeaking={session.coachSpeaking}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
