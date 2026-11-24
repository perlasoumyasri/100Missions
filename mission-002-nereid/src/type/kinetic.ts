/**
 * Kinetic type, driven by scroll (chapter progress) so the words change only as the visitor moves.
 *
 *   slices   (the NEREID title)  each letter forms from horizontal slices of light that widen until solid
 *   fade     (headings)          the words come up in place: no movement, no wipe (the user found entrances
 *                                that move or wipe "like a presentation animation")
 *   transmit (status lines)      the line types out like a signal; on the way back it disintegrates
 */

export type Mode = "slices" | "fade" | "transmit";

export interface Split {
  el: HTMLElement;
  /** Letters (slices, transmit); empty for fade. */
  chars: HTMLElement[];
  /** Per-character random seeds, stable across frames. */
  seeds: number[];
}

/** Letter-level modes split letters; fade leaves the text whole, so the font keeps its spacing. */
const SPLIT: Record<Mode, boolean> = {
  slices: true,
  fade: false,
  transmit: true,
};

export function split(el: HTMLElement, mode: Mode): Split {
  if (!SPLIT[mode]) return { el, chars: [], seeds: [] };
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const chars: HTMLElement[] = [];
  const walk = (node: Node, into: HTMLElement) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        for (const part of (child.textContent ?? "").split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            into.append(document.createTextNode(" "));
            continue;
          }
          // Words stay unbreakable; each letter gets its own box.
          const word = document.createElement("span");
          word.className = "word";
          for (const ch of part) {
            const span = document.createElement("span");
            span.className = "ch";
            span.textContent = ch;
            word.append(span);
            chars.push(span);
          }
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
  // A visually hidden copy keeps the text whole for assistive tech.
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = text;
  el.replaceChildren(spoken, holder);
  const seeds = chars.map((_, i) => {
    const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  });
  return { el, chars, seeds };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export interface Context {
  /** Build progress 0..1 (how far the reveal has got). */
  k: number;
  /** Exit progress 0..1. */
  out: number;
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

/** How many letters of a teleprinter line of `n` letters have struck at progress `k`. */
export const typed = (k: number, n: number) => Math.min(n, Math.floor(clamp01(k) * n * 1.15));

export function apply(mode: Mode, s: Split, c: Context): void {
  const n = s.chars.length;
  if (c.reduced) {
    const o = clamp01(c.k * 1.5) * (1 - c.out);
    put(s.el, `opacity:${o.toFixed(3)}`);
    for (const ch of s.chars) put(ch, "");
    return;
  }
  switch (mode) {
    case "slices": {
      // Each letter forms from horizontal slices of light (0.09 em apart) that widen smoothly until the
      // letter is solid, staggered across the word. Once a letter is whole its mask is removed.
      put(s.el, `opacity:${(1 - c.out).toFixed(3)};${blur(c.out * 6)}`);
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
    case "fade": {
      // In place: only opacity, eased, so the words simply come up with the scroll.
      const t = c.k * c.k * (3 - 2 * c.k);
      put(s.el, `opacity:${(t * (1 - c.out)).toFixed(3)}`);
      return;
    }
    case "transmit": {
      put(s.el, "");
      // A teleprinter: each letter strikes on at once and flashes bright as it lands, settling to the
      // line's colour over the next two letters; a block cursor waits where the next letter will strike.
      // Scrolling back past it, the letters drift up and dissolve like a signal breaking.
      const shown = typed(c.k, n);
      const typing = c.k > 0 && c.k < 1 && c.out === 0;
      s.chars.forEach((ch, i) => {
        const lead = shown - i;
        const seed = s.seeds[i]!;
        const d = clamp01(c.out * 1.6 - seed * 0.6);
        if (typing && i === shown) {
          put(ch, "opacity:1;color:transparent;background:var(--cursor)");
          return;
        }
        const on = lead > 0 ? 1 : 0;
        const flash = c.out === 0 && lead > 0 ? clamp01(1 - (lead - 1) / 2) : 0;
        put(
          ch,
          `opacity:${(on * (1 - d)).toFixed(3)};--f:${flash.toFixed(2)};transform:translate(${((seed - 0.5) * 60 * d).toFixed(1)}px,${(-80 * d * (0.5 + seed)).toFixed(1)}px);${blur(d * 8)}`,
        );
      });
      return;
    }
  }
}
