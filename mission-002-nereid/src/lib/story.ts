/**
 * The expedition clock. Scroll sets a target story position (0..7, one unit per chapter);
 * a critically damped spring turns it into a smooth position P that never jumps.
 * It also runs the sonar, which is driven by scroll, not by a timer: as the visitor scrolls on through
 * the water, the ring spreads from the probe in step with them. Stop, and it holds; scroll back up, and
 * the glow gathers back into the probe, then releases one small ripple.
 */

export const CHAPTERS = 7;
export const ANOMALY_CHAPTER = 4; // 0-based: chapter 5
export const SOUND_SPEED_MS = 1500;
export const METRES_PER_UNIT = 25; // the ring crosses the visible water in about 1.5 s (still a real 1,500 m/s)
export const PULSE_SPEED = SOUND_SPEED_MS / METRES_PER_UNIT; // units per second (real 1,500 m/s)
export const PULSE_RANGE = 260;
export const PULSE_ORIGIN: readonly [number, number] = [0, 14];
export const ANOMALY: readonly [number, number] = [-24, -72];
export const ANOMALY_DISTANCE = Math.hypot(ANOMALY[0] - PULSE_ORIGIN[0], ANOMALY[1] - PULSE_ORIGIN[1]);

/** The sweep, in story position: from the end of First Contact (as the probe closes in) into The Anomaly. */
export const SWEEP: readonly [number, number] = [ANOMALY_CHAPTER - 0.08, ANOMALY_CHAPTER + 0.8];
/** Ring radius from sweep progress. Eased in, so the part of the sweep that's on screen gets most of the scroll. */
export const sweepRadius = (sweep: number) => PULSE_RANGE * sweep ** 1.5;
const SETTLE_RANGE = 40;
const OMEGA = 5.5; // spring stiffness: a little weight behind the camera (settles in about 0.85 s) without feeling laggy

export type PulseKind = "sweep" | "settle";
export interface Pulse {
  readonly start: number;
  readonly strength: number;
  readonly kind: PulseKind;
}

export type StoryEvent = { type: "chapter"; index: number } | { type: "pulse"; strength: number } | { type: "anomaly" };

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class Story {
  time = 0;
  /** Smoothed story position, 0..7. */
  p = 0;
  private velocity = 0;
  private target = 0;
  chapter = 0;
  pulse: Pulse | null = null;
  scanRadius = 0;
  scanAmount = 0;
  anomalyFound = false;
  /** Camera speed, story units per second (the spring's velocity). */
  get speed(): number {
    return this.velocity;
  }
  /** Sweep progress 0..1, from scroll. */
  sweep = 0;
  private events: StoryEvent[] = [];

  constructor(public reducedMotion = false) {}

  setTarget(p: number): void {
    this.target = Math.min(CHAPTERS, Math.max(0, p));
  }

  /** Jump without animation (used on load and when reduced motion is on). */
  snap(p: number): void {
    this.setTarget(p);
    this.p = this.target;
    this.velocity = 0;
  }

  step(dt: number): StoryEvent[] {
    dt = Math.min(Math.max(dt, 0), 0.1);
    this.time += dt;

    if (this.reducedMotion) {
      // No camera flight: hold each chapter's resting pose.
      const chapter = Math.floor(this.target);
      this.p = Math.min(CHAPTERS - 0.35, chapter + (chapter === 0 ? 0.15 : 0.62));
      this.velocity = 0;
    } else {
      // Semi-implicit Euler on a critically damped spring, in small substeps for stability.
      const steps = Math.ceil(dt / (1 / 120));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const accel = OMEGA * OMEGA * (this.target - this.p) - 2 * OMEGA * this.velocity;
        this.velocity += accel * h;
        this.p += this.velocity * h;
      }
    }

    const chapter = Math.min(CHAPTERS - 1, Math.max(0, Math.floor(this.p)));
    if (chapter !== this.chapter) {
      this.chapter = chapter;
      this.events.push({ type: "chapter", index: chapter });
    }

    this.stepSonar(dt);
    const out = this.events;
    this.events = [];
    return out;
  }

  private stepSonar(dt: number): void {
    const before = this.sweep;
    const leaving = smoothstep(CHAPTERS - 1.02, CHAPTERS - 0.85, this.p); // the ocean ends at the rewind
    this.sweep = Math.min(1, Math.max(0, (this.p - SWEEP[0]) / (SWEEP[1] - SWEEP[0])));
    if (before === 0 && this.sweep > 0) this.events.push({ type: "pulse", strength: 1 });

    if (this.sweep > 0 && this.sweep < 1) this.pulse = this.reducedMotion ? null : { start: this.time, strength: 1, kind: "sweep" };
    else if (this.pulse?.kind === "sweep") {
      // Gathered all the way back into the probe: one small ripple, then quiet.
      this.pulse = this.sweep === 0 && !this.reducedMotion ? { start: this.time, strength: 0.4, kind: "settle" } : null;
    }
    if (this.pulse?.kind === "settle" && this.pulseRadius() >= SETTLE_RANGE) this.pulse = null;

    // The mapped floor follows the ring out, and back in.
    this.scanRadius = sweepRadius(this.sweep);
    this.scanAmount = Math.min(1, this.sweep * 25) * (1 - leaving);
    const found = this.scanRadius >= ANOMALY_DISTANCE && this.scanAmount > 0;
    if (found && !this.anomalyFound) this.events.push({ type: "anomaly" });
    this.anomalyFound = found;
    void dt;
  }

  pulseRadius(): number {
    if (!this.pulse) return 0;
    if (this.pulse.kind === "sweep") return sweepRadius(this.sweep);
    return (this.time - this.pulse.start) * PULSE_SPEED;
  }

  pulseStrength(): number {
    if (!this.pulse) return 0;
    const r = this.pulseRadius();
    if (this.pulse.kind === "sweep") return (1 - this.sweep) ** 1.4 * Math.min(1, r / 6);
    const t = Math.min(1, r / SETTLE_RANGE);
    return this.pulse.strength * (1 - t) ** 1.4 * Math.min(1, r / 3);
  }

  /** Progress within chapter `index` (0 at its start, 1 at its end; can go outside 0..1). */
  local(index: number): number {
    return this.p - index;
  }
}
