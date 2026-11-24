/**
 * Kinetic type. Each chapter's headline has its own behaviour, driven by that chapter's progress
 * and by what its environment is doing, so the words move with the world rather than fading up on scroll.
 *
 *   slices   (Opening)       each letter forms from horizontal slices of light that widen until solid (ref: Alien titles)
 *   focus    (Arrival)       the words pull into focus as the camera closes in; the layout never moves
 *   lamp     (Fracture)      words exist only where the cryobot's lamp has passed (ref: Interstellar)
 *   condense (First Contact) characters condense out of the dark, each settling at its own moment
 *   sonar    (Anomaly)       a radial mask centred on the pulse; the words appear as the ring passes
 *   rise     (Discovery)     characters rise into place, carried up by the warm water
 *   transmit (Transmission)  the line types out like a signal; on the way back it disintegrates
 */

export type Mode = "slices" | "focus" | "lamp" | "condense" | "sonar" | "rise" | "transmit";

export interface Split {
  el: HTMLElement;
  chars: HTMLElement[];
  /** Per-character random seeds, stable across frames. */
  seeds: number[];
  /** Cached layout box (refreshed when the frame goes live and on resize), so no frame forces layout. */
  rect: DOMRect | null;
  /** Cached horizontal centre of each character relative to the element, px. */
  charX: number[];
  /** Index of the word each character belongs to, and the word count. */
  wordOf: number[];
  words: number;
}

/** Read layout once (call before any style writes in a frame, or when a frame becomes live). */
export function measure(s: Split): void {
  s.rect = s.el.getBoundingClientRect();
  s.charX = s.chars.map((ch) => {
    const r = ch.getBoundingClientRect();
    return r.left + r.width / 2 - s.rect!.left;
  });
}

/**
 * How finely each mode needs the text split. Every split letter becomes its own box, which loses the
 * font's kerning (Bodoni's "w n" gap), so modes that move whole lines or words don't split letters.
 */
const GRAIN: Record<Mode, "char" | "word" | "none"> = {
  slices: "char",
  focus: "word",
  lamp: "none",
  condense: "char",
  sonar: "none",
  rise: "char",
  transmit: "char",
};

/** Wrap each character (or word) in a span; words stay unbreakable. A visually hidden copy keeps the text for assistive tech. */
export function split(el: HTMLElement, mode: Mode): Split {
  const grain = GRAIN[mode];
  if (grain === "none") return { el, chars: [], seeds: [], rect: null, charX: [], wordOf: [], words: 0 };
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const chars: HTMLElement[] = [];
  const wordOf: number[] = [];
  let words = 0;
  const walk = (node: Node, into: HTMLElement) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? "").split(/(\s+)/);
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            into.append(document.createTextNode(" "));
            continue;
          }
          const word = document.createElement("span");
          word.className = "word";
          if (grain === "word") {
            word.classList.add("ch");
            word.textContent = part;
            chars.push(word);
            wordOf.push(words++);
            into.append(word);
            continue;
          }
          for (const ch of part) {
            const span = document.createElement("span");
            span.className = "ch";
            span.textContent = ch;
            word.append(span);
            chars.push(span);
            wordOf.push(words);
          }
          words += 1;
          into.append(word);
        }
      } else if (child instanceof HTMLElement) {
        const clone = child.cloneNode(false) as HTMLElement;
        walk(child, clone);
        into.append(clone);
      }
    }
  };
  const holder = document.createElement("span");
  holder.setAttribute("aria-hidden", "true");
  walk(el, holder);
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = text;
  el.replaceChildren(spoken, holder);
  const seeds = chars.map((_, i) => {
    const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  });
  return { el, chars, seeds, rect: null, charX: [], wordOf, words };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface Context {
  /** Build progress 0..1 (how far the reveal has got). */
  k: number;
  /** Exit progress 0..1. */
  out: number;
  /** Sonar ring: centre in the element's coordinates and radius in px. */
  ring?: { x: number; y: number; r: number };
  /** Screen x (px) of the plume, for rise ordering. */
  plumeX?: number;
  reduced: boolean;
}

/** Blur only when it is visible: a 0px filter still costs a compositing layer per character. */
const blur = (px: number) => (px > 0.3 ? `filter:blur(${Math.min(px, 8).toFixed(2)}px);` : "");

const cache = new WeakMap<HTMLElement, string>();
const put = (el: HTMLElement, css: string) => {
  if (cache.get(el) === css) return;
  cache.set(el, css);
  el.style.cssText = css;
};

export function apply(mode: Mode, s: Split, c: Context): void {
  const n = s.chars.length;
  if (c.reduced) {
    const o = clamp01(c.k * 1.5) * (1 - c.out);
    put(s.el, `opacity:${o.toFixed(3)}`);
    for (const ch of s.chars) put(ch, "");
    return;
  }
  const outBlur = c.out * 6;
  const outOpacity = 1 - c.out;
  switch (mode) {
    case "slices": {
      // Each letter forms from horizontal slices of light (0.09 em apart) that widen smoothly until the
      // letter is solid, staggered across the word. Once a letter is whole its mask is removed.
      put(s.el, `opacity:${outOpacity.toFixed(3)};${blur(outBlur)}`);
      s.chars.forEach((ch, i) => {
        const t = clamp01(c.k * (1 + n * 0.12) - i * 0.12 - s.seeds[i]! * 0.08);
        if (t >= 1) return put(ch, "");
        const fill = (t * t * (3 - 2 * t) * 100).toFixed(1);
        const m = `linear-gradient(to bottom,#000 ${fill}%,transparent ${fill}%)`;
        put(
          ch,
          `opacity:${Math.min(1, t * 2.5).toFixed(3)};-webkit-mask-image:${m};mask-image:${m};` +
            `-webkit-mask-size:100% 0.09em;mask-size:100% 0.09em`,
        );
      });
      return;
    }
    case "focus": {
      // A focus pull: word by word the headline sharpens and settles as the camera closes in.
      // Only opacity, blur and a small scale change, so the lines never re-wrap.
      const t = smooth(0, 1, c.k);
      put(s.el, `opacity:${outOpacity.toFixed(3)};${blur((1 - t) * 5 + outBlur)}`);
      const words = Math.max(1, s.words);
      s.chars.forEach((ch, i) => {
        const w = s.wordOf[i]! / words;
        const tw = smooth(w * 0.55, w * 0.55 + 0.45, c.k);
        put(ch, `opacity:${tw.toFixed(3)};transform:scale(${(1 + (1 - tw) * 0.06).toFixed(4)})`);
      });
      return;
    }
    case "lamp": {
      // A band of light descends with the cryobot; text exists only above its front.
      const front = c.k * 140 - 20;
      const mask = `linear-gradient(to bottom,#000 ${(front - 18).toFixed(1)}%,rgba(0,0,0,0.35) ${front.toFixed(1)}%,transparent ${(front + 12).toFixed(1)}%)`;
      put(s.el, `-webkit-mask-image:${mask};mask-image:${mask};opacity:${outOpacity.toFixed(3)};${blur(outBlur)}`);
      for (const ch of s.chars) put(ch, "");
      return;
    }
    case "condense": {
      put(s.el, `opacity:${outOpacity.toFixed(3)}`);
      s.chars.forEach((ch, i) => {
        const seed = s.seeds[i]!;
        const t = smooth(seed * 0.55, seed * 0.55 + 0.45, c.k);
        // A small settle, not a scatter: letters stay close to their place.
        const dx = (seed - 0.5) * 10 * (1 - t);
        const dy = (((seed * 7.3) % 1) - 0.5) * 8 * (1 - t);
        put(ch, `opacity:${t.toFixed(3)};transform:translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px);${blur((1 - t) * 6 + outBlur * (0.5 + seed))}`);
      });
      return;
    }
    case "sonar": {
      // Quantised to 4 px so unchanged frames skip the style write.
      const r = Math.round((c.ring && c.ring.r > 0 ? c.ring.r : c.k * 2000) / 4) * 4;
      const x = Math.round((c.ring?.x ?? 0) / 4) * 4;
      const y = Math.round((c.ring?.y ?? 0) / 4) * 4;
      const mask = `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px,#000 ${Math.max(0, r - 60).toFixed(0)}px,transparent ${r.toFixed(0)}px)`;
      const o = (c.k > 0 ? 1 : 0) * outOpacity;
      put(s.el, `-webkit-mask-image:${mask};mask-image:${mask};opacity:${o.toFixed(3)};${blur(outBlur)}`);
      for (const ch of s.chars) put(ch, "");
      return;
    }
    case "rise": {
      put(s.el, `opacity:${outOpacity.toFixed(3)}`);
      const left = s.rect?.left ?? 0;
      s.chars.forEach((ch, i) => {
        // Letters nearest the plume rise first.
        const x = left + (s.charX[i] ?? (i / n) * (s.rect?.width ?? 600));
        const order = c.plumeX !== undefined ? clamp01(Math.abs(x - c.plumeX) / 900) : i / n;
        const t = smooth(order * 0.5, order * 0.5 + 0.5, c.k);
        put(ch, `opacity:${t.toFixed(3)};transform:translateY(${((1 - t) * 42).toFixed(1)}px);${blur((1 - t) * 4 + outBlur)}`);
      });
      return;
    }
    case "transmit": {
      put(s.el, "");
      // Type on; when scrolling back past it, characters drift up and dissolve like a signal breaking.
      const shown = c.k * n * 1.15;
      s.chars.forEach((ch, i) => {
        const on = clamp01(shown - i);
        const seed = s.seeds[i]!;
        const d = clamp01(c.out * 1.6 - seed * 0.6);
        put(
          ch,
          `opacity:${(on * (1 - d)).toFixed(3)};transform:translate(${((seed - 0.5) * 60 * d).toFixed(1)}px,${(-80 * d * (0.5 + seed)).toFixed(1)}px);${blur(d * 8)}`,
        );
      });
      return;
    }
  }
}
