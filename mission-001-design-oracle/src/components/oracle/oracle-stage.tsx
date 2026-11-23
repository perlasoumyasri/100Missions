import { type CSSProperties, useMemo } from "react"

import type { Category } from "@/data/fortunes"
import {
  BALL,
  BALL_SWIRL,
  BALL_X,
  BALL_Y,
  HANDS,
  ORACLE,
  ORACLE_EYES,
  ORACLE_MOUTH,
  SCENE_H,
  SCENE_W,
  type OracleFace,
} from "@/lib/pixel-art"

import { PixelLayer } from "./pixels"

export type Phase = "idle" | "thinking" | "revealed"

const STARS: { x: number; y: number; s: number; d: number; c: string }[] = [
  { x: 7, y: 12, s: 2, d: 0, c: "#bba3ff" },
  { x: 16, y: 34, s: 1, d: 0.8, c: "#fff7e9" },
  { x: 86, y: 10, s: 2, d: 1.2, c: "#c9ff70" },
  { x: 92, y: 40, s: 1, d: 0.3, c: "#fff7e9" },
  { x: 78, y: 26, s: 1, d: 1.9, c: "#ff9d86" },
  { x: 24, y: 8, s: 1, d: 1.5, c: "#fff7e9" },
  { x: 66, y: 6, s: 1, d: 0.6, c: "#bba3ff" },
  { x: 10, y: 58, s: 1, d: 2.1, c: "#c9ff70" },
  { x: 90, y: 64, s: 1, d: 1.1, c: "#bba3ff" },
]

interface Props {
  phase: Phase
  category: Category | null
  /** Changes on every reveal so particles replay. */
  burstKey: number
  accent: string
}

export function OracleStage({ phase, category, burstKey, accent }: Props) {
  const face: OracleFace = phase === "thinking" ? "thinking" : phase === "revealed" && category ? category : "idle"
  const thinking = phase === "thinking"
  // Lavender would vanish inside the lavender ball, so wisdom and thinking swirl in white.
  const swirl = thinking || category === "wisdom" ? "#fff7e9" : accent

  const particles = useMemo(() => {
    // Hash-based pseudo-random: each burst looks different, rendering stays pure.
    const rand = (i: number, salt: number) => {
      const v = Math.sin(i * 12.9898 + burstKey * 78.233 + salt * 37.719) * 43758.5453
      return v - Math.floor(v)
    }
    return Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + rand(i, 1) * 0.3
      const dist = 70 + rand(i, 2) * 70
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.8 - 20,
        size: i % 3 === 0 ? 8 : 5,
        delay: rand(i, 3) * 0.08,
        color: i % 4 === 0 ? "#fff7e9" : accent,
      }
    })
  }, [burstKey, accent])

  return (
    <div className="relative isolate flex h-full w-full items-end justify-center overflow-hidden">
      {/* Night sky */}
      <div className="absolute inset-0 -z-10 bg-[#1b1636]" aria-hidden="true" />
      {STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="anim-twinkle absolute -z-10"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s * 4,
            height: s.s * 4,
            background: s.c,
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
      {/* Pixel moon */}
      <svg viewBox="0 0 8 8" className="sprite absolute top-[9%] right-[12%] -z-10 w-9 opacity-80" aria-hidden="true">
        <path d="M2 0h4v1h1v1h1v4h-1v1h-1v1h-4v-1h3v-1h1v-4h-1v-1h-3z" fill="#fff7e9" />
      </svg>

      {/* Floor: pixel rug with fringe */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[16%] bg-[#120f24]" aria-hidden="true">
        <div className="absolute inset-x-[12%] top-0 h-2 bg-[#2f2852]" />
      </div>

      {/* Glow behind the ball */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[14%] left-1/2 -z-10 aspect-square w-[44%] -translate-x-1/2 transition-opacity duration-300 ${
          thinking ? "anim-glow opacity-100" : phase === "revealed" ? "opacity-70" : "opacity-35"
        }`}
        style={{
          background: `radial-gradient(circle, ${accent}66 0%, ${accent}22 40%, transparent 68%)`,
        }}
      />

      {/* Floating Oracle + ball */}
      <div className="relative mb-[5%] h-[84%]">
        <div className={thinking ? "h-full" : "anim-float h-full"}>
          <svg
            viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
            className="sprite block h-full w-auto"
            role="img"
            aria-label={`The Oracle, ${face === "idle" ? "waiting" : face === "thinking" ? "concentrating" : "reacting"}`}
          >
            <PixelLayer pixels={ORACLE.pixels} />
            <PixelLayer pixels={ORACLE_EYES[face]} className={face === "idle" ? "anim-blink" : undefined} />
            <PixelLayer pixels={ORACLE_MOUTH[face]} />
            <g className={thinking ? "anim-shake" : undefined}>
              <PixelLayer pixels={BALL.pixels} dx={BALL_X} dy={BALL_Y} />
              {phase !== "idle" && (
                <g className={thinking ? "anim-swirl" : undefined}>
                  <PixelLayer pixels={BALL_SWIRL.map(([x, y]) => [x, y, swirl])} dx={BALL_X} dy={BALL_Y} />
                </g>
              )}
            </g>
            <PixelLayer pixels={HANDS.pixels} />
          </svg>
        </div>
        {/* Shadow */}
        <div
          aria-hidden="true"
          className="absolute -bottom-3 left-1/2 h-2 w-3/5 -translate-x-1/2 bg-black/45"
          style={{ clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)" }}
        />

        {/* Particles burst from the ball on reveal */}
        {phase === "revealed" && (
          <div key={burstKey} aria-hidden="true" className="pointer-events-none absolute top-[74%] left-1/2">
            {particles.map((p, i) => (
              <span
                key={i}
                className="anim-particle absolute"
                style={
                  {
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    "--dx": `${p.dx}px`,
                    "--dy": `${p.dy}px`,
                    animationDelay: `${p.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
