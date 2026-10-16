"use client";

import { STAGES, type Stage } from "@/lib/types";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface StageStepperProps {
  currentStage: Stage;
  onSelectStage?: (stage: Stage) => void;
  disabled?: boolean;
}

export function StageStepper({ currentStage, onSelectStage, disabled }: StageStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <nav className="w-full flex items-center justify-between gap-2 px-2 py-3 border-b border-slate-200/80 dark:border-zinc-800">
      {STAGES.map((stage, idx) => {
        const isCurrent = stage.id === currentStage;
        const isPast = idx < currentIndex;

        return (
          <div key={stage.id} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectStage?.(stage.id)}
              className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-500/40"
                  : isPast
                  ? "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  : "text-slate-400 dark:text-zinc-600 cursor-default"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold transition-colors ${
                  isCurrent
                    ? "bg-indigo-600 text-white"
                    : isPast
                    ? "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                    : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : idx + 1}
              </span>
              <div className="flex flex-col text-left">
                <span className="font-semibold leading-tight">{stage.label}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">{stage.hint}</span>
              </div>
            </button>
            {idx < STAGES.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-300 dark:text-zinc-700 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
