/**
 * Hand-placed pixel art for The Design Oracle.
 *
 * Everything is described as pixels on a small grid so it can be drawn
 * crisply as SVG in the app *and* re-drawn onto a canvas for the PNG export.
 */
import type { Category } from "@/data/fortunes"

export const INK = "#0b0918"

export type Pixel = [x: number, y: number, color: string]

export interface Sprite {
  width: number
  height: number
  pixels: Pixel[]
}

class Grid {
  private cells = new Map<string, string>()
  readonly width: number
  readonly height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  set(x: number, y: number, color: string) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    this.cells.set(`${x},${y}`, color)
  }

  row(y: number, x0: number, x1: number, color: string) {
    for (let x = x0; x <= x1; x++) this.set(x, y, color)
  }

  rect(x0: number, y0: number, x1: number, y1: number, color: string) {
    for (let y = y0; y <= y1; y++) this.row(y, x0, x1, color)
  }

  has(x: number, y: number) {
    return this.cells.has(`${x},${y}`)
  }

  /** Adds a one-pixel ink outline around the whole silhouette. */
  outline(color = INK) {
    const add: [number, number][] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.has(x, y)) continue
        if (this.has(x - 1, y) || this.has(x + 1, y) || this.has(x, y - 1) || this.has(x, y + 1)) {
          add.push([x, y])
        }
      }
    }
    for (const [x, y] of add) this.set(x, y, color)
  }

  toSprite(): Sprite {
    const pixels: Pixel[] = []
    for (const [key, color] of this.cells) {
      const [x, y] = key.split(",").map(Number)
      pixels.push([x, y, color])
    }
    return { width: this.width, height: this.height, pixels }
  }
}

/* ------------------------------------------------------------------ */
/* The Oracle                                                          */
/* ------------------------------------------------------------------ */

const C = {
  hat: "#6b4fd8",
  hatHi: "#9f88ff",
  hatShade: "#4b34a8",
  star: "#C9FF70",
  band: "#FF9D86",
  skin: "#ffd6b8",
  skinShade: "#f0b292",
  nose: "#f39c80",
  cheek: "#ff9d86",
  beard: "#fff7e9",
  beardShade: "#d9cdec",
  robe: "#3d2e8f",
  robeHi: "#5440b8",
  robeShade: "#2a1f6b",
  cuff: "#BBA3FF",
  white: "#ffffff",
}

export const ORACLE_W = 34
export const ORACLE_H = 50

/** The full scene: Oracle + crystal ball + hands. */
export const SCENE_W = 34
export const SCENE_H = 54
export const BALL_X = 6
export const BALL_Y = 31

function buildOracle(): Sprite {
  const g = new Grid(ORACLE_W, ORACLE_H)

  // Robe: a widening bell shape.
  for (let y = 25; y < ORACLE_H - 1; y++) {
    const step = Math.floor((y - 25) / 5)
    const x0 = 7 - step
    const x1 = 26 + step
    g.row(y, x0, x1, C.robe)
    g.row(y, x1 - 2, x1, C.robeShade)
    g.set(x0, y, C.robeHi)
  }
  // Tiny stars embroidered on the robe.
  for (const [x, y] of [[6, 41], [27, 34], [9, 46], [26, 45], [28, 40]] as const) g.set(x, y, C.star)

  // Sleeves reaching toward the crystal ball.
  for (let y = 30; y <= 36; y++) {
    g.row(y, 5, 10, C.robeHi)
    g.row(y, 23, 28, C.robe)
  }
  g.row(30, 5, 6, C.robe)
  g.row(30, 27, 28, C.robeShade)
  g.rect(8, 35, 11, 36, C.cuff)
  g.rect(22, 35, 25, 36, C.cuff)

  // Face and ears.
  g.rect(10, 16, 23, 23, C.skin)
  g.rect(9, 18, 9, 20, C.skinShade)
  g.rect(24, 18, 24, 20, C.skinShade)
  g.row(16, 10, 23, C.skinShade) // shadow under the brim

  // Bushy brows.
  g.row(17, 11, 14, C.beard)
  g.row(17, 19, 22, C.beard)
  g.set(10, 17, C.beardShade)
  g.set(23, 17, C.beardShade)

  // Cheeks.
  g.row(21, 11, 12, C.cheek)
  g.row(21, 21, 22, C.cheek)

  // Beard: sideburns, then a long tapering point.
  g.rect(10, 21, 10, 23, C.beard)
  g.rect(23, 21, 23, 23, C.beard)
  for (let y = 23; y <= 38; y++) {
    const inset = y <= 27 ? 0 : Math.ceil((y - 27) * 0.62)
    const x0 = 9 + inset
    const x1 = 24 - inset
    if (x1 < x0) break
    g.row(y, x0, x1, C.beard)
    if (x1 - x0 > 3) g.row(y, x1 - 1, x1, C.beardShade)
  }
  g.set(16, 39, C.beard)
  for (const [x, y] of [[13, 28], [14, 31], [19, 29], [12, 25], [20, 33], [17, 35]] as const) g.set(x, y, C.beardShade)

  // Mustache.
  g.row(22, 12, 21, C.beard)
  g.row(23, 11, 22, C.beard)
  g.set(11, 22, C.beardShade)
  g.set(22, 22, C.beardShade)

  // Nose: big and friendly.
  g.row(19, 16, 17, C.nose)
  g.row(20, 15, 18, C.nose)
  g.row(21, 15, 18, C.nose)
  g.set(15, 19, C.skinShade)

  // Hat brim and band.
  g.row(14, 5, 28, C.hat)
  g.row(15, 6, 27, C.hatShade)
  g.row(14, 5, 7, C.hatHi)
  g.row(13, 9, 24, C.band)

  // Hat cone, leaning slightly right.
  for (let y = 1; y <= 12; y++) {
    const x0 = 21 - y
    const x1 = Math.round(22 + ((y - 1) * 2) / 11)
    g.row(y, x0, x1, C.hat)
    g.set(x0, y, C.hatHi)
    if (y > 5) g.set(x0 + 1, y, C.hatHi)
    g.set(x1, y, C.hatShade)
  }
  // Floppy tip with a pom-pom.
  g.set(22, 0, C.hat)
  g.set(23, 1, C.hat)
  g.row(2, 23, 25, C.hat)
  g.rect(26, 2, 27, 3, C.star)

  // Stars on the hat.
  for (const [x, y] of [[16, 8], [17, 7], [17, 8], [18, 8], [17, 9]] as const) g.set(x, y, C.star)
  for (const [x, y] of [[13, 11], [20, 4], [21, 10]] as const) g.set(x, y, C.star)

  g.outline()
  return g.toSprite()
}

export const ORACLE: Sprite = buildOracle()

/** Hands sit on their own layer so they can hold the crystal ball from the sides. */
function buildHands(): Sprite {
  const g = new Grid(SCENE_W, SCENE_H)
  for (const x0 of [6, 24]) {
    g.rect(x0, 37, x0 + 3, 40, C.skin)
    g.row(40, x0, x0 + 3, C.skinShade)
    g.set(x0 === 6 ? x0 + 3 : x0, 36, C.skin)
  }
  g.outline()
  return g.toSprite()
}

export const HANDS: Sprite = buildHands()

export type OracleFace = "idle" | "thinking" | Category

const eye = (x: number): Pixel[] => [
  [x, 18, INK],
  [x + 1, 18, C.white],
  [x, 19, INK],
  [x + 1, 19, INK],
]

export const ORACLE_EYES: Record<OracleFace, Pixel[]> = {
  idle: [...eye(12), ...eye(19)],
  thinking: [
    [11, 18, INK], [12, 19, INK], [13, 19, INK], [14, 18, INK],
    [18, 18, INK], [19, 19, INK], [20, 19, INK], [21, 18, INK],
  ],
  wisdom: [
    [11, 19, INK], [12, 18, INK], [13, 18, INK], [14, 19, INK],
    [18, 19, INK], [19, 18, INK], [20, 18, INK], [21, 19, INK],
  ],
  roast: [
    // Half-lidded side-eye, left brow cocked up one pixel.
    [11, 16, C.beard], [12, 16, C.beard], [13, 16, C.beard], [14, 16, C.beard],
    [11, 17, C.skin], [12, 17, C.skin], [13, 17, C.skin], [14, 17, C.skin],
    [12, 18, INK], [13, 18, INK], [12, 19, C.white], [13, 19, INK],
    [19, 18, INK], [20, 18, INK], [19, 19, C.white], [20, 19, INK],
  ],
  boost: [
    [12, 17, C.star], [11, 18, C.star], [12, 18, C.white], [13, 18, C.star], [12, 19, C.star],
    [20, 17, C.star], [19, 18, C.star], [20, 18, C.white], [21, 18, C.star], [20, 19, C.star],
  ],
}

export const ORACLE_MOUTH: Record<OracleFace, Pixel[]> = {
  idle: [[15, 24, INK], [16, 25, INK], [17, 25, INK], [18, 24, INK]],
  thinking: [[16, 24, INK], [17, 24, INK], [16, 25, INK], [17, 25, INK]],
  wisdom: [[14, 24, INK], [15, 25, INK], [16, 25, INK], [17, 25, INK], [18, 25, INK], [19, 24, INK]],
  roast: [[14, 25, INK], [15, 25, INK], [16, 25, INK], [17, 25, INK], [18, 24, INK], [19, 23, INK]],
  boost: [
    [14, 24, INK], [15, 24, INK], [16, 24, INK], [17, 24, INK], [18, 24, INK], [19, 24, INK],
    [14, 25, INK], [15, 25, C.cheek], [16, 25, C.cheek], [17, 25, C.cheek], [18, 25, C.cheek], [19, 25, INK],
    [15, 26, INK], [16, 26, INK], [17, 26, INK], [18, 26, INK],
  ],
}

/* ------------------------------------------------------------------ */
/* Crystal ball                                                        */
/* ------------------------------------------------------------------ */

export const BALL_W = 22
export const BALL_H = 23

function buildBall(): Sprite {
  const g = new Grid(BALL_W, BALL_H)
  const cx = 11
  const cy = 9.5
  const r = 8.6
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < BALL_W; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (d > r) continue
      const t = d / r
      // Light comes from the top-left, so shade the bottom-right edge.
      const side = (x + 0.5 - cx) * 0.55 + (y + 0.5 - cy) * 0.85
      let color = "#8f7bea"
      if (t > 0.78 && side > 1) color = "#5a44b5"
      else if (t > 0.86) color = "#7562d6"
      else if (t < 0.45) color = "#a996ff"
      g.set(x, y, color)
    }
  }
  // Glint.
  for (const [x, y] of [[6, 4], [7, 4], [5, 5], [5, 6], [6, 5]] as const) g.set(x, y, "#ffffff")
  g.set(8, 3, "#e9e2ff")
  // Stand.
  g.row(18, 6, 15, "#ffb49f")
  g.row(19, 5, 16, "#FF9D86")
  g.row(20, 4, 17, "#FF9D86")
  g.row(21, 4, 17, "#d9715a")
  g.row(19, 15, 16, "#d9715a")
  g.row(20, 16, 17, "#d9715a")
  g.outline()
  return g.toSprite()
}

export const BALL: Sprite = buildBall()

/** Pixels inside the ball that swirl when it activates. */
export const BALL_SWIRL: [number, number][] = [
  [9, 7], [10, 7], [11, 7], [12, 8], [12, 9], [11, 10], [10, 10], [9, 9],
  [13, 11], [14, 10], [14, 9], [8, 11], [9, 12], [10, 12], [11, 12],
]

/* ------------------------------------------------------------------ */
/* 8×8 icons                                                           */
/* ------------------------------------------------------------------ */

function icon(rows: string[]): [number, number][] {
  const out: [number, number][] = []
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && out.push([x, y])))
  return out
}

export const ICONS = {
  surprise: icon([
    "...#....",
    "...#....",
    ".#####..",
    "..###...",
    ".##.##..",
    "........",
    "......#.",
    ".....###",
  ]),
  wisdom: icon([
    "..####..",
    ".#....#.",
    "#..##..#",
    "#.####.#",
    "#..##..#",
    ".#....#.",
    "..####..",
    "........",
  ]),
  roast: icon([
    "...#....",
    "..##....",
    "..###.#.",
    ".####.#.",
    ".######.",
    "##.####.",
    "##..###.",
    ".######.",
  ]),
  boost: icon([
    "....##..",
    "...##...",
    "..##....",
    ".#####..",
    "...##...",
    "..##....",
    ".##.....",
    ".#......",
  ]),
  soundOn: icon([
    "...#....",
    "..##..#.",
    "####.#..",
    "####.#.#",
    "####.#.#",
    "####.#..",
    "..##..#.",
    "...#....",
  ]),
  soundOff: icon([
    "...#....",
    "..##....",
    "####.#.#",
    "####..#.",
    "####..#.",
    "####.#.#",
    "..##....",
    "...#....",
  ]),
  copy: icon([
    "#####...",
    "#...#...",
    "#.######",
    "#.#....#",
    "###....#",
    "..#....#",
    "..#....#",
    "..######",
  ]),
  save: icon([
    "...##...",
    "...##...",
    "...##...",
    ".######.",
    "..####..",
    "...##...",
    "#......#",
    "########",
  ]),
  again: icon([
    "..####..",
    ".#....#.",
    "#.....##",
    "#....###",
    "#.......",
    "#......#",
    ".#....#.",
    "..####..",
  ]),
} satisfies Record<string, [number, number][]>

export type IconName = keyof typeof ICONS
