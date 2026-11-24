import { describe, expect, it } from "vitest";
import { buildAt, buildStages, layoutCallout, MARK_R, schedule, wordAt, type Slot } from "./callouts";

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

describe("schedule", () => {
  const pace = { structure: 6, line: 3, gap: 10, perWord: 1 };
  it("starts the first line once the structure is built, and takes longer for more words", () => {
    expect(schedule([{ words: 5, data: false }], pace)).toEqual({ windows: [[6, 14]], end: 14 });
  });
  it("pauses after each line; a reading comes up in a short beat", () => {
    const s = schedule(
      [
        { words: 6, data: true },
        { words: 10, data: false },
      ],
      pace,
    );
    expect(s.windows).toEqual([
      [6, 13], // reading: 3 + 4
      [23, 36], // after a 10 gap: 3 + 10 words
    ]);
    expect(s.end).toBe(36);
  });
  it("never lets two lines form at once", () => {
    const s = schedule(Array.from({ length: 4 }, () => ({ words: 3, data: false })), pace);
    for (let i = 1; i < s.windows.length; i++) expect(s.windows[i]![0]).toBeGreaterThan(s.windows[i - 1]![1]);
  });
});

describe("buildAt and wordAt", () => {
  const pace = { structure: 6, line: 3, gap: 10, perWord: 1 };
  const s = schedule(
    [
      { words: 2, data: false },
      { words: 2, data: false },
    ],
    pace,
  );
  it("shows the structure first, then line one, then line two", () => {
    expect(buildAt(3, s, pace)).toEqual({ structure: 0.5, lines: [0, 0] });
    expect(buildAt(11, s, pace).lines).toEqual([1, 0]);
    expect(buildAt(100, s, pace).lines).toEqual([1, 1]);
  });
  it("brings the words up in order, all whole at the end of the line", () => {
    expect(wordAt(0, 0, 4)).toBe(0);
    expect(wordAt(0.3, 0, 4)).toBeGreaterThan(wordAt(0.3, 2, 4));
    for (let j = 0; j < 4; j++) expect(wordAt(1, j, 4)).toBe(1);
  });
});
