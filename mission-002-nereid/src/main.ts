import "./styles.css";

import { CRACK_NORMAL, DIVE_POINT, EARTH_DIR, oceanMatrices, projectSpace, PULSE_POINT, shoot, smooth, VENT, widenForAspect } from "./lib/director";
import { initialTier, QualityGovernor, type Tier } from "./lib/quality";
import { ANOMALY, ANOMALY_DISTANCE, CHAPTERS, METRES_PER_UNIT, Story, type StoryEvent } from "./lib/story";
import { hexLinear } from "./ocean/tuning";
import type { FrameInfo, FrameParams, OceanRenderer } from "./ocean/renderer";
import { createSound, type CueId } from "./sound";
import { apply, measure as measureSplit, split, type Mode, type Split } from "./type/kinetic";

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
const coarse = matchMedia("(pointer: coarse)").matches;
const story = new Story(reducedQuery.matches);
reducedQuery.addEventListener("change", (e) => (story.reducedMotion = e.matches));
const sound = createSound();
const body = document.body;

// ───── Chapters and their kinetic type ─────

/** Chapter progress where an element arrives (a → b) and, optionally, leaves (c → d). */
type Window = readonly [number, number, number?, number?];
const parseWindow = (el: HTMLElement): Window | null =>
  el.dataset.window ? (el.dataset.window.split(",").map(Number) as unknown as Window) : null;
const inWindow = ([a, b, c, d]: Window, lp: number) => smooth(a, b, lp) * (c === undefined ? 1 : 1 - smooth(c, d!, lp));

interface Frame {
  el: HTMLElement;
  kinetic: { s: Split; mode: Mode; win: Window | null }[];
  /** Plain elements (actions, asides) that show only inside their window. */
  timed: { el: HTMLElement; win: Window }[];
}
const frames: Frame[] = [...document.querySelectorAll<HTMLElement>(".frame")].map((el) => ({
  el,
  kinetic: [...el.querySelectorAll<HTMLElement>("[data-kinetic]")].map((k) => {
    const mode = k.dataset.kinetic as Mode;
    return { s: split(k, mode), mode, win: parseWindow(k) };
  }),
  timed: [...el.querySelectorAll<HTMLElement>("[data-window]:not([data-kinetic])")].map((t) => ({ el: t, win: parseWindow(t)! })),
}));
const anomalyKm = ((ANOMALY_DISTANCE * METRES_PER_UNIT) / 1000).toFixed(1);
const TITLES = ["The Mystery", "Arrival", "The Descent", "First Contact", "The Anomaly", "The Discovery", "The Transmission"];

// The Transmission's diagram: lines radiating from Europa with tick-mark values, in the manner of
// an engraved plaque. Lengths encode the simulated findings (depth, temperature, range, delay...).
const diagram = $<SVGSVGElement>(".diagram");
const rays = $<SVGGElement>(".diagram__rays");
const RAY_VALUES = [0.92, 0.55, 0.78, 0.4, 0.86, 0.62, 0.7, 0.48, 0.95, 0.58, 0.82, 0.44, 0.74, 0.66];
RAY_VALUES.forEach((v, i) => {
  const a = (i / RAY_VALUES.length) * Math.PI * 2 + 0.2;
  const r0 = 66;
  const r1 = r0 + v * 120;
  const svg = (x1: number, y1: number, x2: number, y2: number, cls?: string) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    if (cls) line.classList.add(cls);
    rays.append(line);
  };
  svg(200 + Math.cos(a) * r0, 200 + Math.sin(a) * r0, 200 + Math.cos(a) * r1, 200 + Math.sin(a) * r1);
  // Binary tick marks across each ray, as on the pulsar map.
  const ticks = Math.round(v * 9);
  for (let t = 1; t <= ticks; t++) {
    const rr = r0 + (t / (ticks + 1)) * (r1 - r0);
    const len = t % 3 === 0 ? 5 : 2.5;
    const cx = 200 + Math.cos(a) * rr;
    const cy = 200 + Math.sin(a) * rr;
    svg(cx - Math.sin(a) * len, cy + Math.cos(a) * len, cx + Math.sin(a) * len, cy - Math.cos(a) * len, "diagram__tick");
  }
});
// The outer ring keeps its dashes and fades in with the frame; everything else draws on.
const diagramLines = [...document.querySelectorAll<SVGGeometryElement>(".diagram line, .diagram circle:not(.diagram__ring--outer)")].map((el) => {
  const len = el.getTotalLength?.() ?? 400;
  el.style.strokeDasharray = `${len}`;
  el.style.strokeDashoffset = `${len}`;
  return { el, len };
});

// ───── Scroll is the expedition clock ─────

// Each chapter has its own scroll length (--len, in vh), tuned to how long its moment needs.
// P = chapter index + progress through that chapter's section.
const sections = [...document.querySelectorAll<HTMLElement>(".chapter")];
let tops: number[] = [];
let heights: number[] = [];
let gaugeH = 0;
// All layout reads happen here (boot, resize, fonts loaded), never inside the frame loop.
const measure = () => {
  tops = sections.map((el) => el.offsetTop);
  heights = sections.map((el) => el.offsetHeight || innerHeight);
  gaugeH = gaugeList.clientHeight;
  for (const f of frames) for (const k of f.kinetic) measureSplit(k.s);
  onScroll();
};
let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(measure, 150);
});
let fontsReady = false;
const fontsLoaded = () => {
  if (fontsReady) return;
  fontsReady = true;
  measure();
};
void document.fonts.ready.then(fontsLoaded);
// Faces load lazily as hidden frames first use them; re-measure the letters when they arrive.
document.fonts.addEventListener("loadingdone", () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(measure, 50);
});
setTimeout(fontsLoaded, 2500); // never hold the intro for a slow font
const scrollP = () => {
  const y = scrollY;
  for (let i = sections.length - 1; i >= 0; i--) {
    if (y >= tops[i]!) return Math.min(CHAPTERS, i + (y - tops[i]!) / heights[i]!);
  }
  return 0;
};
const onScroll = () => {
  const target = scrollP();
  // Very big jumps (chapter links, keyboard End) cut instead of flashing through every world.
  if (Math.abs(target - story.p) > 2.5) story.snap(target);
  else story.setTarget(target);
};
addEventListener("scroll", onScroll, { passive: true });

/** Where a chapter reads best: its headline formed, before it starts to leave. */
const restY = (n: number) => (n === 0 ? 0 : tops[n]! + heights[n]! * (story.reducedMotion ? 0.62 : 0.5));
// Focus moves to a chapter's content once its frame is visible (hidden frames can't take focus).
let pendingFocus: { el: HTMLElement; frame: number } | null = null;
const goTo = (n: number, focus: HTMLElement) => {
  scrollTo({ top: restY(n), behavior: "auto" });
  pendingFocus = { el: focus, frame: n };
};
for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="#ch-"]')) {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const n = Number(a.hash.slice(4)) - 1;
    const heading = sections[n]!.querySelector<HTMLElement>("h1, h2")!;
    heading.tabIndex = -1;
    goTo(n, a.classList.contains("skip") ? $("#replay") : heading);
  });
}
/** The y position of a story position P. */
const yOf = (p: number) => {
  const i = Math.min(CHAPTERS - 1, Math.floor(p));
  return tops[i]! + (p - i) * heights[i]!;
};
/**
 * The action buttons glide the camera on to the next discovery, slowly enough for what happens on the
 * way (the sonar sweep, the signal) to play out. Any wheel, touch or key from the visitor takes over.
 */
let glideId = 0;
const glide = (toP: number, focusFrame: number) => {
  const id = ++glideId;
  const target = yOf(toP);
  if (story.reducedMotion) {
    scrollTo({ top: target, behavior: "auto" });
  } else {
    const from = scrollY;
    const seconds = Math.min(4.5, Math.max(1.6, Math.abs(toP - story.p) * 2.6));
    const t0 = performance.now();
    const step = (now: number) => {
      if (id !== glideId) return;
      const t = Math.min(1, (now - t0) / (seconds * 1000));
      const e = t * t * (3 - 2 * t);
      scrollTo({ top: from + (target - from) * e, behavior: "auto" });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const heading = frames[focusFrame]?.el.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.tabIndex = -1;
    pendingFocus = { el: heading, frame: focusFrame };
  }
};
const stopGlide = () => (glideId += 1);
for (const ev of ["wheel", "touchstart", "keydown"] as const) addEventListener(ev, stopGlide, { passive: true });
for (const b of document.querySelectorAll<HTMLButtonElement>(".cta[data-go]")) {
  b.addEventListener("click", () => {
    const to = Number(b.dataset.go);
    sound.cue(b.id === "begin" ? "expedition-start" : "ui-confirm");
    // Land focus on the heading of the chapter the glide ends in (the Transmission keeps its own).
    glide(to, Math.min(CHAPTERS - 1, Math.floor(to)));
  });
}
let replayAt = -1;
$("#replay").addEventListener("click", () => {
  sound.cue("reset");
  replayAt = story.time;
});
$("#sound").addEventListener("click", async () => {
  const on = await sound.toggle();
  $("#sound").setAttribute("aria-pressed", String(on));
  $("[data-sound-state]").textContent = on ? "on" : "off";
});

const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
if (!coarse) {
  addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });
}

// ───── Announcements ─────

// Messages are queued, so a chapter change never cancels the anomaly report (or the reverse).
const live = $("#live");
const queue: string[] = [];
let speaking = false;
const speakNext = () => {
  const msg = queue.shift();
  if (!msg) return void (speaking = false);
  speaking = true;
  live.textContent = msg;
  setTimeout(speakNext, 1400);
};
const announce = (msg: string, delay = 0) =>
  setTimeout(() => {
    // A newer chapter supersedes a queued, unspoken chapter message.
    if (msg.startsWith("Chapter ")) for (let i = queue.length - 1; i >= 0; i--) if (queue[i]!.startsWith("Chapter ")) queue.splice(i, 1);
    queue.push(msg);
    if (!speaking) speakNext();
  }, delay);

// Without WebGPU, each chapter shows a still rendered from the real scene (loaded only in that case).
const poster = $<HTMLImageElement>(".poster");
const showStill = (index: number) => {
  if (body.dataset.gpu === "unsupported") poster.src = `./stills/ch${index + 1}.jpg`;
};

function handle(events: StoryEvent[]): void {
  for (const ev of events) {
    if (ev.type === "chapter") {
      body.dataset.chapter = String(ev.index);
      showStill(ev.index);
      announce(`Chapter ${ev.index + 1}: ${TITLES[ev.index]}`, 700);
    } else if (ev.type === "pulse") sound.cue("sonar-emit");
    else if (ev.type === "anomaly") {
      sound.cue("anomaly-lock");
      announce(`Thermal anomaly detected, ${anomalyKm} kilometres ahead. Simulated reading.`, 200);
    }
  }
}

// ───── Per-frame overlay ─────

const gaugeItems = [...document.querySelectorAll<HTMLElement>(".gauge li")];
const gaugeMarker = $("#gauge-marker");
const gaugeList = $(".gauge__list");
const depthEl = $("#depth");
const shaftDepthEl = $("#shaft-depth");
const sonarRangeEl = $("#sonar-range");
const anchors = { crack: $("#anchor-crack"), anomaly: $("#anchor-anomaly"), vent: $("#anchor-vent") };
for (const el of document.querySelectorAll("[data-anomaly-range]")) el.textContent = `${anomalyKm} km`;

const text = new Map<HTMLElement, string>();
const write = (el: HTMLElement, value: string) => {
  if (text.get(el) === value) return;
  text.set(el, value);
  el.textContent = value;
};
const fmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const metres = (m: number) => fmt.format(Math.round(m / 10) * 10).replace(/,/g, " ");

const vars = new Map<string, string>();
let varId = 0;
const ids = new WeakMap<HTMLElement, number>();
/** Set a custom property only when its value changes (each write invalidates style). */
const setVar = (el: HTMLElement, name: string, value: string) => {
  let id = ids.get(el);
  if (id === undefined) ids.set(el, (id = varId++));
  const key = `${id}${name}`;
  if (vars.get(key) === value) return;
  vars.set(key, value);
  el.style.setProperty(name, value);
};
let lastDraw = -1;

type Pt = { x: number; y: number; visible: boolean };
function place(el: HTMLElement, pt: Pt, show: boolean, flipAt = 0.55) {
  const on = show && pt.visible;
  el.classList.toggle("is-visible", on);
  // Near the right edge, the label hangs to the left of its marker.
  el.classList.toggle("anchor--flip", pt.x > innerWidth * flipAt);
  if (on) el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`;
}

interface Anchors {
  crack: Pt;
  anomaly: Pt;
  vent: Pt;
  ring: { x: number; y: number; r: number } | null;
}

function overlay(p: number, depthM: number, a: Anchors): void {
  const reduced = story.reducedMotion;
  const replayOut = replayAt >= 0 ? smooth(0, 1.2, story.time - replayAt) : 0;
  if (replayAt >= 0 && story.time - replayAt > 1.3) {
    replayAt = -1;
    story.snap(0);
    scrollTo({ top: 0, behavior: "auto" });
    pendingFocus = { el: $("#begin"), frame: 0 };
  }
  frames.forEach((f, i) => {
    const lp = p - i;
    const last = i === CHAPTERS - 1;
    const near = lp > -0.25 && lp < 1.05;
    const wasLive = f.el.classList.contains("is-live");
    if (wasLive !== near) f.el.classList.toggle("is-live", near);
    if (!near) return;
    let k: number;
    let inEnv: number;
    // Headings hand over with a long, overlapping crossfade: one leaves as the next forms.
    let out = last ? replayOut : smooth(0.7, 0.99, lp);
    if (i === 0) {
      // The journey line over Jupiter, then "Mission" and the name forming as Europa arrives.
      const it = reduced ? 99 : introT;
      setVar(f.el, "--journey", (smooth(0.8, 1.8, it) * (1 - smooth(3.6, 4.6, it)) * (1 - smooth(0.05, 0.3, lp))).toFixed(3));
      k = smooth(TITLE[0], TITLE[1], it);
      inEnv = smooth(7.9, 9.0, it);
      out = smooth(0.5, 0.92, lp);
    } else {
      // First Contact waits for the breakthrough: the ocean is never announced before it is seen.
      const start = i === 3 ? 0.08 : 0;
      k = smooth(start - 0.04, start + 0.45, lp);
      inEnv = smooth(start + 0.04, start + 0.34, lp);
    }
    setVar(f.el, "--in", inEnv.toFixed(3));
    setVar(f.el, "--out", out.toFixed(3));
    // Faded-out content can't be focused or clicked.
    const gone = inEnv * (1 - out) < 0.05;
    if (f.el.inert !== gone) f.el.inert = gone;
    if (pendingFocus?.frame === i && !gone && inEnv > 0.5) {
      pendingFocus.el.focus({ preventScroll: true });
      pendingFocus = null;
    }
    for (const { el, win } of f.timed) {
      const show = reduced ? 1 : inWindow(win, lp);
      setVar(el, "--show", show.toFixed(3));
      if (el.inert !== show < 0.05) el.inert = show < 0.05;
    }
    for (const { s, mode, win } of f.kinetic) {
      let kk = k;
      let o = out;
      if (win) {
        // Status lines type out at their own moment, synced to the picture.
        kk = reduced ? 1 : smooth(win[0], win[1], lp);
        if (win[2] !== undefined) o = Math.max(last ? replayOut : 0, smooth(win[2], win[3]!, lp));
      }
      if (i === 0 && mode === "condense") kk = reduced ? 1 : smooth(7.2, 8.7, introT);
      if (last && mode === "condense") kk = smooth(0.04, 0.36, lp);
      let ring: { x: number; y: number; r: number } | undefined;
      if (mode === "sonar") {
        // The words appear where the ring has passed, and go back as it gathers in on the way up.
        const rect = s.rect ?? { left: 0, top: 0 };
        if (a.ring && a.ring.r > 0) ring = { x: a.ring.x - rect.left, y: a.ring.y - rect.top, r: a.ring.r };
        else ring = { x: 0, y: 0, r: story.sweep >= 1 || reduced ? 4000 : 0 };
        kk = ring.r > 0 ? 1 : 0;
      }
      apply(mode, s, { k: kk, out: o, ring, plumeX: a.vent.visible ? a.vent.x : undefined, reduced });
    }
    if (last) {
      const draw = reduced ? 1 : smooth(0.46, 0.9, lp); // the record of the findings draws as the signal leaves
      if (draw !== lastDraw) for (const { el, len } of diagramLines) el.style.strokeDashoffset = (len * (1 - draw)).toFixed(1);
      lastDraw = draw;
    }
  });

  // Gauge, depth and readouts.
  const current = Math.min(CHAPTERS - 1, Math.floor(p));
  gaugeItems.forEach((li, i) => li.classList.toggle("is-current", i === current));
  setVar(gaugeMarker, "--y", `${((p / CHAPTERS) * gaugeH).toFixed(1)}px`);
  write(depthEl, metres(depthM));
  write(shaftDepthEl, metres(depthM));
  const range = story.scanRadius;
  write(sonarRangeEl, ((range * METRES_PER_UNIT) / 1000).toFixed(2));

  place(anchors.crack, a.crack, p > 1.3 && p < 2.1);
  place(anchors.anomaly, a.anomaly, story.anomalyFound && p > 4.1 && p < 5.35);
  // The vent label hangs right unless it would leave the screen: the headline owns the left.
  place(anchors.vent, a.vent, p > 5.45 && p < 6.0, 0.78);
}

// ───── Per-frame scene ─────

const SPACE_GROUND = hexLinear("#010203");
const OCEAN_GROUND = hexLinear("#06111a");
const ICE = hexLinear("#c8eef0");
let oceanTime = 0;
let elapsed = 0;
/**
 * The opening journey clock (Jupiter → Europa → the title). It runs on time, and runs 5× faster
 * once the visitor scrolls, so nobody is held in an intro they want to leave.
 */
let introT = 0;
const INTRO_TRAVEL: readonly [number, number] = [0.6, 7.4];
const introProgress = () => (story.reducedMotion ? 1 : smooth(INTRO_TRAVEL[0], INTRO_TRAVEL[1], introT));
let hurried = false;
addEventListener("keydown", () => (hurried = true), { once: true });
addEventListener("focusin", () => (hurried = true), { once: true });
/** NEREID forms over these seconds of the intro clock: slow, so each slice of light can be watched. */
const TITLE: readonly [number, number] = [4.6, 8.4];
const advanceIntro = (dt: number) => {
  if (!fontsReady) return;
  // A visitor who scrolls or uses the keyboard early skips ahead through the journey to Europa,
  // but the title always forms at its own pace: it is never sped up.
  const hurry = introT < TITLE[0] && (story.p > 0.1 || hurried) ? 3 : 1;
  introT += dt * hurry;
};

// Story-position cues, synced to the visual events. Each plays once on the way down and is re-armed only
// after scrolling well back, so reversing never spams hits. Jumps (chapter links) pass silently.
const POSITION_CUES: readonly { id: CueId; at: number; rearm: number }[] = [
  { id: "arrival-lock", at: 1.56, rearm: 1.3 }, // "Landing site identified" 
  { id: "ice-breakthrough", at: 3.0, rearm: 2.6 },
  { id: "discovery-reveal", at: 5.3, rearm: 4.9 }, // the plume rises into view
  { id: "transmission", at: 6.46, rearm: 6.2 }, // the signal leaves Europa
];
const armed = POSITION_CUES.map(() => true);
let cueP = 0;
function positionCues(p: number): void {
  const jump = Math.abs(p - cueP) > 0.4;
  cueP = p;
  POSITION_CUES.forEach((c, i) => {
    if (armed[i] && p >= c.at) {
      armed[i] = false;
      if (!jump) sound.cue(c.id);
    } else if (!armed[i] && p < c.rearm) armed[i] = true;
  });
}

function frameParams(info: FrameInfo): FrameParams {
  const dt = Math.min(info.dt, 0.1);
  elapsed += dt;
  advanceIntro(dt);
  handle(story.step(dt));
  const p = story.p;
  const aspect = info.width / Math.max(1, info.height);
  const shot = shoot(p, elapsed, aspect, introProgress());
  positionCues(p);
  sound.update({ ...shot.weights, warm: shot.plume, signal: shot.signal }, story.speed);
  oceanTime += dt * (story.reducedMotion ? 0.12 : 0.6);

  // Ocean camera with gentle pointer parallax.
  pointer.sx += (pointer.x - pointer.sx) * 0.04;
  pointer.sy += (pointer.y - pointer.sy) * 0.04;
  const still = story.reducedMotion ? 0 : 1;
  const pose = {
    ...shot.ocean,
    yaw: shot.ocean.yaw + pointer.sx * 0.035 * still,
    pitch: shot.ocean.pitch - pointer.sy * 0.02 * still,
    fov: widenForAspect(shot.ocean.fov, aspect),
  };
  const ocean = oceanMatrices(pose, aspect);

  // Space camera, widened on portrait screens.
  const cam = shot.space;
  const tanH = Math.tan(widenForAspect(Math.atan(cam.tanHalfFov) * 2, aspect) / 2);
  const spaceCam = { ...cam, tanHalfFov: tanH };

  // DOM anchors.
  const w = innerWidth;
  const h = innerHeight;
  let ring: Anchors["ring"] = null;
  if (story.pulse?.kind === "sweep" && shot.weights.ocean > 0.5) {
    const c = ocean.project(PULSE_POINT, w, h);
    const e = ocean.project([PULSE_POINT[0] + story.pulseRadius(), 0, PULSE_POINT[2]], w, h);
    ring = { x: c.x, y: c.y, r: Math.hypot(e.x - c.x, e.y - c.y) };
  }
  // The Transmission diagram rings Europa: centre and size from the projected disc.
  if (p > 6) {
    const c = projectSpace(spaceCam, [0, 0, 0], w / h, w, h);
    const edge = projectSpace(spaceCam, [spaceCam.right[0], spaceCam.right[1], spaceCam.right[2]], w / h, w, h);
    const radiusPx = Math.hypot(edge.x - c.x, edge.y - c.y);
    setVar(diagram as unknown as HTMLElement, "--x", `${c.x.toFixed(1)}px`);
    setVar(diagram as unknown as HTMLElement, "--y", `${c.y.toFixed(1)}px`);
    // The inner ring (r 58 of 400) sits just outside the disc.
    // On phones it stays compact, so its rays don't run through the words below.
    const size = Math.max(240, (radiusPx * 1.25 * 400) / 58);
    setVar(diagram as unknown as HTMLElement, "--s", (Math.min(size, w < 700 ? 280 : Infinity) / 400).toFixed(3));
  }
  overlay(p, shot.depthM, {
    crack: projectSpace(spaceCam, DIVE_POINT, w / h, w, h),
    anomaly: ocean.project([ANOMALY[0], 2.2, ANOMALY[1]], w, h),
    vent: ocean.project([VENT[0], 8, VENT[2]], w, h),
    ring,
  });

  const wO = shot.weights.ocean;
  const intro = story.reducedMotion ? 1 : smooth(0, 2.4, elapsed);
  return {
    oceanTime,
    view: ocean.view,
    projection: ocean.projection,
    pulse: [PULSE_POINT[0], PULSE_POINT[2], story.pulseRadius(), story.pulseStrength()],
    scan: [story.scanRadius, story.scanAmount],
    anomaly: [ANOMALY[0], ANOMALY[1], story.anomalyFound ? story.scanAmount : 0],
    brightness: 1,
    visibility: intro,
    horizonY: 0.5 - (Math.tan(-pose.pitch) / Math.tan(pose.fov / 2)) * 0.5,
    ocean: wO,
    world: {
      eye: [...spaceCam.eye, tanH],
      forward: [...spaceCam.forward, aspect],
      right: [...spaceCam.right, elapsed],
      up: [...spaceCam.up, shot.weights.space],
      sun: [...shot.sun, shot.starBrightness],
      crack: [...CRACK_NORMAL, shot.crackOpen],
      signal: [...EARTH_DIR, shot.signal],
      shaft: [shot.weights.shaft, shot.shaftDepth, 1, shot.breakthrough],
      extra: [shot.jupiter[0], shot.jupiter[1], 0, 0],
    },
    plume: { amount: shot.plume, vent: VENT },
    flash: [ICE[0] * shot.flash, ICE[1] * shot.flash, ICE[2] * shot.flash],
    // The ocean's low bloom threshold only arrives once the water has taken over; mid-seam it would
    // make the bright ice and Europa glow across the whole frame.
    bloomThreshold: 0.62 + (0.28 - 0.62) * wO ** 3,
    ground: [0, 1, 2].map((c) => SPACE_GROUND[c]! + (OCEAN_GROUND[c]! - SPACE_GROUND[c]!) * wO) as [number, number, number],
  };
}

// ───── Boot ─────

function fallback(reason: unknown): void {
  if (reason) console.warn("NEREID: WebGPU unavailable, showing still frames.", reason);
  body.dataset.gpu = "unsupported";
  showStill(story.chapter);
  let prev = performance.now();
  const off = { x: 0, y: 0, visible: false };
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;
    elapsed += dt;
    advanceIntro(dt);
    handle(story.step(dt));
    overlay(story.p, shoot(story.p, elapsed).depthM, { crack: off, anomaly: off, vent: off, ring: null });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function boot(): Promise<void> {
  measure();
  story.snap(scrollP());
  if (!("gpu" in navigator) || !navigator.gpu) return fallback(null);
  // Fetch the renderer while the adapter is requested.
  const rendererModule = import("./ocean/renderer");
  const adapter = await navigator.gpu.requestAdapter().catch(() => null);
  if (!adapter) return fallback("No WebGPU adapter");

  const nav = navigator as Navigator & { deviceMemory?: number };
  let tier: Tier = initialTier({ coarsePointer: coarse, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency, memoryGb: nav.deviceMemory });
  const governor = new QualityGovernor(tier);
  let failed = false;
  const { createRenderer } = await rendererModule;
  let renderer: OceanRenderer | null = null;
  renderer = createRenderer({
    canvas: $<HTMLCanvasElement>("#world"),
    tier,
    onFrame(info) {
      const next = governor.push(info.dt);
      if (next) renderer?.setTier((tier = next));
      return frameParams(info);
    },
    onError(error) {
      if (failed) return;
      failed = true;
      fallback(error);
    },
  });
  await renderer.ready;
  if (!failed) body.dataset.gpu = "live";
  if (import.meta.env.DEV) {
    Object.assign(window, { __nereid: { story, tier: () => tier, setTier: (t: Tier) => renderer?.setTier((tier = governor.tier = t)) } });
  }
}

void boot();

// Development only: the four-button sound audition panel (sound-design.md §9). Tree-shaken from builds.
if (import.meta.env.DEV && new URLSearchParams(location.search).has("audition")) {
  void import("./audition").then((m) => m.mountAudition(sound));
}
