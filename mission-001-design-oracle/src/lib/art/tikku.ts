/**
 * Tikku: the tiny fortune-keeper who lives inside the machine's window.
 * A round chai-coloured creature in a railway cap. One base body,
 * with eyes, brows, mouth and arms swapped per animation state.
 */
import { Grid, type Pixel } from "@/lib/pixel/grid"
import type { Tone } from "@/data/fortunes"

export const T_W = 26
export const T_H = 26

const C = {
  ink: "#16131f",
  body: "#f6d39b",
  bodyHi: "#ffe9c2",
  bodySh: "#d9a868",
  cheek: "#f08a6a",
  cap: "#e4643d",
  capSh: "#b9472a",
  capHi: "#f4875d",
  visor: "#2a1d22",
  badge: "#f5b947",
  feet: "#7a4a2e",
  white: "#ffffff",
  tongue: "#e4643d",
  star: "#f5b947",
  sweat: "#8fd0f0",
  stache: "#4a2b22",
}

export type TikkuState =
  | "idle"
  | "blink"
  | "glance-left"
  | "glance-right"
  | "smug"
  | "surprised"
  | "look-mechanism"
  | "thinking-a"
  | "thinking-b"
  | "roast"
  | "wisdom"
  | "hype-a"
  | "hype-b"

type Arms = "rest" | "lever-up" | "lever-down" | "up" | "wave"

function body(arms: Arms): Grid {
  const g = new Grid(T_W, T_H)

  // Cap, tilted a touch to the right for attitude.
  g.row(1, 11, 16, C.cap)
  g.row(2, 9, 18, C.cap)
  g.rect(8, 3, 18, 4, C.cap)
  g.row(5, 8, 18, C.capSh)
  g.set(10, 2, C.capHi)
  g.row(3, 9, 10, C.capHi)
  g.rect(13, 2, 14, 3, C.badge)
  g.row(6, 6, 19, C.visor)
  g.set(19, 5, C.visor)

  // Round body.
  g.row(7, 7, 18, C.body)
  g.row(8, 6, 19, C.body)
  g.rect(5, 9, 20, 19, C.body)
  g.row(20, 6, 19, C.body)
  g.row(21, 7, 18, C.body)
  g.row(22, 9, 16, C.bodySh)
  g.col(20, 10, 19, C.bodySh)
  g.col(19, 19, 20, C.bodySh)
  g.row(21, 13, 18, C.bodySh)
  g.set(6, 9, C.bodyHi)
  g.set(6, 10, C.bodyHi)
  g.set(7, 8, C.bodyHi)

  // Feet.
  g.row(23, 8, 10, C.feet)
  g.row(23, 15, 17, C.feet)

  // Arms.
  if (arms === "rest") {
    g.rect(3, 15, 4, 17, C.body)
    g.rect(21, 15, 22, 17, C.bodySh)
  } else if (arms === "lever-up") {
    g.rect(3, 15, 4, 17, C.body)
    g.rect(21, 13, 22, 14, C.bodySh)
    g.rect(23, 12, 24, 13, C.body)
  } else if (arms === "lever-down") {
    g.rect(3, 15, 4, 17, C.body)
    g.rect(21, 16, 22, 17, C.bodySh)
    g.rect(23, 17, 24, 18, C.body)
  } else if (arms === "up") {
    g.rect(3, 9, 4, 12, C.body)
    g.rect(2, 7, 3, 8, C.body)
    g.rect(21, 9, 22, 12, C.bodySh)
    g.rect(22, 7, 23, 8, C.body)
  } else {
    g.rect(3, 15, 4, 17, C.body)
    g.rect(21, 9, 22, 12, C.bodySh)
    g.rect(22, 7, 23, 8, C.body)
  }

  g.outline(C.ink)
  return g
}

const eye = (x: number, y = 11, h = 4): Pixel[] => {
  const out: Pixel[] = []
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + 3; xx++) out.push([xx, yy, C.ink])
  out.push([x, y, C.white])
  return out
}

const cheeks: Pixel[] = [
  [6, 16, C.cheek],
  [7, 16, C.cheek],
  [18, 16, C.cheek],
  [19, 16, C.cheek],
]

function face(state: TikkuState): { pixels: Pixel[]; arms: Arms } {
  switch (state) {
    case "idle":
      return {
        arms: "rest",
        pixels: [...eye(8), ...eye(15), ...cheeks, [11, 17, C.ink], [12, 18, C.ink], [13, 18, C.ink], [14, 17, C.ink], [15, 16, C.ink]],
      }
    case "blink":
      return {
        arms: "rest",
        pixels: [
          [8, 14, C.ink], [9, 14, C.ink], [10, 14, C.ink], [15, 14, C.ink], [16, 14, C.ink], [17, 14, C.ink],
          ...cheeks, [11, 17, C.ink], [12, 18, C.ink], [13, 18, C.ink], [14, 17, C.ink], [15, 16, C.ink],
        ],
      }
    case "glance-left":
      return {
        arms: "rest",
        pixels: [...eye(7), ...eye(14), ...cheeks, [10, 17, C.ink], [11, 18, C.ink], [12, 18, C.ink], [13, 17, C.ink]],
      }
    case "glance-right":
      return {
        arms: "rest",
        pixels: [...eye(9), ...eye(16), ...cheeks, [12, 17, C.ink], [13, 18, C.ink], [14, 18, C.ink], [15, 17, C.ink]],
      }
    case "smug":
      return {
        arms: "rest",
        pixels: [
          ...eye(8, 13, 2), ...eye(15, 12, 3),
          [8, 12, C.ink], [9, 12, C.ink], [10, 12, C.ink],
          [15, 10, C.ink], [16, 9, C.ink], [17, 9, C.ink],
          ...cheeks, [11, 18, C.ink], [12, 18, C.ink], [13, 18, C.ink], [14, 17, C.ink], [15, 16, C.ink],
        ],
      }
    case "surprised":
      return {
        arms: "up",
        pixels: [
          ...eye(8, 10, 5), ...eye(15, 10, 5),
          [8, 8, C.ink], [9, 8, C.ink], [10, 8, C.ink], [15, 8, C.ink], [16, 8, C.ink], [17, 8, C.ink],
          ...cheeks,
          [12, 17, C.ink], [13, 17, C.ink], [11, 18, C.ink], [14, 18, C.ink], [12, 19, C.ink], [13, 19, C.ink],
          [12, 18, C.tongue], [13, 18, C.tongue],
          // "!" pop
          [23, 0, C.star], [23, 1, C.star], [23, 2, C.star], [23, 4, C.star],
        ],
      }
    case "look-mechanism":
      return {
        arms: "lever-up",
        pixels: [
          ...eye(9, 12, 4), ...eye(16, 12, 4),
          [9, 12, C.ink], [10, 12, C.white], [16, 12, C.ink], [17, 12, C.white],
          [9, 10, C.ink], [10, 10, C.ink], [16, 10, C.ink], [17, 10, C.ink],
          ...cheeks, [13, 18, C.ink], [14, 18, C.ink], [15, 17, C.ink],
        ],
      }
    case "thinking-a":
    case "thinking-b": {
      const b = state === "thinking-b"
      return {
        arms: b ? "lever-down" : "lever-up",
        pixels: [
          // Squeezed-shut eyes and furrowed brows.
          [8, 12, C.ink], [9, 13, C.ink], [10, 13, C.ink], [17, 12, C.ink], [16, 13, C.ink], [15, 13, C.ink],
          [8, 10, C.ink], [9, 10, C.ink], [10, 11, C.ink], [17, 10, C.ink], [16, 10, C.ink], [15, 11, C.ink],
          ...cheeks,
          [11, 18, C.ink], [12, 17, C.ink], [13, 18, C.ink], [14, 17, C.ink], [15, 18, C.ink],
          ...(b ? ([[21, 6, C.sweat], [21, 7, C.sweat], [22, 7, C.sweat]] as Pixel[]) : []),
        ],
      }
    }
    case "roast":
      return {
        arms: "rest",
        pixels: [
          // One eye open, one sly wink, a raised brow and a crooked grin.
          ...eye(8, 12, 3), [8, 10, C.ink], [9, 9, C.ink], [10, 9, C.ink],
          [15, 13, C.ink], [16, 12, C.ink], [17, 13, C.ink],
          ...cheeks,
          [9, 16, C.ink], [10, 17, C.ink], [11, 17, C.ink], [12, 17, C.ink], [13, 17, C.ink], [14, 17, C.ink], [15, 16, C.ink], [16, 15, C.ink],
          [11, 16, C.white], [12, 16, C.white], [13, 16, C.white], [14, 16, C.white],
        ],
      }
    case "wisdom":
      return {
        arms: "rest",
        pixels: [
          // Half-lidded, knowing look with one raised brow.
          [8, 13, C.ink], [9, 13, C.ink], [10, 13, C.ink], [8, 14, C.ink], [9, 14, C.white], [10, 14, C.ink],
          [15, 13, C.ink], [16, 13, C.ink], [17, 13, C.ink], [15, 14, C.ink], [16, 14, C.white], [17, 14, C.ink],
          [8, 11, C.ink], [9, 11, C.ink], [10, 11, C.ink], [15, 10, C.ink], [16, 9, C.ink], [17, 9, C.ink],
          ...cheeks,
          [11, 18, C.ink], [12, 18, C.ink], [13, 18, C.ink], [14, 17, C.ink],
        ],
      }
    case "hype-a":
    case "hype-b": {
      const star = (cx: number): Pixel[] => [
        [cx, 10, C.star], [cx - 1, 11, C.star], [cx, 11, C.white], [cx + 1, 11, C.star], [cx, 12, C.star],
        [cx - 1, 12, C.ink], [cx + 1, 12, C.ink], [cx, 13, C.star],
      ]
      return {
        arms: state === "hype-a" ? "up" : "wave",
        pixels: [
          ...star(9), ...star(16), ...cheeks,
          [9, 16, C.ink], [10, 16, C.ink], [11, 16, C.ink], [12, 16, C.ink], [13, 16, C.ink], [14, 16, C.ink], [15, 16, C.ink], [16, 16, C.ink],
          [9, 17, C.ink], [10, 17, C.tongue], [11, 17, C.tongue], [12, 17, C.tongue], [13, 17, C.tongue], [14, 17, C.tongue], [15, 17, C.tongue], [16, 17, C.ink],
          [10, 18, C.ink], [11, 18, C.ink], [12, 18, C.ink], [13, 18, C.ink], [14, 18, C.ink], [15, 18, C.ink],
        ],
      }
    }
  }
}

const cache = new Map<TikkuState, Pixel[]>()

export function tikkuPixels(state: TikkuState): Pixel[] {
  const hit = cache.get(state)
  if (hit) return hit
  const f = face(state)
  const g = body(f.arms)
  // Mouths sit one row lower to make room for the mustache.
  g.stamp(f.pixels.map(([x, y, c]): Pixel => (y >= 15 && x >= 8 && x <= 17 && c !== C.cheek ? [x, y + 1, c] : [x, y, c])))
  // Handlebar mustache: Tikku's signature.
  g.row(16, 10, 15, C.stache)
  g.set(9, 15, C.stache)
  g.set(16, 15, C.stache)
  g.set(12, 15, C.stache)
  g.set(13, 15, C.stache)
  const px = g.pixels()
  cache.set(state, px)
  return px
}

export function deliveredState(tone: Tone, frame: number): TikkuState {
  if (tone === "hype") return frame % 2 === 0 ? "hype-a" : "hype-b"
  return tone
}
