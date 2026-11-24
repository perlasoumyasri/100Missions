import { describe, expect, it } from "vitest";
import { TAKES, bedGains, levelTo, motion, onsetSeconds, resolveTake } from "./mix";

describe("resolveTake", () => {
  it("uses the default pick without audition picks", () => {
    expect(resolveTake("06-sonar")).toEqual({ take: "c", lufs: TAKES["06-sonar"].lufs.c, fromAudition: false });
  });
  it("lets an audition pick override the default, and ignores 'none' or junk", () => {
    expect(resolveTake("06-sonar", { "06-sonar": { pick: "a" } }).take).toBe("a");
    expect(resolveTake("06-sonar", { "06-sonar": { pick: "none" } }).take).toBe("c");
    expect(resolveTake("06-sonar", { "06-sonar": { pick: "" } }).fromAudition).toBe(false);
  });
});

describe("levelTo", () => {
  it("is unity at the target and +6 dB for a take 6 dB quiet", () => {
    expect(levelTo(-30, -30)).toBeCloseTo(1);
    expect(levelTo(-36, -30)).toBeCloseTo(2, 1);
  });
});

describe("bedGains", () => {
  it("is equal-power across a crossfade", () => {
    const g = bedGains({ space: 0.5, shaft: 0.5, ocean: 0 }, 2.4);
    expect(g.space ** 2 + g.shaft ** 2).toBeCloseTo(1, 2);
  });
  it("draws every bed back to near-silence just before the breakthrough", () => {
    const at = bedGains({ space: 0, shaft: 1, ocean: 0 }, 2.97);
    const before = bedGains({ space: 0, shaft: 1, ocean: 0 }, 2.8);
    expect(at.shaft).toBeLessThan(0.3);
    expect(before.shaft).toBeGreaterThan(0.99);
  });
});

describe("motion", () => {
  it("is dark and unboosted at rest, open while moving, and capped", () => {
    expect(motion(0)).toEqual({ cutoff: 1800, gain: 1 });
    expect(motion(-0.5).cutoff).toBeCloseTo(6000);
    expect(motion(5).cutoff).toBeCloseTo(6000);
  });
});

describe("onsetSeconds", () => {
  it("finds where a sound starts after leading silence", () => {
    const sr = 1000;
    const d = new Float32Array(1000);
    for (let i = 400; i < 600; i++) d[i] = Math.sin(i);
    expect(onsetSeconds(d, sr)).toBeCloseTo(0.39, 2);
  });
  it("is zero for silence or a sound that starts at once", () => {
    expect(onsetSeconds(new Float32Array(100), 1000)).toBe(0);
    expect(onsetSeconds(new Float32Array(100).fill(0.5), 1000)).toBe(0);
  });
});
