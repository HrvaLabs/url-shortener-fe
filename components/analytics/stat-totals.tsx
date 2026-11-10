import { LiveNumber } from "@/components/live-number"
import type { LiveStamp } from "@/lib/live"
import type { AnalyticsTotals } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatTotalsProps {
  totals: AnalyticsTotals
  scope: string
  stamp: LiveStamp
  uniqueVisitorsLabel?: string
  uniqueVisitorsHint?: string
  columnsClassName?: string
  className?: string
}

export function StatTotals({
  totals,
  scope,
  stamp,
  uniqueVisitorsLabel = "Daily unique visitors",
  uniqueVisitorsHint = "Counted per day, so one person on two different days counts twice.",
  columnsClassName = "sm:grid-cols-3",
  className,
}: StatTotalsProps) {
  const stats = [
    { label: "Clicks", value: totals.clicks },
    {
      label: uniqueVisitorsLabel,
      value: totals.uniqueVisitors,
      hint: uniqueVisitorsHint,
    },
    {
      label: "Bot clicks",
      value: totals.botClicks,
      hint: "Link previews, crawlers and scripts. Not counted as clicks.",
    },
  ]

  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-xl border bg-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]", columnsClassName, className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 bg-card p-5">
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            <LiveNumber value={stat.value} scope={scope} stamp={stamp} />
          </dd>
          {stat.hint && <dd className="mt-1.5 text-xs text-muted-foreground">{stat.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}
