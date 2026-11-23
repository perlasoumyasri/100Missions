import { useCallback, useEffect, useRef, useState } from "react"
import { Toaster } from "sonner"

import { CategoryPicker } from "@/components/oracle/category-picker"
import { FortuneCard } from "@/components/oracle/fortune-card"
import { OracleStage, type Phase } from "@/components/oracle/oracle-stage"
import { PixelIcon } from "@/components/oracle/pixels"
import { Button } from "@/components/ui/8bit/button"
import { Card } from "@/components/ui/8bit/card"
import { toast } from "@/components/ui/8bit/toast"
import { Toggle } from "@/components/ui/8bit/toggle"
import {
  CATEGORY_META,
  FORTUNES,
  IDLE_LINE,
  THINKING_LINES,
  type Fortune,
  type Mode,
} from "@/data/fortunes"
import { copyText } from "@/lib/clipboard"
import { downloadFortuneCard } from "@/lib/export-card"
import { ShuffleBag } from "@/lib/shuffle-bag"
import { playClick, playReveal, playThinking } from "@/lib/sound"

const THINK_MS = 720

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

function makeBags(): Record<Mode, ShuffleBag<Fortune>> {
  return {
    surprise: new ShuffleBag(FORTUNES),
    wisdom: new ShuffleBag(FORTUNES.filter((f) => f.category === "wisdom")),
    roast: new ShuffleBag(FORTUNES.filter((f) => f.category === "roast")),
    boost: new ShuffleBag(FORTUNES.filter((f) => f.category === "boost")),
  }
}

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)"
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [mode, setMode] = useState<Mode>("surprise")
  const [phase, setPhase] = useState<Phase>("idle")
  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [reaction, setReaction] = useState("")
  const [dialogue, setDialogue] = useState(IDLE_LINE)
  const [drawNumber, setDrawNumber] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sound, setSound] = useState(false)

  const bags = useRef(makeBags())
  const busyRef = useRef(false)
  const lastShown = useRef<Fortune | undefined>(undefined)
  const cardRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const accent = fortune && phase !== "thinking" ? CATEGORY_META[fortune.category].color : mode === "surprise" ? "#c9ff70" : CATEGORY_META[mode].color

  const consult = useCallback(() => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)

    // Each mode has its own bag, so pass the fortune on screen to avoid an immediate repeat.
    const next = bags.current[mode].next(lastShown.current)
    lastShown.current = next

    setPhase("thinking")
    setDialogue(pick(THINKING_LINES))
    if (sound) playThinking()

    timer.current = window.setTimeout(
      () => {
        const meta = CATEGORY_META[next.category]
        setFortune(next)
        setReaction(pick(meta.reactions))
        setDialogue(pick(meta.dialogue))
        setDrawNumber((n) => n + 1)
        setPhase("revealed")
        if (sound) playReveal()
        if (window.innerWidth < 1024) {
          cardRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" })
        }
      },
      reducedMotion ? 0 : THINK_MS,
    )
  }, [mode, sound, reducedMotion])

  const onTypingDone = useCallback(() => {
    busyRef.current = false
    setBusy(false)
  }, [])

  const onCopy = useCallback(async () => {
    if (!fortune) return
    if (sound) playClick()
    const ok = await copyText(fortune.text)
    toast(ok ? "Fortune copied. Use it wisely." : "Copy failed. Select the quote and copy it manually.")
  }, [fortune, sound])

  const onSave = useCallback(async () => {
    if (!fortune || saving) return
    if (sound) playClick()
    setSaving(true)
    try {
      await downloadFortuneCard(fortune, reaction)
      toast("Card saved as PNG. Go share your destiny.")
    } catch {
      toast("The Oracle couldn't save that card. Try again.")
    } finally {
      setSaving(false)
    }
  }, [fortune, reaction, saving, sound])

  const thinking = phase === "thinking"

  return (
    <div className="crt pixel-dots min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-8">
        <p className="retro text-[9px] leading-relaxed tracking-wider text-muted-foreground sm:text-[10px]">
          <span className="text-primary">MISSION 001</span> / THE DESIGN ORACLE
        </p>
        <Toggle
          variant="outline"
          size="sm"
          pressed={sound}
          onPressedChange={(on) => {
            setSound(on)
            if (on) playClick()
          }}
          aria-label="Sound effects"
          className="mx-1.5 h-8 shrink-0 gap-2 bg-card px-2.5 text-[8px] whitespace-nowrap text-muted-foreground [--foreground:var(--ink)] hover:bg-muted hover:text-foreground data-[state=on]:bg-secondary data-[state=on]:text-ink"
        >
          <PixelIcon name={sound ? "soundOn" : "soundOff"} className="size-3.5!" />
          <span className="hidden sm:inline">SOUND</span> {sound ? "ON" : "OFF"}
        </Toggle>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-7 pb-14 sm:px-8 sm:pt-6">
        <div className="text-center">
          <h1 className="retro text-[clamp(1.3rem,4vw,2.6rem)] leading-[1.15] tracking-tight [text-shadow:4px_4px_0_var(--ink)]">
            THE DESIGN <span className="text-primary">ORACLE</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[34ch] font-terminal text-[clamp(1.35rem,2.2vw,1.7rem)] leading-tight text-secondary sm:max-w-none">
            Your design destiny awaits. The Oracle knows things. Unfortunately.
          </p>
        </div>

        <div className="mt-8 grid items-stretch gap-x-12 gap-y-10 sm:mt-9 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Left: the arcade stage + controls */}
          <section aria-label="The Oracle" className="flex flex-col gap-6">
            <div className="hard-shadow">
              <Card font="normal" className="[--foreground:var(--ink)] gap-0 bg-[#1b1636] py-0">
                <div className="h-[300px] sm:h-[330px]">
                  <OracleStage
                    phase={phase}
                    category={fortune?.category ?? null}
                    burstKey={drawNumber}
                    accent={accent}
                  />
                </div>
                {/* RPG dialogue box */}
                <div className="relative border-t-[6px] border-ink bg-ink px-5 pt-5 pb-4">
                  <span className="retro absolute -top-3.5 left-4 bg-secondary px-2 py-1 text-[8px] text-ink">ORACLE</span>
                  <p aria-live="polite" className="min-h-[2.1em] font-terminal text-[24px] leading-[1.05] text-[#fff7e9]">
                    {dialogue}
                    <span aria-hidden="true" className="anim-caret ml-2 inline-block text-primary">
                      ▼
                    </span>
                  </p>
                </div>
              </Card>
            </div>

            <CategoryPicker value={mode} onChange={setMode} disabled={thinking} />

            <div className="hard-shadow px-1.5">
              <Button
                font="retro"
                size="lg"
                onClick={consult}
                disabled={busy}
                aria-busy={thinking}
                className="h-16 w-full bg-primary text-[13px] tracking-wide text-ink [--foreground:var(--ink)] hover:bg-[#d8ff94] disabled:opacity-100 sm:text-sm"
              >
                {thinking ? "THE ORB STIRS…" : "CONSULT THE ORACLE"}
              </Button>
            </div>
          </section>

          {/* Right: the fortune */}
          <section ref={cardRef} aria-label="Your fortune" className="scroll-mt-6 lg:pt-0">
            <FortuneCard
              fortune={fortune}
              reaction={reaction}
              drawNumber={drawNumber}
              reducedMotion={reducedMotion}
              busy={busy}
              saving={saving}
              onTypingDone={onTypingDone}
              onCopy={onCopy}
              onSave={onSave}
              onAgain={consult}
            />
          </section>
        </div>
      </main>

      <footer className="pb-8 text-center font-terminal text-lg text-muted-foreground/70">
        Mission 001 of 100 · Built with React + 8bitcn
      </footer>

      <Toaster position="bottom-center" offset={28} />
    </div>
  )
}
