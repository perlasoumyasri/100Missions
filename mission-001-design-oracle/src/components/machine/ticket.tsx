import { forwardRef } from "react"

import { Badge } from "@/components/ui/8bit/badge"
import { TONE_META, TOPIC_NAMES, type Fortune } from "@/data/fortunes"
import { cn } from "@/lib/utils"

interface Props {
  fortune: Fortune
  ticketNo: number
  date: string
  className?: string
}

/** The printed fortune ticket: warm paper, railway-ticket layout, readable type. */
export const Ticket = forwardRef<HTMLDivElement, Props>(function Ticket({ fortune, ticketNo, date, className }, ref) {
  const tone = TONE_META[fortune.tone]
  return (
    <div ref={ref} className={cn("ticket", className)} data-tone={fortune.tone} data-topic={fortune.topic} data-fortune-id={fortune.id}>
      <div className="ticket-frame">
        <div className="flex items-start justify-between gap-3">
          <p className="ticket-label">
            The Fortune Machine
            <span className="block text-[0.85em] font-normal tracking-[0.08em] opacity-70">Platform 1 · Est. today</span>
          </p>
          <p className="ticket-label text-right">
            No. {String(ticketNo).padStart(6, "0")}
            <span className="block text-[0.85em] font-normal tracking-[0.08em] opacity-70">{date}</span>
          </p>
        </div>

        <div className="ticket-rule" />

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="ticket-route">
            <span className="opacity-60">From</span> Overthinking <span aria-hidden="true">→</span>{" "}
            <span className="opacity-60">To</span> {TOPIC_NAMES[fortune.topic]}
          </p>
          <span className="ticket-stamp" style={{ ["--stamp" as string]: tone.color }}>
            <Badge font="normal" className="h-7 bg-[var(--stamp)] border-[var(--stamp)] text-[#faf5ff] text-[19px] tracking-[0.1em]">
              {tone.stamp}
            </Badge>
          </span>
        </div>

        <p className="ticket-fortune">{fortune.text}</p>

        <div className="ticket-rule" />

        <div className="flex items-end justify-between gap-3">
          <p className="ticket-small">No refunds on destiny.</p>
          <p className="ticket-small text-right whitespace-nowrap">Class: {tone.stamp}</p>
        </div>
      </div>
    </div>
  )
})
