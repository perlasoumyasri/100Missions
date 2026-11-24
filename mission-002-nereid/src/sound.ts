/**
 * NEREID's sound (sound-design.md): three looping beds that follow the camera through space, ice and
 * ocean, and one-shot cues on the story's visual events. The sounds are ElevenLabs generations (see
 * lib/mix.ts for the takes, their measured loudness and the mixing rules).
 *
 * Sound is on by default as a preference, but nothing loads or plays before the visitor's first click,
 * tap or key press (usually "Begin expedition"); the opening from Jupiter to Europa is silent by the
 * user's choice. Files load then, beds first, and the sound rises from almost nothing to its level over
 * several seconds. It suspends when the tab is hidden.
 *
 * Buses: beds → motion filter → lift → duck → swell → master;  cues → master;  master → limiter → out.
 */
import { TAKES, bedGains, dB, levelTo, motion, onsetSeconds, resolveTake, type SampleId } from "./lib/mix";

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

/** Each cue: which sample, its loudness target (LUFS), optional pitch (rate), and how far it ducks the beds. */
const CUES: Record<CueId, { sample: SampleId; target: number; rate?: number; duck?: number }> = {
  "expedition-start": { sample: "10-ui-confirm", target: -27 },
  "ui-confirm": { sample: "10-ui-confirm", target: -30 },
  "reset": { sample: "10-ui-confirm", target: -30, rate: 0.8 }, // the confirm, lowered: a step back
  // The motif: the anomaly's two tones, a tone lower and quieter, first heard when the landing site locks.
  "arrival-lock": { sample: "07-anomaly-lock", target: -29, rate: 0.89 },
  "ice-breakthrough": { sample: "05-breakthrough", target: -24, duck: 3 },
  "sonar-emit": { sample: "06-sonar", target: -25, duck: 4 },
  "anomaly-lock": { sample: "07-anomaly-lock", target: -26 },
  "discovery-reveal": { sample: "08-vent-swell", target: -25, duck: 3 },
  "transmission": { sample: "09-transmission", target: -27, duck: 2 },
};

const BEDS = { space: "01-space-bed", shaft: "02-ice-bed", ocean: "03-ocean-bed" } as const;
/** Bed loudness at full weight (LUFS): quiet, but audible on laptop speakers; space a little the quietest. */
const BED_TARGET = { space: -29, shaft: -28, ocean: -28 } as const;
type World = keyof typeof BEDS;
const WORLDS = Object.keys(BEDS) as World[];

function auditionPicks(): Record<string, { pick?: string }> | undefined {
  if (!import.meta.env.DEV) return undefined;
  try {
    return JSON.parse(localStorage.getItem("nereid-audition-picks") ?? "{}");
  } catch {
    return undefined;
  }
}

function sampleUrl(id: SampleId, picks: ReturnType<typeof auditionPicks>) {
  const r = resolveTake(id, picks);
  return {
    url: import.meta.env.DEV && r.fromAudition ? `/audition/sounds/${id}-${r.take}.mp3` : `./sound/${id.slice(3)}.mp3`,
    lufs: r.lufs,
  };
}

type Loaded = { buffer: AudioBuffer; lufs: number; onset: number };

export function buildEngine(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 3;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.connect(limiter).connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = motion(0).cutoff;
  filter.Q.value = 0.5;
  const lift = ctx.createGain();
  const duck = ctx.createGain();
  // The beds' first arrival: they grow out of near-silence (`rise`); cues and clicks are never held back.
  const swell = ctx.createGain();
  swell.gain.value = 0;
  filter.connect(lift).connect(duck).connect(swell).connect(master);

  const samples = new Map<SampleId, Loaded>();
  const bedGain = {} as Record<World, GainNode>;
  for (const w of WORLDS) {
    bedGain[w] = ctx.createGain();
    bedGain[w].gain.value = 0;
    bedGain[w].connect(filter);
  }

  const picks = auditionPicks();
  // The click's confirmation first (tiny, and wanted at once), then the beds (they set the place), then
  // the cues in story order.
  const beds: SampleId[] = Object.values(BEDS);
  const first: SampleId[] = ["10-ui-confirm", ...beds];
  const order = [...first, ...(Object.keys(TAKES) as SampleId[]).filter((id) => !first.includes(id))];
  const loaded = new Map<SampleId, Promise<void>>();
  for (const id of order) {
    loaded.set(id, (async () => {
      const { url, lufs } = sampleUrl(id, picks);
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        const loop = beds.includes(id);
        samples.set(id, { buffer, lufs, onset: loop ? 0 : onsetSeconds(buffer.getChannelData(0), buffer.sampleRate) });
        if (loop) startBed(id);
      } catch {
        // A missing or undecodable file leaves that sound silent; the expedition goes on.
      }
    })());
  }

  function startBed(id: SampleId) {
    const world = WORLDS.find((w) => BEDS[w] === id)!;
    const s = samples.get(id)!;
    const src = ctx.createBufferSource();
    src.buffer = s.buffer;
    src.loop = true;
    const level = ctx.createGain();
    level.gain.value = levelTo(s.lufs, BED_TARGET[world]);
    src.connect(level).connect(bedGain[world]);
    // Each bed starts at a different point of its loop, so their phrases never line up.
    src.start(0, (WORLDS.indexOf(world) * s.buffer.duration) / 3);
  }

  // Per-frame updates are cheap: an AudioParam is only touched when its value has really moved.
  const last = new Map<AudioParam, number>();
  const glide = (param: AudioParam, value: number, tau: number, eps: number) => {
    if (Math.abs((last.get(param) ?? -1) - value) < eps) return;
    last.set(param, value);
    param.setTargetAtTime(value, ctx.currentTime, tau);
  };

  let lastCue: Partial<Record<CueId, number>> = {};
  let lastTick = 0;
  return {
    /**
     * The beds' first start: from very quiet (−30 dB) up to full level, even in decibels, so the sound is
     * heard to arrive gradually rather than switch on, but is there within a second or two.
     */
    rise(seconds: number) {
      const now = ctx.currentTime;
      swell.gain.cancelScheduledValues(now);
      swell.gain.setValueAtTime(dB(-30), now);
      swell.gain.exponentialRampToValueAtTime(1, now + seconds);
    },
    world(weights: { space: number; shaft: number; ocean: number }, speed: number, p: number) {
      const g = bedGains(weights, p);
      for (const w of WORLDS) glide(bedGain[w].gain, g[w], 0.12, 0.004);
      const m = motion(speed);
      // Opens softly when the camera moves and settles over about a second when it stops, so the gaps
      // between wheel notches never pump the sound.
      const opening = m.cutoff > (last.get(filter.frequency) ?? 0);
      glide(filter.frequency, m.cutoff, opening ? 0.2 : 0.4, 15);
      glide(lift.gain, m.gain, opening ? 0.2 : 0.4, 0.004);
    },
    playCue(id: CueId, pan = 0) {
      const at = ctx.currentTime;
      if ((lastCue[id] ?? -1) > at - 0.4) return; // never retrigger within 0.4 s
      const cue = CUES[id];
      const s = samples.get(cue.sample);
      if (!s) {
        // Still loading (the first click starts the loading): play it if it arrives within 0.3 s, else
        // stay silent rather than play late.
        lastCue[id] = at;
        void loaded.get(cue.sample)?.then(() => {
          if (samples.has(cue.sample) && ctx.currentTime - at < 0.3) {
            lastCue[id] = -1;
            this.playCue(id, pan);
          }
        });
        return;
      }
      lastCue[id] = at;
      const rate = cue.rate ?? 1;
      const src = ctx.createBufferSource();
      src.buffer = s.buffer;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = levelTo(s.lufs, cue.target);
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan)) * 0.6;
      src.connect(g).connect(panner).connect(master);
      // Skip the take's lead-in so its audible start lands on the visual event.
      src.start(at, s.onset);
      if (cue.duck) {
        const length = (s.buffer.duration - s.onset) / rate;
        duck.gain.cancelScheduledValues(at);
        duck.gain.setTargetAtTime(dB(-cue.duck), at, 0.25); // a gentle dip, never a cut
        duck.gain.setTargetAtTime(1, at + length * 0.5, 0.6);
      }
    },
    /** One teleprinter strike: a soft key tick, a little different in pitch each time, at most every 35 ms. */
    tick() {
      const s = samples.get("13-type-tick");
      const at = ctx.currentTime;
      if (!s || at - lastTick < 0.035) return;
      lastTick = at;
      const src = ctx.createBufferSource();
      src.buffer = s.buffer;
      src.playbackRate.value = 0.92 + Math.random() * 0.16;
      const g = ctx.createGain();
      g.gain.value = levelTo(s.lufs, -33);
      src.connect(g).connect(master);
      src.start(at, s.onset);
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
        const first = !ctx;
        if (!ctx) {
          ctx = new AudioContext();
          engine = buildEngine(ctx);
        }
        await ctx.resume();
        enabled = ctx.state === "running";
        if (enabled) {
          // The first time, the beds grow out of near-silence over 6 s; turning sound back on later is quicker.
          engine!.fadeTo(1, first ? 0.05 : 1.5);
          if (first) engine!.rise(6);
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
    tick() {
      if (enabled) engine?.tick();
    },
    cue(id: CueId, pan = 0) {
      if (!enabled || !engine) return;
      try {
        engine.playCue(id, pan);
      } catch {
        // Audio must never break the expedition.
      }
    },
    /** Every frame: the director's world weights, the camera's speed and the story position. */
    world(weights: { space: number; shaft: number; ocean: number }, speed: number, p: number) {
      if (!enabled || !engine) return;
      engine.world(weights, speed, p);
    },
  };
}
