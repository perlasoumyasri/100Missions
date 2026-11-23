import { type CSSProperties, useEffect, useState } from "react"

import { Badge } from "@/components/ui/8bit/badge"
import { Button } from "@/components/ui/8bit/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/8bit/card"
import { CATEGORY_META, type Fortune } from "@/data/fortunes"
import { cn } from "@/lib/utils"

import { PixelIcon } from "./pixels"

interface Props {
  fortune: Fortune | null
  reaction: string
  drawNumber: number
  reducedMotion: boolean
  busy: boolean
  saving: boolean
  onTypingDone: () => void
  onCopy: () => void
  onSave: () => void
  onAgain: () => void
}

/** Speed so that any quote finishes typing in roughly half a second. */
function typingDelay(text: string) {
  return Math.min(22, Math.max(8, 520 / text.length))
}

function PixelQuoteMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 5 3" className="sprite h-4 w-[1.66rem] self-start" aria-hidden="true">
      <path d="M1 0h1v1h-1zM0 1h2v2h-2zM4 0h1v1h-1zM3 1h2v2h-2z" fill={color} />
    </svg>
  )
}

export function FortuneCard(props: Props) {
  const { fortune, drawNumber } = props
  if (!fortune) {
    return (
      <div className="hard-shadow h-full">
      <Card font="normal" className="[--foreground:var(--ink)] h-full bg-card">
        <CardContent className="flex min-h-[260px] flex-1 flex-col sm:min-h-[340px] items-center justify-center gap-6 px-8 py-12 text-center">
          <div className="anim-nudge grid size-16 place-items-center bg-muted text-secondary">
            <PixelIcon name="surprise" className="size-8" />
          </div>
          <div className="space-y-3">
            <p className="retro text-[11px] leading-relaxed tracking-wide text-secondary">
              YOUR FORTUNE AWAITS
            </p>
            <p className="mx-auto max-w-[26ch] font-terminal text-[26px] leading-[1.05] text-muted-foreground">
              Choose a path. Press the button. Accept your fate.
            </p>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="anim-twinkle size-2 bg-secondary/60" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    )
  }

  return <RevealedCard key={`${fortune.id}-${drawNumber}`} {...props} fortune={fortune} />
}

function RevealedCard({
  fortune,
  reaction,
  drawNumber,
  reducedMotion,
  busy,
  saving,
  onTypingDone,
  onCopy,
  onSave,
  onAgain,
}: Props & { fortune: Fortune }) {
  const total = fortune.text.length
  const [typed, setTyped] = useState(() => (reducedMotion ? total : 0))

  useEffect(() => {
    if (reducedMotion) {
      onTypingDone()
      return
    }
    const step = typingDelay(fortune.text)
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const n = Math.min(total, Math.floor((now - started) / step) + 1)
      setTyped(n)
      if (n < total) frame = requestAnimationFrame(tick)
      else onTypingDone()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [fortune, total, reducedMotion, onTypingDone])

  const meta = CATEGORY_META[fortune.category]
  const done = typed >= total

  return (
    <div className="anim-card-in hard-shadow h-full">
    <Card
      font="normal"
      className="[--foreground:var(--ink)] h-full bg-card"
      style={{ "--accent-c": meta.color } as CSSProperties}
    >
      {/* Inner accent frame, like a collectible card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2.5 border-2 border-[var(--accent-c)] opacity-60 sm:inset-3"
      />
      {/* Pixel sparkles on the frame corners */}
      {[
        "top-0.5 left-0.5 sm:top-1 sm:left-1",
        "top-0.5 right-0.5 sm:top-1 sm:right-1",
        "bottom-0.5 left-0.5 sm:bottom-1 sm:left-1",
        "right-0.5 bottom-0.5 sm:right-1 sm:bottom-1",
      ].map((pos) => (
        <svg key={pos} viewBox="0 0 3 3" aria-hidden="true" className={`sprite pointer-events-none absolute size-4 ${pos}`}>
          <path d="M1 0h1v1h1v1h-1v1h-1v-1h-1v-1h1z" fill={meta.color} />
        </svg>
      ))}
      <CardHeader className="relative flex flex-row flex-wrap items-center justify-between gap-3 px-6 pt-7 sm:px-9 sm:pt-9">
        <Badge font="retro" className="bg-[var(--accent-c)] border-[var(--accent-c)] text-ink text-[9px] sm:text-[10px] h-8">
          {meta.label}
        </Badge>
        <p className="retro text-[9px] tracking-wider text-muted-foreground">
          FORTUNE #{String(drawNumber).padStart(3, "0")} · {fortune.id}
        </p>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col justify-center gap-5 px-6 py-4 sm:px-9">
        <PixelQuoteMark color={meta.color} />
        {/* Full text reserves the final height so nothing jumps while typing. */}
        <blockquote
          className="font-body text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.1] font-semibold tracking-[-0.015em] text-pretty text-card-foreground"
          aria-hidden="true"
        >
          <span>{fortune.text.slice(0, typed)}</span>
          {!done && <span className="anim-caret ml-0.5 inline-block h-[0.8em] w-[0.42em] translate-y-[0.08em] bg-[var(--accent-c)]" />}
          <span className="invisible">{fortune.text.slice(typed)}</span>
        </blockquote>
        <p className="sr-only">{fortune.text}</p>
        <p
          className={cn(
            "font-terminal text-[24px] leading-none text-[var(--accent-c)] transition-opacity duration-300",
            done ? "opacity-100" : "opacity-0",
          )}
        >
          &gt; {reaction}
        </p>
      </CardContent>

      <CardFooter className="relative flex flex-wrap gap-x-5 gap-y-4 px-6 pt-3 pb-8 sm:px-9 sm:pb-9">
        <Button
          font="retro"
          size="sm"
          variant="secondary"
          onClick={onCopy}
          className="[--foreground:var(--ink)] h-10 bg-[#efe6ff] px-3 text-[9px] text-ink hover:bg-white"
        >
          <PixelIcon name="copy" className="size-3.5!" /> COPY
        </Button>
        <Button
          font="retro"
          size="sm"
          variant="secondary"
          onClick={onSave}
          disabled={saving}
          className="[--foreground:var(--ink)] h-10 bg-[#efe6ff] px-3 text-[9px] text-ink hover:bg-white disabled:opacity-70"
        >
          <PixelIcon name="save" className="size-3.5!" /> {saving ? "SAVING…" : "SAVE PNG"}
        </Button>
        <Button
          font="retro"
          size="sm"
          variant="secondary"
          onClick={onAgain}
          disabled={busy}
          className="[--foreground:var(--ink)] h-10 bg-[var(--accent-c)] px-3 text-[9px] text-ink hover:brightness-110 disabled:opacity-70"
        >
          <PixelIcon name="again" className="size-3.5!" /> ANOTHER
        </Button>
      </CardFooter>
    </Card>
    </div>
  )
}
