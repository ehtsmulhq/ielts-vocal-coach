import { Mic, Play, Repeat, Square, Volume2 } from "lucide-react";
import { Alert, Button, Card, cn } from "@/ui/primitives";
import type { ModelPlayer } from "../useModelPlayer";
import type { useShadowLoop } from "../useShadowLoop";

type ShadowLoop = ReturnType<typeof useShadowLoop>;

export function ShadowPanel({
  chunks,
  loop,
  player,
  rate,
  onNext,
}: {
  chunks: string[];
  loop: ShadowLoop;
  player: ModelPlayer;
  rate: number;
  onNext: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Repeat className="h-4 w-4 text-subtle" aria-hidden />
          Shadow it, one breath at a time
        </h2>
        <div className="flex gap-2">
          {loop.running ? (
            <Button variant="danger" onClick={loop.stop}>
              <Square className="h-4 w-4" aria-hidden />
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void loop.run(0)}>
              <Play className="h-4 w-4" aria-hidden />
              Start shadowing
            </Button>
          )}
          <Button onClick={onNext} disabled={loop.running}>
            Next: Deliver
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        {loop.turnActive ? (
          <Alert tone="success" className="flex items-center gap-2 font-medium">
            <Mic className="h-4 w-4 animate-pulse" aria-hidden />
            Your turn: repeat what you just heard, copying the rhythm and stress.
          </Alert>
        ) : (
          <p className="text-sm text-muted">
            The model speaks a phrase, then it&apos;s your turn straight away. Match the music, not just the words.
            Headphones stop the model being picked up by your mic.
          </p>
        )}
      </div>

      {loop.error && <Alert tone="danger">{loop.error}</Alert>}

      <ol className="space-y-2">
        {chunks.map((chunk, i) => (
          <li
            key={i}
            aria-current={loop.activeChunk === i ? "step" : undefined}
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border p-3 transition-colors",
              loop.activeChunk === i ? "border-accent bg-accent-soft" : "border-line bg-surface-2/50"
            )}
          >
            <span className="min-w-[12rem] flex-1 font-serif">
              <span className="mr-2 text-xs tabular-nums text-subtle">{i + 1}</span>
              {chunk}
            </span>
            <span className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                disabled={loop.running}
                onClick={() => void player.playModel(chunk, rate)}
                aria-label={`Play model for phrase ${i + 1}`}
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                Model
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={loop.running}
                onClick={() => void loop.run(i, true)}
                aria-label={`Shadow phrase ${i + 1} again`}
              >
                <Repeat className="h-3.5 w-3.5" aria-hidden />
                Repeat
              </Button>
              {loop.takes[i] && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loop.running}
                  onClick={() => void player.playUrl(loop.takes[i])}
                  aria-label={`Play your take of phrase ${i + 1}`}
                  className="text-success"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  You
                </Button>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
