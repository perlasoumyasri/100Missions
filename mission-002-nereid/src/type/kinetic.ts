/**
 * Kinetic type, driven by scroll (chapter progress) so the words change only as the visitor moves.
 *
 *   slices   (the NEREID title)  each letter forms from horizontal slices of light that widen until solid
 *   fade     (headings)          the words come up in place: no movement, no wipe (the user found entrances
 *                                that move or wipe "like a presentation animation")
 */

export type Mode = "slices" | "fade";

export interface Split {
  el: HTMLElement;
  /** Letters (slices); empty for fade. */
  chars: HTMLElement[];
  /** Per-character random seeds, stable across frames. */
  seeds: number[];
}

/** Letter-level modes split letters; fade leaves the text whole, so the font keeps its spacing. */
const SPLIT: Record<Mode, boolean> = {
  slices: true,
  fade: false,
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
        // Evenly staggered (k is linear time for the title), with only a slight random offset, so the
        // letters finish at a steady cadence and the last is whole by about 83 % of the build; the
        // finished name then holds.
        const stagger = n > 1 ? 0.3 / (n - 1) : 0;
        const t = clamp01((c.k - i * stagger - s.seeds[i]! * 0.01) / 0.52);
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
  }
}
