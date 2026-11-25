import { describe, expect, it } from "vitest";
import { buildAt, buildStages, layoutCallout, MARK_R, type Slot } from "./callouts";

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

  it("moves the words clear of the chapter's text, to the nearest clear spot", () => {
    const heading = { x: 380, y: 300, w: 500, h: 160 };
    const p = layoutCallout({ x: 0, y: 0 }, box, desk, { ...slot, side: -1, up: false, y: 0.36 }, [heading]);
    // The slot put the words at (420, 324), on the heading; the nearest clear spot is just above it.
    expect(p.text).toEqual({ x: 420, y: 202 });
    expect(p.corner).toEqual({ x: 720, y: 202 });
    // With no room above, the nearest clear spot is below it.
    const r = layoutCallout({ x: 0, y: 0 }, box, desk, { ...slot, side: -1, up: false, y: 0.36 }, [{ ...heading, y: 150, h: 310 }]);
    expect(r.text).toEqual({ x: 420, y: 478 });
    const q = layoutCallout({ x: 0, y: 0 }, box, desk, slot, [{ x: 0, y: 600, w: 100, h: 100 }]);
    expect(q.text).toEqual({ x: 720, y: 370 }); // already clear: unchanged
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
