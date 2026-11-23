import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react"

import type { Tone } from "@/data/fortunes"
import { COIN_SLOT, DISPENSER, M_H, M_W, type MachineMode } from "@/lib/art/machine"
import { deliveredState, type TikkuState } from "@/lib/art/tikku"
import { cn } from "@/lib/utils"

import { MachineArt } from "./machine-art"

export interface MachineHandle {
  slotRect(): DOMRect | null
  stubRect(): DOMRect | null
  machineRect(): DOMRect | null
}

interface Props {
  phase: MachineMode
  tone: Tone | null
  line: string
  reducedMotion: boolean
  /** Upper bounds for the machine size in CSS px. */
  maxHeight: number
  maxWidth: number
  /** Hide the printed stub once the ticket has been pulled out. */
  stubVisible: boolean
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Cell size that maps each art pixel to whole device pixels, so nothing blurs or seams. */
function crispCell(width: number, maxHeight: number) {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  const ideal = Math.min(width / M_W, maxHeight / M_H, 6)
  return Math.max(2, Math.floor(ideal * dpr) / dpr)
}

export const FortuneMachine = forwardRef<MachineHandle, Props>(function FortuneMachine(
  { phase, tone, line, reducedMotion, maxHeight, maxWidth, stubVisible },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const stubRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(4)

  useImperativeHandle(ref, () => ({
    slotRect: () => slotRef.current?.getBoundingClientRect() ?? null,
    stubRect: () => stubRef.current?.getBoundingClientRect() ?? null,
    machineRect: () => artRef.current?.getBoundingClientRect() ?? null,
  }))

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // Sized from the viewport, not the parent: the desktop grid column takes its width from the machine.
    const update = () => setCell(crispCell(maxWidth, maxHeight))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxHeight, maxWidth])

  // ----- Animation clock -----
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reducedMotion) return
    const ms = phase === "idle" ? 150 : 70
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [phase, reducedMotion])

  // Wheel speed depends on what the machine is doing.
  const speed = { idle: 1 / 3, coin: 1, thinking: 2, printing: 1, done: 1 / 2 }[phase]
  const wheel = reducedMotion ? 0 : Math.floor(tick * speed)

  // ----- Tikku's behaviour -----
  const [idleFace, setIdleFace] = useState<TikkuState>("idle")
  const [phaseAge, setPhaseAge] = useState(0)

  useEffect(() => {
    setPhaseAge(0)
    if (reducedMotion) return
    const started = performance.now()
    const id = window.setInterval(() => setPhaseAge(performance.now() - started), 60)
    return () => window.clearInterval(id)
  }, [phase, reducedMotion])

  // Idle life: blinks, glances and the occasional smug look.
  useEffect(() => {
    if (reducedMotion || (phase !== "idle" && phase !== "done")) return
    let timer = 0
    let cancelled = false
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return
        const roll = Math.random()
        const face: TikkuState = roll < 0.55 ? "blink" : roll < 0.72 ? "glance-left" : roll < 0.88 ? "glance-right" : "smug"
        setIdleFace(face)
        window.setTimeout(() => !cancelled && setIdleFace("idle"), face === "blink" ? 140 : face === "smug" ? 1400 : 900)
        schedule()
      }, rand(1800, 4200))
    }
    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [phase, reducedMotion])

  let tikku: TikkuState = idleFace
  let leverDown = false
  if (phase === "coin") tikku = phaseAge < 260 ? "surprised" : "look-mechanism"
  else if (phase === "thinking") {
    const down = Math.floor(tick / 2) % 2 === 1
    tikku = down ? "thinking-b" : "thinking-a"
    leverDown = down
  } else if (phase === "printing") tikku = "look-mechanism"
  else if (phase === "done" && tone) {
    // Hold the reaction for a few seconds, then go back to idle life.
    tikku = reducedMotion || phaseAge < 3600 ? deliveredState(tone, Math.floor(tick / 3)) : idleFace
  }

  // Gauge needle.
  const needle =
    phase === "thinking"
      ? -Math.PI / 2 + Math.sin(tick * 0.9) * 1.3
      : phase === "done" && tone
        ? { roast: -0.4, wisdom: -Math.PI / 2, hype: 0.1 }[tone]
        : phase === "printing"
          ? -0.8
          : -2.5 + (reducedMotion ? 0 : Math.sin(tick * 0.2) * 0.08)

  const breathe = !reducedMotion && phase === "idle" && Math.floor(tick / 9) % 2 === 1

  const width = Math.round(M_W * cell * 100) / 100
  const height = Math.round(M_H * cell * 100) / 100
  const pct = (v: number, of: number) => `${(v / of) * 100}%`

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      <div ref={artRef} className="relative" style={{ width, height }}>
        <MachineArt
          mode={phase}
          tick={tick}
          wheel={wheel}
          tikku={tikku}
          leverDown={leverDown}
          needle={needle}
          breathe={breathe}
        />

        {/* Coin slot target (invisible) */}
        <div
          ref={slotRef}
          aria-hidden="true"
          className="pointer-events-none absolute size-px"
          style={{ left: pct(COIN_SLOT.x, M_W), top: pct(COIN_SLOT.y, M_H) }}
        />

        {/* Ticket stub printing out of the dispenser */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: pct(DISPENSER.x0 + 1, M_W),
            width: pct(DISPENSER.x1 - DISPENSER.x0 - 1, M_W),
            top: pct(DISPENSER.y + 1, M_H),
            height: pct(19, M_H),
          }}
        >
          <div
            ref={stubRef}
            className={cn(
              "ticket-stub h-full w-full",
              phase === "printing" && "anim-print",
              phase === "done" && stubVisible && "translate-y-0",
              (phase === "done" && !stubVisible) || phase === "idle" || phase === "coin" || phase === "thinking"
                ? "-translate-y-full opacity-0"
                : "",
            )}
          >
            <span className="ticket-stub-inner">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>

        {/* Tikku's speech bubble */}
        <div
          className="speech pointer-events-none absolute"
          style={{ top: pct(-2, M_H) }}
          aria-live="polite"
        >
          <span key={line} className="anim-pop block">
            {line}
          </span>
        </div>
      </div>
    </div>
  )
})
