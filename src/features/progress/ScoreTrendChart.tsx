"use client";

import { useEffect, useRef, useState } from "react";

export interface TrendPoint {
  at: number;
  score: number;
  label: string;
}

const W = 640;
const H = 220;
const BASE_PAD = { top: 16, right: 40, bottom: 28, left: 36 };
const GRID = [0, 25, 50, 75, 100];

const fmtDate = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Single-series line chart of headline scores, oldest to newest. No legend (the
 * title names the series), a recessive grid, a direct label on the latest value,
 * a crosshair tooltip on hover/focus, and a table view for screen readers.
 */
export function ScoreTrendChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // The SVG scales with its container; scale text and margins back up on narrow screens so labels stay ~12px.
  const boxRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setK(Math.min(2.2, Math.max(1, W / Math.max(1, el.clientWidth))));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fs = 12 * k;
  const PAD = { top: BASE_PAD.top, right: BASE_PAD.right * k, bottom: BASE_PAD.bottom * k, left: BASE_PAD.left * k };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (score: number) => PAD.top + innerH - (score / 100) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const active = hover !== null ? points[hover] : null;
  const slot = points.length > 1 ? innerW / (points.length - 1) : innerW;

  return (
    <figure className="space-y-3">
      <div ref={boxRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Score trend over your last ${points.length} scored reps, latest ${last.score}`}
          onMouseLeave={() => setHover(null)}
        >
          {GRID.map((g) => (
            <g key={g}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(g)} dy="0.35em" textAnchor="end" fontSize={fs} fill="var(--subtle)">
                {g}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} fontSize={fs} fill="var(--subtle)">
            {fmtDate(points[0].at)}
          </text>
          {points.length > 1 && (
            <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={fs} fill="var(--subtle)">
              {fmtDate(last.at)}
            </text>
          )}

          {active && hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--line-strong)" strokeWidth={1} />
          )}

          <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.score)}
              r={hover === i ? 5 : 4}
              fill="var(--series-1)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
          <text x={x(points.length - 1) + 8} y={y(last.score)} dy="0.35em" fontSize={fs} fontWeight={600} fill="var(--fg)">
            {last.score}
          </text>

          {/* Hit targets wider than the marks */}
          {points.map((p, i) => (
            <rect
              key={`hit-${i}`}
              x={x(i) - slot / 2}
              y={PAD.top}
              width={Math.max(slot, 12)}
              height={innerH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${fmtDate(p.at)}: ${p.score} (${p.label})`}
              onMouseEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </svg>

        {active && hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-xs shadow-md"
            style={{ left: `${Math.min(85, Math.max(15, (x(hover) / W) * 100))}%`, top: `${(y(active.score) / H) * 100}%`, marginTop: -10 }}
          >
            <p className="font-semibold tabular-nums">{active.score}</p>
            <p className="text-muted">{active.label}</p>
            <p className="text-subtle">{fmtDate(active.at)}</p>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer py-2.5 text-muted hover:text-fg sm:py-0">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-subtle">
            <tr>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Script</th>
              <th className="py-1 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1">{fmtDate(p.at)}</td>
                <td className="py-1">{p.label}</td>
                <td className="py-1 text-right tabular-nums">{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
