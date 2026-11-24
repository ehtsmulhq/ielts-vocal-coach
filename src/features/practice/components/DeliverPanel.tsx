import { useState } from "react";
import { Mic, Square, X } from "lucide-react";
import type { ScriptItem } from "@/domain/contracts";
import { countWords } from "@/domain/transcript";
import { Alert, Button, Card } from "@/ui/primitives";
import type { useRecorder } from "../useRecorder";
import { ScriptText } from "./ScriptText";

type Recorder = ReturnType<typeof useRecorder>;

export function DeliverPanel({
  script,
  recorder,
  isAnalyzing,
  error,
  onStart,
  onFinish,
}: {
  script: ScriptItem;
  recorder: Recorder;
  isAnalyzing: boolean;
  error: string | null;
  onStart: () => void;
  onFinish: () => void;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const words = countWords(recorder.transcript);
  const wpm = recorder.seconds > 3 && words > 0 ? Math.round(words / (recorder.seconds / 60)) : null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Mic className="h-4 w-4 text-subtle" aria-hidden />
          Deliver the whole answer
        </h2>
        <div className="flex items-center gap-2">
          {recorder.isRecording ? (
            <>
              <Button variant="primary" onClick={onFinish}>
                <Square className="h-4 w-4" aria-hidden />
                Stop &amp; get feedback
              </Button>
              <Button variant="ghost" onClick={recorder.cancel} aria-label="Cancel recording">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onStart} disabled={isAnalyzing}>
              <Mic className="h-4 w-4" aria-hidden />
              {isAnalyzing ? "Analysing…" : "Start recording"}
            </Button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        {recorder.isRecording ? (
          <>
            <span className="flex items-center gap-2 font-medium text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden />
              Recording · {recorder.seconds}s
            </span>
            <span className="flex items-center gap-2">
              Mic level
              <span className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full bg-success transition-[width] duration-75"
                  style={{ width: `${Math.max(6, Math.round(recorder.level * 100))}%` }}
                />
              </span>
            </span>
            <span>Pace: {wpm ? `${wpm} wpm` : `aim for ~${script.masterCadenceWpm} wpm`}</span>
          </>
        ) : isAnalyzing ? (
          <span>Comparing your take with the model…</span>
        ) : (
          <span>Read the script aloud at a natural pace. Stop when you finish to get accent feedback.</span>
        )}
      </div>

      {(recorder.error || error) && <Alert tone="danger">{recorder.error ?? error}</Alert>}

      <ScriptText text={script.upgradedScript} stressedWords={script.stressedWords} spoken={recorder.transcript} />

      {script.originalRawSpoken && (
        <div className="text-sm">
          <button
            type="button"
            className="text-accent underline-offset-4 hover:underline cursor-pointer"
            onClick={() => setShowOriginal((v) => !v)}
            aria-expanded={showOriginal}
          >
            {showOriginal ? "Hide" : "Show"} what you originally said
          </button>
          {showOriginal && <p className="mt-2 font-serif italic text-muted">&ldquo;{script.originalRawSpoken}&rdquo;</p>}
        </div>
      )}
    </Card>
  );
}
