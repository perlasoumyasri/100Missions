/**
 * The director: from the story position P (0..7) and the clock, decide what every part of the
 * frame does. Pure and deterministic, so the GPU uniforms and the DOM overlay always agree.
 *
 * Worlds: space (P 0 → 2.5 and 6.08 → 7), the ice shaft (2.25 → 3.05), the ocean (3.0 → 6.2).
 * The dive and the breakthrough hide their seams behind light; the rewind is a plain dissolve
 * (any flash there reads as grey fog over the space world).
 *
 * Pacing (measured as on-screen change per 100 px of scroll, see CLAUDE.md): the approach to the
 * surface starts halfway through the Opening and zooms at an even rate, so there is no dead stretch
 * and no sudden rush; the dive into the crack is the slowest moment of the story, by design.
 */
import { posePath, projectionMatrix, projectToScreen, viewMatrix, type Pose, type Vec3 } from "./camera";
import { ANOMALY, PULSE_ORIGIN } from "./story";

const deg = Math.PI / 180;
type V = [number, number, number];

const norm = (v: readonly number[]): V => {
  const l = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
  return [v[0]! / l, v[1]! / l, v[2]! / l];
};
const add = (a: readonly number[], b: readonly number[]): V => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
const scale = (a: readonly number[], s: number): V => [a[0]! * s, a[1]! * s, a[2]! * s];
const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const cross = (a: readonly number[], b: readonly number[]): V => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixV = (a: readonly number[], b: readonly number[], t: number): V => [mix(a[0]!, b[0]!, t), mix(a[1]!, b[1]!, t), mix(a[2]!, b[2]!, t)];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Altitudes interpolated in log space, so the surface grows at an even rate on screen. */
const logMix = (a: number, b: number, t: number) => a * (b / a) ** clamp01(t);
/** Cubic ease from rest that arrives still moving, with end speed v1 (relative to linear). */
const easeInArrive = (t: number, v1: number) => {
  const x = clamp01(t);
  return (v1 - 2) * x * x * x + (3 - v1) * x * x;
};
/** The mirror: leaves already moving at speed v0 and comes to rest. */
const easeOutFrom = (t: number, v0: number) => 1 - easeInArrive(1 - clamp01(t), v0);
const ease = (t: number) => {
  const c = clamp01(t);
  return c * c * c * (c * (c * 6 - 15) + 10); // smootherstep: zero velocity and acceleration at both ends
};

// ───── Space constants ─────
const OPENING_DIR = norm([0.1, 0.12, 1]);
const OPENING_DIST = 12;
/** The story beats, in story position P (chapter index + progress). */
export const BEATS = {
  approach: [0.5, 2] as const, // Opening → Arrival: from the title pose down to the target fracture
  drop: [2, 2.5] as const, // onto the crack and down into it (the slow, brown-to-blue moment)
  intoIce: [2.25, 2.5] as const, // space → shaft dissolve
  shaft: [2.38, 3] as const, // twenty kilometres of ice
  rewind: [6, 6.3] as const,
};
const APPROACH_DIST = OPENING_DIST - BEATS.approach[0] * 0.4;
const OPENING_TARGET: V = [-2.8, 0.2, 0];
/** Where the cryobot goes in: a point on the hero fracture, on the lit side near the terminator. */
export const DIVE_POINT = norm([0.35, 0.25, 0.9]);
export const CRACK_NORMAL = norm(cross(DIVE_POINT, norm([0.2, 1, -0.1])));
const CRACK_TANGENT = norm(cross(CRACK_NORMAL, DIVE_POINT));
// Low sun across the target fracture: the dive point sits near the terminator, so ridges cast relief.
const SUN = norm(add(scale(DIVE_POINT, 0.3), scale(CRACK_NORMAL, 0.95)));
const TRANSMIT_DIR = norm([0.25, 0.18, 1]);
export const EARTH_DIR = norm([-0.5, 0.05, -1]);

// ───── Ocean poses (the user-approved frames are SURFACE and SURVEY) ─────
const SURFACE: Pose = { eye: [0, 30, 90], yaw: 0, pitch: -(Math.atan2(25, 35) + 10 * deg), fov: 90 * deg };
const SURVEY: Pose = { eye: [0, 7.5, 48], yaw: -3 * deg, pitch: -17 * deg, fov: 74 * deg };
const HIGH: Pose = { eye: [0, 52, 130], yaw: 0, pitch: -52 * deg, fov: 90 * deg };
export const VENT: Vec3 = [ANOMALY[0], 0.5, ANOMALY[1]];
// Looking a little left of the vents puts them right of centre, clear of the headline.
const VENT_POSE: Pose = { eye: [-4, 6.5, -30], yaw: Math.atan2(VENT[0] + 4, -(VENT[2] + 30)) - 0.2, pitch: 4 * deg, fov: 62 * deg };

export interface SpaceCamera {
  eye: V;
  forward: V;
  right: V;
  up: V;
  tanHalfFov: number;
}

// The opening journey: start beyond Jupiter, already facing distant Europa, with the giant filling
// the right of the frame; then fly past it. Jupiter slides out with parallax while Europa grows.
// The line of sight clears Jupiter's limb (17 units from its centre, radius 12), so it never hides Europa.
// Jupiter sits in the Sun's direction from Europa (SUN × 60), so the approach sees both day sides.
const JUPITER: V = [-46.8, 16.88, 33.54];
const TOWARD_EUROPA = norm(scale(JUPITER, -1));
const PASS_SIDE = norm(cross(TOWARD_EUROPA, [0, 1, 0]));
const JUPITER_EYE: V = add(add(JUPITER, scale(TOWARD_EUROPA, -28)), scale(PASS_SIDE, -24));

export interface Shot {
  weights: { space: number; shaft: number; ocean: number };
  space: SpaceCamera;
  sun: V;
  crackOpen: number;
  signal: number;
  starBrightness: number;
  shaftDepth: number;
  breakthrough: number;
  ocean: Pose;
  plume: number;
  flash: number;
  /** Simulated depth below the surface, metres. */
  depthM: number;
  /** Jupiter brightness and close-up detail. */
  jupiter: [number, number];
}

function lookAt(eye: V, target: V, upHint: V, fov: number): SpaceCamera {
  const forward = norm(sub(target, eye));
  let right = cross(forward, upHint);
  if (Math.hypot(...right) < 1e-4) right = cross(forward, [0, 0, 1]);
  right = norm(right);
  return { eye, forward, right, up: cross(right, forward), tanHalfFov: Math.tan(fov / 2) };
}

function spaceCamera(p: number, time: number, portrait: number, wide: number, intro: number): SpaceCamera {
  // Portrait: the Opening puts the moon above the title; Arrival puts it below the text.
  // Wide screens: push the moon further right so the title never runs into it.
  const landscapeTarget: V = [OPENING_TARGET[0] * (1 + (wide - 1) * 5), OPENING_TARGET[1], OPENING_TARGET[2]];
  const openingTarget = mixV(landscapeTarget, [0.14, -2.4, 0], portrait);
  const drift: V = [Math.sin(time * 0.05) * 0.06, Math.sin(time * 0.037) * 0.04, 0];
  if (p >= 6) {
    // The Transmission: pull back until Europa is a small disc and Earth a point.
    const t = ease((p - 6.05) / 0.95);
    const dist = mix(4, 15, t) + 3 * portrait; // Europa is already a whole disc when space returns
    const eye = scale(TRANSMIT_DIR, dist);
    // Europa holds the right of the frame (the top on portrait screens) from the start and recedes
    // there; the words own the rest. The aim offset scales with distance, so its place changes gently.
    const target: V = [
      -mix(0.3, 0.156, t) * dist * (1 - portrait),
      (-mix(0.1, 0.077, t) * (1 - portrait) - mix(0.5, 0.38, t) * portrait) * dist,
      0,
    ];
    return lookAt(add(eye, drift), target, [0, 1, 0], mix(48, 36, t) * deg);
  }
  if (p < BEATS.approach[0]) {
    const eye = add(scale(OPENING_DIR, OPENING_DIST - p * 0.4), drift);
    if (intro >= 1) return lookAt(eye, openingTarget, [0, 1, 0], 34 * deg);
    const e = ease(intro);
    const path = add(mixV(JUPITER_EYE, eye, e), [0, Math.sin(Math.PI * e) * 5, 0]);
    return lookAt(path, openingTarget, [0, 1, 0], mix(46, 34, e) * deg);
  }
  if (p < BEATS.approach[1]) {
    // Opening → Arrival: swing round to the fracture and close in until the surface fills the frame.
    const [a0, a1] = BEATS.approach;
    const t = smooth(a0, a1, p);
    // The swing (direction and aim) is spread over the whole approach at a steady angular rate.
    const turn = smooth(-0.15, 1, t);
    const dir = norm(mixV(OPENING_DIR, DIVE_POINT, turn));
    const dist = 1 + logMix(APPROACH_DIST - 1, 0.12, t);
    const targetNear = add(add(DIVE_POINT, scale(CRACK_TANGENT, 0.32)), scale(DIVE_POINT, -0.05));
    // The aim offset shrinks with distance, so the moon keeps its place on screen and simply grows
    // (a zoom, not a slide); only in the last stretch does the aim settle onto the fracture.
    // Portrait: the moon eases up under the Arrival text instead of jumping there.
    const keep = scale(add(openingTarget, [0, 1.1 * portrait * smooth(0, 0.35, t), 0]), dist / APPROACH_DIST);
    const target = mixV(keep, targetNear, smooth(0.55, 1, turn));
    const up = norm(mixV([0, 1, 0], DIVE_POINT, t));
    return lookAt(add(scale(dir, dist), scale(drift, 1 - t)), target, up, mix(34, 44, t) * deg);
  }
  // The Fracture: drop onto the crack and look straight down into it, slowly.
  const k = smooth(BEATS.drop[0], BEATS.drop[1], p);
  const eye = scale(DIVE_POINT, 1 + logMix(0.12, 0.0035, k));
  const target = mixV(add(add(DIVE_POINT, scale(CRACK_TANGENT, 0.32)), scale(DIVE_POINT, -0.05)), scale(DIVE_POINT, 0.9), k);
  const up = norm(mixV(DIVE_POINT, CRACK_TANGENT, k));
  return lookAt(eye, target, up, mix(44, 30, k) * deg);
}

function oceanPose(p: number, time: number): Pose {
  let base: Pose;
  // Into the ocean at the speed the shaft left off, settling gently onto the surface pose.
  if (p < 4) base = posePath(HIGH, [0, 36, 104], SURFACE, easeOutFrom((p - 3) / 0.7, 0.45));
  else if (p < 5) base = posePath(SURFACE, [0, 13, 74], SURVEY, ease(p - 4));
  else if (p < 6) base = posePath(SURVEY, [-3, 7, 2], VENT_POSE, ease(p - 5));
  else {
    // Rewind: rise fast towards the ice.
    const k = ease((p - BEATS.rewind[0]) / (BEATS.rewind[1] - BEATS.rewind[0]));
    base = { ...VENT_POSE, eye: [VENT_POSE.eye[0], VENT_POSE.eye[1] + k * 70, VENT_POSE.eye[2]], pitch: VENT_POSE.pitch + k * 40 * deg };
  }
  // A probe in water drifts; near the vents it slowly circles.
  const orbit = smooth(5.6, 6, p) * Math.sin(time * 0.06) * 4 * deg;
  return {
    eye: [base.eye[0], base.eye[1] + Math.sin(time * 0.37) * 0.3, base.eye[2]],
    yaw: base.yaw + Math.sin(time * 0.13) * 0.4 * deg + orbit,
    pitch: base.pitch,
    fov: base.fov,
  };
}

/** Bell-shaped flash centred on c. */
const bump = (p: number, c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));

export function shoot(p: number, time: number, aspect = 1.6, intro = 1): Shot {
  const portrait = clamp01((1 - aspect) / 0.55);
  const wide = Math.max(1, aspect / 1.6);
  const [i0, i1] = BEATS.intoIce;
  const space = 1 - smooth(i0, i1, p) + smooth(6.08, 6.28, p);
  const shaft = smooth(i0, i1, p) * (1 - smooth(2.95, 3.07, p));
  const ocean = smooth(2.98, 3.26, p) * (1 - smooth(6.02, 6.2, p));
  const sun = SUN;
  // The descent speeds up gradually from rest and is still moving, but slowing, as it breaks through.
  const shaftDepth = easeInArrive((p - BEATS.shaft[0]) / (BEATS.shaft[1] - BEATS.shaft[0]), 0.45);
  const depthM =
    p < BEATS.shaft[0] ? 0 : p < 3 ? shaftDepth * 19_800 : p < 6.08 ? 19_800 + clamp01((p - 3) / 3) * 3_100 : 0;
  return {
    weights: { space: clamp01(space), shaft: clamp01(shaft), ocean: clamp01(ocean) },
    space: spaceCamera(p, time, portrait, wide, intro),
    sun,
    crackOpen: smooth(2.04, 2.4, p) * (1 - smooth(2.9, 3.0, p)),
    signal: smooth(6.45, 6.75, p), // after "Transmit findings"
    starBrightness: p > 1.6 && p < 6 ? 0.5 : 1,
    shaftDepth,
    breakthrough: smooth(2.86, 3.0, p),
    ocean: oceanPose(p, time),
    plume: smooth(5.05, 5.5, p) * (1 - smooth(6.0, 6.16, p)),
    flash: bump(p, 2.38, 0.06) * 0.2 + bump(p, 3.02, 0.065) * 0.42,
    depthM,
    jupiter: [mix(0.42, 0.16, ease(smooth(0.35, 0.95, intro))), 1 - smooth(0.3, 0.8, intro)],
  };
}

/** Portrait screens get a wider vertical field so the horizontal view stays usable. */
export function widenForAspect(fov: number, aspect: number): number {
  const portrait = clamp01((1 - aspect) / 0.55);
  return 2 * Math.atan(Math.tan(fov / 2) * (1 + portrait * 0.45));
}

/** Project a world point through a space camera to CSS pixels. */
export function projectSpace(cam: SpaceCamera, point: readonly number[], aspect: number, w: number, h: number) {
  const v = sub(point, cam.eye);
  const z = dot(v, cam.forward);
  if (z <= 1e-4) return { x: 0, y: 0, visible: false };
  const nx = dot(v, cam.right) / (z * cam.tanHalfFov * aspect);
  const ny = dot(v, cam.up) / (z * cam.tanHalfFov);
  return { x: (nx * 0.5 + 0.5) * w, y: (0.5 - ny * 0.5) * h, visible: Math.abs(nx) < 1 && Math.abs(ny) < 1 };
}

/** Ocean camera matrices and helpers for anchoring DOM elements to world points. */
export function oceanMatrices(pose: Pose, aspect: number) {
  const view = viewMatrix(pose);
  const projection = projectionMatrix(pose.fov, aspect);
  return {
    view,
    projection,
    project: (pt: Vec3, w: number, h: number) => projectToScreen(pt, view, projection, w, h),
  };
}

export const PULSE_POINT: Vec3 = [PULSE_ORIGIN[0], 0, PULSE_ORIGIN[1]];
