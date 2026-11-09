import { DEFAULT_ANALYTICS_RANGE } from "./analytics"
import type { AnalyticsRange, AnalyticsTotals, CreatedVia, EmailStatus, ReviewResolution, ReviewSource, VisitKind } from "./types"

export type StatsTab = "traffic" | "links" | "users" | "safety" | "system"

export const statsTabLabels: Record<StatsTab, string> = {
  traffic: "Traffic",
  links: "Links",
  users: "Users",
  safety: "Safety",
  system: "System",
}

export const STATS_TABS: StatsTab[] = ["traffic", "links", "users", "safety", "system"]

export const DEFAULT_STATS_TAB: StatsTab = "traffic"

export const createdViaLabels: Record<CreatedVia | "unknown", string> = {
  WEB: "Website, signed in",
  API_KEY: "API key",
  BULK: "Bulk",
  MCP: "AI connector, signed in",
  ANONYMOUS_WEB: "Website, no account",
  ANONYMOUS_MCP: "AI connector, no account",
  unknown: "Unknown (made before this was recorded)",
}

export const visitKindLabels: Record<VisitKind, string> = {
  utm: "From a utm_source tag",
  referrer: "From the page before",
  direct: "No referrer or tag",
}

export type SignInProvider = "local" | "google" | "github"

export const providerLabels: Record<SignInProvider, string> = {
  local: "Email and password",
  google: "Google",
  github: "GitHub",
}

export const reviewSourceLabels: Record<ReviewSource, string> = {
  SYSTEM: "Flagged by the checks",
  VISITOR: "Reported by visitors",
}

export const resolutionLabels: Record<ReviewResolution, string> = {
  OK: "Looks fine",
  DOMAIN_TRUSTED: "Domain trusted",
  LINK_BLOCKED: "Link blocked",
  DOMAIN_BLOCKED: "Domain blocked",
  USER_BLOCKED: "User blocked",
  DESTINATION_CHANGED: "Destination changed",
}

export const emailStatusLabels: Record<EmailStatus, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SENDING: "Sending",
  RESENT: "Resent",
  SKIPPED: "Not sent",
}

export const redisPrefixLabels: Record<string, string> = {
  "blocklist:": "Blocklists",
  "rate-limit:": "Rate limits",
  "analytics:": "Visitor counting (daily keys)",
  "rdap:": "Domain age lookups",
  "dbl:": "Spamhaus lookups",
  "mcp:connect:": "AI connector sign-ins",
  "urls::": "Link cache",
}

export function parseStatsTab(value: string | null): StatsTab {
  return STATS_TABS.find((tab) => tab === value) ?? DEFAULT_STATS_TAB
}

export function adminStatsHref({ tab, days }: { tab?: StatsTab; days?: AnalyticsRange } = {}): string {
  const params = new URLSearchParams()
  if (tab != null && tab !== DEFAULT_STATS_TAB) params.set("tab", tab)
  if (days != null && days !== DEFAULT_ANALYTICS_RANGE) params.set("days", String(days))
  const query = params.toString()
  return query ? `/admin/dashboard?${query}` : "/admin/dashboard"
}

/** Bot clicks as a percentage (0 to 100) of all clicks, bots included; `null` when there were none. */
export function botShare(totals: AnalyticsTotals): number | null {
  const all = totals.clicks + totals.botClicks
  return all === 0 ? null : (totals.botClicks / all) * 100
}

const byteUnits = ["KB", "MB", "GB"]

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  let value = bytes / 1024
  let unit = 0
  while (unit < byteUnits.length - 1 && Number(value.toFixed(1)) >= 1024) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${byteUnits[unit]}`
}

const minutesPerHour = 60
const hoursPerDay = 24
const minutesPerDay = hoursPerDay * minutesPerHour

const oneDecimal = (value: number) => value.toFixed(1).replace(/\.0$/, "")

export function formatMinutes(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return "—"
  if (minutes < 1) return "< 1 min"
  if (minutes < minutesPerHour) return `${Math.floor(minutes)} min`
  if (minutes < 2 * minutesPerDay) return `${oneDecimal(minutes / minutesPerHour)} h`
  return `${oneDecimal(minutes / minutesPerDay)} days`
}

type DurationUnit = "day" | "hour" | "minute"

const shortDurationUnits: Record<DurationUnit, (amount: number) => string> = {
  day: (amount) => (amount === 1 ? "day" : "days"),
  hour: () => "h",
  minute: () => "min",
}

function durationParts(minutes: number): [number, DurationUnit][] {
  const wholeMinutes = Math.round(minutes)
  if (wholeMinutes < minutesPerHour) return [[wholeMinutes, "minute"]]
  if (wholeMinutes < minutesPerDay) {
    return [[Math.floor(wholeMinutes / minutesPerHour), "hour"], [wholeMinutes % minutesPerHour, "minute"]]
  }
  const hours = Math.round(wholeMinutes / minutesPerHour)
  return [[Math.floor(hours / hoursPerDay), "day"], [hours % hoursPerDay, "hour"]]
}

export function formatDuration(minutes: number): { shown: string; spoken: string } {
  if (!Number.isFinite(minutes) || minutes < 1) return { shown: "< 1 min", spoken: "less than a minute" }
  const parts = durationParts(minutes).filter(([amount], index) => index === 0 || amount > 0)
  return {
    shown: parts.map(([amount, unit]) => `${amount} ${shortDurationUnits[unit](amount)}`).join(" "),
    spoken: parts.map(([amount, unit]) => `${amount} ${unit}${amount === 1 ? "" : "s"}`).join(" "),
  }
}

export type BucketSize = "day" | "week" | "month"

export interface BucketMeta {
  date: string
  bucketLabel: string
  tickLabel: string
  partial: boolean
}

export function bucketSizeFor(days: AnalyticsRange): BucketSize {
  if (days === 365) return "month"
  if (days === 90) return "week"
  return "day"
}

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const localDay = (date: string) => new Date(`${date}T00:00:00`)

const monthDay = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" })

function bucketStart(date: string, size: BucketSize): string {
  if (size === "day") return date
  const day = localDay(date)
  if (size === "month") return isoDay(new Date(day.getFullYear(), day.getMonth(), 1))
  return isoDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7)))
}

function bucketName(start: string, size: BucketSize): string {
  const day = localDay(start)
  if (size === "month") return day.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  if (size === "week") return `Week of ${monthDay(day)}`
  return day.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function tickName(start: string, size: BucketSize): string {
  const day = localDay(start)
  if (size !== "month") return monthDay(day)
  return day.getMonth() === 0
    ? day.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : day.toLocaleDateString(undefined, { month: "short" })
}

/**
 * Daily rows summed into days, weeks (from Monday) or months. The last row is today, so its bucket is
 * marked partial and labelled "so far"; a first week or month that starts before the range is marked
 * partial too and labelled with the range's first day.
 */
export function bucketRows<Row extends { date: string }>(rows: Row[], size: BucketSize): (Row & BucketMeta)[] {
  const buckets: (Row & BucketMeta)[] = []
  rows.forEach((row) => {
    const start = bucketStart(row.date, size)
    const current = buckets[buckets.length - 1]
    if (current && current.date === start) {
      const sums = current as unknown as Record<string, number>
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "number") sums[key] = (sums[key] ?? 0) + value
      }
      return
    }
    buckets.push({ ...row, date: start, bucketLabel: bucketName(start, size), tickLabel: tickName(start, size), partial: false })
  })
  const first = buckets[0]
  if (first && rows.length > 0 && first.date !== rows[0].date) {
    first.partial = true
    first.bucketLabel = `${first.bucketLabel} (from ${monthDay(localDay(rows[0].date))})`
  }
  const last = buckets[buckets.length - 1]
  if (last) {
    last.partial = true
    last.bucketLabel = `${last.bucketLabel} (${size === "day" ? "today so far" : "so far"})`
  }
  return buckets
}

/**
 * The ticks for bucketed rows: every day up to a week, every seventh day back from today for a month,
 * every week, and every other month counted from January, so the one label with a year always shows.
 */
export function bucketTicks(dates: string[], size: BucketSize): string[] {
  if (size === "month") return dates.filter((date) => localDay(date).getMonth() % 2 === 0)
  if (size === "week" || dates.length <= 7) return dates
  return dates.filter((_, index) => (dates.length - 1 - index) % 7 === 0)
}
