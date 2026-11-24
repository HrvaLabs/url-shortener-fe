"use client"

import { useState } from "react"
import { HideOnError } from "@/components/hide-on-error"
import { breakdownLabel, countryFlag } from "@/lib/analytics"
import type { BreakdownDimension, BreakdownEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

const WIDE_FROM = {
  lg: {
    body: "lg:grid lg:grid-cols-5",
    header: "lg:col-span-3 lg:flex lg:flex-col lg:justify-center lg:border-b-0 lg:border-r",
    list: "lg:col-span-2",
  },
  "@3xl": {
    body: "@3xl:grid @3xl:grid-cols-5",
    header: "@3xl:col-span-3 @3xl:flex @3xl:flex-col @3xl:justify-center @3xl:border-b-0 @3xl:border-r",
    list: "@3xl:col-span-2",
  },
} as const

interface BreakdownListProps {
  title: string
  dimension: BreakdownDimension
  entries: BreakdownEntry[]
  note?: React.ReactNode
  header?: React.ReactNode
  /** From this breakpoint, while the header shows, the header sits left of the list (3/5 to 2/5); give the card a full-width row. */
  wideFrom?: keyof typeof WIDE_FROM
}

export function BreakdownList({ title, dimension, entries, note, header, wideFrom }: BreakdownListProps) {
  const largest = Math.max(1, ...entries.map((entry) => entry.clicks))
  const [headerFailed, setHeaderFailed] = useState(false)
  const headerShown = header != null && entries.length > 0 && !headerFailed
  const wide = headerShown && wideFrom ? WIDE_FROM[wideFrom] : undefined

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">Clicks</span>
      </div>
      {note && <p className="border-b px-5 py-2.5 text-xs text-muted-foreground">{note}</p>}
      <div className={wide?.body}>
        {headerShown && (
          <div className={cn("min-w-0 border-b px-5 py-4", wide?.header)}>
            <HideOnError onError={() => setHeaderFailed(true)}>{header}</HideOnError>
          </div>
        )}
        {entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No clicks in this range.</p>
        ) : (
          <ul className={cn("min-w-0 space-y-1 p-3", wide?.list)}>
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
      </div>
    </section>
  )
}
