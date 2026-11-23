import { memo } from "react"

import {
  M_H,
  M_W,
  MACHINE_BODY,
  TIKKU_ORIGIN,
  bulbPixels,
  ledPixels,
  leverPixels,
  needlePixels,
  wheelPixels,
  type MachineMode,
} from "@/lib/art/machine"
import { tikkuPixels, type TikkuState } from "@/lib/art/tikku"

import { PixelLayer } from "./pixels"

interface Props {
  mode: MachineMode
  tick: number
  wheel: number
  tikku: TikkuState
  leverDown: boolean
  needle: number
  breathe: boolean
}

const Body = memo(function Body() {
  return <PixelLayer pixels={MACHINE_BODY.pixels} />
})

export function MachineArt({ mode, tick, wheel, tikku, leverDown, needle, breathe }: Props) {
  return (
    <svg
      viewBox={`0 0 ${M_W} ${M_H}`}
      className="sprite block h-full w-auto"
      role="img"
      aria-label="The Fortune Machine, with Tikku the fortune-keeper inside its window"
    >
      <Body />
      <PixelLayer pixels={wheelPixels(mode, wheel)} />
      <PixelLayer pixels={bulbPixels(mode, tick)} />
      <PixelLayer pixels={leverPixels(leverDown)} />
      <g transform={`translate(${TIKKU_ORIGIN.x} ${TIKKU_ORIGIN.y + (breathe ? 1 : 0)})`}>
        <PixelLayer pixels={tikkuPixels(tikku)} />
      </g>
      <PixelLayer pixels={needlePixels(needle)} />
      <PixelLayer pixels={ledPixels(mode, tick)} />
    </svg>
  )
}
