import { describe, expect, it } from "vitest";
import { dailyActivity, recentAreaAverages, scoreSeries, weakestArea, weeklyTrend } from "./progress";
import type { Attempt } from "./attempt";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date(2026, 10, 24, 12).getTime();
const mk = (daysAgo: number, overall?: number, accuracy = 50, extra: Partial<Attempt["accent"]> = {}): Attempt => ({
  id: `a${daysAgo}-${overall}`,
  scriptId: "s",
  at: now - daysAgo * DAY,
  accuracy,
  wpm: 130,
  accent:
    overall === undefined
      ? undefined
      : { overall, stress: 70, rhythm: 70, intonation: 70, sounds: 70, ...extra },
});

describe("progress", () => {
  it("counts reps per day across the calendar window", () => {
    const days = dailyActivity([mk(0, 80), mk(0, 70), mk(2, 60), mk(40, 50)], new Date(now), 7);
    expect(days).toHaveLength(7);
    expect(days[6].reps).toBe(2);
    expect(days[4].reps).toBe(1);
    expect(days.reduce((s, d) => s + d.reps, 0)).toBe(3);
  });

  it("compares this week with last week", () => {
    const t = weeklyTrend([mk(1, 80), mk(3, 70), mk(9, 60)], now);
    expect(t).toEqual({ thisWeek: 75, lastWeek: 60 });
    expect(weeklyTrend([], now)).toEqual({ thisWeek: null, lastWeek: null });
  });

  it("finds the weakest accent area from recent scored attempts", () => {
    const avgs = recentAreaAverages([mk(2, 70, 50, { rhythm: 40 }), mk(1, 72, 50, { rhythm: 50 }), mk(0)]);
    expect(avgs?.rhythm).toBe(45);
    expect(weakestArea(avgs)).toBe("rhythm");
    expect(recentAreaAverages([mk(0)])).toBeNull();
    expect(weakestArea(null)).toBeNull();
  });

  it("builds a chart series from the latest attempts", () => {
    const series = scoreSeries([mk(3, 60), mk(2), mk(1, 82.4)], 2);
    expect(series.map((p) => p.score)).toEqual([50, 82]);
  });
});
