"use client"

import { actionLabels, actionVariants } from "@/components/admin/blocklists/labels"
import { RankedList } from "@/components/admin/stats/ranked-list"
import { StackedDailyChart, inFillOrder, type StackDetail, type StackFill, type StackStep } from "@/components/admin/stats/stacked-daily-chart"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBytes, formatMinutes, resolutionLabels, reviewSourceLabels } from "@/lib/admin-stats"
import { parseServerDateTime } from "@/lib/analytics"
import { useSafetyStats } from "@/lib/hooks/useSiteStats"
import { blockReasonLabels } from "@/lib/labels"
import type { AnalyticsRange, BlockReason, SafetyStats, SourceHealth, StackedSeries } from "@/lib/types"
import { formatDateTime, formatTimeAgo, plural } from "@/lib/utils"

const reasonOrder: (BlockReason | "unknown")[] = ["SAFE_BROWSING", "BLOCKLIST", "SCAM_SIGNALS", "DNS_FILTERS", "CAMPAIGN", "SIGN_IN_FORM", "DOMAIN_RULE", "ADMIN", "USER_BLOCKED", "unknown"]

const OTHER_REASONS = "other-reasons"

const topReasonSteps: StackStep[] = [100, 55, 25]

const blockedLabels: Record<string, string> = { ...blockReasonLabels, unknown: "Unknown", [OTHER_REASONS]: "Other reasons" }

interface GroupedBlocked {
  series: StackedSeries
  fills: Record<string, StackFill>
  detail: StackDetail
}

/** The three reasons with the most blocked links in the range get their own step; the rest stack as one muted "Other reasons". */
function groupBlocked(blocked: StackedSeries): GroupedBlocked {
  const rank = (key: string) => {
    const index = reasonOrder.indexOf(key as BlockReason)
    return index === -1 ? reasonOrder.length : index
  }
  const keys = [...blocked.keys].sort((a, b) => rank(a) - rank(b))
  const total = (key: string) => blocked.daily.reduce((sum, day) => sum + (day.counts[key] ?? 0), 0)
  const top = keys
    .filter((key) => key !== "unknown" && total(key) > 0)
    .sort((a, b) => total(b) - total(a) || rank(a) - rank(b))
    .slice(0, topReasonSteps.length)
  const rest = keys.filter((key) => !top.includes(key))
  const showOther = rest.some((key) => total(key) > 0)
  const daily = blocked.daily.map((day) => {
    const counts: Record<string, number> = {}
    top.forEach((key) => {
      counts[key] = day.counts[key] ?? 0
    })
    if (showOther) counts[OTHER_REASONS] = rest.reduce((sum, key) => sum + (day.counts[key] ?? 0), 0)
    return { date: day.date, counts }
  })
  return {
    series: { keys: showOther ? [...top, OTHER_REASONS] : top, daily },
    fills: Object.fromEntries(top.map((key, index) => [key, { step: topReasonSteps[index] }])),
    detail: { series: { keys, daily: blocked.daily }, labels: blockedLabels },
  }
}

const resolvedLabels: Record<string, string> = { ...resolutionLabels, unknown: "Unknown" }

interface SafetyTabProps {
  days: AnalyticsRange
}

export function SafetyTab({ days }: SafetyTabProps) {
  const query = useSafetyStats(days)
  return <StatsPanel query={query}>{(data) => <SafetyBody data={data} days={data.days} />}</StatsPanel>
}

interface SafetyBodyProps {
  data: SafetyStats
  days: AnalyticsRange
}

function SafetyBody({ data, days }: SafetyBodyProps) {
  const { resolveTimes, domainRules } = data
  const blocked = groupBlocked(data.blocked)

  return (
    <>
      <StackedDailyChart
        title="Reviews opened"
        hint="An entry the checks also flagged counts as flagged."
        series={data.reviewsOpened}
        labels={reviewSourceLabels}
        days={days}
      />
      <StatGrid
        items={[
          { label: "Open reviews", value: data.openReviews.toLocaleString(), href: "/admin/review" },
          { label: "Of which visitor reports", value: data.openVisitorReports.toLocaleString() },
          {
            label: "Possible scammers",
            value: data.possibleScammers.toLocaleString(),
            hint: "Signals only; nothing is blocked automatically.",
          },
        ]}
      />
      <RankedList
        title="Resolved in this range"
        valueLabel="Reviews"
        entries={data.resolved}
        label={(value) => resolvedLabels[value] ?? value}
        emptyText="No reviews resolved in this range."
      />
      <StatGrid
        title="Time to resolve"
        hint={resolveTimes.count === 0 ? "No reviews resolved in this range." : `From flag to decision, for the ${plural(resolveTimes.count, "review")} resolved in this range.`}
        items={[
          { label: "Median", value: formatMinutes(resolveTimes.medianMinutes) },
          { label: "90th percentile", value: formatMinutes(resolveTimes.p90Minutes) },
        ]}
      />
      <StackedDailyChart
        title="Links blocked"
        hint="Links that are still blocked, by the day they were blocked. The three most common reasons in this range have their own shade."
        series={inFillOrder(blocked.series, blocked.fills)}
        labels={blockedLabels}
        fills={blocked.fills}
        detail={blocked.detail}
        days={days}
      />
      <StatGrid
        title="Domain rules"
        items={[
          { label: "Blocked domains", value: domainRules.block.toLocaleString() },
          { label: "Trusted domains", value: domainRules.allow.toLocaleString() },
        ]}
      />
      <Blocklists sources={data.sources} />
    </>
  )
}

function Blocklists({ sources }: { sources: SourceHealth[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Blocklists</h2>
      {sources.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No blocklists yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>On</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="text-right">Memory</TableHead>
              <TableHead className="whitespace-nowrap">Last loaded</TableHead>
              <TableHead className="whitespace-nowrap">Last error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const loaded = source.lastSuccessAt ? parseServerDateTime(source.lastSuccessAt) : null
              return (
                <TableRow key={source.id}>
                  <TableCell>
                    <span className="block min-w-32 font-medium [overflow-wrap:anywhere]">{source.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariants[source.action] ?? "secondary"}>{actionLabels[source.action] ?? source.action}</Badge>
                  </TableCell>
                  <TableCell className={source.enabled ? undefined : "text-muted-foreground"}>{source.enabled ? "Yes" : "No"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{source.domainCount?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatBytes(source.memoryBytes)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {loaded ? (
                      <span className="block min-w-40">
                        <span className="whitespace-nowrap">{formatTimeAgo(loaded)}</span> ·{" "}
                        <span className="whitespace-nowrap">{formatDateTime(loaded)}</span>
                      </span>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell>
                    {source.lastError ? (
                      <span className="block min-w-48 text-destructive [overflow-wrap:anywhere]">{source.lastError}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
