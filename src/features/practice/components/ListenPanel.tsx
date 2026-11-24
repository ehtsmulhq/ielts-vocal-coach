import { Headphones, Play, Square } from "lucide-react";
import type { ScriptItem } from "@/domain/contracts";
import { Button, Card } from "@/ui/primitives";
import type { ModelPlayer } from "../useModelPlayer";
import { ScriptText } from "./ScriptText";

export function ListenPanel({
  script,
  player,
  rate,
  onNext,
}: {
  script: ScriptItem;
  player: ModelPlayer;
  rate: number;
  onNext: () => void;
}) {
  const busy = player.isPlaying || player.isLoading;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Headphones className="h-4 w-4 text-subtle" aria-hidden />
          Listen to the British RP model
        </h2>
        <div className="flex gap-2">
          {busy ? (
            <Button variant="danger" onClick={player.stop}>
              <Square className="h-4 w-4" aria-hidden />
              {player.isLoading ? "Loading…" : "Stop"}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void player.playModel(script.upgradedScript, rate)}>
              <Play className="h-4 w-4" aria-hidden />
              Play model ({rate}x)
            </Button>
          )}
          <Button onClick={onNext}>Next: Shadow</Button>
        </div>
      </div>
      <p className="text-sm text-muted">
        Listen without speaking. Notice the underlined stressed words, where the voice pauses, and how the pitch rises
        and falls.
      </p>
      <ScriptText text={script.upgradedScript} stressedWords={script.stressedWords} />
    </Card>
  );
}
