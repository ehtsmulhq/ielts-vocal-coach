export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Keeps a floating window fully on screen, with a small margin, and never
 * above `top` (so it can't cover the navbar). Prefers showing the top-left if
 * it can't fit.
 */
export function clampToViewport(
  p: Point,
  size: Size,
  viewport: Size,
  { margin = 8, top }: { margin?: number; top?: number } = {}
): Point {
  top ??= margin;
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(top, viewport.height - size.height - margin);
  return {
    x: Math.round(Math.min(Math.max(p.x, margin), maxX)),
    y: Math.round(Math.min(Math.max(p.y, top), maxY)),
  };
}

/** Arrow-key nudges for moving the window from the keyboard. */
export function nudge(p: Point, key: string, big: boolean): Point | null {
  const step = big ? 96 : 24;
  switch (key) {
    case "ArrowLeft":
      return { x: p.x - step, y: p.y };
    case "ArrowRight":
      return { x: p.x + step, y: p.y };
    case "ArrowUp":
      return { x: p.x, y: p.y - step };
    case "ArrowDown":
      return { x: p.x, y: p.y + step };
    default:
      return null;
  }
}
