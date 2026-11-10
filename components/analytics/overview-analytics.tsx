"use client"

import { useRef } from "react"
import Link from "next/link"
import { PageMeta } from "@/components/page-meta"
import { AnalyticsEmpty, AnalyticsError, AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { BreakdownPanels } from "@/components/analytics/breakdown-panels"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { RangePicker } from "@/components/analytics/range-picker"
import { StatTotals } from "@/components/analytics/stat-totals"
import { LiveNumber } from "@/components/live-number"
import { StaleDataNotice } from "@/components/stale-data-notice"
import { ANALYTICS_HISTORY_START, analyticsDay, analyticsHref } from "@/lib/analytics"
import { useAnalyticsOverview } from "@/lib/hooks/useAnalytics"
import { liveStamp, liveState, type LiveStamp } from "@/lib/live"
import type { AnalyticsOverview, AnalyticsRange, AnalyticsTopLink } from "@/lib/types"
import { cn, formatDate, plural, shortHostOf } from "@/lib/utils"
import { shortHost } from "@/lib/domains"

interface OverviewAnalyticsProps {
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
}

export function OverviewAnalytics({ days, onDaysChange }: OverviewAnalyticsProps) {
  const query = useAnalyticsOverview(days)
  const { data, error, isPending, isPlaceholderData, refetch, isRefetching } = query
  const headingRef = useRef<HTMLHeadingElement>(null)
  const state = liveState(error, data !== undefined)

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Analytics" description="Clicks, daily unique visitors and top links across all your links." />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">Analytics</h1>
          <Link href="/help/stats#overview" className="text-sm text-brand-link">How analytics work</Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Clicks across all your links</p>
      </div>

      {isPending ? (
        <AnalyticsSkeleton variant="overview" />
      ) : data && state !== "failed" ? (
        <>
          {state === "stale" && (
            <StaleDataNotice message="Couldn't refresh these numbers. They may be out of date." onRetry={() => refetch()} returnFocusTo={headingRef} />
          )}
          <OverviewBody data={data} stamp={liveStamp(query)} days={days} onDaysChange={onDaysChange} refreshing={isPlaceholderData} />
        </>
      ) : error ? (
        <AnalyticsError error={error} retrying={isRefetching} onRetry={() => refetch()} />
      ) : null}
    </div>
  )
}

interface OverviewBodyProps {
  data: AnalyticsOverview
  stamp: LiveStamp
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
  refreshing: boolean
}

function OverviewBody({ data, stamp, days, onDaysChange, refreshing }: OverviewBodyProps) {
  const { totals, daily, topLinks, breakdowns } = data
  const empty = totals.clicks + totals.botClicks === 0
  const historyStart = formatDate(analyticsDay(ANALYTICS_HISTORY_START))
  const counters = [
    { label: "Links", value: data.totalUrls },
    { label: "Active", value: data.activeUrls },
    { label: "Expired", value: data.expiredUrls },
  ]

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">All time</h2>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {counters.map((counter) => (
            <div key={counter.label}>
              <dt className="text-xs text-muted-foreground">{counter.label}</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{counter.value.toLocaleString()}</dd>
            </div>
          ))}
          <div className="max-w-sm">
            <dt className="text-xs text-muted-foreground">All-time visits</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              <LiveNumber value={data.totalVisits} stamp={stamp} />
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Daily unique visitors, added up since each link was created. Counts from before {historyStart} used an older method.
            </dd>
          </div>
        </dl>
      </section>

      <RangePicker value={days} onChange={onDaysChange} />

      <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
        <StatTotals
          totals={totals}
          scope={`${data.from}:${data.to}`}
          stamp={stamp}
          uniqueVisitorsHint="Counted per day and per link, so one person on two different days or two links counts twice."
        />

        {empty ? (
          <AnalyticsEmpty days={days} historyStart={historyStart} />
        ) : (
          <>
            <ClicksChart daily={daily} days={days} />
            <TopLinks links={topLinks} days={days} />
            <BreakdownPanels totals={totals} breakdowns={breakdowns} />
          </>
        )}
      </div>
    </>
  )
}

interface TopLinksProps {
  links: AnalyticsTopLink[]
  days: AnalyticsRange
}

function TopLinks({ links, days }: TopLinksProps) {
  const top = Math.max(1, ...links.map((link) => link.clicks))

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Top links</h2>
      {links.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No clicks in this range.</p>
      ) : (
        <ol className="space-y-1 p-2">
          {links.map((link) => (
            <li key={link.id}>
              <Link
                href={analyticsHref({ link: link.id, days })}
                className="block space-y-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]"><span className="font-normal text-muted-foreground">{shortHost(link.domain, shortHostOf())}/</span>{link.shortUrl}</span>
                  <span className="shrink-0 text-sm tabular-nums">{plural(link.clicks, "click")}</span>
                </span>
                <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(link.clicks / top) * 100}%` }} />
                </span>
                <span className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{link.destinationHost}</span>
                  <span className="shrink-0 tabular-nums">{plural(link.uniqueVisitors, "daily unique visitor")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
