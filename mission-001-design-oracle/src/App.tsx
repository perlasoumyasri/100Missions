import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Toaster } from "sonner"

import { PixelCoin } from "@/components/machine/coin"
import { ControlPanel } from "@/components/machine/control-panel"
import { FortuneMachine, type MachineHandle } from "@/components/machine/fortune-machine"
import { PixelIcon } from "@/components/machine/pixels"
import { Ticket } from "@/components/machine/ticket"
import { Button } from "@/components/ui/8bit/button"
import { toast } from "@/components/ui/8bit/toast"
import { Toggle } from "@/components/ui/8bit/toggle"
import { FORTUNES, LINES, type Fortune, type Tone, type TopicMode } from "@/data/fortunes"
import type { MachineMode } from "@/lib/art/machine"
import { copyText } from "@/lib/clipboard"
import { downloadTicket } from "@/lib/export-ticket"
import { ShuffleBag } from "@/lib/shuffle-bag"
import { sfx, unlockAudio } from "@/lib/sound"
import { cn } from "@/lib/utils"

/** Choreography, in ms after the coin is released. */
const COIN_FLIGHT = 420
const AFTER_COIN = { thinking: 480, printing: 930, done: 1380 }
const TICKET_FLIGHT = 560

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)"
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", on)
    return () => window.removeEventListener("resize", on)
  }, [])
  return vp
}

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()

interface CoinFlight {
  id: number
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const vp = useViewport()
  const wide = vp.w >= 1024

  const [topic, setTopic] = useState<TopicMode>("surprise")
  const [tone, setTone] = useState<Tone>("roast")
  const [phase, setPhase] = useState<MachineMode>("idle")
  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [ticketNo, setTicketNo] = useState(() => 4200 + Math.floor(Math.random() * 700))
  const [draws, setDraws] = useState(0)
  const [line, setLine] = useState(LINES.idle[0])
  const [sound, setSound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stubVisible, setStubVisible] = useState(false)
  const [coin, setCoin] = useState<CoinFlight | null>(null)
  const [saving, setSaving] = useState(false)
  const [date] = useState(todayLabel)

  const machine = useRef<MachineHandle>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ticketWrap = useRef<HTMLDivElement>(null)
  const coinEl = useRef<HTMLDivElement>(null)
  const bags = useRef(new Map<string, ShuffleBag<Fortune>>())
  const lastShown = useRef<Fortune | undefined>(undefined)
  const busyRef = useRef(false)
  const soundRef = useRef(false)
  const timers = useRef<number[]>([])
  const flightPending = useRef(false)

  // soundRef is kept in sync by the sound toggle, so timers always read the latest value.
  const play = (fn: () => void) => soundRef.current && fn()

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  // Idle chatter.
  useEffect(() => {
    if (phase !== "idle") return
    const id = window.setInterval(() => setLine((l) => pick(LINES.idle.filter((x) => x !== l))), 6500)
    return () => window.clearInterval(id)
  }, [phase])

  const draw = useCallback((): Fortune => {
    const key = `${topic}:${tone}`
    let bag = bags.current.get(key)
    if (!bag) {
      bag = new ShuffleBag(FORTUNES.filter((f) => f.tone === tone && (topic === "surprise" || f.topic === topic)))
      bags.current.set(key, bag)
    }
    const next = bag.next(lastShown.current)
    lastShown.current = next
    return next
  }, [topic, tone])

  const deliver = useCallback(
    (next: Fortune) => {
      setFortune(next)
      setTicketNo((n) => n + 1)
      setDraws((d) => d + 1)
      setPhase("done")
      setLine(pick(LINES.delivered[next.tone]))
      play(sfx.reveal)
    },
    [],
  )

  const finish = useCallback(() => {
    busyRef.current = false
    setBusy(false)
  }, [])

  const insertCoin = useCallback(
    (source?: HTMLElement | null) => {
      if (busyRef.current) return
      busyRef.current = true
      setBusy(true)
      play(sfx.press)
      const next = draw()

      if (reducedMotion) {
        flightPending.current = false
        setStubVisible(false)
        deliver(next)
        finish()
        return
      }

      // Make sure the machine is on screen before the show starts.
      const slot = machine.current?.slotRect()
      let delay = 0
      if (slot && (slot.top < 40 || slot.top > window.innerHeight - 40)) {
        const machineBox = machine.current?.machineRect()
        const target = machineBox ? window.scrollY + machineBox.top - 12 : window.scrollY + slot.top - window.innerHeight / 2
        window.scrollTo({ top: Math.max(0, target), behavior: "smooth" })
        delay = 380
      }

      later(delay, () => {
        const s = machine.current?.slotRect()
        const b = (source ?? buttonRef.current)?.getBoundingClientRect()
        if (s && b) {
          const fromY = Math.min(Math.max(b.top + b.height / 2, 0), window.innerHeight - 20)
          setCoin({ id: Date.now(), from: { x: b.left + Math.min(40, b.width / 2), y: fromY }, to: { x: s.left, y: s.top } })
        }
        later(COIN_FLIGHT, () => {
          setPhase("coin")
          setLine(pick(LINES.coin))
          play(sfx.coin)
          later(150, () => play(sfx.activate))
        })
        later(COIN_FLIGHT + AFTER_COIN.thinking, () => {
          setPhase("thinking")
          setLine(pick(LINES.thinking))
          play(() => sfx.spin(0.45))
        })
        later(COIN_FLIGHT + AFTER_COIN.printing, () => {
          setPhase("printing")
          setStubVisible(true)
          play(() => sfx.print(0.45))
        })
        later(COIN_FLIGHT + AFTER_COIN.done, () => {
          flightPending.current = true
          deliver(next)
        })
      })
    },
    [draw, deliver, finish, reducedMotion],
  )

  // Coin flight: a short arc from the button into the slot.
  useLayoutEffect(() => {
    const el = coinEl.current
    if (!coin || !el) return
    const { from, to } = coin
    const midX = (from.x + to.x) / 2
    const midY = Math.min(from.y, to.y) - 70
    const anim = el.animate(
      [
        { transform: `translate(${from.x - 14}px, ${from.y - 14}px) rotate(0deg) scale(1)` },
        { transform: `translate(${midX - 14}px, ${midY - 14}px) rotate(200deg) scale(1.15)`, offset: 0.5 },
        { transform: `translate(${to.x - 14}px, ${to.y - 18}px) rotate(340deg) scale(0.9)`, offset: 0.85 },
        { transform: `translate(${to.x - 14}px, ${to.y - 6}px) rotate(360deg) scaleX(0.15) scaleY(0.8)` },
      ],
      { duration: COIN_FLIGHT, easing: "cubic-bezier(0.35, 0, 0.3, 1)", fill: "forwards" },
    )
    anim.onfinish = () => setCoin(null)
    return () => anim.cancel()
  }, [coin])

  // Ticket flight: from the printed stub to the reading position.
  useLayoutEffect(() => {
    if (!flightPending.current || phase !== "done") return
    flightPending.current = false
    const wrap = ticketWrap.current
    const stub = machine.current?.stubRect()
    if (!wrap || !stub) {
      setStubVisible(false)
      finish()
      return
    }
    const t = wrap.getBoundingClientRect()
    const scale = stub.width / t.width
    const dx = stub.left - t.left
    const dy = stub.top - t.top
    setStubVisible(false)
    const anim = wrap.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 },
        { transform: `translate(${dx + (t.left - stub.left) * 0.15}px, ${dy * 0.6 - 40}px) scale(${(scale + 1) / 2}) rotate(-4deg)`, offset: 0.45 },
        { transform: "translate(0, 0) scale(1) rotate(0deg)" },
      ],
      { duration: TICKET_FLIGHT, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)" },
    )
    if (!wide) {
      const top = window.scrollY + t.top - Math.max(16, (window.innerHeight - t.height) / 2)
      window.scrollTo({ top, behavior: "smooth" })
    }
    anim.onfinish = finish
    anim.oncancel = finish
  }, [phase, draws, wide, finish])

  const onCopy = async () => {
    if (!fortune) return
    play(sfx.press)
    const ok = await copyText(fortune.text)
    toast(ok ? "Fortune copied. Use it wisely." : "Couldn't copy. Select the text and copy it manually.")
  }

  const onSave = async () => {
    if (!fortune || saving) return
    play(sfx.press)
    setSaving(true)
    try {
      await downloadTicket(fortune, ticketNo, date)
      toast("Ticket saved. Frame it. Post it. Live by it.")
    } catch {
      toast("The printer jammed. Try saving again.")
    } finally {
      setSaving(false)
    }
  }

  const showTicket = fortune && phase === "done"
  const lastFortune = fortune

  return (
    <div className="crt app-bg min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 pt-4 sm:px-8 sm:pt-5">
        <p className="retro text-[9px] leading-relaxed tracking-wider text-[#a99f86] sm:text-[10px]">
          <span className="text-[#f5b947]">MISSION 001</span> / THE FORTUNE MACHINE
        </p>
        <Toggle
          variant="outline"
          size="sm"
          pressed={sound}
          onPressedChange={(on) => {
            if (on) unlockAudio()
            setSound(on)
            soundRef.current = on
            if (on) sfx.press()
          }}
          aria-label="Sound effects"
          className="mx-1.5 h-8 shrink-0 gap-2 bg-[#2c2a3d] px-2.5 text-[8px] whitespace-nowrap text-[#cfc6ad] [--foreground:var(--ink)] hover:bg-[#3a3750] hover:text-[#fff8e6] data-[state=on]:bg-[#78b18c] data-[state=on]:text-ink"
        >
          <PixelIcon name={sound ? "soundOn" : "soundOff"} className="size-3.5!" />
          SOUND {sound ? "ON" : "OFF"}
        </Toggle>
      </header>

      <main className="stage mx-auto max-w-[1380px] px-4 pt-5 pb-12 sm:px-8 lg:pt-4">
        <section className="[grid-area:intro]">
          <h1 className="retro text-[clamp(1.05rem,2.3vw,1.6rem)] leading-[1.35] text-[#f1dda5] [text-shadow:3px_3px_0_var(--ink)]">
            THE FORTUNE
            <br className="hidden lg:block" /> <span className="text-[#e4643d]">MACHINE</span>
          </h1>
          <p className="mt-3 font-body text-[clamp(1.15rem,1.7vw,1.45rem)] leading-snug font-semibold text-[#fff8e6] lg:mt-4">
            What&rsquo;s weighing on you today?
          </p>
          <p className="mt-1 font-terminal text-[21px] leading-tight text-[#f5b947]">Insert a coin. The universe has opinions.</p>
        </section>

        <section aria-label="The Fortune Machine" className="[grid-area:machine] relative self-center pt-14 lg:pt-16">
          <FortuneMachine
            ref={machine}
            phase={phase}
            tone={fortune?.tone ?? null}
            line={line}
            reducedMotion={reducedMotion}
            maxHeight={wide ? Math.max(400, vp.h - 150) : Math.min(520, Math.max(400, vp.h * 0.62))}
            maxWidth={wide ? Math.min(380, vp.w * 0.27) : vp.w - 32}
            stubVisible={stubVisible}
          />
        </section>

        <section aria-label="Operating panel" className="[grid-area:panel]">
          <ControlPanel
            topic={topic}
            tone={tone}
            busy={busy}
            hasTicket={!!fortune}
            onTopic={(t) => {
              play(sfx.press)
              setTopic(t)
            }}
            onTone={(t) => {
              play(sfx.press)
              setTone(t)
            }}
            onInsert={(e) => insertCoin(e.currentTarget)}
            buttonRef={buttonRef}
          />
        </section>

        <section aria-label="Your ticket" className={cn("tray [grid-area:tray]", !lastFortune && "max-lg:hidden")}>
          {lastFortune ? (
            <div className={cn("transition-opacity duration-200", !showTicket && "opacity-0")}>
              <div ref={ticketWrap} className="ticket-wrap" key={draws}>
                <Ticket fortune={lastFortune} ticketNo={ticketNo} date={date} />
                {lastFortune.tone === "hype" && !reducedMotion && <Confetti key={draws} />}
              </div>
              <div className={cn("mt-7 flex flex-wrap gap-x-5 gap-y-4 px-1.5 transition-opacity duration-300", busy ? "opacity-0" : "opacity-100")}>
                <Button
                  font="retro"
                  size="sm"
                  onClick={(e) => insertCoin(e.currentTarget)}
                  disabled={busy}
                  className="h-10 bg-[#f5b947] px-3 text-[9px] text-ink [--foreground:var(--ink)] hover:bg-[#ffc95e]"
                >
                  <PixelIcon name="again" className="size-3.5!" /> ANOTHER FORTUNE
                </Button>
                <Button
                  font="retro"
                  size="sm"
                  onClick={onCopy}
                  disabled={busy}
                  className="h-10 bg-[#f1dda5] px-3 text-[9px] text-ink [--foreground:var(--ink)] hover:bg-[#fff1c9]"
                >
                  <PixelIcon name="copy" className="size-3.5!" /> COPY
                </Button>
                <Button
                  font="retro"
                  size="sm"
                  onClick={onSave}
                  disabled={busy || saving}
                  className="h-10 bg-[#f1dda5] px-3 text-[9px] text-ink [--foreground:var(--ink)] hover:bg-[#fff1c9]"
                >
                  <PixelIcon name="save" className="size-3.5!" /> {saving ? "SAVING…" : "SAVE PNG"}
                </Button>
              </div>
              <p className="sr-only" aria-live="polite">
                {showTicket ? `Your fortune: ${lastFortune.text}` : ""}
              </p>
            </div>
          ) : (
            <div className="ticket-placeholder">
              <PixelCoin className="size-8 opacity-80" />
              <p className="retro text-[9px] leading-relaxed text-[#cfc6ad]">YOUR TICKET PRINTS HERE</p>
              <p className="font-terminal text-[20px] leading-tight text-[#8f879f]">
                Pick what&rsquo;s on your mind, choose a fortune, then feed the machine a coin.
              </p>
            </div>
          )}
        </section>
      </main>

      {coin && (
        <div ref={coinEl} key={coin.id} className="pointer-events-none fixed top-0 left-0 z-40 size-7" aria-hidden="true">
          <PixelCoin className="size-7" />
        </div>
      )}

      <Toaster position="bottom-center" offset={24} />
    </div>
  )
}

function Confetti() {
  const colors = ["#f5b947", "#e4643d", "#78b18c", "#f1dda5", "#9fd0e6"]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3">
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2
        const dist = 120 + (i % 5) * 26
        return (
          <span
            key={i}
            className="anim-confetti absolute left-1/2"
            style={
              {
                width: i % 3 ? 6 : 9,
                height: i % 3 ? 6 : 9,
                background: colors[i % colors.length],
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist * 0.7 - 30}px`,
                animationDelay: `${TICKET_FLIGHT - 120 + (i % 4) * 25}ms`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
