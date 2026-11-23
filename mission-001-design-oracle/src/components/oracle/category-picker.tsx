import { ToggleGroup, ToggleGroupItem } from "@/components/ui/8bit/toggle-group"
import type { Mode } from "@/data/fortunes"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

import { PixelIcon } from "./pixels"

const OPTIONS: { value: Mode; label: string; color: string }[] = [
  { value: "surprise", label: "Surprise Me", color: "#fff7e9" },
  { value: "wisdom", label: "Wisdom", color: "var(--wisdom)" },
  { value: "roast", label: "Roast", color: "var(--roast)" },
  { value: "boost", label: "Boost", color: "var(--boost)" },
]

interface Props {
  value: Mode
  onChange: (mode: Mode) => void
  disabled?: boolean
}

export function CategoryPicker({ value, onChange, disabled }: Props) {
  return (
    <div>
      <p id="path-label" className="mb-3 font-pixel text-[10px] leading-none tracking-wider text-muted-foreground">
        CHOOSE YOUR PATH
      </p>
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(v) => v && onChange(v as Mode)}
        aria-labelledby="path-label"
        className="grid grid-cols-2 gap-x-4 gap-y-4 px-1.5 sm:grid-cols-[1.5fr_1fr_1fr_1fr]"
      >
        {OPTIONS.map((o) => {
          const active = value === o.value
          return (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              variant="outline"
              disabled={disabled && !active}
              aria-label={o.label}
              style={{ "--chip": o.color } as CSSProperties}
              className={cn(
                "retro relative h-11 w-full gap-2 rounded-none border-0 px-1.5 text-[8px] leading-none tracking-normal uppercase shadow-none",
                "[--foreground:var(--ink)] bg-card text-[#e6def8] hover:bg-muted hover:text-[var(--chip)]",
                "data-[state=on]:bg-[var(--chip)] data-[state=on]:text-ink data-[state=on]:hover:bg-[var(--chip)] data-[state=on]:hover:text-ink",
                "focus-visible:ring-0 disabled:opacity-60",
                active && "hard-shadow-sm",
              )}
            >
              <PixelIcon name={o.value} className="size-3.5! shrink-0" />
              <span className="truncate">{o.label}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
