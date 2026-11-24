import { describe, expect, it } from "vitest";
import { ANOMALY_CHAPTER, ANOMALY_DISTANCE, PULSE_RANGE, Story, SWEEP, sweepRadius, type StoryEvent } from "./story";

function run(s: Story, seconds: number, dt = 1 / 60): StoryEvent[] {
  const events: StoryEvent[] = [];
  for (let t = 0; t < seconds; t += dt) events.push(...s.step(dt));
  return events;
}

describe("Story", () => {
  it("follows scroll smoothly, without overshoot", () => {
    const s = new Story();
    s.setTarget(3);
    let max = 0;
    let prev = 0;
    let maxStep = 0;
    for (let i = 0; i < 240; i++) {
      s.step(1 / 60);
      max = Math.max(max, s.p);
      maxStep = Math.max(maxStep, s.p - prev);
      prev = s.p;
    }
    expect(s.p).toBeCloseTo(3, 2);
    expect(max).toBeLessThan(3.001); // critically damped: never passes the target
    expect(maxStep).toBeLessThan(0.14); // no frame-to-frame jumps (peak speed of a critically damped spring: 3·ω/e·dt ≈ 0.13)
  });

  it("reports chapter changes", () => {
    const s = new Story();
    s.setTarget(2.5);
    const chapters = run(s, 3).filter((e) => e.type === "chapter").map((e) => (e as { index: number }).index);
    expect(chapters).toEqual([1, 2]);
  });

  it("spreads the sonar ring with scroll: it holds when scrolling stops, and finds the anomaly on the way", () => {
    const s = new Story();
    s.snap(SWEEP[0] - 0.1);
    const ev: StoryEvent[] = [];
    const at = (p: number) => {
      s.setTarget(p);
      ev.push(...run(s, 2));
      return s.pulseRadius();
    };
    const r1 = at(SWEEP[0] + 0.2);
    expect(ev.filter((e) => e.type === "pulse")).toHaveLength(1);
    expect(r1).toBeCloseTo(sweepRadius(0.2 / (SWEEP[1] - SWEEP[0])), 0);
    expect(r1).toBeLessThan(PULSE_RANGE);
    expect(at(SWEEP[0] + 0.2)).toBeCloseTo(r1, 1); // no scroll, no movement (beyond the spring settling)
    expect(s.anomalyFound).toBe(r1 >= ANOMALY_DISTANCE);
    at(SWEEP[0] + 0.6);
    expect(s.anomalyFound).toBe(true);
    expect(ev.filter((e) => e.type === "anomaly")).toHaveLength(1);
    expect(ev.filter((e) => e.type === "pulse")).toHaveLength(1); // one ping per dive, never per scroll tick
  });

  it("gathers the glow back into the probe when scrolling back up, then settles and clears", () => {
    const s = new Story();
    s.snap(ANOMALY_CHAPTER + 0.5);
    run(s, 1);
    s.setTarget(SWEEP[0] - 0.4);
    let prev = Infinity;
    let shrinking = true;
    let sawSettle = false;
    for (let i = 0; i < 300; i++) {
      s.step(1 / 60);
      if (s.pulse?.kind === "sweep") {
        if (s.pulseRadius() > prev + 1e-9) shrinking = false;
        prev = s.pulseRadius();
      }
      if (s.pulse?.kind === "settle") sawSettle = true;
    }
    expect(shrinking).toBe(true);
    expect(sawSettle).toBe(true);
    expect(s.pulse).toBeNull();
    expect(s.scanAmount).toBe(0);
    expect(s.anomalyFound).toBe(false);
  });

  it("holds a still pose per chapter with reduced motion, and completes the scan without a ring", () => {
    const s = new Story(true);
    s.setTarget(ANOMALY_CHAPTER + 0.1);
    run(s, 1);
    expect(s.p).toBeCloseTo(ANOMALY_CHAPTER + 0.62, 5);
    expect(s.pulse).toBeNull();
    expect(s.scanAmount).toBe(1);
    expect(s.anomalyFound).toBe(true);
    s.setTarget(0.4);
    run(s, 0.2);
    expect(s.p).toBeCloseTo(0.15, 5); // the Opening rests early so its title stays whole
  });
});
