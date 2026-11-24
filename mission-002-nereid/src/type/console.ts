/**
 * The probe's console: one fixed place where the instruments report, like a teleprinter log.
 *
 * Each line belongs to a story position (`data-at`, in P). When the visitor reaches it, the line types out
 * letter by letter at the machine's own steady pace (with a tick per letter), and it stays: it never
 * fades with its chapter, so it can always be read. The newest lines show, older ones dimmer above;
 * scrolling back removes the lines not yet reached. (The user found status lines that faded with their
 * chapter "disappear before I can read them", and couldn't tell where they would appear.)
 */

/** Seconds per letter: a steady teleprinter rhythm, about 25 letters a second. */
export const PER_CHAR = 0.04;
/** How many lines the console shows at once. */
export const SHOWN = 3;

/** Indices of the lines reached at story position `p` that the console shows (the newest `max`). */
export function visibleLines(ats: readonly number[], p: number, max = SHOWN): number[] {
  const reached = ats.map((a, i) => (p >= a ? i : -1)).filter((i) => i >= 0);
  return reached.slice(-max);
}

/** Letters of an `n`-letter line typed `elapsed` seconds after it was reached. */
export const typedCount = (elapsed: number, n: number) => Math.max(0, Math.min(n, Math.floor(elapsed / PER_CHAR)));

interface ConsoleLine {
  el: HTMLElement;
  at: number;
  chars: HTMLElement[];
  /** When it started typing (seconds), or -1 while not reached. */
  since: number;
  typed: number;
}

export function createConsole(root: HTMLElement, onStrike: () => void) {
  const lines: ConsoleLine[] = [...root.querySelectorAll<HTMLElement>("[data-at]")].map((el) => {
    const text = el.textContent ?? "";
    el.textContent = "";
    const chars = [...text].map((c) => {
      const span = document.createElement("span");
      span.className = "console__ch";
      span.textContent = c;
      el.append(span);
      return span;
    });
    el.hidden = true;
    return { el, at: Number(el.dataset.at), chars, since: -1, typed: 0 };
  });
  const ats = lines.map((l) => l.at);

  return {
    /** Every frame: the story position, the time in seconds, and whether motion is reduced. */
    update(p: number, now: number, reduced: boolean) {
      const show = new Set(visibleLines(ats, p));
      lines.forEach((l, i) => {
        const on = show.has(i);
        if (!on) {
          if (!l.el.hidden) l.el.hidden = true;
          if (p < l.at) {
            l.since = -1; // not reached: it types again when it is
            l.typed = 0;
          }
          return;
        }
        if (l.el.hidden) l.el.hidden = false;
        if (l.since < 0) l.since = now;
        const n = reduced ? l.chars.length : typedCount(now - l.since, l.chars.length);
        const newest = i === Math.max(...show);
        l.el.classList.toggle("is-old", !newest);
        if (n === l.typed && n === l.chars.length) return;
        if (n > l.typed && !reduced) onStrike();
        l.typed = n;
        // A letter strikes on white-hot and cools to cyan over the next two; a cursor waits for the next.
        l.chars.forEach((c, j) => {
          const lead = n - j;
          const css =
            j === n && n < l.chars.length
              ? "opacity:1;color:transparent;background:var(--cursor)"
              : `opacity:${lead > 0 ? 1 : 0};--f:${lead > 0 ? Math.max(0, 1 - (lead - 1) / 2).toFixed(2) : 0}`;
          if (c.style.cssText !== css) c.style.cssText = css;
        });
      });
    },
  };
}
