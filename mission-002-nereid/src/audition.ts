/**
 * Development-only sound audition panel (sound-design.md §9): four isolated previews to compare and
 * refine the cues. Loaded only in dev with ?audition in the URL; never part of the production build.
 */
import type { createSound, SceneMix } from "./sound";

type Sound = ReturnType<typeof createSound>;

const mix = (o: Partial<SceneMix>): SceneMix => ({ space: 0, shaft: 0, ocean: 0, warm: 0, signal: 0, ...o });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Drives the mix over time: f(t 0..1) → [mix, speed]. */
async function sweep(sound: Sound, ms: number, f: (t: number) => [SceneMix, number]) {
  const t0 = performance.now();
  await new Promise<void>((done) => {
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const [m, v] = f(t);
      sound.update(m, v, true);
      if (t < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  });
}

export function mountAudition(sound: Sound): void {
  const panel = document.createElement("div");
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Sound audition (development only)");
  panel.style.cssText =
    "position:fixed;left:12px;bottom:12px;z-index:50;display:flex;gap:6px;padding:8px;background:rgb(3 9 14/.9);border:1px solid rgb(240 244 240/.2);font:12px/1 var(--mono)";
  let busy = false;
  const run = (label: string, play: () => Promise<void>) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText = "padding:8px 10px;background:none;color:#f0f4f0;border:1px solid rgb(240 244 240/.3);cursor:pointer";
    b.addEventListener("click", async () => {
      if (busy) return; // no overlapping auditions
      busy = true;
      panel.querySelectorAll("button").forEach((x) => (x.disabled = x !== stop));
      if (!sound.enabled) await sound.toggle();
      sound.hold(true);
      try {
        await play();
      } finally {
        await sweep(sound, 600, () => [mix({}), 0]);
        sound.hold(false);
        busy = false;
        panel.querySelectorAll("button").forEach((x) => (x.disabled = false));
      }
    });
    panel.append(b);
    return b;
  };

  run("1 · UI / Button", async () => {
    sound.cue("expedition-start");
    await wait(900);
  });
  run("2 · Traverse", () =>
    // Ice descent into water: narrow and dark, speeding up, opening wide as it reaches the ocean, then rest.
    sweep(sound, 4200, (t) => [mix({ shaft: 1 - smoothish(0.55, 0.75, t), ocean: smoothish(0.55, 0.75, t) }), t < 0.85 ? Math.sin(Math.PI * Math.min(1, t / 0.85)) * 0.7 : 0]),
  );
  run("3 · Transition", async () => {
    await sweep(sound, 1200, () => [mix({ shaft: 1 }), 0.4]);
    sound.cue("ice-breakthrough");
    await sweep(sound, 3200, (t) => [mix({ shaft: 1 - smoothish(0, 0.25, t), ocean: smoothish(0, 0.35, t) }), 0.4 * (1 - t)]);
  });
  run("4 · Sonar / Discovery", async () => {
    await sweep(sound, 800, () => [mix({ ocean: 1 }), 0]);
    sound.cue("sonar-emit");
    await sweep(sound, 1700, () => [mix({ ocean: 1 }), 0]);
    sound.cue("anomaly-lock");
    await sweep(sound, 1300, () => [mix({ ocean: 1 }), 0]);
    sound.cue("discovery-reveal");
    await sweep(sound, 4500, (t) => [mix({ ocean: 1, warm: smoothish(0, 0.6, t) }), 0]);
  });
  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "Stop";
  stop.style.cssText = "padding:8px 10px;background:none;color:#8be3f5;border:1px solid rgb(139 227 245/.4);cursor:pointer";
  stop.addEventListener("click", () => sound.enabled && void sound.toggle());
  panel.append(stop);
  document.body.append(panel);
}

function smoothish(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
