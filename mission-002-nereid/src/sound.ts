/**
 * NEREID's sound (sound-design.md). One engine, all procedural Web Audio: no files to load.
 *
 *   ambience  one quiet bed per world (space, ice, ocean, warm vents), crossfaded with equal power
 *             from the director's world weights, so the sound changes exactly where the picture does
 *   traversal filtered noise that follows the camera's smoothed speed: it rises gently while moving
 *             and fades within about half a second of stopping; narrow and dark in the ice, wide in water
 *   events    one-shot cues tied to real story events (the breakthrough, the sonar, the vents...),
 *             each fired once per pass and re-armed only after scrolling well back
 *   ui        the Begin, Replay and Sound-on confirmations
 *
 * Nothing exists until the visitor turns sound on (a user gesture). Starts muted; suspends when the
 * tab is hidden. Audio failures never touch the visuals.
 */

export type CueId =
  | "expedition-start"
  | "arrival-lock"
  | "ice-breakthrough"
  | "sonar-emit"
  | "sonar-return"
  | "anomaly-lock"
  | "discovery-reveal"
  | "transmission"
  | "reset"
  | "ui-confirm";

export interface SceneMix {
  space: number;
  shaft: number;
  ocean: number;
  /** Vent field presence 0..1. */
  warm: number;
  /** Transmission progress 0..1 (the ocean bed thins out as it rises). */
  signal: number;
}

const dB = (db: number) => 10 ** (db / 20);
// The motif: a rising fifth for confirmations (A4 → E5), widened to a slower sixth for discovery.
const MOTIF = { low: 440, high: 659.26 } as const;

/** Builds the engine on any audio context (an OfflineAudioContext is used to measure levels). */
export function buildEngine(ctx: BaseAudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  // A gentle peak limiter: catches stacked cues, keeps the sum under −1 dBFS.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const out = ctx.createGain();
  out.gain.value = dB(-1.5);
  master.connect(limiter).connect(out).connect(ctx.destination);

  const bus = (db: number) => {
    const g = ctx.createGain();
    g.gain.value = dB(db);
    g.connect(master);
    return g;
  };
  const ambience = bus(-2);
  const traversal = bus(-8);
  const events = bus(1);
  const ui = bus(2);

  // Shared noise: 4 s of white noise per channel, looped, so left and right are decorrelated.
  const noise = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = noise.getChannelData(c);
    let seed = 1234567 + c * 7654321;
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (seed / 0x7fffffff) * 2 - 1;
    }
  }
  const noiseSource = (pan = 0) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.loopStart = Math.random() * 3;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    src.connect(p);
    src.start();
    return p;
  };
  const tone = (freq: number, type: OscillatorType = "sine") => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.start();
    return o;
  };
  const gainNode = (v = 0) => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  const filter = (type: BiquadFilterType, freq: number, q = 0.7) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };

  // ───── Ambience beds ─────
  // Space: near silence. A low fifth with an audible octave partial, breathing slowly.
  const spaceBed = gainNode();
  const spaceTone = filter("lowpass", 420);
  for (const [f, v] of [
    [55, 0.5],
    [82.41, 0.32],
    [110, 0.22],
    [220, 0.05],
  ] as const) {
    const g = gainNode(v);
    tone(f).connect(g).connect(spaceTone);
  }
  // Breathing: a 14 s swell of ±30% on its own stage, so the bed's level stays under the mixer's control.
  const breathing = gainNode(1);
  tone(0.07).connect(gainNode(0.3)).connect(breathing.gain);
  spaceTone.connect(breathing).connect(spaceBed).connect(ambience);

  // Ice: low pressure in a narrow, dark band, centred (the passage is enclosed).
  const iceBed = gainNode();
  const iceBand = filter("bandpass", 240, 3.5);
  noiseSource(0).connect(iceBand);
  const iceLow = gainNode(0.25);
  tone(73.42, "triangle").connect(filter("lowpass", 160)).connect(iceLow);
  iceBand.connect(iceBed);
  iceLow.connect(iceBed);
  iceBed.connect(ambience);

  // Ocean: dense, muffled, wide. Two decorrelated low noise layers, left and right.
  const oceanBed = gainNode();
  for (const pan of [-0.7, 0.7]) {
    const lp = filter("lowpass", 320, 0.5);
    noiseSource(pan).connect(lp).connect(oceanBed);
  }
  const oceanBody = gainNode(0.35);
  tone(49, "sine").connect(oceanBody).connect(oceanBed);
  oceanBed.connect(ambience);

  // Warm vents: a soft open chord (D, A, F♯) that blooms in with the plume.
  const warmBed = gainNode();
  const warmTone = filter("lowpass", 900);
  for (const [f, v] of [
    [146.83, 0.32],
    [220, 0.24],
    [369.99, 0.12],
  ] as const) {
    const g = gainNode(v);
    tone(f, "triangle").connect(g).connect(warmTone);
  }
  warmTone.connect(warmBed).connect(ambience);

  // ───── Traversal ─────
  const travel = gainNode();
  const travelFilter = filter("bandpass", 600, 1.2);
  const travelWidth = [noiseSource(-0.5), noiseSource(0.5)];
  for (const n of travelWidth) n.connect(travelFilter);
  travelFilter.connect(travel).connect(traversal);

  // ───── One-shots ─────
  /** A shaped sine/triangle note into a bus. */
  const note = (
    at: number,
    freq: number,
    dur: number,
    peak: number,
    into: AudioNode,
    opts: { type?: OscillatorType; to?: number; attack?: number; pan?: number; lp?: number } = {},
  ) => {
    const o = ctx.createOscillator();
    o.type = opts.type ?? "sine";
    o.frequency.setValueAtTime(freq, at);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
    const g = ctx.createGain();
    const attack = opts.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = opts.pan ?? 0;
    let chain: AudioNode = o.connect(g);
    if (opts.lp) chain = chain.connect(filter("lowpass", opts.lp));
    chain.connect(p).connect(into);
    o.start(at);
    o.stop(at + dur + 0.05);
  };
  /** A filtered noise burst. */
  const hiss = (at: number, dur: number, peak: number, into: AudioNode, f0: number, f1: number, q = 0.8) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = filter("bandpass", f0, q);
    f.frequency.setValueAtTime(f0, at);
    f.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(into);
    src.start(at, Math.random() * 3);
    src.stop(at + dur + 0.05);
  };
  /** Briefly lowers the ambience so a key cue reads clearly (a few dB, as the doc asks). */
  const duck = (at: number, hold: number) => {
    ambience.gain.cancelScheduledValues(at);
    ambience.gain.setTargetAtTime(dB(-10), at, 0.05);
    ambience.gain.setTargetAtTime(dB(-6), at + hold, 0.6);
  };

  const cues: Record<CueId, (t: number) => void> = {
    // A soft click, then the motif rising: low to high.
    "expedition-start": (t) => {
      hiss(t, 0.04, dB(-26), ui, 3000, 2000, 2);
      note(t + 0.03, MOTIF.low, 0.22, dB(-20), ui, { lp: 2400 });
      note(t + 0.16, MOTIF.high, 0.3, dB(-21), ui, { lp: 2400 });
    },
    // The orbit locks onto the target fracture: a restrained low sweep and one precise tone.
    "arrival-lock": (t) => {
      hiss(t, 1.1, dB(-27), events, 180, 900, 1.5);
      note(t + 0.9, MOTIF.high, 0.25, dB(-21), events, { lp: 2600 });
    },
    // The strongest spatial moment: the enclosure drops away, a pressure release, then the water opens.
    "ice-breakthrough": (t) => {
      duck(t, 0.6);
      hiss(t, 0.5, dB(-18), events, 2400, 300, 0.9);
      note(t + 0.08, 62, 1.6, dB(-12), events, { to: 44, attack: 0.03 });
      for (const pan of [-0.8, 0.8]) {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const lp = filter("lowpass", 900, 0.5);
        lp.frequency.setValueAtTime(900, t + 0.3);
        lp.frequency.exponentialRampToValueAtTime(260, t + 2.8);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + 0.3);
        g.gain.exponentialRampToValueAtTime(dB(-22), t + 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        src.connect(lp).connect(g).connect(p).connect(events);
        src.start(t + 0.3, Math.random() * 3);
        src.stop(t + 3.1);
      }
    },
    // A rounded ping (about 200 ms), not a piercing beep.
    "sonar-emit": (t) => {
      duck(t, 1.4);
      note(t, 1180, 0.22, dB(-14), events, { to: 1040, attack: 0.004, lp: 3200 });
      note(t, 590, 0.3, dB(-24), events, { to: 520 });
    },
    // Returns from the floor: quieter, darker, spread across the field as the terrain appears.
    "sonar-return": (t) => {
      const echoes = [
        [0.42, -0.45, -24],
        [0.78, 0.5, -28],
        [1.22, -0.2, -32],
      ] as const;
      for (const [dt, pan, db] of echoes) note(t + dt, 1040, 0.28, dB(db), events, { to: 980, pan, lp: 1600 });
    },
    // A distinct, quiet two-tone lock: the motif.
    "anomaly-lock": (t) => {
      note(t, MOTIF.low, 0.2, dB(-19), events, { lp: 2400 });
      note(t + 0.14, MOTIF.high, 0.34, dB(-19), events, { lp: 2400 });
    },
    // Warm harmonic opening, slow, with no hit: the motif widened to a sixth over a low root.
    "discovery-reveal": (t) => {
      duck(t, 2.5);
      note(t, 146.83, 4.2, dB(-18), events, { type: "triangle", attack: 1.4, lp: 1200 });
      note(t + 0.6, MOTIF.low, 3.6, dB(-24), events, { attack: 1.2, lp: 1800 });
      note(t + 1.3, 739.99, 3.2, dB(-28), events, { attack: 1.1, lp: 2000 });
      hiss(t + 0.4, 3.4, dB(-32), events, 300, 700, 0.7);
    },
    // A few clean pulses following the signal, then a long quiet tail.
    "transmission": (t) => {
      for (let i = 0; i < 4; i++) note(t + i * 0.42, 880, 0.12, dB(-19 - i * 2), events, { lp: 3000 });
      note(t + 1.8, MOTIF.low, 5, dB(-26), events, { attack: 0.8, lp: 1600 });
      note(t + 2.2, 554.37, 5, dB(-29), events, { attack: 1, lp: 1600 });
    },
    // A short reverse-feeling glide.
    "reset": (t) => {
      note(t, MOTIF.high, 0.26, dB(-22), ui, { to: MOTIF.low * 0.75, lp: 2000 });
    },
    // A tiny rounded confirmation when sound is turned on.
    "ui-confirm": (t) => {
      note(t, MOTIF.high, 0.14, dB(-21), ui, { lp: 2400 });
    },
  };

  // ───── Scene-driven texture: ice ticks and distant ocean resonances ─────
  let nextTick = 0;
  let nextSwell = 0;
  const sparse = (mix: SceneMix, t: number) => {
    if (mix.shaft > 0.3 && t >= nextTick) {
      // A crystalline tick with a short refracted tail; never glass breaking.
      const f = 2400 + Math.random() * 2200;
      note(t, f, 0.09 + Math.random() * 0.12, dB(-34) * mix.shaft, ambience, { pan: Math.random() * 1.2 - 0.6, lp: 5000 });
      if (Math.random() < 0.3) note(t + 0.05, f * 1.5, 0.08, dB(-40) * mix.shaft, ambience, { pan: Math.random() - 0.5 });
      nextTick = t + 0.5 + Math.random() * 1.6;
    }
    if (mix.ocean > 0.5 && t >= nextSwell) {
      if (nextSwell > 0) note(t, 98 + Math.random() * 49, 3.5, dB(-32) * mix.ocean, ambience, { attack: 1.4, pan: Math.random() - 0.5, lp: 500 });
      nextSwell = t + 7 + Math.random() * 7;
    }
  };

  const eq = (w: number) => Math.sin((Math.min(1, Math.max(0, w)) * Math.PI) / 2); // equal-power
  let lastCue: Partial<Record<CueId, number>> = {};

  return {
    master,
    playCue(id: CueId, at = ctx.currentTime) {
      // Deduplicate: the same cue never retriggers within 0.4 s.
      if ((lastCue[id] ?? -1) > at - 0.4) return;
      lastCue[id] = at;
      cues[id](at + 0.01);
      if (id === "sonar-emit") cues["sonar-return"](at + 0.01);
    },
    setScene(mix: SceneMix) {
      const t = ctx.currentTime;
      const thin = 1 - 0.6 * mix.signal;
      spaceBed.gain.setTargetAtTime(dB(-30) * eq(mix.space) * (1 - 0.5 * mix.signal) + dB(-34) * mix.signal, t, 0.4);
      iceBed.gain.setTargetAtTime(dB(-18) * eq(mix.shaft), t, 0.3);
      oceanBed.gain.setTargetAtTime(dB(-21) * eq(mix.ocean) * thin, t, 0.5);
      warmBed.gain.setTargetAtTime(dB(-30) * eq(mix.warm), t, 0.8);
      // The traversal texture's colour follows the world: dark and narrow in ice, low and soft in water.
      const centre = mix.shaft > 0.5 ? 380 : mix.ocean > 0.5 ? 260 : 900;
      travelFilter.frequency.setTargetAtTime(centre, t, 0.3);
      travelFilter.Q.setTargetAtTime(mix.shaft > 0.5 ? 4 : 1, t, 0.3);
      sparse(mix, t);
    },
    /** Camera speed in story units per second (already smoothed by the spring). */
    setTraversal(speed: number) {
      const level = Math.min(1, Math.abs(speed) / 0.6);
      // Time constant 0.15 s: audibly gone within about half a second of stopping.
      travel.gain.setTargetAtTime(dB(-24) * level, ctx.currentTime, 0.15);
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

/** The live engine behind the Sound button. Created on the first enable (a user gesture). */
export function createSound() {
  let ctx: AudioContext | null = null;
  let engine: Engine | null = null;
  let enabled = false;
  /** While auditioning (dev panel), the scene stops driving the mix. */
  let held = false;

  const onVisibility = () => {
    if (!ctx || !enabled) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      // Audio must never break the expedition.
    }
  };

  return {
    get enabled() {
      return enabled;
    },
    /** Must be called from a user gesture. Resolves to the new state. */
    async toggle(): Promise<boolean> {
      try {
        if (!enabled) {
          if (!ctx) {
            ctx = new AudioContext();
            engine = buildEngine(ctx);
          }
          await ctx.resume();
          enabled = true;
          engine!.fadeTo(1, 0.8);
          engine!.playCue("ui-confirm");
        } else {
          enabled = false;
          // Fade out at once, with no cue after muting, then release the device.
          engine?.fadeTo(0, 0.12);
          const c = ctx;
          setTimeout(() => !enabled && void c?.suspend(), 200);
        }
      } catch {
        enabled = false;
      }
      return enabled;
    },
    cue(id: CueId) {
      if (enabled && engine) safe(() => engine!.playCue(id));
    },
    /** Called each frame; cheap (a few parameter ramps), and a no-op while muted. */
    update(mix: SceneMix, speed: number, fromAudition = false) {
      if (!enabled || !engine || document.hidden || held !== fromAudition) return;
      safe(() => {
        engine!.setScene(mix);
        engine!.setTraversal(speed);
      });
    },
    hold(on: boolean) {
      held = on;
    },
    dispose() {
      document.removeEventListener("visibilitychange", onVisibility);
      void ctx?.close();
      ctx = null;
      engine = null;
      enabled = false;
    },
  };
}
