/** Small pixel-art toolkit: art is a grid of coloured cells, drawn as SVG or onto a canvas. */
export type Pixel = [x: number, y: number, color: string]

export interface Sprite {
  width: number
  height: number
  pixels: Pixel[]
}

export class Grid {
  private cells = new Map<number, string>()
  readonly width: number
  readonly height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  private key(x: number, y: number) {
    return y * 10000 + x
  }

  set(x: number, y: number, color: string) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    this.cells.set(this.key(x, y), color)
  }

  get(x: number, y: number) {
    return this.cells.get(this.key(x, y))
  }

  has(x: number, y: number) {
    return this.cells.has(this.key(x, y))
  }

  row(y: number, x0: number, x1: number, color: string) {
    for (let x = x0; x <= x1; x++) this.set(x, y, color)
  }

  col(x: number, y0: number, y1: number, color: string) {
    for (let y = y0; y <= y1; y++) this.set(x, y, color)
  }

  rect(x0: number, y0: number, x1: number, y1: number, color: string) {
    for (let y = y0; y <= y1; y++) this.row(y, x0, x1, color)
  }

  /** Fills every cell whose centre satisfies the predicate. */
  fill(test: (cx: number, cy: number, x: number, y: number) => string | null | undefined | false) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const c = test(x + 0.5, y + 0.5, x, y)
        if (c) this.set(x, y, c)
      }
    }
  }

  stamp(pixels: Pixel[], dx = 0, dy = 0) {
    for (const [x, y, c] of pixels) this.set(x + dx, y + dy, c)
  }

  /** Adds a one-pixel outline around the whole silhouette. */
  outline(color: string) {
    const add: [number, number][] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.has(x, y)) continue
        if (this.has(x - 1, y) || this.has(x + 1, y) || this.has(x, y - 1) || this.has(x, y + 1)) add.push([x, y])
      }
    }
    for (const [x, y] of add) this.set(x, y, color)
  }

  pixels(): Pixel[] {
    const out: Pixel[] = []
    for (const [k, c] of this.cells) out.push([k % 10000, Math.floor(k / 10000), c])
    return out
  }

  toSprite(): Sprite {
    return { width: this.width, height: this.height, pixels: this.pixels() }
  }
}

/** Integer line between two points (for needles and levers). */
export function line(x0: number, y0: number, x1: number, y1: number, color: string): Pixel[] {
  const out: Pixel[] = []
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    out.push([x0, y0, color])
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
  return out
}
