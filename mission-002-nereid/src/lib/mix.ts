/**
 * Pure mixing rules for NEREID's sound (sound-design.md §5, §6, §8). No Web Audio here, so it is tested.
 *
 * The sounds are ElevenLabs Sound Effects v3 generations: four takes per cue, auditioned at /audition/.
 * `pick` is the take the site uses. Loudness (integrated LUFS) was measured per take with ffmpeg ebur128
 * so any take can be levelled to its cue's target; the beds were measured after their loop seams were
 * crossfaded.
 */

export type Take = "a" | "b" | "c" | "d";
export type SampleId =
  | "01-space-bed"
  | "02-ice-bed"
  | "03-ocean-bed"
  | "05-breakthrough"
  | "06-sonar"
  | "07-anomaly-lock"
  | "08-vent-swell"
  | "09-transmission"
  | "10-ui-confirm"
  | "13-type-tick";

export const TAKES: Record<SampleId, { pick: Take; lufs: Record<Take, number> }> = {
  "01-space-bed": { pick: "b", lufs: { a: -34.5, b: -36.7, c: -38.7, d: -32.2 } },
  "02-ice-bed": { pick: "c", lufs: { a: -35.9, b: -40.8, c: -33.0, d: -35.0 } },
  "03-ocean-bed": { pick: "a", lufs: { a: -40.0, b: -31.2, c: -26.7, d: -31.6 } },
  "05-breakthrough": { pick: "b", lufs: { a: -19.7, b: -25.5, c: -29.3, d: -27.0 } },
  "06-sonar": { pick: "c", lufs: { a: -23.0, b: -23.3, c: -25.5, d: -23.1 } },
  "07-anomaly-lock": { pick: "b", lufs: { a: -22.5, b: -22.6, c: -25.4, d: -23.0 } },
  "08-vent-swell": { pick: "d", lufs: { a: -22.2, b: -22.9, c: -24.1, d: -19.4 } },
  "09-transmission": { pick: "c", lufs: { a: -49.1, b: -45.1, c: -36.7, d: -36.8 } },
  "10-ui-confirm": { pick: "d", lufs: { a: -39.3, b: -44.6, c: -43.4, d: -46.3 } },
  "13-type-tick": { pick: "d", lufs: { a: -37.4, b: -53.9, c: -51.3, d: -42.4 } },
};

const isTake = (t: unknown): t is Take => t === "a" || t === "b" || t === "c" || t === "d";

/**
 * Which take to load for a sample. In development, a pick saved on the audition page overrides the
 * default, so the designer can hear a take in the real expedition by picking it and reloading.
 */
export function resolveTake(id: SampleId, devPicks?: Record<string, { pick?: string } | undefined>) {
  const dev = devPicks?.[id]?.pick;
  const take = isTake(dev) ? dev : TAKES[id].pick;
  return { take, lufs: TAKES[id].lufs[take], fromAudition: isTake(dev) };
}

export const dB = (db: number) => 10 ** (db / 20);

/** Linear gain that brings a take measured at `lufs` to `target` LUFS. */
export const levelTo = (lufs: number, target: number) => dB(target - lufs);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const bump = (p: number, c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));

/**
 * Bed gains (0–1) from the director's world weights. Equal-power, so a crossfade never dips or swells.
 * Just before the breakthrough every bed draws back to a near-silence, so the water opens into quiet
 * (sound-design.md: "reduce the enclosed ice sound, moment of quiet, then open").
 */
export function bedGains(w: { space: number; shaft: number; ocean: number }, p: number) {
  const hush = 1 - 0.75 * bump(p, 2.97, 0.035);
  const eq = (x: number) => Math.sin((clamp01(x) * Math.PI) / 2) * hush;
  return { space: eq(w.space), shaft: eq(w.shaft), ocean: eq(w.ocean) };
}

/**
 * Traversal: the beds open up (brighter, a touch louder) while the camera moves, and settle when it
 * stops. Driven by the spring's smoothed speed, never by raw scroll events. Speed is story units per
 * second; a brisk scroll is about 0.5. At rest the beds keep enough upper range (1.8 kHz) for laptop
 * and phone speakers, which reproduce almost nothing below a few hundred hertz.
 */
export function motion(speed: number) {
  const m = clamp01(Math.abs(speed) / 0.5) ** 0.7;
  return { cutoff: 1800 + 4200 * m, gain: dB(2 * m) };
}

/**
 * Seconds of near-silence before a one-shot actually sounds, so its audible start can be placed on the
 * visual beat. The threshold is 30 dB below the take's peak, checked over 5 ms windows.
 */
export function onsetSeconds(data: Float32Array, sampleRate: number, below = 30): number {
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]!));
  if (peak === 0) return 0;
  const limit = peak * dB(-below);
  const w = Math.max(1, Math.round(sampleRate * 0.005));
  for (let i = 0; i + w <= data.length; i += w) {
    let sum = 0;
    for (let j = i; j < i + w; j++) sum += data[j]! * data[j]!;
    if (Math.sqrt(sum / w) > limit) return Math.max(0, i / sampleRate - 0.01);
  }
  return 0;
}
