"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, ButtonLink, scoreTone } from "@/ui/primitives";
import { useScriptVault, useHasCaptured } from "@/features/shared/stores";
import { buildPacks, scriptLabel } from "./catalog";

export function LibraryScreen() {
  const vault = useScriptVault();
  const hasCaptured = useHasCaptured();
  const packs = useMemo(() => buildPacks(vault.items, hasCaptured), [vault.items, hasCaptured]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold">Library</h1>
        <p className="max-w-2xl text-muted">
          Pick a script to shadow. Repeating the same script many times is the point: that is how the accent becomes
          automatic.
        </p>
      </header>

      {packs.map((pack) => (
        <section key={pack.id} className="space-y-4" aria-labelledby={`pack-${pack.id}`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id={`pack-${pack.id}`} className="text-xl font-semibold">
                {pack.name} <span className="text-base font-normal text-subtle">({pack.scripts.length})</span>
              </h2>
              <p className="text-sm text-muted">{pack.description}</p>
            </div>
            {pack.id === "mine" && <ButtonLink href="/capture" size="sm">Capture new scripts</ButtonLink>}
          </div>

          {pack.scripts.length === 0 && (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line p-6 text-center text-sm text-muted">
              No personal scripts yet. Answer a short spoken interview and your own answers become scripts to shadow.
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {pack.scripts.map((script) => {
              const stats = vault.itemStats?.[script.id];
              return (
                <li key={script.id}>
                  <Link
                    href={`/practice/${script.id}`}
                    className="group flex h-full flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-subtle">{scriptLabel(script)}</p>
                      <p className="font-serif font-semibold leading-snug">{script.question}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex gap-2">
                        {stats?.reps ? (
                          <Badge>
                            {stats.reps} {stats.reps === 1 ? "rep" : "reps"}
                          </Badge>
                        ) : (
                          <Badge tone="accent">New</Badge>
                        )}
                        {stats?.bestAccentScore ? (
                          <Badge tone={scoreTone(stats.bestAccentScore)}>best {Math.round(stats.bestAccentScore)}</Badge>
                        ) : null}
                      </span>
                      <ArrowRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
