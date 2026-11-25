/**
 * Callouts: short lines of the narrative pinned to things in the scene with an engraved leader, in the
 * manner of the Golden Record's diagrams (a hairline from a small ring on the target to a shelf the words
 * sit on). Layout is pure and tested; main.ts projects the targets and drives the build.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Viewport {
  w: number;
  h: number;
  /** Side margin, px. */
  gutter: number;
  /** Space kept clear at the top (masthead) and bottom (fine print), px. */
  top: number;
  bottom: number;
  /** Narrow screens: the words stack under (or over) their marker instead of hanging to one side. */
  phone: boolean;
}

export interface Placement {
  /** Top-left of the text block. */
  text: Pt;
  /** Where the leader meets the shelf. */
  corner: Pt;
  /** The shelf runs along the top edge of the block (words below it) instead of the bottom. */
  shelfOnTop: boolean;
  /** Distance from the block's left edge to the corner: the shelf and the words grow from there. */
  origin: number;
  /** Leader from the edge of the ring to the corner. */
  leg: { x: number; y: number; length: number; angle: number };
}

/** A rectangle on screen, px (the chapter's own text: heading, label, status line, narrative). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Space kept between a callout's words and the chapter's text, px. */
export const CLEAR = 18;

/** Radius of the target ring, px: the leader starts at its edge. */
export const MARK_R = 5;

/** Where a callout's words sit. They never move: only the leader follows the target. */
export interface Slot {
  /** Desktop: the corner the leader meets, as fractions of the viewport. */
  x: number;
  y: number;
  /** Desktop: the words hang to the right of the corner (1) or to its left (-1), above it or below it. */
  side: 1 | -1;
  up: boolean;
  /** Phones: the top of the words, as a fraction of the viewport height (full width between the gutters). */
  phoneTop: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), Math.max(lo, hi));

/**
 * Place a callout. The words sit in a fixed slot (clamped into the safe area); the leader runs from the
 * target to the shelf. On phones the leader meets the top of the words under the target's x.
 */
export function layoutCallout(t: Pt, box: { w: number; h: number }, vp: Viewport, slot: Slot, words?: Pt): Placement {
  const minX = vp.gutter;
  const maxX = vp.w - vp.gutter - box.w;
  const minY = vp.top;
  const maxY = vp.h - vp.bottom - box.h;
  let text: Pt;
  let corner: Pt;
  let shelfOnTop: boolean;
  if (vp.phone) {
    text = { x: clamp((vp.w - box.w) / 2, minX, maxX), y: clamp(slot.phoneTop * vp.h, minY, maxY) };
    shelfOnTop = true;
    corner = { x: clamp(t.x, text.x, text.x + box.w), y: text.y };
  } else {
    const cx = slot.x * vp.w;
    const cy = slot.y * vp.h;
    text = {
      x: clamp(slot.side > 0 ? cx : cx - box.w, minX, maxX),
      y: clamp(slot.up ? cy - box.h : cy, minY, maxY),
    };
    shelfOnTop = !slot.up;
    if (words) text = words;
    corner = { x: slot.side > 0 ? text.x : text.x + box.w, y: shelfOnTop ? text.y : text.y + box.h };
  }

  const dx = corner.x - t.x;
  const dy = corner.y - t.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const ux = dist > 0 ? dx / dist : 0;
  const uy = dist > 0 ? dy / dist : 1;
  return {
    text,
    corner,
    shelfOnTop,
    origin: corner.x - text.x,
    leg: { x: t.x + ux * MARK_R, y: t.y + uy * MARK_R, length: Math.max(0, dist - MARK_R), angle },
  };
}

const hits = (a: Pt, box: { w: number; h: number }, r: Rect) =>
  a.x < r.x + r.w + CLEAR && a.x + box.w > r.x - CLEAR && a.y < r.y + r.h + CLEAR && a.y + box.h > r.y - CLEAR;

/** Does the straight leader from a to b pass through r (with a few px to spare)? */
const crosses = (a: Pt, b: Pt, r: Rect) => {
  for (let i = 1; i < 32; i++) {
    const x = a.x + ((b.x - a.x) * i) / 32;
    const y = a.y + ((b.y - a.y) * i) / 32;
    if (x > r.x - 6 && x < r.x + r.w + 6 && y > r.y - 6 && y < r.y + r.h + 6) return true;
  }
  return false;
};

/**
 * Where a callout's words go when it first appears (desktop): its slot, unless the words or the leader
 * from the target would cross the chapter's text (heading, label, status, narrative), which a wide but
 * short window or a target sitting by the heading can cause. Then the nearest spot right of, above or
 * below that text where both are clear. The caller keeps the answer while the callout shows, so the
 * words never move; only the leader follows the target.
 */
export function placeWords(t: Pt, box: { w: number; h: number }, vp: Viewport, slot: Slot, keepClear: Rect[]): Pt {
  const home = layoutCallout(t, box, vp, slot).text;
  if (vp.phone || keepClear.length === 0) return home;
  const minX = vp.gutter;
  const maxX = vp.w - vp.gutter - box.w;
  const minY = vp.top;
  const maxY = vp.h - vp.bottom - box.h;
  const options: Pt[] = [home];
  for (const r of keepClear) {
    options.push({ x: r.x + r.w + CLEAR, y: home.y }, { x: home.x, y: r.y - CLEAR - box.h }, { x: home.x, y: r.y + r.h + CLEAR });
  }
  let best = home;
  let bestScore = Infinity;
  for (const o of options) {
    if (o.x < minX - 0.5 || o.x > maxX + 0.5 || o.y < minY - 0.5 || o.y > maxY + 0.5) continue;
    if (keepClear.some((r) => hits(o, box, r))) continue;
    const corner = layoutCallout(t, box, vp, slot, o).corner;
    const score = Math.hypot(o.x - home.x, o.y - home.y) + (keepClear.some((r) => crosses(t, corner, r)) ? 1e5 : 0);
    if (score < bestScore) [best, bestScore] = [o, score];
  }
  return best;
}

const step = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** How a callout's structure builds from k = 0 to 1: ring, then leader, then shelf. */
export function buildStages(k: number) {
  const s = (a: number, b: number) => step((k - a) / (b - a));
  return { mark: s(0, 0.3), leg: s(0.15, 0.75), shelf: s(0.55, 1) };
}

/**
 * Once the scroll reaches a callout, it builds in time and comes up whole: ring, leader and shelf in half
 * a second, then all its words at once, and it stays until its chapter hands over. (Words that came up
 * one by one were still arriving when visitors scrolled on, so they never got to read them.)
 */
export const STRUCTURE_S = 0.5;
export const TEXT_S = 0.5;
export function buildAt(x: number) {
  return { structure: Math.min(1, Math.max(0, x / STRUCTURE_S)), text: step((x - STRUCTURE_S * 0.7) / TEXT_S) };
}

/** Seconds to read `words` words that appeared at once, before the next thing comes. */
export const readSeconds = (words: number) => 1 + words * 0.26;
