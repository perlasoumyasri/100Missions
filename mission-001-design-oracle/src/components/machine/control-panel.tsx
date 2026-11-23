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
  "relative h-12 w-full justify-start gap-2.5 rounded-none border-0 px-3 text-[19px] leading-[0.95] tracking-[0.04em] uppercase shadow-none " +
  "[--foreground:var(--ink)] bg-[#1a1129] text-[#d8c7f0] hover:bg-[#2b1b3b] hover:text-[#faf5ff] " +
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
        font="normal"
        value={topic}
        onValueChange={(v) => v && onTopic(v as TopicMode)}
        aria-labelledby="step-topic"
        className="grid grid-cols-2 gap-4 px-1.5"
      >
        {TOPICS.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            variant="outline"
            font="normal"
            aria-label={t.label}
            disabled={busy && topic !== t.value}
            style={{ "--chip": "#e9d5ff" } as CSSProperties}
            className={cn(itemClass, topic === t.value && "pressed-chip")}
          >
            <PixelIcon name={TOPIC_ICON[t.value]} className="size-4! shrink-0" />
            <span className="text-left">{t.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Step n={2} id="step-tone">Choose your fortune</Step>
      <ToggleGroup
        type="single"
        variant="outline"
        font="normal"
        value={tone}
        onValueChange={(v) => v && onTone(v as Tone)}
        aria-labelledby="step-tone"
        className="grid grid-cols-3 gap-4 px-1.5"
      >
        {TONES.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            variant="outline"
            font="normal"
            aria-label={t.label}
            disabled={busy && tone !== t.value}
            style={{ "--chip": { roast: "#f472b6", wisdom: "#c084fc", hype: "#2dd4bf" }[t.value] } as CSSProperties}
            className={cn(itemClass, "max-sm:justify-center max-sm:px-2 max-sm:text-[17px]", tone === t.value && "pressed-chip")}
          >
            <PixelIcon name={TONE_ICON[t.value]} className="size-4! shrink-0 max-sm:hidden" />
            <span className="text-left max-sm:text-center">{t.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Step n={3} id="step-coin">Insert a coin</Step>
      <div className="px-1.5">
        <Button
          ref={buttonRef}
          font="normal"
          size="lg"
          onClick={onInsert}
          disabled={busy}
          aria-describedby="step-coin"
          className="coin-button h-14 w-full gap-3 whitespace-normal bg-[#d946ef] text-[21px] leading-none tracking-[0.04em] text-ink uppercase [--foreground:var(--ink)] hover:bg-[#e879f9] disabled:opacity-100 sm:text-[27px] sm:tracking-[0.06em]"
        >
          <PixelCoin className={cn("size-7 shrink-0", busy && "opacity-0")} />
          {busy ? "The machine is working…" : hasTicket ? "Insert another coin" : "Insert coin — get fortune"}
        </Button>
      </div>
      <p className="mt-4 text-center text-[19px] leading-none text-[#9a86b5]">Free to play. No real coins required.</p>
    </div>
  )
}
