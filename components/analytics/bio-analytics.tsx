"use client"

import { useRef } from "react"
import Link from "next/link"
import { PageMeta } from "@/components/page-meta"
import { AnalyticsError, AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { BioViewsChart } from "@/components/analytics/bio-views-chart"
import { RangePicker } from "@/components/analytics/range-picker"
import { StaleDataNotice } from "@/components/stale-data-notice"
import { LiveNumber } from "@/components/live-number"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api-client"
import { bioButtonLabel, displayShareUrl, linkStateLabel } from "@/lib/bio"
import { useBioAnalytics } from "@/lib/hooks/useBioAnalytics"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { liveStamp, liveState, type LiveStamp } from "@/lib/live"
import type { AnalyticsRange, BioButtonClicks, BioPageAnalytics } from "@/lib/types"
import { cn, getShortBaseUrl } from "@/lib/utils"

interface BioAnalyticsProps {
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
}

const panelClass = "min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"

export function BioAnalytics({ days, onDaysChange }: BioAnalyticsProps) {
  const query = useBioAnalytics(days)
  const { data, error, isPending, isPlaceholderData, refetch, isRefetching } = query
  const state = liveState(error, data !== undefined)
  const noPage = error instanceof ApiError && error.status === 404
  const headingRef = useRef<HTMLHeadingElement>(null)
  const retry = useFocusAfterRetry(headingRef, !!data && !error)

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Bio page analytics" description="Views and button clicks for your hrva.cc bio page." />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Bio page
        </h1>
        {data && state !== "failed" && <PageLine handle={data.handle} />}
      </div>

      {isPending ? (
        <AnalyticsSkeleton variant="link" />
      ) : noPage ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">You don&apos;t have a bio page yet.</p>
          <Link href="/dashboard/bio" className="mt-3 inline-block text-sm font-medium text-brand-link">
            Create your bio page
          </Link>
        </div>
      ) : data && state !== "failed" ? (
        <>
          {state === "stale" && (
            <StaleDataNotice message="Couldn't refresh these numbers. They may be out of date." onRetry={() => refetch()} returnFocusTo={headingRef} />
          )}
          <BioAnalyticsBody data={data} stamp={liveStamp(query)} onDaysChange={onDaysChange} refreshing={isPlaceholderData} days={days} />
        </>
      ) : error ? (
        <AnalyticsError error={error} retrying={isRefetching} onRetry={() => retry(refetch)} />
      ) : null}
    </div>
  )
}

function PageLine({ handle }: { handle: string | null }) {
  if (handle === null) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        Views and button clicks for your bio page. It has no address until you choose a new handle.{" "}
        <Link href="/dashboard/bio" className="text-brand-link">
          Choose a handle
        </Link>
      </p>
    )
  }
  return (
    <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">
      Views and button clicks for {displayShareUrl(handle, getShortBaseUrl())}
    </p>
  )
}

interface BioAnalyticsBodyProps {
  data: BioPageAnalytics
  stamp: LiveStamp
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
  refreshing: boolean
}

function BioAnalyticsBody({ data, stamp, days, onDaysChange, refreshing }: BioAnalyticsBodyProps) {
  const totals = [
    { label: "Views", value: data.views, hint: "Each visitor counts once a day. Bots are counted apart." },
    { label: "Bot views", value: data.botViews, hint: "Link previews and crawlers. Not counted as views." },
  ]

  return (
    <>
      <RangePicker value={days} onChange={onDaysChange} />

      <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
        <dl className="grid gap-px overflow-hidden rounded-xl border bg-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:grid-cols-2">
          {totals.map((stat) => (
            <div key={stat.label} className="min-w-0 bg-card p-5">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                <LiveNumber value={stat.value} scope={`${data.from}:${data.to}`} stamp={stamp} />
              </dd>
              {stat.hint && <dd className="mt-1.5 text-xs text-muted-foreground">{stat.hint}</dd>}
            </div>
          ))}
        </dl>

        {data.views === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No views in this range yet.</p>
          </div>
        ) : (
          <BioViewsChart daily={data.daily} days={data.days} />
        )}

        <ButtonClicks buttons={data.buttons} />
      </div>
    </>
  )
}

const missingReason = (button: BioButtonClicks): string =>
  button.visible === false ? "Hidden" : (linkStateLabel(button.linkState)?.badge ?? "Not on your page")

function ButtonClicks({ buttons }: { buttons: BioButtonClicks[] }) {
  return (
    <section className={panelClass}>
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Buttons</h2>
      {buttons.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Your page has no buttons yet.{" "}
          <Link href="/dashboard/bio" className="text-brand-link">
            Add buttons
          </Link>
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-36 pl-5">Button</TableHead>
                <TableHead className="text-right">From your bio page</TableHead>
                <TableHead className="pr-5 text-right">All clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buttons.map((button) => (
                <TableRow key={button.buttonId}>
                  <TableCell className="min-w-36 pl-5">
                    <span className="block font-medium [overflow-wrap:anywhere]">{bioButtonLabel(button)}</span>
                    <span className="mt-0.5 block font-mono text-[13px] text-brand [overflow-wrap:anywhere]">/{button.shortUrl}</span>
                    {!button.shownOnPage && (
                      <Badge variant="secondary" className="mt-1.5">
                        {missingReason(button)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{button.fromHrvaPages.toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap pr-5 text-right tabular-nums">{button.allClicks.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t px-5 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">From your bio page.</span> Clicks on the link that came from a hrva.cc page,
            such as your bio page. <span className="font-medium text-foreground">All clicks.</span> Every click on the link, wherever
            it was shared.
          </p>
        </>
      )}
    </section>
  )
}
