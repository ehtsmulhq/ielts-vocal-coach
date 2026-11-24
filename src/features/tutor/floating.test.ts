import { describe, expect, it } from "vitest";
import { clampToViewport, nudge } from "./floating";

const viewport = { width: 1000, height: 800 };
const size = { width: 400, height: 360 };

describe("floating coach window", () => {
  it("keeps the window fully on screen with a margin", () => {
    expect(clampToViewport({ x: 300, y: 200 }, size, viewport)).toEqual({ x: 300, y: 200 });
    expect(clampToViewport({ x: -50, y: -20 }, size, viewport)).toEqual({ x: 8, y: 8 });
    expect(clampToViewport({ x: 900, y: 700 }, size, viewport)).toEqual({ x: 592, y: 432 });
  });

  it("never goes above the navbar", () => {
    expect(clampToViewport({ x: 300, y: 10 }, size, viewport, { top: 80 })).toEqual({ x: 300, y: 80 });
    expect(clampToViewport({ x: 300, y: 700 }, size, viewport, { top: 80 })).toEqual({ x: 300, y: 432 });
  });

  it("pins to the top-left when the window is bigger than the screen", () => {
    expect(clampToViewport({ x: 100, y: 100 }, { width: 500, height: 900 }, { width: 375, height: 600 })).toEqual({ x: 8, y: 8 });
  });

  it("moves in small or big steps with the arrow keys", () => {
    expect(nudge({ x: 100, y: 100 }, "ArrowLeft", false)).toEqual({ x: 76, y: 100 });
    expect(nudge({ x: 100, y: 100 }, "ArrowDown", true)).toEqual({ x: 100, y: 196 });
    expect(nudge({ x: 100, y: 100 }, "Enter", false)).toBeNull();
  });
});
