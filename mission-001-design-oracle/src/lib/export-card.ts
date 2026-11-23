import { CATEGORY_META, type Fortune } from "@/data/fortunes"
import {
  BALL,
  BALL_X,
  BALL_Y,
  HANDS,
  INK,
  ORACLE,
  ORACLE_EYES,
  ORACLE_MOUTH,
  SCENE_H,
  SCENE_W,
  type Pixel,
} from "@/lib/pixel-art"

const SIZE = 1080
const BG = "#151229"
const PANEL = "#251f40"
const TEXT = "#fff7e9"
const MUTED = "#b9b0d6"

/** Draws a rectangle with 8-bit stepped corners. */
function steppedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x + step, y, w - step * 2, h)
  ctx.fillRect(x, y + step, w, h - step * 2)
}

function drawPixels(ctx: CanvasRenderingContext2D, pixels: Pixel[], ox: number, oy: number, scale: number, dx = 0, dy = 0) {
  for (const [x, y, color] of pixels) {
    ctx.fillStyle = color
    ctx.fillRect(ox + (x + dx) * scale, oy + (y + dy) * scale, scale, scale)
  }
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y - s, s, s * 3)
  ctx.fillRect(x - s, y, s * 3, s)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

async function ensureFonts() {
  if (!document.fonts) return
  await Promise.all([
    document.fonts.load('24px "Press Start 2P"'),
    document.fonts.load('36px "VT323"'),
    document.fonts.load('600 60px "Space Grotesk"'),
  ])
}

/** Renders the fortune as a 1080×1080 PNG blob. */
export async function renderFortuneCard(fortune: Fortune, reaction: string): Promise<Blob> {
  await ensureFonts()
  const meta = CATEGORY_META[fortune.category]
  const accent = meta.color

  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not supported")
  ctx.imageSmoothingEnabled = false

  // Background with a faint pixel dot grid.
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = "rgba(187,163,255,0.10)"
  for (let y = 12; y < SIZE; y += 24) for (let x = 12; x < SIZE; x += 24) ctx.fillRect(x, y, 3, 3)

  // Card: hard shadow, ink border, panel, inner accent frame.
  const m = 70
  const w = SIZE - m * 2
  steppedRect(ctx, m + 16, m + 16, w, w, 18, INK)
  steppedRect(ctx, m, m, w, w, 18, INK)
  steppedRect(ctx, m + 9, m + 9, w - 18, w - 18, 12, PANEL)
  steppedRect(ctx, m + 30, m + 30, w - 60, w - 60, 9, accent)
  steppedRect(ctx, m + 36, m + 36, w - 72, w - 72, 6, PANEL)

  const left = m + 78
  const right = SIZE - m - 78

  // Header: brand + fortune id.
  ctx.textBaseline = "top"
  ctx.font = '20px "Press Start 2P"'
  ctx.fillStyle = MUTED
  ctx.textAlign = "left"
  ctx.fillText("THE DESIGN ORACLE", left, m + 82)
  ctx.textAlign = "right"
  ctx.fillText(`NO. ${fortune.id}`, right, m + 82)

  // Category chip.
  ctx.textAlign = "left"
  ctx.font = '24px "Press Start 2P"'
  const label = meta.label
  const chipW = ctx.measureText(label).width + 48
  steppedRect(ctx, left + 6, m + 142, chipW, 60, 6, INK)
  steppedRect(ctx, left, m + 136, chipW, 60, 6, accent)
  ctx.fillStyle = INK
  ctx.fillText(label, left + 24, m + 155)

  // Quote, auto-sized to fit the space above the Oracle.
  const quoteTop = m + 286
  const quoteMaxW = right - left
  const quoteMaxH = 360
  let size = 76
  let lines: string[] = []
  for (; size >= 36; size -= 2) {
    ctx.font = `600 ${size}px "Space Grotesk"`
    lines = wrap(ctx, fortune.text, quoteMaxW)
    if (lines.length * size * 1.16 <= quoteMaxH) break
  }
  // Pixel open-quote mark.
  ctx.fillStyle = accent
  for (const [qx, qy] of [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [4, 0], [3, 1], [4, 1], [3, 2], [4, 2]]) {
    ctx.fillRect(left + qx * 9, quoteTop - 58 + qy * 9, 9, 9)
  }
  ctx.fillStyle = TEXT
  ctx.font = `600 ${size}px "Space Grotesk"`
  lines.forEach((line, i) => ctx.fillText(line, left, quoteTop + i * size * 1.16))

  // Reaction line.
  ctx.font = '40px "VT323"'
  ctx.fillStyle = accent
  ctx.fillText(`> ${reaction}`, left, m + 690, right - left - 230)

  // Footer.
  ctx.font = '16px "Press Start 2P"'
  ctx.fillStyle = MUTED
  ctx.fillText("MISSION 001 · CONSULT THE ORACLE", left, SIZE - m - 108)

  // The Oracle himself, bottom right.
  const scale = 5
  const ox = SIZE - m - 70 - SCENE_W * scale
  const oy = SIZE - m - 46 - SCENE_H * scale
  drawPixels(ctx, ORACLE.pixels, ox, oy, scale)
  drawPixels(ctx, ORACLE_EYES[fortune.category], ox, oy, scale)
  drawPixels(ctx, ORACLE_MOUTH[fortune.category], ox, oy, scale)
  drawPixels(ctx, BALL.pixels, ox, oy, scale, BALL_X, BALL_Y)
  drawPixels(ctx, HANDS.pixels, ox, oy, scale)

  // Sparkles.
  sparkle(ctx, 40, 40, 8, accent)
  sparkle(ctx, SIZE - 52, 132, 6, "#bba3ff")
  sparkle(ctx, 30, SIZE - 160, 6, "#ff9d86")
  sparkle(ctx, ox - 30, oy + 40, 6, accent)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))), "image/png")
  })
}

export async function downloadFortuneCard(fortune: Fortune, reaction: string) {
  const blob = await renderFortuneCard(fortune, reaction)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `design-oracle-${fortune.id.toLowerCase()}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
