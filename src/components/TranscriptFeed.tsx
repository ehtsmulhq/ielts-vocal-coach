"use client";

import { useEffect, useRef, useState } from "react";
import type { TranscriptEntry } from "@/lib/types";
import { Copy, Check, Volume2, Square, Terminal } from "lucide-react";

interface TranscriptFeedProps {
  entries: TranscriptEntry[];
  onReplay?: (text: string) => void;
  onStopReplay?: () => void;
  isCoachSpeaking?: boolean;
}

export function TranscriptFeed({
  entries,
  onReplay,
  onStopReplay,
  isCoachSpeaking,
}: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedReplayId, setSelectedReplayId] = useState<number | null>(null);

  const activeReplayId = isCoachSpeaking ? selectedReplayId : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const handleCopy = () => {
    const text = entries
      .map((e) => `[${e.stage.toUpperCase()}] ${e.role.toUpperCase()}: ${e.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayMessage = (entry: TranscriptEntry) => {
    if (activeReplayId === entry.id) {
      onStopReplay?.();
      setSelectedReplayId(null);
    } else {
      setSelectedReplayId(entry.id);
      onReplay?.(entry.text);
    }
  };

  return (
    <div className="w-full flex flex-col h-[400px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 overflow-hidden font-sans">
      {/* Journal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span>PHONETIC TRANSCRIPTION JOURNAL</span>
        </div>

        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title="Copy transcript text"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "[ COPIED ]" : "[ COPY TRANSCRIPT ]"}</span>
            </button>
          )}
          <span>{entries.length} TURNS</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1 scrollbar-thin">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-600 font-mono text-xs space-y-2">
            <p>[ ACOUSTIC LOG STANDBY — WAITING FOR AUDIO INPUT ]</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isTutor = entry.role === "tutor";
            const isPlayingThis = activeReplayId === entry.id && isCoachSpeaking;

            return (
              <div
                key={entry.id}
                className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        isTutor ? "text-zinc-900 dark:text-zinc-100" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isTutor ? "[ EXAMINER / COACH ]" : "[ CANDIDATE ]"}
                    </span>
                    <span className="opacity-60">• {entry.stage}</span>
                  </div>
                  <span>ID: {entry.id}</span>
                </div>

                <p className="font-serif text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                  {entry.text}
                </p>

                {/* Replay Vocal Correction */}
                {isTutor && onReplay && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => handlePlayMessage(entry)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border uppercase font-bold transition-all cursor-pointer ${
                        isPlayingThis
                          ? "bg-rose-900 text-white border-rose-900"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>STOP REPLAY</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-zinc-500" />
                          <span>[ REPLAY PHONETIC AUDIO ]</span>
                        </>
                      )}
                    </button>

                    <span className="text-zinc-400">
                      {entry.text.split(/\s+/).filter(Boolean).length} WORDS
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
