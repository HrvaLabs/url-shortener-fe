"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageMeta } from "@/components/page-meta"
import { StatusBadge } from "@/components/status-badge"
import { DestinationHealthBadge } from "@/components/notifications/destination-health-badge"
import { AnalyticsEmpty, AnalyticsError, AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { BreakdownPanels } from "@/components/analytics/breakdown-panels"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { RangePicker } from "@/components/analytics/range-picker"
import { StatTotals } from "@/components/analytics/stat-totals"
import { LiveNumber } from "@/components/live-number"
import { StaleDataNotice } from "@/components/stale-data-notice"
import { ANALYTICS_HISTORY_START, analyticsDay, analyticsHref, parseServerDateTime } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"
import { useUrlAnalytics } from "@/lib/hooks/useAnalytics"
import { liveStamp, liveState, type LiveStamp } from "@/lib/live"
import type { AnalyticsLinkSummary, AnalyticsRange, UrlAnalytics } from "@/lib/types"
import { cn, formatDate, formatDateTime, formatShortUrl, formatTimeAgo } from "@/lib/utils"
import { readUtm, UTM_KEYS, type UtmKey } from "@/lib/utm"

interface LinkAnalyticsProps {
  linkId: number
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
}

const refusals: Record<number, string> = {
  403: "You can only see analytics for your own links.",
  404: "This link doesn't exist or was deleted.",
}

export function LinkAnalytics({ linkId, days, onDaysChange }: LinkAnalyticsProps) {
  const query = useUrlAnalytics(linkId, days)
  const { data, error, isPending, isPlaceholderData, refetch, isRefetching } = query
  const backRef = useRef<HTMLAnchorElement>(null)
  const state = liveState(error, data !== undefined)

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Link analytics" description="Clicks, referrers, countries and devices for one of your links." />
      <Link
        ref={backRef}
        href={analyticsHref({ days })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All analytics
      </Link>

      {isPending ? (
        <AnalyticsSkeleton variant="link" />
      ) : data && state !== "failed" ? (
        <>
          {state === "stale" && (
            <StaleDataNotice message="Couldn't refresh these numbers. They may be out of date." onRetry={() => refetch()} returnFocusTo={backRef} />
          )}
          <LinkAnalyticsBody data={data} stamp={liveStamp(query)} days={days} onDaysChange={onDaysChange} refreshing={isPlaceholderData} />
        </>
      ) : error ? (
        <AnalyticsError error={error} retrying={isRefetching} onRetry={() => refetch()} refusals={refusals} />
      ) : null}
    </div>
  )
}

interface LinkAnalyticsBodyProps {
  data: UrlAnalytics
  stamp: LiveStamp
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
  refreshing: boolean
}

function LinkAnalyticsBody({ data, stamp, days, onDaysChange, refreshing }: LinkAnalyticsBodyProps) {
  const { isAdmin } = useAuth()
  const { link, totals, daily, breakdowns } = data
  const empty = totals.clicks + totals.botClicks === 0
  const historyStart = formatDate(analyticsDay(ANALYTICS_HISTORY_START))
  const createDate = link.createDate ? parseServerDateTime(link.createDate) : null
  const lastAccessed = link.lastAccessed ? parseServerDateTime(link.lastAccessed) : null

  return (
    <>
      <div className="min-w-0 space-y-4">
        <div className="min-w-0">
          <h1 className="font-mono text-lg font-medium text-brand [overflow-wrap:anywhere]">{formatShortUrl(link.shortUrl, link.domain?.hostname)}</h1>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={link.status} className="shrink-0" />
            {link.destinationHost && (
              <span className="min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere]">{link.destinationHost}</span>
            )}
          </div>
          <DestinationHealthBadge health={link.destinationHealth} active={link.status === "ACTIVE"} emailPrompt={!isAdmin} />
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatDate(createDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last visit</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatTimeAgo(lastAccessed)}</dd>
            {lastAccessed && <dd className="mt-1 text-xs tabular-nums text-muted-foreground">{formatDateTime(lastAccessed)}</dd>}
          </div>
          <div className="max-w-sm">
            <dt className="text-xs text-muted-foreground">All-time visits</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              <LiveNumber value={link.visits} scope={String(link.id)} stamp={stamp} />
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Daily unique visitors, added up since the link was created. Counts from before {historyStart} used an older method.
            </dd>
          </div>
        </dl>
        <CampaignTags link={link} />
      </div>

      <RangePicker value={days} onChange={onDaysChange} />

      <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
        <StatTotals totals={totals} scope={`${link.id}:${data.from}:${data.to}`} stamp={stamp} />

        {empty ? (
          <AnalyticsEmpty days={days} historyStart={historyStart} />
        ) : (
          <>
            <ClicksChart daily={daily} days={days} />
            <BreakdownPanels totals={totals} breakdowns={breakdowns} passwordProtected={link.passwordProtected} />
          </>
        )}
      </div>
    </>
  )
}

const utmLabels: Record<UtmKey, string> = {
  utm_source: "Source",
  utm_medium: "Medium",
  utm_campaign: "Campaign",
  utm_term: "Term",
  utm_content: "Content",
}

function CampaignTags({ link }: { link: AnalyticsLinkSummary }) {
  const tags = readUtm(link.longUrl ?? "")
  const present = UTM_KEYS.filter((key) => tags[key])
  if (present.length === 0) return null

  return (
    <section className="max-w-xl rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Campaign tags</h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 px-5 py-4 text-sm">
        {present.map((key) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{utmLabels[key]}</dt>
            <dd className="font-medium [overflow-wrap:anywhere]">{tags[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
