/**
 * NEREID's sound: short, clean tonal cues on the story's key moments (sound-design.md).
 *
 * Interim version (2026-11-24): the user found the procedural ambience and noise textures disturbing
 * ("they sound like disturbance"), so every noise-based layer was removed. What remains is a small
 * family of soft sine cues built on one motif. The plan is to replace these with recorded or generated
 * assets (see CLAUDE.md "Next").
 *
 * Sound is on by default as a preference, but no audio plays before the visitor's first click, tap or
 * key press (browsers forbid it, and so do the mission's standards). It suspends when the tab is hidden.
 */

export type CueId =
  | "expedition-start"
  | "arrival-lock"
  | "ice-breakthrough"
  | "sonar-emit"
  | "anomaly-lock"
  | "discovery-reveal"
  | "transmission"
  | "reset"
  | "ui-confirm";

const dB = (db: number) => 10 ** (db / 20);
// The motif: a rising fifth for confirmations (A4 → E5), widened to a sixth for discovery.
const MOTIF = { low: 440, high: 659.26 } as const;

export function buildEngine(ctx: BaseAudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const out = ctx.createGain();
  out.gain.value = dB(3.5); // puts the cues at the doc's targets: UI about −22, key moments −19 to −12 dBFS
  master.connect(limiter).connect(out).connect(ctx.destination);
  // A soft, short room so the tones bloom a little instead of stopping dead (no noise, no hiss).
  const room = ctx.createDelay(1);
  room.delayTime.value = 0.19;
  const roomTone = ctx.createBiquadFilter();
  roomTone.type = "lowpass";
  roomTone.frequency.value = 1400;
  const roomGain = ctx.createGain();
  roomGain.gain.value = 0.22;
  room.connect(roomTone).connect(roomGain).connect(master);
  roomGain.connect(room);

  const note = (at: number, freq: number, dur: number, peak: number, opts: { to?: number; attack?: number; pan?: number; type?: OscillatorType } = {}) => {
    const o = ctx.createOscillator();
    o.type = opts.type ?? "sine";
    o.frequency.setValueAtTime(freq, at);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = opts.pan ?? 0;
    o.connect(g).connect(p);
    p.connect(master);
    p.connect(room);
    o.start(at);
    o.stop(at + dur + 0.05);
  };

  const cues: Record<CueId, (t: number) => void> = {
    "expedition-start": (t) => {
      note(t, MOTIF.low, 0.35, dB(-20));
      note(t + 0.16, MOTIF.high, 0.5, dB(-21));
    },
    "arrival-lock": (t) => note(t, MOTIF.high, 0.4, dB(-24)),
    // The strongest moment: a deep, soft pressure release as the water opens.
    "ice-breakthrough": (t) => {
      note(t, 70, 2.2, dB(-12), { to: 46, attack: 0.08 });
      note(t + 0.1, 220, 1.6, dB(-26), { to: 196, attack: 0.3 });
    },
    // A rounded ping with three soft returns.
    "sonar-emit": (t) => {
      note(t, 1180, 0.25, dB(-16), { to: 1040, attack: 0.005 });
      for (const [dt, pan, db] of [
        [0.42, -0.45, -26],
        [0.78, 0.5, -30],
        [1.22, -0.2, -34],
      ] as const)
        note(t + dt, 1040, 0.3, dB(db), { to: 980, pan });
    },
    "anomaly-lock": (t) => {
      note(t, MOTIF.low, 0.25, dB(-19));
      note(t + 0.14, MOTIF.high, 0.4, dB(-19));
    },
    "discovery-reveal": (t) => {
      note(t, 146.83, 4.2, dB(-18), { type: "triangle", attack: 1.4 });
      note(t + 0.6, MOTIF.low, 3.6, dB(-24), { attack: 1.2 });
      note(t + 1.3, 739.99, 3.2, dB(-28), { attack: 1.1 });
    },
    "transmission": (t) => {
      for (let i = 0; i < 4; i++) note(t + i * 0.42, 880, 0.14, dB(-19 - i * 2));
      note(t + 1.8, MOTIF.low, 5, dB(-26), { attack: 0.8 });
      note(t + 2.2, 554.37, 5, dB(-29), { attack: 1 });
    },
    "reset": (t) => note(t, MOTIF.high, 0.3, dB(-22), { to: MOTIF.low * 0.75 }),
    "ui-confirm": (t) => note(t, MOTIF.high, 0.18, dB(-21)),
  };

  let lastCue: Partial<Record<CueId, number>> = {};
  return {
    master,
    playCue(id: CueId, at = ctx.currentTime) {
      if ((lastCue[id] ?? -1) > at - 0.4) return; // never retrigger within 0.4 s
      lastCue[id] = at;
      cues[id](at + 0.01);
    },
    fadeTo(level: number, seconds = 0.25) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(level, ctx.currentTime, seconds / 3);
    },
    resetCues() {
      lastCue = {};
    },
  };
}

type Engine = ReturnType<typeof buildEngine>;

export function createSound() {
  let ctx: AudioContext | null = null;
  let engine: Engine | null = null;
  let enabled = false;

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !enabled) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });

  return {
    get enabled() {
      return enabled;
    },
    /** Must run inside a user gesture (click, tap or key press). */
    async enable(confirm = false): Promise<boolean> {
      try {
        if (!ctx) {
          ctx = new AudioContext();
          engine = buildEngine(ctx);
        }
        await ctx.resume();
        enabled = ctx.state === "running";
        if (enabled) {
          engine!.fadeTo(1, 0.6);
          if (confirm) engine!.playCue("ui-confirm");
        }
      } catch {
        enabled = false;
      }
      return enabled;
    },
    disable() {
      enabled = false;
      engine?.fadeTo(0, 0.12); // fade at once, no cue after muting
      const c = ctx;
      setTimeout(() => !enabled && void c?.suspend(), 200);
    },
    cue(id: CueId) {
      if (!enabled || !engine) return;
      try {
        engine.playCue(id);
      } catch {
        // Audio must never break the expedition.
      }
    },
  };
}
