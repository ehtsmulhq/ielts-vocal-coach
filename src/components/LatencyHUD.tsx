"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { NetworkTelemetry } from "@/lib/types";
import { Activity, X, Terminal, Cpu } from "lucide-react";

const emptySubscribe = () => () => {};

interface LatencyHUDProps {
  telemetry: NetworkTelemetry | null;
  activeModelName?: string;
}

export function LatencyHUD({ telemetry, activeModelName }: LatencyHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!telemetry) return null;

  return (
    <>
      {/* Compact Status Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
        title="View live network latency and telemetry"
      >
        <Activity className="w-3 h-3 text-zinc-500" />
        <span>RTT: {telemetry.pingMs}ms</span>
        <span className="text-zinc-400">|</span>
        <span>TTFB: {telemetry.ttfbMs ? `${(telemetry.ttfbMs / 1000).toFixed(1)}s` : "—"}</span>
        <span className="text-zinc-400">|</span>
        <span>{telemetry.bufferUnderruns === 0 ? "0 DROPS" : `${telemetry.bufferUnderruns} DROPS`}</span>
      </button>

      {/* Expanded Modal Diagnostic Inspector */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Audio Stream and Latency Diagnostics"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
          >
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-bold uppercase text-zinc-900 dark:text-zinc-100">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  <span>SYSTEM TELEMETRY DIAGNOSTICS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-1 font-sans text-xs">
                <div className="font-mono text-[10px] uppercase font-bold text-zinc-500">
                  DIAGNOSTIC HEALTH: {telemetry.quality.toUpperCase()}
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {telemetry.diagnosis}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="text-[10px] text-zinc-400 uppercase">NETWORK PING (RTT)</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {telemetry.pingMs} ms
                  </div>
                </div>

                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="text-[10px] text-zinc-400 uppercase">TURNAROUND (TTFB)</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {telemetry.ttfbMs ? `${(telemetry.ttfbMs / 1000).toFixed(2)} s` : "—"}
                  </div>
                </div>

                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="text-[10px] text-zinc-400 uppercase">BUFFER DROPOUTS</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {telemetry.bufferUnderruns} ({telemetry.lossRatePercent}%)
                  </div>
                </div>

                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="text-[10px] text-zinc-400 uppercase">SAMPLE RATE</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    24.0 kHz PCM
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {activeModelName || "Gemini 3.1 Flash Live"}
                </span>
                <span>STATUS: OPERATIONAL</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
