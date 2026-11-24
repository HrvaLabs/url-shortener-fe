import { breakdownLabel, countryFlag } from "@/lib/analytics"
import type { BreakdownDimension, BreakdownEntry } from "@/lib/types"

interface BreakdownListProps {
  title: string
  dimension: BreakdownDimension
  entries: BreakdownEntry[]
  note?: React.ReactNode
  header?: React.ReactNode
}

export function BreakdownList({ title, dimension, entries, note, header }: BreakdownListProps) {
  const largest = Math.max(1, ...entries.map((entry) => entry.clicks))

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">Clicks</span>
      </div>
      {note && <p className="border-b px-5 py-2.5 text-xs text-muted-foreground">{note}</p>}
      {header && entries.length > 0 && <div className="border-b px-5 py-4">{header}</div>}
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No clicks in this range.</p>
      ) : (
        <ul className="space-y-1 p-3">
          {entries.map((entry) => {
            const label = breakdownLabel(dimension, entry.value)
            const flag = dimension === "countries" ? countryFlag(entry.value) : ""
            return (
              <li key={entry.value} className="relative flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-md bg-brand/10"
                  style={{ width: `${(entry.clicks / largest) * 100}%` }}
                />
                <span className="relative flex min-w-0 items-center gap-2">
                  {flag && <span aria-hidden="true" className="shrink-0">{flag}</span>}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                </span>
                <span className="relative shrink-0 tabular-nums text-muted-foreground">{entry.clicks.toLocaleString()}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
