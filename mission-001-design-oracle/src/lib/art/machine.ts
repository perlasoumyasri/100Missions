/**
 * The Fortune Machine: an original pixel-art take on the coin-operated
 * weighing machines of Indian railway platforms.
 *
 * Static body parts are built once. Lights, wheel, gauge and LEDs are
 * produced per frame from small functions so they can animate crisply.
 */
import { Grid, line, type Pixel, type Sprite } from "@/lib/pixel/grid"
import { pixelText, textWidth } from "@/lib/pixel/font"

export const M_W = 72
export const M_H = 128

export const PAL = {
  ink: "#16131f",
  verm: "#e4643d",
  vermHi: "#f4875d",
  vermSh: "#b9472a",
  vermDeep: "#8a3220",
  cream: "#f1dda5",
  creamSh: "#d6bb7d",
  petrol: "#243a4a",
  petrolDk: "#172734",
  petrolHi: "#33536a",
  mustard: "#f5b947",
  mustardHi: "#ffd98a",
  mustardSh: "#c48a2a",
  jade: "#78b18c",
  jadeSh: "#4f8665",
  glass: "#142530",
  glassHi: "#1b3241",
  steel: "#a9b4b8",
  steelSh: "#66747b",
  bulbOff: "#5b4026",
  white: "#fff8e6",
}

/** Head geometry (octagon with a round window). */
export const HEAD = { cx: 36, cy: 31, r: 30 }
export const WINDOW_R = 18.6
/** Where things sit, in machine cells. */
export const COIN_SLOT = { x: 29.5, y: 90.5 }
export const DISPENSER = { x0: 22, x1: 49, y: 106 }
export const TIKKU_ORIGIN = { x: 23, y: 20 }
export const LEVER_BASE = { x: 51, y: 44 }

const inOctagon = (dx: number, dy: number, r: number) =>
  Math.abs(dx) <= r && Math.abs(dy) <= r && Math.abs(dx) + Math.abs(dy) <= r * 1.42

function buildBody(): Sprite {
  const g = new Grid(M_W, M_H)
  const { cx, cy, r } = HEAD

  // --- Head: octagonal vermilion housing with bevelled rim.
  g.fill((x, y) => {
    const dx = x - cx
    const dy = y - cy
    if (!inOctagon(dx, dy, r)) return null
    const edge = Math.min(r - Math.abs(dx), r - Math.abs(dy), (r * 1.42 - Math.abs(dx) - Math.abs(dy)) / 1.42)
    if (edge < 1.6) return dx + dy < 0 ? PAL.vermHi : PAL.vermSh
    if (edge < 2.6 && dx + dy > 6) return PAL.vermSh
    return PAL.verm
  })

  // Brass bezel around the wheel.
  g.fill((x, y) => {
    const d = Math.hypot(x - cx, y - cy)
    if (d > 24.2 && d <= 25.8) return x - cx + (y - cy) > 4 ? PAL.mustardSh : PAL.mustard
    if (d > 23.4 && d <= 24.2) return PAL.ink
    return null
  })

  // Window glass (wheel ring is drawn on top per frame).
  g.fill((x, y) => {
    const d = Math.hypot(x - cx, y - cy)
    if (d > WINDOW_R + 0.8 && d <= WINDOW_R + 1.6) return PAL.ink
    if (d <= WINDOW_R + 0.8) return y < cy - 6 ? PAL.glassHi : PAL.glass
    return null
  })
  // Little stage floor inside the window.
  g.fill((x, y, ix, iy) => {
    const d = Math.hypot(x - cx, y - cy)
    if (d > WINDOW_R) return null
    if (iy === 45) return PAL.petrolHi
    if (iy > 45) return ix % 3 === 0 ? PAL.petrol : PAL.petrolDk
    return null
  })
  // Glass glint.
  for (const [x, y] of [[24, 17], [23, 18], [22, 19], [22, 20], [25, 16], [26, 15], [21, 22]] as const) {
    g.set(x, y, "#2d4a5c")
  }

  // Lever mount inside the window.
  g.rect(LEVER_BASE.x - 2, LEVER_BASE.y, LEVER_BASE.x + 2, LEVER_BASE.y + 1, PAL.steelSh)
  g.row(LEVER_BASE.y, LEVER_BASE.x - 1, LEVER_BASE.x + 1, PAL.steel)

  // Rivets on the head corners.
  for (const [x, y] of [[13, 9], [58, 9], [13, 52], [58, 52], [6, 31], [65, 31], [36, 2]] as const) {
    g.set(x, y, PAL.mustardHi)
  }

  // --- Name sign.
  g.rect(3, 62, 68, 71, PAL.ink)
  g.rect(4, 63, 67, 70, PAL.mustard)
  g.rect(5, 64, 66, 69, PAL.cream)
  g.row(69, 5, 66, PAL.creamSh)
  const title = "FORTUNE MACHINE"
  g.stamp(pixelText(title, Math.round(36 - textWidth(title) / 2), 64, PAL.vermDeep))
  g.set(4, 66, PAL.mustardSh)
  g.set(67, 66, PAL.mustardSh)

  // Neck.
  g.rect(22, 72, 49, 73, PAL.petrolDk)
  g.row(72, 24, 47, PAL.petrol)

  // --- Body: tapered vermilion cabinet with fluting.
  for (let y = 74; y <= 110; y++) {
    const step = Math.floor((y - 74) / 9)
    const x0 = 16 - step
    const x1 = 55 + step
    g.row(y, x0, x1, PAL.verm)
    g.row(y, x0, x0 + 1, PAL.vermHi)
    g.row(y, x1 - 2, x1, PAL.vermSh)
    g.set(x0 + 3, y, PAL.vermSh)
    g.set(x1 - 4, y, PAL.vermHi)
  }
  g.row(74, 16, 55, PAL.vermHi)

  // Control panel inset.
  g.rect(21, 77, 50, 101, PAL.ink)
  g.rect(22, 78, 49, 100, PAL.petrol)
  g.row(78, 22, 49, PAL.petrolHi)
  for (const [x, y] of [[23, 79], [48, 79], [23, 99], [48, 99]] as const) g.set(x, y, PAL.mustard)
  const insert = "₹1 COIN"
  g.stamp(pixelText(insert, Math.round(36 - textWidth(insert, 1) / 2), 80, PAL.cream, 1))

  // Coin slot plate.
  g.rect(24, 86, 34, 96, PAL.ink)
  g.rect(25, 87, 33, 95, PAL.mustard)
  g.row(95, 25, 33, PAL.mustardSh)
  g.col(33, 87, 95, PAL.mustardSh)
  g.row(87, 25, 32, PAL.mustardHi)
  g.rect(28, 88, 30, 94, PAL.mustardSh)
  g.rect(29, 88, 29, 93, PAL.ink)
  g.set(30, 88, PAL.ink)

  // Gauge (face only; needle is dynamic).
  g.fill((x, y) => {
    const d = Math.hypot(x - 42.5, y - 91)
    if (d <= 4.2) return PAL.cream
    if (d <= 5.3) return PAL.ink
    return null
  })
  for (const [x, y] of [[39, 89], [42, 87], [46, 89]] as const) g.set(x, y, PAL.creamSh)

  // --- Ticket dispenser.
  g.rect(DISPENSER.x0 - 2, 103, DISPENSER.x1 + 2, 109, PAL.ink)
  g.rect(DISPENSER.x0 - 1, 104, DISPENSER.x1 + 1, 108, PAL.mustard)
  g.row(104, DISPENSER.x0 - 1, DISPENSER.x1 + 1, PAL.mustardHi)
  g.row(108, DISPENSER.x0 - 1, DISPENSER.x1 + 1, PAL.mustardSh)
  g.rect(DISPENSER.x0, 105, DISPENSER.x1, 106, PAL.ink)

  // --- Weighing platform base.
  g.rect(8, 111, 63, 112, PAL.petrolDk)
  for (let y = 113; y <= 121; y++) {
    const inset = Math.max(0, 121 - y > 6 ? 1 : 0)
    g.row(y, 4 + inset, 67 - inset, y % 2 === 0 ? PAL.petrol : PAL.petrolDk)
  }
  // Footprints on the mat: step right up.
  for (const fx of [27, 39]) {
    g.rect(fx, 114, fx + 4, 119, PAL.petrolHi)
    g.row(114, fx, fx + 4, PAL.petrol)
    g.set(fx, 119, PAL.petrol)
    g.set(fx + 4, 119, PAL.petrol)
  }
  g.rect(3, 122, 68, 125, PAL.verm)
  g.row(122, 3, 68, PAL.vermHi)
  g.row(123, 3, 68, PAL.mustard)
  g.row(125, 3, 68, PAL.vermSh)
  g.rect(6, 126, 12, 127, PAL.petrolDk)
  g.rect(59, 126, 65, 127, PAL.petrolDk)

  g.outline(PAL.ink)
  return g.toSprite()
}

export const MACHINE_BODY: Sprite = buildBody()

/* ------------------------------------------------------------------ */
/* Dynamic parts                                                       */
/* ------------------------------------------------------------------ */

export type MachineMode = "idle" | "coin" | "thinking" | "printing" | "done"

/** 16 bulbs around the octagon. */
const BULBS: [number, number][] = (() => {
  const out: [number, number][] = []
  const { cx, cy } = HEAD
  const ring = 27
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2
    let t = 0
    while (inOctagon(Math.cos(a) * (t + 0.5), Math.sin(a) * (t + 0.5), ring)) t += 0.5
    out.push([Math.round(cx + Math.cos(a) * t - 1), Math.round(cy + Math.sin(a) * t - 1)])
  }
  return out
})()

export function bulbPixels(mode: MachineMode, tick: number): Pixel[] {
  const out: Pixel[] = []
  BULBS.forEach(([x, y], i) => {
    let on: boolean
    if (mode === "idle") on = (i + Math.floor(tick / 2)) % 4 === 0
    else if (mode === "coin") on = i <= ((tick * 3) % 20)
    else if (mode === "thinking") on = (i + tick) % 2 === 0
    else if (mode === "printing") on = (i + tick) % 3 !== 0
    else on = true
    const core = on ? PAL.mustardHi : PAL.bulbOff
    const rim = on ? PAL.mustard : "#46301b"
    out.push([x, y, core], [x + 1, y, rim], [x, y + 1, rim], [x + 1, y + 1, on ? PAL.mustardSh : "#3a2716"])
  })
  return out
}

/** Segments of the illuminated fortune wheel, precomputed. */
const WHEEL_SEGMENTS = 20
const WHEEL_CELLS: { x: number; y: number; seg: number; edge: boolean }[] = (() => {
  const out: { x: number; y: number; seg: number; edge: boolean }[] = []
  const { cx, cy } = HEAD
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < M_W; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (d <= WINDOW_R + 1.6 || d > 23.4) continue
      const a = (Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + Math.PI * 2) % (Math.PI * 2)
      const f = (a / (Math.PI * 2)) * WHEEL_SEGMENTS
      const seg = Math.floor(f)
      out.push({ x, y, seg, edge: f - seg < 0.12 })
    }
  }
  return out
})()

const WHEEL_BRIGHT = [PAL.cream, PAL.mustard, PAL.jade, PAL.vermHi]
const WHEEL_DIM = ["#8f8466", "#94713a", "#4b6e58", "#8a4c37"]

export function wheelPixels(mode: MachineMode, rotation: number): Pixel[] {
  const bright = mode !== "idle"
  const palette = bright ? WHEEL_BRIGHT : WHEEL_DIM
  return WHEEL_CELLS.map(({ x, y, seg, edge }) => [
    x,
    y,
    edge ? PAL.ink : palette[(((seg + rotation) % WHEEL_SEGMENTS) + WHEEL_SEGMENTS) % 4],
  ])
}

/** Gauge needle; angle in radians, 0 = pointing right. */
export function needlePixels(angle: number): Pixel[] {
  const cx = 42
  const cy = 91
  const x1 = Math.round(cx + Math.cos(angle) * 3.4)
  const y1 = Math.round(cy + Math.sin(angle) * 3.4)
  return [...line(cx, cy, x1, y1, PAL.vermDeep), [cx, cy, PAL.ink]]
}

/** Three status lamps on the panel: ready, working, printing. */
export function ledPixels(mode: MachineMode, tick: number): Pixel[] {
  const lamps = [
    { x: 38, color: PAL.jade, on: mode === "idle" || mode === "done" },
    { x: 41, color: PAL.mustard, on: mode === "coin" || mode === "thinking" ? tick % 2 === 0 : false },
    { x: 44, color: PAL.vermHi, on: mode === "printing" },
  ]
  const out: Pixel[] = []
  for (const l of lamps) {
    const c = l.on ? l.color : PAL.petrolDk
    out.push([l.x, 97, c], [l.x + 1, 97, c], [l.x, 98, c], [l.x + 1, 98, l.on ? PAL.white : PAL.petrolDk])
  }
  return out
}

/** The tiny lever Tikku pulls; 0 = up, 1 = pulled down. */
export function leverPixels(pulled: boolean): Pixel[] {
  const { x, y } = LEVER_BASE
  const tipX = pulled ? x - 4 : x
  const tipY = pulled ? y - 4 : y - 8
  const stick = line(x, y - 1, tipX, tipY + 1, PAL.steel)
  return [
    ...stick,
    [tipX - 1, tipY, PAL.ink],
    [tipX, tipY, PAL.vermHi],
    [tipX + 1, tipY, PAL.verm],
    [tipX - 1, tipY - 1, PAL.ink],
    [tipX, tipY - 1, PAL.verm],
    [tipX + 1, tipY - 1, PAL.vermSh],
  ]
}
