import { TONE_META, TOPIC_NAMES, type Fortune } from "@/data/fortunes"
import { T_W, deliveredState, tikkuPixels } from "@/lib/art/tikku"

const SIZE = 1080
const BG = "#211f2e"
const PAPER = "#f3e3b6"
const PAPER_SH = "#e3cd93"
const INK = "#2b2320"
const VERM = "#c4502f"

function stepped(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x + s, y, w - s * 2, h)
  ctx.fillRect(x, y + s, w, h - s * 2)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

/** Deterministic speckle so every export has the same paper grain. */
function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  let seed = 7
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(120,80,30,0.10)" : "rgba(255,255,255,0.18)"
    ctx.fillRect(x + r() * w, y + r() * h, 2, 2)
  }
}

async function ensureFonts() {
  if (!document.fonts) return
  await Promise.all([
    document.fonts.load('700 40px "Courier Prime"'),
    document.fonts.load('400 20px "Courier Prime"'),
    document.fonts.load('20px "Press Start 2P"'),
  ])
}

export async function renderTicket(fortune: Fortune, ticketNo: number, date: string): Promise<Blob> {
  await ensureFonts()
  const tone = TONE_META[fortune.tone]
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unsupported")
  ctx.imageSmoothingEnabled = false

  // Backdrop with pixel dots.
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = "rgba(241,221,165,0.07)"
  for (let y = 14; y < SIZE; y += 28) for (let x = 14; x < SIZE; x += 28) ctx.fillRect(x, y, 4, 4)

  // Brand line.
  ctx.textBaseline = "top"
  ctx.textAlign = "center"
  ctx.font = '22px "Press Start 2P"'
  ctx.fillStyle = "#f5b947"
  ctx.fillText("THE FORTUNE MACHINE", SIZE / 2, 74)
  ctx.font = '400 26px "Courier Prime"'
  ctx.fillStyle = "#cbbf9f"
  ctx.fillText("What's weighing on you today?", SIZE / 2, 116)

  // Ticket, slightly rotated like it just landed on the table.
  const tw = 860
  const th = 680
  const tx = (SIZE - tw) / 2
  const ty = 200
  ctx.save()
  ctx.translate(SIZE / 2, ty + th / 2)
  ctx.rotate(-0.018)
  ctx.translate(-SIZE / 2, -(ty + th / 2))

  stepped(ctx, tx + 14, ty + 16, tw, th, 10, "rgba(0,0,0,0.45)")
  stepped(ctx, tx, ty, tw, th, 10, PAPER)
  ctx.fillStyle = PAPER_SH
  ctx.fillRect(tx + 10, ty + th - 8, tw - 20, 8)
  grain(ctx, tx, ty, tw, th)

  // Perforation notches on both sides.
  ctx.fillStyle = BG
  for (const nx of [tx - 2, tx + tw - 26]) stepped(ctx, nx, ty + th / 2 - 28, 28, 56, 8, BG)

  // Double vermilion frame.
  ctx.strokeStyle = VERM
  ctx.lineWidth = 5
  ctx.strokeRect(tx + 30, ty + 30, tw - 60, th - 60)
  ctx.lineWidth = 2
  ctx.strokeRect(tx + 42, ty + 42, tw - 84, th - 84)

  const L = tx + 72
  const R = tx + tw - 72

  // Header.
  ctx.textAlign = "left"
  ctx.fillStyle = INK
  ctx.font = '700 24px "Courier Prime"'
  ctx.fillText("THE FORTUNE MACHINE", L, ty + 72)
  ctx.font = '400 20px "Courier Prime"'
  ctx.globalAlpha = 0.7
  ctx.fillText("PLATFORM 1 · EST. TODAY", L, ty + 102)
  ctx.globalAlpha = 1
  ctx.textAlign = "right"
  ctx.font = '700 24px "Courier Prime"'
  ctx.fillText(`NO. ${String(ticketNo).padStart(6, "0")}`, R, ty + 72)
  ctx.font = '400 20px "Courier Prime"'
  ctx.globalAlpha = 0.7
  ctx.fillText(date.toUpperCase(), R, ty + 102)
  ctx.globalAlpha = 1

  const dashed = (y: number) => {
    ctx.fillStyle = INK
    ctx.globalAlpha = 0.45
    for (let x = L; x < R; x += 14) ctx.fillRect(x, y, 8, 2)
    ctx.globalAlpha = 1
  }
  dashed(ty + 142)

  // Route + stamp.
  ctx.textAlign = "left"
  ctx.font = '700 24px "Courier Prime"'
  ctx.fillStyle = INK
  ctx.fillText(`FROM OVERTHINKING → TO ${TOPIC_NAMES[fortune.topic].toUpperCase()}`, L, ty + 168, R - L - 220)

  ctx.save()
  ctx.translate(R - 90, ty + 182)
  ctx.rotate(-0.08)
  ctx.font = '18px "Press Start 2P"'
  const sw = ctx.measureText(tone.stamp).width + 36
  stepped(ctx, -sw / 2, -24, sw, 48, 6, tone.color)
  ctx.fillStyle = "#fff8e6"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(tone.stamp, 0, 2)
  ctx.restore()
  ctx.textBaseline = "top"

  // Fortune, auto-sized.
  const maxW = R - L
  const top = ty + 236
  const maxH = 270
  let size = 54
  let lines: string[] = []
  for (; size >= 32; size -= 2) {
    ctx.font = `700 ${size}px "Courier Prime"`
    lines = wrap(ctx, fortune.text, maxW)
    if (lines.length * size * 1.25 <= maxH) break
  }
  ctx.fillStyle = INK
  ctx.textAlign = "left"
  const blockH = lines.length * size * 1.25
  const startY = top + (maxH - blockH) / 2
  lines.forEach((l, i) => ctx.fillText(l, L, startY + i * size * 1.25))

  dashed(ty + th - 136)
  ctx.font = '400 21px "Courier Prime"'
  ctx.fillStyle = INK
  ctx.fillText("No refunds on destiny.", L, ty + th - 112)
  ctx.textAlign = "right"
  ctx.fillText(`CLASS: ${tone.stamp}`, R, ty + th - 112)
  ctx.restore()

  // Tikku waving from the bottom corner.
  const scale = 6
  const px = tikkuPixels(deliveredState(fortune.tone, 0))
  const ox = SIZE - 70 - T_W * scale
  const oy = SIZE - 40 - 24 * scale
  for (const [x, y, c] of px) {
    ctx.fillStyle = c
    ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale)
  }
  ctx.textAlign = "left"
  ctx.font = '16px "Press Start 2P"'
  ctx.fillStyle = "#8f879f"
  ctx.fillText("MISSION 001 · 100 MISSIONS", 70, SIZE - 66)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/png"),
  )
}

export async function downloadTicket(fortune: Fortune, ticketNo: number, date: string) {
  const blob = await renderTicket(fortune, ticketNo, date)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `fortune-ticket-${String(ticketNo).padStart(6, "0")}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
