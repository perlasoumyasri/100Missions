import "./styles.css";

import { clamp01, CRACK_NORMAL, EARTH_DIR, oceanMatrices, projectSpace, PULSE_POINT, shoot, smooth, VENT, widenForAspect } from "./lib/director";
import { initialTier, QualityGovernor, type Tier } from "./lib/quality";
import { ANOMALY, ANOMALY_DISTANCE, CHAPTERS, METRES_PER_UNIT, Story, type StoryEvent } from "./lib/story";
import { hexLinear } from "./ocean/tuning";
import type { FrameInfo, FrameParams, OceanRenderer } from "./ocean/renderer";
import { createSound, type CueId } from "./sound";
import { buildAt, buildStages, layoutCallout, readSeconds, type Slot } from "./type/callouts";
import { apply, split, type Mode, type Split } from "./type/kinetic";
import { createStatuses } from "./type/status";

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

/**
 * A callout pins a few lines of the narrative to a target in the scene. It follows the scroll: over the
 * start of its span (chapter progress) the ring, leader and words build, and at its end they fold away.
 */
interface Callout {
  el: HTMLElement;
  at: string;
  /** Chapter progress where it turns on (null: the Opening's intro clock decides) and off. */
  span: readonly [number | null, number];
  /** Where the words sit; they never move, only the leader follows the target. */
  slot: Slot;
  gate?: string;
  text: HTMLElement;
  /** When the scroll reached it (story time, s), or -1: from then it builds in time and its words come up whole. */
  since: number;
  /** Build progress 0..1 of the ring, leader and shelf, and the measured size of the words. */
  k: number;
  /** Once placed, a callout holds its last position if its target leaves the screen, rather than vanishing. */
  placed: boolean;
  w: number;
  h: number;
}
interface Frame {
  el: HTMLElement;
  /** The chapter's scroll length in vh (its section's --len), so reading pace can be set in vh of scroll. */
  len: number;
  kinetic: { s: Split; mode: Mode; win: Window | null }[];
  /** Plain elements (actions, asides) that show only inside their window. */
  timed: { el: HTMLElement; win: Window }[];
  callouts: Callout[];
}
const words = (el: Element) => (el.textContent ?? "").trim().split(/\s+/).length;
const frames: Frame[] = [...document.querySelectorAll<HTMLElement>(".frame")].map((el) => ({
  el,
  len: Number(el.closest<HTMLElement>(".chapter")!.style.getPropertyValue("--len")),
  callouts: [...el.querySelectorAll<HTMLElement>(".callout")].map((c) => {
    const [a, b] = c.dataset.span!.split(",");
    return {
      since: -1,
      el: c,
      at: c.dataset.at!,
      span: [a === "intro" ? null : Number(a), Number(b)] as const,
      slot: ((v: number[]) => ({ x: v[0]!, y: v[1]!, side: v[2]! < 0 ? -1 : 1, up: v[3] === 1, phoneTop: v[4]! }) as Slot)(
        c.dataset.slot!.split(",").map(Number),
      ),
      gate: c.dataset.gate,
      text: c.querySelector<HTMLElement>(".callout__text")!,
      k: 0,
      placed: false,
      w: 0,
      h: 0,
    };
  }),
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
  for (const f of frames) {
    for (const c of f.callouts) {
      c.w = c.text.offsetWidth;
      c.h = c.text.offsetHeight;
    }
  }
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
// Sound is on by default (a remembered preference). Browsers allow no audio before a gesture, so it
// starts at the visitor's first click, tap or key press; the Sound button turns it off and on.
const soundButton = $("#sound");
let wantSound = localStorage.getItem("nereid-sound-on") !== "off";
// Sound is on by default (the user's choice: it starts quiet and rises slowly, so there is time to turn it
// off). It is tried at once; browsers that still need a click, tap or key press start it on the first one.
const soundHint = $("#sound-hint");
const showSound = () => {
  if (sound.enabled) soundHint.hidden = true;
  soundButton.setAttribute("aria-pressed", String(wantSound));
  $("[data-sound-state]").textContent = wantSound ? "on" : "off";
};
showSound();
const startSound = (e: Event) => {
  if (!wantSound || sound.enabled || soundButton.contains(e.target as Node)) return;
  void sound.enable().then(showSound);
};
for (const ev of ["pointerdown", "keydown", "touchend", "click"] as const) addEventListener(ev, startSound, { passive: true });
if (wantSound) void sound.enable().then(showSound);
// Scrolling can't start audio, so a visitor who only scrolls is told, once, how to turn it on.
addEventListener(
  "scroll",
  () => {
    if (wantSound && !sound.enabled && scrollY > innerHeight * 0.3) soundHint.hidden = false;
  },
  { passive: true },
);
soundButton.addEventListener("click", () => {
  // Wanted but not started yet: this click starts it. Otherwise the button toggles.
  if (wantSound && !sound.enabled) return void sound.enable(true).then(showSound);
  wantSound = !wantSound;
  localStorage.setItem("nereid-sound-on", wantSound ? "on" : "off");
  if (wantSound) void sound.enable(true).then(showSound);
  else sound.disable();
  showSound();
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
for (const el of document.querySelectorAll("[data-anomaly-range]")) el.textContent = `${anomalyKm}\u00a0km`;

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

type Target = "europa" | "ice" | "lamp" | "water" | "anomaly" | "vent" | "earth";
interface Anchors {
  targets: Record<Target, Pt>;
}

// ───── Callouts ─────

/** Chapter progress a callout takes to fold away. Its build follows the reading pace (type/callouts.ts). */
const CALLOUT_FOLD = 0.04;
const calloutViewport = () => {
  const w = innerWidth;
  const h = innerHeight;
  const phone = w < 700;
  // The chapter gauge owns the right edge on wide screens; the masthead and fine print own top and bottom.
  return { w: w - (w > 900 ? 130 : 0), h, gutter: Math.min(96, Math.max(20, w * 0.052)), top: phone ? 72 : 86, bottom: phone ? 100 : 76, phone };
};

/**
 * Without WebGPU there is nothing to pin to, and with reduced motion each chapter is held still: there,
 * a chapter's callouts sit together in its text column, without leaders, for as long as the chapter shows.
 */
function updateCallouts(f: Frame, lp: number, targets: Anchors["targets"], openingT: number): void {
  const pinned = body.dataset.gpu !== "unsupported" && !story.reducedMotion;
  const mode = pinned ? "pinned" : "static";
  if (body.dataset.callouts !== mode) body.dataset.callouts = mode;
  const vp = calloutViewport();
  for (const c of f.callouts) {
    const t = targets[c.at as Target];
    const before = c.k;
    let text: number;
    if (pinned) {
      const [start, end] = c.span;
      const span = end - (start ?? 0);
      const fold = clamp01((end - lp) / Math.min(CALLOUT_FOLD, span * 0.25));
      // The scroll decides when a callout begins (the Opening's: its clock); from then it builds in time
      // and its words come up whole, so they can be read however fast the visitor scrolls.
      const gate = c.gate !== "anomaly" || story.anomalyFound;
      if (start !== null) {
        if (lp >= start && lp < end && gate && t.visible) {
          if (c.since < 0) c.since = story.time;
        } else if (lp < start) c.since = -1;
      }
      const b = buildAt(start === null ? openingT - OPENING.callout : c.since < 0 ? 0 : story.time - c.since);
      const on = gate && (t.visible || c.placed) ? fold : 0;
      c.k = Math.min(b.structure, on);
      text = Math.min(b.text, on);
    } else {
      c.k = lp > -0.1 && lp < 1 ? 1 : 0;
      text = c.k;
    }
    if (c.k === 0) c.placed = false;
    if (before === 0 && c.k === 0) continue;
    if (c.el.classList.contains("is-on") !== c.k > 0) c.el.classList.toggle("is-on", c.k > 0);
    if (pinned && t.visible) {
      c.placed = true;
      const pl = layoutCallout(t, c, vp, c.slot);
      const px = (v: number) => `${v.toFixed(1)}px`;
      setVar(c.el, "--x", px(t.x));
      setVar(c.el, "--y", px(t.y));
      setVar(c.el, "--lx", px(pl.leg.x));
      setVar(c.el, "--ly", px(pl.leg.y));
      setVar(c.el, "--la", `${pl.leg.angle.toFixed(3)}rad`);
      setVar(c.el, "--ll", pl.leg.length.toFixed(1));
      setVar(c.el, "--tx", px(pl.text.x));
      setVar(c.el, "--ty", px(pl.text.y));
      setVar(c.el, "--origin", px(pl.origin));
      const fromRight = pl.origin > c.w * 0.5;
      if (c.el.classList.contains("is-from-right") !== fromRight) c.el.classList.toggle("is-from-right", fromRight);
      if (c.el.classList.contains("is-shelf-top") !== pl.shelfOnTop) c.el.classList.toggle("is-shelf-top", pl.shelfOnTop);
    }
    const st = buildStages(c.k);
    setVar(c.el, "--mark", st.mark.toFixed(3));
    setVar(c.el, "--leg", st.leg.toFixed(3));
    setVar(c.el, "--shelf", st.shelf.toFixed(3));
    setVar(c.el, "--text", text.toFixed(3)); // all the words, and the plate behind them, at once
  }
}

/** The instruments' status lines, one under each heading: they type out once reached, with a soft tick. */
const statuses = createStatuses([...document.querySelectorAll<HTMLElement>(".status[data-at]")], () => sound.tick());

function overlay(p: number, depthM: number, a: Anchors): void {
  const reduced = story.reducedMotion;
  const replayOut = replayAt >= 0 ? smooth(0, 1.2, story.time - replayAt) : 0;
  if (replayAt >= 0 && story.time - replayAt > 1.3) {
    replayAt = -1;
    story.snap(0);
    scrollTo({ top: 0, behavior: "auto" });
    pendingFocus = { el: $("#begin"), frame: 0 };
  }
  let openingT = 99;
  frames.forEach((f, i) => {
    const lp = p - i;
    const last = i === CHAPTERS - 1;
    // A little past its end too: some callouts carry into the next chapter until its own callout arrives.
    const near = lp > -0.25 && lp < 1.2;
    const wasLive = f.el.classList.contains("is-live");
    if (wasLive !== near) f.el.classList.toggle("is-live", near);
    if (!near) return;
    let k: number;
    let inEnv: number;
    // One thing at a time: a heading forms early, the callout's lines and actions follow it, and the
    // heading leaves late, as the next one forms, so nothing goes before it has been read.
    let out = last ? replayOut : smooth(0.82, 0.99, lp);
    if (i === 0) {
      // The journey line over Jupiter, then the name forming as Europa arrives (the title clock), then,
      // on the opening clock, the label, the question, the callout line by line, and the first action.
      const it = reduced ? 99 : introT;
      // Scrolling moves the opening on only once the name has formed, so nothing after it (the label, the
      // question, the callout) can arrive over the journey line or the forming name.
      if (introT >= TITLE[1] && lpAtTitle === null) lpAtTitle = lp;
      openingT = reduced
        ? 99
        : lpAtTitle === null
          ? introT
          : Math.max(introT, TITLE[1] + (Math.max(0, lp - lpAtTitle) * f.len) / VH_PER_SECOND);
      setVar(f.el, "--journey", (smooth(0.8, 1.8, it) * (1 - smooth(3.6, 4.6, it)) * (1 - smooth(0.05, 0.3, lp))).toFixed(3));
      setVar(f.el, "--act", smooth(OPENING.begin[0], OPENING.begin[1], openingT).toFixed(3));
      // Linear, not eased: an eased clock crawls at the end, so the last letters (I, D) formed slowly and
      // unevenly. Each letter carries its own ease (kinetic.ts), so the name forms at an even cadence.
      k = clamp01((it - TITLE[0]) / (TITLE[1] - TITLE[0]));
      inEnv = smooth(TITLE[1], TITLE[1] + 0.5, openingT);
      out = smooth(0.8, 0.98, lp);
    } else {
      // First Contact waits for the breakthrough: the ocean is never announced before it is seen.
      const start = i === 3 ? 0.08 : 0;
      k = smooth(start - 0.02, start + 0.18, lp);
      inEnv = smooth(start, start + 0.18, lp);
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
      if (i === 0 && mode === "fade") kk = reduced ? 1 : smooth(OPENING.question[0], OPENING.question[1], openingT);
      if (last && mode === "fade") kk = smooth(0.02, 0.2, lp);
      apply(mode, s, { k: kk, out: o, reduced });
    }
    updateCallouts(f, lp, a.targets, openingT);
    if (last) {
      const draw = reduced ? 1 : smooth(0.46, 0.9, lp); // the record of the findings draws as the signal leaves
      if (draw !== lastDraw) for (const { el, len } of diagramLines) el.style.strokeDashoffset = (len * (1 - draw)).toFixed(1);
      lastDraw = draw;
    }
  });

  statuses.update(p, story.time, reduced, story.speed);

  // Gauge, depth and readouts.
  const current = Math.min(CHAPTERS - 1, Math.floor(p));
  gaugeItems.forEach((li, i) => li.classList.toggle("is-current", i === current));
  setVar(gaugeMarker, "--y", `${((p / CHAPTERS) * gaugeH).toFixed(1)}px`);
  write(depthEl, metres(depthM));
  write(shaftDepthEl, metres(depthM));
  const range = story.scanRadius;
  write(sonarRangeEl, ((range * METRES_PER_UNIT) / 1000).toFixed(2));

}

// ───── Per-frame scene ─────

const add3 = (a: readonly number[], b: readonly number[], s: number) => [a[0]! + b[0]! * s, a[1]! + b[1]! * s, a[2]! + b[2]! * s];
/** A point on the open ice, high on the moon's face as the probe approaches (Arrival's first callout). */
const ICE_POINT = (() => {
  const v = [0.3, 0.4, 0.85];
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
})();
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
/** The Opening's scroll position when the name finished forming (scroll moves the opening on from there). */
let lpAtTitle: number | null = null;
/** Scrolling moves the opening clock on: one second of it for every 6vh of scroll. */
const VH_PER_SECOND = 8;
/**
 * After the name (seconds on the opening clock): the question, then the Europa callout once the question
 * has been read, its lines one by one, then the first action once the last line has been read.
 */
const OPENING = (() => {
  const question = [TITLE[1] + 0.6, TITLE[1] + 1.6] as const;
  const callout = question[1] + readSeconds(words($(".tagline")));
  const c = frames[0]!.callouts[0]!;
  const begin = callout + 1 + readSeconds(words(c.text));
  return { question, callout, begin: [begin, begin + 0.7] as const };
})();
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
  { id: "ice-breakthrough", at: 2.97, rearm: 2.6 }, // at the bottom of the beds' hush, just before the flash
  { id: "discovery-reveal", at: 5.15, rearm: 4.9 }, // the swell grows as the plume rises into view
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
  sound.world(shot.weights, story.speed, p);
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
  const europaC = projectSpace(spaceCam, [0, 0, 0], w / h, w, h);
  const europaEdge = projectSpace(spaceCam, spaceCam.right, w / h, w, h);
  const europaR = Math.hypot(europaEdge.x - europaC.x, europaEdge.y - europaC.y);
  // The Transmission diagram rings Europa: centre and size from the projected disc.
  if (p > 6) {
    const c = europaC;
    const radiusPx = europaR;
    setVar(diagram as unknown as HTMLElement, "--x", `${c.x.toFixed(1)}px`);
    setVar(diagram as unknown as HTMLElement, "--y", `${c.y.toFixed(1)}px`);
    // The inner ring (r 58 of 400) sits just outside the disc.
    // On phones it stays compact, so its rays don't run through the words below.
    const size = Math.max(240, (radiusPx * 1.25 * 400) / 58);
    setVar(diagram as unknown as HTMLElement, "--s", (Math.min(size, w < 700 ? 280 : Infinity) / 400).toFixed(3));
  }
  // Callout targets. Europa carries its radius (callouts pin to a point on the disc); the lamp is fixed on screen.
  const space = shot.weights.space > 0.5;
  const inOcean = shot.weights.ocean > 0.5;
  const oceanPt = (pt: [number, number, number]) => {
    const r = ocean.project(pt, w, h);
    return { ...r, visible: r.visible && inOcean };
  };
  const spacePt = (pt: readonly number[], show = space) => {
    const r = projectSpace(spaceCam, pt, w / h, w, h);
    return { ...r, visible: r.visible && show };
  };
  // Europa's callout points at the upper left of the disc (on phones, its bottom: the words sit under the moon).
  const europaAt = w < 700 ? [0, 0.9] : [-0.5, -0.62];
  const europa = {
    x: europaC.x + europaAt[0]! * europaR,
    y: europaC.y + europaAt[1]! * europaR,
    visible: europaC.visible && space,
  };
  // Earth is above the frame on portrait screens: then the callout pins where the signal leaves the screen.
  const earthRaw = projectSpace(spaceCam, add3(spaceCam.eye, EARTH_DIR, 1000), w / h, w, h);
  const earth = { ...earthRaw, visible: space && shot.signal > 0.25 && europaC.visible };
  if (earth.visible && !earthRaw.visible) {
    const [x0, x1, y0, y1] = [24, w - 24, 96, h - 24];
    const dx = earthRaw.x - europaC.x;
    const dy = earthRaw.y - europaC.y;
    let k = 1;
    if (dx < 0) k = Math.min(k, (x0 - europaC.x) / dx);
    if (dx > 0) k = Math.min(k, (x1 - europaC.x) / dx);
    if (dy < 0) k = Math.min(k, (y0 - europaC.y) / dy);
    if (dy > 0) k = Math.min(k, (y1 - europaC.y) / dy);
    earth.x = europaC.x + dx * Math.max(0, k);
    earth.y = europaC.y + dy * Math.max(0, k);
  }
  overlay(
    p,
    shot.depthM,
    {
      targets: {
        europa,
        ice: spacePt(ICE_POINT),
        lamp: { x: w / 2, y: h * 0.56, visible: shot.weights.shaft > 0.6 },
        water: oceanPt([-30, 0, -40]),
        anomaly: oceanPt([ANOMALY[0], 2.2, ANOMALY[1]]),
        vent: oceanPt([VENT[0], 8, VENT[2]]),
        earth,
      },
    },
  );

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
  const targets = { europa: off, ice: off, lamp: off, water: off, anomaly: off, vent: off, earth: off };
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;
    elapsed += dt;
    advanceIntro(dt);
    handle(story.step(dt));
    overlay(story.p, shoot(story.p, elapsed).depthM, { targets });
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
