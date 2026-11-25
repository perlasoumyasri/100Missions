import { describe, expect, it } from "vitest";
import { buildAt, buildStages, layoutCallout, MARK_R, placeWords, type Slot } from "./callouts";

const desk = { w: 1440, h: 900, gutter: 75, top: 90, bottom: 80, phone: false };
const phone = { w: 390, h: 844, gutter: 20, top: 82, bottom: 88, phone: true };
const box = { w: 300, h: 80 };
const slot: Slot = { x: 0.5, y: 0.5, side: 1, up: true, phoneTop: 0.5 };

describe("layoutCallout", () => {
  it("keeps the words in their slot wherever the target goes", () => {
    const a = layoutCallout({ x: 100, y: 100 }, box, desk, slot);
    const b = layoutCallout({ x: 1300, y: 800 }, box, desk, slot);
    expect(a.text).toEqual({ x: 720, y: 370 });
    expect(b.text).toEqual(a.text);
    expect(b.corner).toEqual(a.corner);
  });

  it("hangs the words from the corner by side and direction", () => {
    const p = layoutCallout({ x: 0, y: 0 }, box, desk, { ...slot, side: -1, up: false });
    expect(p.text).toEqual({ x: 420, y: 450 });
    expect(p.corner).toEqual({ x: 720, y: 450 });
    expect(p.shelfOnTop).toBe(true);
    expect(p.origin).toBe(300);
  });

  it("places the words clear of the chapter's text, and the leader too", () => {
    const heading = { x: 380, y: 300, w: 500, h: 160 };
    const low = { ...slot, side: -1 as const, up: false, y: 0.36 };
    // The slot puts the words at (420, 324), on the heading; the nearest clear spot is just above it.
    expect(placeWords({ x: 300, y: 100 }, box, desk, low, [heading])).toEqual({ x: 420, y: 202 });
    // Already clear, with a clear leader: the slot stands.
    expect(placeWords({ x: 100, y: 100 }, box, desk, slot, [{ x: 0, y: 600, w: 100, h: 100 }])).toEqual({ x: 720, y: 370 });
    // Words clear, but the leader from a target below the heading would cross it: they move below it.
    const p = placeWords({ x: 700, y: 520 }, box, desk, { ...slot, x: 0.6, y: 0.3, up: true }, [{ x: 380, y: 280, w: 400, h: 160 }]);
    expect(p.y).toBeGreaterThanOrEqual(280 + 160);
    // The words, once placed, are where layoutCallout draws them.
    expect(layoutCallout({ x: 0, y: 0 }, box, desk, low, { x: 420, y: 202 }).text).toEqual({ x: 420, y: 202 });
  });

  it("stays inside the safe area", () => {
    for (const s of [{ ...slot, x: 0, y: 0 }, { ...slot, x: 1, y: 1, up: false }]) {
      const p = layoutCallout({ x: 0, y: 0 }, box, desk, s);
      expect(p.text.x).toBeGreaterThanOrEqual(desk.gutter);
      expect(p.text.x + box.w).toBeLessThanOrEqual(desk.w - desk.gutter);
      expect(p.text.y).toBeGreaterThanOrEqual(desk.top);
      expect(p.text.y + box.h).toBeLessThanOrEqual(desk.h - desk.bottom);
    }
  });

  it("on phones, fixes the words at their height and meets them under the target", () => {
    const p = layoutCallout({ x: 300, y: 100 }, { w: 350, h: 90 }, phone, { ...slot, phoneTop: 0.4 });
    expect(p.text).toEqual({ x: 20, y: 337.6 });
    expect(p.corner).toEqual({ x: 300, y: 337.6 });
    expect(p.origin).toBe(280);
  });

  it("starts the leader at the edge of the ring and ends it on the corner", () => {
    const t = { x: 300, y: 200 };
    const p = layoutCallout(t, box, desk, slot);
    expect(Math.hypot(p.leg.x - t.x, p.leg.y - t.y)).toBeCloseTo(MARK_R);
    expect(p.leg.x + Math.cos(p.leg.angle) * p.leg.length).toBeCloseTo(p.corner.x);
    expect(p.leg.y + Math.sin(p.leg.angle) * p.leg.length).toBeCloseTo(p.corner.y);
  });
});

describe("buildStages", () => {
  it("builds in order: ring, leader, then shelf", () => {
    expect(buildStages(0)).toEqual({ mark: 0, leg: 0, shelf: 0 });
    expect(buildStages(0.5).shelf).toBe(0);
    expect(buildStages(0.5).leg).toBeGreaterThan(0.5);
    expect(buildStages(1)).toEqual({ mark: 1, leg: 1, shelf: 1 });
  });
});

describe("buildAt", () => {
  it("builds the structure first, then all the words at once, within a second", () => {
    expect(buildAt(0)).toEqual({ structure: 0, text: 0 });
    expect(buildAt(0.25).text).toBe(0);
    expect(buildAt(0.25).structure).toBe(0.5);
    expect(buildAt(1)).toEqual({ structure: 1, text: 1 });
  });
});
