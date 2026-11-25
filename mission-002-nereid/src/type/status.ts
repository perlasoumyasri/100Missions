/**
 * Instrument status lines: one under each chapter's heading, in the probe's cyan.
 *
 * A line belongs to a story position (`data-at`, in P). When the visitor reaches it, it types out letter
 * by letter at the machine's steady pace, with a soft tick, and then stays until its chapter hands over.
 * Coming back up from below, it is simply there. Its space is kept while it waits, so nothing shifts.
 */

/** Seconds per letter: a steady teleprinter rhythm, about 25 letters a second. */
export const PER_CHAR = 0.04;

/** Letters of an `n`-letter line typed `elapsed` seconds after it was reached. */
export const typedCount = (elapsed: number, n: number) => Math.max(0, Math.min(n, Math.floor(elapsed / PER_CHAR)));

export function createStatuses(els: HTMLElement[], onStrike: () => void) {
  const lines = els.map((el) => {
    const text = el.textContent ?? "";
    el.textContent = "";
    const chars = [...text].map((c) => {
      const span = document.createElement("span");
      span.className = "status__ch";
      span.textContent = c;
      el.append(span);
      return span;
    });
    el.classList.add("is-off");
    return { el, at: Number(el.dataset.at), chars, since: -1, typed: 0 };
  });

  const paint = (l: (typeof lines)[number]) => {
    // A letter strikes on white-hot and cools to cyan over the next two; a cursor waits for the next.
    l.chars.forEach((c, j) => {
      const lead = l.typed - j;
      const css =
        j === l.typed && l.typed < l.chars.length
          ? "opacity:1;color:transparent;background:var(--cursor)"
          : `opacity:${lead > 0 ? 1 : 0};--f:${lead > 0 ? Math.max(0, 1 - (lead - 1) / 2).toFixed(2) : 0}`;
      if (c.style.cssText !== css) c.style.cssText = css;
    });
  };

  return {
    /** Every frame: the story position, the time in seconds, and whether motion is reduced. */
    update(p: number, now: number, reduced: boolean, speed: number) {
      for (const l of lines) {
        const reached = p >= l.at;
        if (!reached) {
          if (l.since >= 0) {
            l.since = -1;
            l.typed = 0;
            l.el.classList.add("is-off");
          }
          continue;
        }
        if (l.since < 0) {
          l.since = now;
          l.el.classList.remove("is-off");
          // Arriving from below (scrolling back), the line is simply there.
          l.typed = reduced || speed < 0 ? l.chars.length : 0;
          paint(l);
          continue;
        }
        if (l.typed >= l.chars.length) continue;
        const t = typedCount(now - l.since, l.chars.length);
        if (t > l.typed) {
          onStrike();
          l.typed = t;
          paint(l);
        }
      }
    },
  };
}
