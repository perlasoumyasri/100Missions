/**
 * The probe's console: one line under the masthead where the instruments report, like a teleprinter.
 *
 * Each message belongs to a story position (`data-at`, in P). When the visitor reaches it, it types out
 * letter by letter at the machine's own steady pace (a tick per letter) and stays until the next message
 * replaces it. It never fades with its chapter, and it is always in the same place. (The user: status
 * lines that faded with their chapter disappeared before they could be read, and a console in the corner
 * sat on the buttons and was too small to read.) Scrolling back shows the earlier message, already typed.
 */

/** Seconds per letter: a steady teleprinter rhythm, about 25 letters a second. */
export const PER_CHAR = 0.04;

/** The newest message reached at story position `p`, or -1. */
export const currentLine = (ats: readonly number[], p: number) => ats.reduce((cur, a, i) => (p >= a ? i : cur), -1);

/** Letters of an `n`-letter message typed `elapsed` seconds after it arrived. */
export const typedCount = (elapsed: number, n: number) => Math.max(0, Math.min(n, Math.floor(elapsed / PER_CHAR)));

export function createConsole(root: HTMLElement, onStrike: () => void) {
  const lines = [...root.querySelectorAll<HTMLElement>("[data-at]")].map((el) => {
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
    return { el, at: Number(el.dataset.at), chars };
  });
  const ats = lines.map((l) => l.at);
  let current = -1;
  let since = 0;
  let typed = 0;

  const paint = (n: number) => {
    const l = lines[current]!;
    // A letter strikes on white-hot and cools to cyan over the next two; a cursor waits for the next.
    l.chars.forEach((c, j) => {
      const lead = n - j;
      const css =
        j === n && n < l.chars.length
          ? "opacity:1;color:transparent;background:var(--cursor)"
          : `opacity:${lead > 0 ? 1 : 0};--f:${lead > 0 ? Math.max(0, 1 - (lead - 1) / 2).toFixed(2) : 0}`;
      if (c.style.cssText !== css) c.style.cssText = css;
    });
  };

  return {
    /** Every frame: the story position, the time in seconds, and whether motion is reduced. */
    update(p: number, now: number, reduced: boolean) {
      const next = currentLine(ats, p);
      if (next !== current) {
        if (current >= 0) lines[current]!.el.hidden = true;
        const forward = next > current;
        current = next;
        root.hidden = current < 0;
        if (current < 0) return;
        lines[current]!.el.hidden = false;
        since = now;
        // Going forward it types; going back, the earlier message is simply there.
        typed = forward && !reduced ? 0 : lines[current]!.chars.length;
        paint(typed);
        return;
      }
      if (current < 0) return;
      const n = lines[current]!.chars.length;
      if (typed >= n) return;
      const t = typedCount(now - since, n);
      if (t > typed) {
        onStrike();
        typed = t;
        paint(t);
      }
    },
  };
}
