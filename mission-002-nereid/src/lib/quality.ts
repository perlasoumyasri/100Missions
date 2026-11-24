export type Tier = "high" | "medium" | "low";

export interface TierSettings {
  /** Cap on the device-pixel ratio used for the scene and bloom passes. */
  readonly maxDpr: number;
  /** Extra scale on the scene passes after the DPR cap. */
  readonly renderScale: number;
  /** Draw every Nth particle on each axis (1 = all 262,144). */
  readonly stride: number;
  /** Run the FFT simulation every Nth frame. The swell is slow, so 30 Hz is enough; particles still draw every frame. */
  readonly simEvery: number;
  /** First bloom level size as a fraction of the scene (2 = half, 4 = quarter). */
  readonly bloomDivisor: number;
  /** Resolution of the procedural space and ice world relative to the scene. Its detail is soft, so it upscales well. */
  readonly worldScale: number;
}

// Measured on an M1 MacBook Air at 2× DPR: the FFT and the half-res bloom each cost about half a frame,
// so the lower tiers halve the simulation rate and start bloom at quarter resolution.
export const TIERS: Record<Tier, TierSettings> = {
  high: { maxDpr: 1.5, renderScale: 1, stride: 1, simEvery: 1, bloomDivisor: 2, worldScale: 0.75 },
  medium: { maxDpr: 1.25, renderScale: 0.9, stride: 1, simEvery: 2, bloomDivisor: 4, worldScale: 0.6 },
  low: { maxDpr: 1, renderScale: 0.8, stride: 2, simEvery: 2, bloomDivisor: 4, worldScale: 0.5 },
};

const ORDER: Tier[] = ["high", "medium", "low"];

export interface DeviceHints {
  readonly coarsePointer: boolean;
  readonly dpr: number;
  readonly cores?: number;
  readonly memoryGb?: number;
}

export function initialTier(hints: DeviceHints): Tier {
  if ((hints.cores ?? 8) <= 4 && (hints.memoryGb ?? 8) <= 4) return "low";
  if (hints.coarsePointer || hints.dpr >= 2) return "medium";
  return "high";
}

export function lowerTier(tier: Tier): Tier | null {
  return ORDER[ORDER.indexOf(tier) + 1] ?? null;
}

/**
 * Watches frame times and asks for a lower tier when the average over a short window
 * stays above budget. It only ever steps down, so quality never oscillates.
 */
export class FrameBudget {
  private elapsed = 0;
  private frames = 0;
  private sum = 0;
  /** True on the frame a measuring window completes; its average is in lastAvgMs. */
  windowDone = false;
  lastAvgMs = 0;

  constructor(
    private readonly budgetMs = 1000 / 50,
    private readonly windowS = 1,
    private warmupS = 0.75,
  ) {}

  /** Returns true when the last full window was over budget. */
  push(dtS: number): boolean {
    this.windowDone = false;
    if (dtS <= 0 || dtS > 1) return false; // ignore pauses and tab switches, but count slow frames
    if (this.warmupS > 0) {
      this.warmupS -= dtS;
      return false;
    }
    this.elapsed += dtS;
    this.frames += 1;
    this.sum += dtS;
    if (this.elapsed < this.windowS) return false;
    const avgMs = (this.sum / this.frames) * 1000;
    this.elapsed = this.frames = this.sum = 0;
    this.windowDone = true;
    this.lastAvgMs = avgMs;
    if (avgMs > this.budgetMs) {
      this.warmupS = 0.5; // let the new tier settle before judging it
      return true;
    }
    return false;
  }
}

/**
 * Decides tier changes. It steps down when frames are over budget, then checks that the step helped.
 * If the frame time didn't improve, the limit was never the GPU: it's a frame-rate cap (Chrome's
 * Energy Saver holds pages at 30 fps on battery). It restores the previous tier and stops adjusting,
 * so a capped visitor keeps full quality.
 */
export class QualityGovernor {
  private probe: { from: Tier; avgMs: number } | null = null;
  private settled = false;

  constructor(
    public tier: Tier,
    private readonly budget = new FrameBudget(),
  ) {}

  /** Returns the tier to switch to, or null to keep the current one. */
  push(dtS: number): Tier | null {
    const over = this.budget.push(dtS);
    if (!this.budget.windowDone) return null;
    if (this.probe) {
      const { from, avgMs } = this.probe;
      this.probe = null;
      if (this.budget.lastAvgMs > avgMs * 0.85) {
        this.settled = true;
        this.tier = from;
        return from;
      }
    }
    if (!over || this.settled) return null;
    const next = lowerTier(this.tier);
    if (!next) return null;
    this.probe = { from: this.tier, avgMs: this.budget.lastAvgMs };
    this.tier = next;
    return next;
  }
}
