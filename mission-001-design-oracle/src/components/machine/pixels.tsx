import { memo, type SVGProps } from "react"

import { ICONS, type IconName } from "@/lib/art/icons"
import type { Pixel } from "@/lib/pixel/grid"

/** Merges horizontal runs of same-coloured pixels into single rects. */
function runs(pixels: Pixel[]) {
  // Later pixels win when two share a cell.
  const unique = new Map<number, Pixel>()
  for (const p of pixels) unique.set(p[1] * 10000 + p[0], p)
  const sorted = [...unique.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0])
  const out: { x: number; y: number; w: number; c: string }[] = []
  for (const [x, y, c] of sorted) {
    const last = out[out.length - 1]
    if (last && last.y === y && last.c === c && last.x + last.w === x) last.w++
    else out.push({ x, y, w: 1, c })
  }
  return out
}

export const PixelLayer = memo(function PixelLayer({
  pixels,
  dx = 0,
  dy = 0,
  ...props
}: { pixels: Pixel[]; dx?: number; dy?: number } & SVGProps<SVGGElement>) {
  return (
    <g {...props}>
      {runs(pixels).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x + dx} y={r.y + dy} width={r.w} height={1} fill={r.c} />
      ))}
    </g>
  )
})

export function PixelIcon({ name, className, title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      className={`sprite ${className ?? ""}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      {ICONS[name].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
      ))}
    </svg>
  )
}
