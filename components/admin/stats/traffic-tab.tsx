"use client"

import { useState } from "react"
import { AnalyticsEmpty } from "@/components/analytics/analytics-states"
import { BreakdownList } from "@/components/analytics/breakdown-list"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { QrScansList } from "@/components/analytics/qr-scans-list"
import { StatTotals } from "@/components/analytics/stat-totals"
import { LinkIdentityCells, LinkIdentityHeads } from "@/components/admin/stats/link-identity-cells"
import { StatGrid, type StatItem } from "@/components/admin/stats/stat-grid"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { botShare } from "@/lib/admin-stats"
import { ANALYTICS_HISTORY_START, analyticsDay } from "@/lib/analytics"
import { useTrafficStats } from "@/lib/hooks/useSiteStats"
import type { LiveStamp } from "@/lib/live"
import type { AnalyticsRange, TrafficStats, TrafficTopLink } from "@/lib/types"
import { formatDate } from "@/lib/utils"

const uniqueVisitorsLabel = "Unique visitors (per link per day)"

interface TrafficTabProps {
  days: AnalyticsRange
}

export function TrafficTab({ days }: TrafficTabProps) {
  const query = useTrafficStats(days)
  return <StatsPanel query={query}>{(data, stamp) => <TrafficBody data={data} stamp={stamp} days={data.days} />}</StatsPanel>
}

interface TrafficBodyProps {
  data: TrafficStats
  stamp: LiveStamp
  days: AnalyticsRange
}

function TrafficBody({ data, stamp, days }: TrafficBodyProps) {
  const [showBots, setShowBots] = useState(false)
  const { totals, daily, topLinks, breakdowns } = data
  const empty = totals.clicks + totals.botClicks === 0
  const historyStart = formatDate(analyticsDay(ANALYTICS_HISTORY_START))
  const share = botShare(totals)
  const items: StatItem[] = [
    {
      label: "Bot share",
      value: share == null ? "—" : `${share.toFixed(1)}%`,
      hint: "Bot clicks as a share of all clicks, bots included.",
    },
    { label: "Clicks on links without an account", value: data.anonymousClicks.toLocaleString() },
    { label: "Clicks on account links", value: data.accountClicks.toLocaleString() },
    {
      label: "All-time unique visitors",
      value: data.allTimeVisits.toLocaleString(),
      hint: `Unique visitors per link per day, added up since each link was created. Counts from before ${historyStart} used an older method.`,
    },
    ...(data.bioPageViews
      ? [
          { label: "Bio page views", value: data.bioPageViews.views.toLocaleString(), hint: "Each visitor counts once a day per page." },
          { label: "Bio page bot views", value: data.bioPageViews.botViews.toLocaleString() },
        ]
      : []),
  ]

  return (
    <>
      <StatTotals
        totals={totals}
        scope={`${data.from}:${data.to}`}
        stamp={stamp}
        columnsClassName="@2xl:grid-cols-3"
        uniqueVisitorsLabel={uniqueVisitorsLabel}
        uniqueVisitorsHint="Each link's unique visitors per day, added up. One person on two links or two days counts more than once."
      />
      <StatGrid items={items} />

      {empty ? (
        <AnalyticsEmpty days={days} historyStart={historyStart} />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2.5">
              <Label htmlFor="traffic-show-bots" className="font-normal text-muted-foreground">
                Show bot clicks
              </Label>
              <Switch id="traffic-show-bots" checked={showBots} onCheckedChange={setShowBots} />
            </div>
            <ClicksChart daily={daily} days={days} uniqueVisitorsLabel={uniqueVisitorsLabel} showBots={showBots} bucketed />
          </div>
          <TopLinks links={topLinks} days={days} />
          <div className="grid gap-4 @3xl:grid-cols-2">
            <QrScansList totals={totals} sources={breakdowns.sources} />
            <BreakdownList
              title="Referrers"
              dimension="referrers"
              entries={breakdowns.referrers}
              note="All links together. A link records its top 50 referrers a day; any others are counted under Other."
            />
            <BreakdownList title="Countries" dimension="countries" entries={breakdowns.countries} />
            <BreakdownList title="Devices" dimension="devices" entries={breakdowns.devices} />
            <BreakdownList title="Browsers" dimension="browsers" entries={breakdowns.browsers} />
            <BreakdownList title="Operating systems" dimension="operatingSystems" entries={breakdowns.operatingSystems} />
          </div>
        </>
      )}
    </>
  )
}

interface TopLinksProps {
  links: TrafficTopLink[]
  days: AnalyticsRange
}

function TopLinks({ links, days }: TopLinksProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Top links</h2>
      {links.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No clicks in this range.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <LinkIdentityHeads />
              <TableHead className="whitespace-nowrap text-right">Clicks</TableHead>
              <TableHead className="whitespace-nowrap text-right">Unique visitors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <LinkIdentityCells link={link} days={days} />
                <TableCell className="text-right tabular-nums">{link.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{link.uniqueVisitors.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
