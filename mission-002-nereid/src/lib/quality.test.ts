import { describe, expect, it } from "vitest";
import { FrameBudget, initialTier, lowerTier, QualityGovernor, type Tier } from "./quality";

describe("quality", () => {
  it("picks a starting tier from device hints", () => {
    expect(initialTier({ coarsePointer: false, dpr: 1, cores: 10, memoryGb: 16 })).toBe("high");
    expect(initialTier({ coarsePointer: false, dpr: 2, cores: 8 })).toBe("medium");
    expect(initialTier({ coarsePointer: true, dpr: 3, cores: 8 })).toBe("medium");
    expect(initialTier({ coarsePointer: true, dpr: 3, cores: 4, memoryGb: 3 })).toBe("low");
  });

  it("steps down and stops at low", () => {
    expect(lowerTier("high")).toBe("medium");
    expect(lowerTier("medium")).toBe("low");
    expect(lowerTier("low")).toBeNull();
  });

  it("flags a slow window after warmup and ignores fast ones", () => {
    const fast = new FrameBudget(1000 / 50, 1, 0.75);
    let flagged = false;
    for (let i = 0; i < 400; i++) flagged ||= fast.push(1 / 60);
    expect(flagged).toBe(false);

    const slow = new FrameBudget(1000 / 50, 1, 0.75);
    let flaggedSlow = false;
    for (let i = 0; i < 200; i++) flaggedSlow ||= slow.push(1 / 30);
    expect(flaggedSlow).toBe(true);
  });

  it("ignores long pauses such as tab switches", () => {
    const b = new FrameBudget(1000 / 50, 1, 0);
    expect(b.push(3)).toBe(false);
  });

  it("reacts within about a second and a half to very slow frames", () => {
    const b = new FrameBudget();
    let t = 0;
    let flagged = false;
    while (!flagged && t < 5) {
      flagged = b.push(0.12);
      t += 0.12;
    }
    expect(flagged).toBe(true);
    expect(t).toBeLessThan(2);
  });

  it("keeps full quality under a frame-rate cap, but steps down when the GPU is the limit", () => {
    const simulate = (frameMs: (tier: Tier) => number) => {
      const g = new QualityGovernor("high");
      for (let i = 0; i < 600; i++) {
        const next = g.push(frameMs(g.tier) / 1000);
        if (next) g.tier = next;
      }
      return g.tier;
    };
    // Capped at 30 fps whatever the tier (battery saver): lowering quality buys nothing, so it goes back.
    expect(simulate(() => 33.3)).toBe("high");
    // GPU-bound at high, fine at medium: it steps down once and stays there.
    expect(simulate((t) => (t === "high" ? 33.3 : 16.7))).toBe("medium");
  });
});
