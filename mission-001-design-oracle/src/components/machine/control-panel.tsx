import type { CSSProperties, ReactNode } from "react"

import { Button } from "@/components/ui/8bit/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/8bit/toggle-group"
import { TONES, TOPICS, type Tone, type TopicMode } from "@/data/fortunes"
import type { IconName } from "@/lib/art/icons"
import { cn } from "@/lib/utils"

import { PixelCoin } from "./coin"
import { PixelIcon } from "./pixels"

interface Props {
  topic: TopicMode
  tone: Tone
  busy: boolean
  hasTicket: boolean
  onTopic: (t: TopicMode) => void
  onTone: (t: Tone) => void
  onInsert: (e: React.MouseEvent<HTMLButtonElement>) => void
  buttonRef: React.Ref<HTMLButtonElement>
}

const TOPIC_ICON: Record<TopicMode, IconName> = { work: "work", love: "love", life: "life", surprise: "surprise" }
const TONE_ICON: Record<Tone, IconName> = { roast: "roast", wisdom: "wisdom", hype: "hype" }

function Step({ n, children, id }: { n: number; children: ReactNode; id: string }) {
  return (
    <p id={id} className="panel-step">
      <span className="panel-step-n">{n}</span>
      {children}
    </p>
  )
}

const itemClass =
  "retro relative h-12 w-full justify-start gap-2 rounded-none border-0 px-2 text-[8px] sm:px-2.5 sm:text-[8.5px] leading-[1.35] uppercase shadow-none " +
  "[--foreground:var(--ink)] bg-[#1b2e3b] text-[#d9cfb0] hover:bg-[#2b475a] hover:text-[#fff8e6] " +
  "data-[state=on]:bg-[var(--chip)] data-[state=on]:text-ink data-[state=on]:hover:bg-[var(--chip)] " +
  "focus-visible:ring-0 disabled:opacity-60"

export function ControlPanel({ topic, tone, busy, hasTicket, onTopic, onTone, onInsert, buttonRef }: Props) {
  return (
    <div className="panel">
      <span className="panel-rivet left-2 top-2" />
      <span className="panel-rivet right-2 top-2" />
      <span className="panel-rivet bottom-2 left-2" />
      <span className="panel-rivet right-2 bottom-2" />

      <Step n={1} id="step-topic">What&rsquo;s weighing on you?</Step>
      <ToggleGroup
        type="single"
        variant="outline"
        value={topic}
        onValueChange={(v) => v && onTopic(v as TopicMode)}
        aria-labelledby="step-topic"
        className="grid grid-cols-2 gap-3.5 px-1.5"
      >
        {TOPICS.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            variant="outline"
            aria-label={t.label}
            disabled={busy && topic !== t.value}
            style={{ "--chip": "#f1dda5" } as CSSProperties}
            className={cn(itemClass, topic === t.value && "pressed-chip")}
          >
            <PixelIcon name={TOPIC_ICON[t.value]} className="size-3.5! shrink-0" />
            <span className="text-left">{t.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Step n={2} id="step-tone">Choose your fortune</Step>
      <ToggleGroup
        type="single"
        variant="outline"
        value={tone}
        onValueChange={(v) => v && onTone(v as Tone)}
        aria-labelledby="step-tone"
        className="grid grid-cols-3 gap-3.5 px-1.5"
      >
        {TONES.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            variant="outline"
            aria-label={t.label}
            disabled={busy && tone !== t.value}
            style={{ "--chip": { roast: "#e4643d", wisdom: "#9fd0e6", hype: "#78b18c" }[t.value] } as CSSProperties}
            className={cn(itemClass, tone === t.value && "pressed-chip")}
          >
            <PixelIcon name={TONE_ICON[t.value]} className="size-3.5! shrink-0" />
            <span className="text-left">{t.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Step n={3} id="step-coin">Insert a coin</Step>
      <div className="px-1.5">
        <Button
          ref={buttonRef}
          font="retro"
          size="lg"
          onClick={onInsert}
          disabled={busy}
          aria-describedby="step-coin"
          className="coin-button h-14 w-full gap-3 whitespace-normal bg-[#f5b947] text-[11px] leading-tight text-ink [--foreground:var(--ink)] hover:bg-[#ffc95e] disabled:opacity-100 sm:text-[12px]"
        >
          <PixelCoin className={cn("size-6 shrink-0", busy && "opacity-0")} />
          {busy ? "THE MACHINE IS WORKING…" : hasTicket ? "INSERT ANOTHER COIN" : "INSERT COIN — GET FORTUNE"}
        </Button>
      </div>
      <p className="mt-3 text-center font-terminal text-[17px] leading-none text-[#8fa6b4]">Free to play. No real coins required.</p>
    </div>
  )
}
