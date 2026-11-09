import { parseServerDateTime } from "./analytics"
import type { SwitchableMethod } from "./sign-in-methods"
import type { AbuseNoContact, AbuseReport, Campaign, DomainBlockPreview, DomainBulkBlockResult, DomainSkipped, PublicSettings, ReportStatus, SettingGroup, SettingResponse } from "./types"

export const ANONYMOUS_PAUSED = "Making links without an account is paused."

export const SIGNUPS_PAUSED = "Creating new accounts is paused."

export const ALIASES_PAUSED = "Custom aliases are turned off right now."

export const ANONYMOUS_REFUSED = "Sign in to create short URLs"

export const HUMAN_CHECK_REQUIRED = "Complete the check and try again."

export const HUMAN_CHECK_UNCONFIRMED = "The check couldn't confirm you're a person. Try again, or sign in."

export const NOT_AVAILABLE = "Not available"

export type PublicSwitch = "anonymousLinks" | "customAliases" | "humanCheck"

export function refusedSwitch(message: string | undefined): PublicSwitch | null {
  if (message === ANONYMOUS_REFUSED) return "anonymousLinks"
  if (message === ALIASES_PAUSED) return "customAliases"
  if (message === HUMAN_CHECK_REQUIRED) return "humanCheck"
  return null
}

export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

export const HUMAN_CHECK_WAIT_MS = 5000

export function humanCheckEnabled(settings: PublicSettings | undefined, signedIn: boolean, authLoading: boolean): boolean {
  if (authLoading || signedIn || settings === undefined || settings.anonymousLinks === false) return false
  return settings.humanCheck === true && Boolean(settings.turnstileSiteKey?.trim())
}

export const TURNSTILE_TOKEN_MAX_AGE_MS = 290_000

export const TICK_THE_BOX = "Tick the box above to continue."

export interface TurnstileState {
  token: string | null
  receivedAt: number | null
  interactive: boolean
  boxShown: boolean
}

export type TurnstileEvent =
  | { type: "token"; token: string; at: number }
  | { type: "interactive" }
  | { type: "settled" }
  | { type: "expired" }
  | { type: "error" }
  | { type: "submitted" }

export const NO_TURNSTILE_TOKEN: TurnstileState = { token: null, receivedAt: null, interactive: false, boxShown: false }

export function nextTurnstileState(state: TurnstileState, event: TurnstileEvent): TurnstileState {
  if (event.type === "token") return { token: event.token, receivedAt: event.at, interactive: false, boxShown: state.boxShown }
  if (event.type === "interactive") return { ...state, interactive: true, boxShown: true }
  if (event.type === "settled") return { ...state, interactive: false }
  if (event.type === "submitted") return NO_TURNSTILE_TOKEN
  return { ...NO_TURNSTILE_TOKEN, boxShown: state.boxShown }
}

export type HumanCheckRefusal = "complete" | "unconfirmed"

export function humanCheckRefusal(state: TurnstileState, checkRan: boolean): HumanCheckRefusal {
  return checkRan && !state.boxShown ? "unconfirmed" : "complete"
}

export function freshTurnstileToken(state: TurnstileState, now: number): string | null {
  if (state.token === null || state.receivedAt === null) return null
  return now - state.receivedAt < TURNSTILE_TOKEN_MAX_AGE_MS ? state.token : null
}

export function turnstileNeedsReload(widgetRendered: boolean, loadFailed: boolean): boolean {
  return loadFailed && !widgetRendered
}

export function noEffectText(parentLabel: string): string {
  return `Has no effect while ${parentLabel} is off.`
}

export function anonymousLinksPaused(settings: PublicSettings | undefined, signedIn: boolean, authLoading: boolean): boolean {
  return !authLoading && !signedIn && settings?.anonymousLinks === false
}

export function signupsPaused(settings: PublicSettings | undefined): boolean {
  return settings?.newSignups === false
}

export function aliasFieldShown(settings: PublicSettings | undefined, domain: string | null): boolean {
  return settings?.customAliases !== false || domain !== null
}

export function anonymousLimitLine(expiryDays: number | null, visitLimit: number | null): string | null {
  const limits = [expiryDays === null ? null : countOf(expiryDays, "day"), visitLimit === null ? null : countOf(visitLimit, "visit")].filter(
    (limit): limit is string => limit !== null,
  )
  if (limits.length === 0) return null
  return `Links made without an account stop working after ${limits.join(" or ")}${limits.length === 2 ? ", whichever comes first" : ""}.`
}

export function linkEndsText(expirationDate: string | undefined, visitLimit: number): string | null {
  const ends: string[] = []
  if (expirationDate) {
    const date = parseServerDateTime(expirationDate)
    ends.push(`on ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`)
  }
  if (visitLimit > 0) ends.push(`after ${countOf(visitLimit, "visit")}`)
  if (ends.length === 0) return null
  return `This link stops working ${ends.join(" or ")}${ends.length === 2 ? ", whichever comes first" : ""}.`
}

export const WARNING_PAGE_NOTE = "People who open this link see its address first, because the site is new or its name looks machine-made."

export const WARNING_PAGE_REVIEW_NOTE = "This link is being checked. People who open it see its address first until the check is done."

export const warningPageNote = (warningPageForReview: boolean | null | undefined): string =>
  warningPageForReview === true ? WARNING_PAGE_REVIEW_NOTE : WARNING_PAGE_NOTE

export function anonymousLimitLineShown(settings: PublicSettings | undefined, signedIn: boolean, authLoading: boolean): string | null {
  if (authLoading || signedIn || settings === undefined || settings.anonymousLinks === false) return null
  return anonymousLimitLine(settings.anonymousExpiryDays ?? null, settings.anonymousVisitLimit ?? null)
}

const PROVIDER_NAMES: Record<SwitchableMethod, string> = { GOOGLE: "Google", GITHUB: "GitHub" }

const PROVIDER_FIELDS = { GOOGLE: "googleSignIn", GITHUB: "githubSignIn" } as const

export const PROVIDER_ORDER: readonly SwitchableMethod[] = ["GOOGLE", "GITHUB"]

export function providerShown(settings: PublicSettings | undefined, provider: SwitchableMethod): boolean {
  return settings?.[PROVIDER_FIELDS[provider]] !== false
}

export function providersOff(settings: PublicSettings | undefined): SwitchableMethod[] {
  return PROVIDER_ORDER.filter((provider) => !providerShown(settings, provider))
}

export function providerButtonsLayout(settings: PublicSettings | undefined): { shown: SwitchableMethod[]; columns: 1 | 2; divider: boolean } {
  const shown = PROVIDER_ORDER.filter((provider) => providerShown(settings, provider))
  return { shown, columns: shown.length === 1 ? 1 : 2, divider: shown.length > 0 }
}

export function providersOffText(off: readonly SwitchableMethod[]): string | null {
  if (off.length === 0) return null
  const names = off.map((provider) => PROVIDER_NAMES[provider])
  const start = names.length === 1 ? `Sign in with ${names[0]} is` : `Signing in with ${names.join(" and ")} is`
  return `${start} turned off right now.`
}

export const FORGOT_PASSWORD_HINT = "No password yet? Use Forgot password to set one."

export function providerDisabledText(provider: SwitchableMethod | null): string {
  return `${provider ? PROVIDER_NAMES[provider] : "That"} sign-in is turned off on hrva.cc right now. Sign in with your password or a passkey. ${FORGOT_PASSWORD_HINT}`
}

export const FORGOT_PASSWORD_LABEL = "Forgot password"

export function providerDisabledHeading(provider: SwitchableMethod | null): string {
  return `${provider ? PROVIDER_NAMES[provider] : "That"} sign-in is off`
}

export const SITE_OFF_TEXT = "Turned off on hrva.cc right now."

export function providerOffSiteWide(settings: PublicSettings | undefined, method: string): boolean {
  return (method === "GOOGLE" || method === "GITHUB") && !providerShown(settings, method)
}

export const SETTING_GROUP_LABELS: Record<SettingGroup, string> = {
  ACCESS: "Access",
  LINKS: "Links",
  SAFETY: "Safety",
  ALERTS: "Alerts",
  DIGEST: "Digest",
  EMAILS: "Emails",
  ABUSE_REPORTS: "Abuse reports",
  APP_DIRECTORIES: "App directories",
}

const NONE = "None"

export interface SettingRowView {
  setting: SettingResponse
  indented: boolean
  offParent: string | null
}

export interface SettingGroupView {
  group: SettingGroup
  rows: SettingRowView[]
}

function matchesSearch(setting: SettingResponse, words: string[]): boolean {
  const text = `${setting.label} ${setting.description}`.toLowerCase()
  return words.every((word) => text.includes(word))
}

function offParent(setting: SettingResponse, byKey: Map<string, SettingResponse>): SettingResponse | undefined {
  const seen = new Set<string>()
  let parent = setting.parent ? byKey.get(setting.parent) : undefined
  while (parent && !seen.has(parent.key)) {
    if (parent.type === "SWITCH" && parent.value === false) return parent
    seen.add(parent.key)
    parent = parent.parent ? byKey.get(parent.parent) : undefined
  }
  return undefined
}

export function groupSettings(settings: SettingResponse[], search: string): SettingGroupView[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  const shown = settings.filter((setting) => matchesSearch(setting, words))
  return (Object.keys(SETTING_GROUP_LABELS) as SettingGroup[])
    .map((group) => {
      const inGroup = shown.filter((setting) => setting.group === group)
      const keys = new Set(inGroup.map((setting) => setting.key))
      const rows: SettingRowView[] = []
      const add = (setting: SettingResponse, indented: boolean) => {
        rows.push({ setting, indented, offParent: offParent(setting, byKey)?.label ?? null })
        for (const child of inGroup.filter((entry) => entry.parent === setting.key)) add(child, true)
      }
      for (const setting of inGroup.filter((entry) => !entry.parent || !keys.has(entry.parent))) add(setting, false)
      return { group, rows }
    })
    .filter((entry) => entry.rows.length > 0)
}

export function switchUnavailable(setting: SettingResponse): boolean {
  return setting.type === "SWITCH" && !setting.available
}

export function switchChecked(setting: SettingResponse): boolean {
  return setting.value === true && !switchUnavailable(setting)
}

export function safetyOffLines(settings: SettingResponse[]): string[] {
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  return settings
    .filter((setting) => setting.safety && setting.type === "SWITCH" && setting.value === false && !offParent(setting, byKey))
    .map((setting) => `${setting.label} is off.`)
}

function numberText(setting: SettingResponse, value: number): string {
  const number = value.toLocaleString("en-US")
  const unit = setting.unit
  if (!unit) return number
  if (unit === "%") return `${number}%`
  return `${number} ${value === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit}`
}

export function settingValueText(setting: SettingResponse, value: SettingResponse["value"]): string {
  if (typeof value === "boolean") return value ? "On" : "Off"
  if (typeof value === "number") return numberText(setting, value)
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : NONE
  if (typeof value === "string") return value || NONE
  return setting.noneLabel ?? NONE
}

const DAY_MS = 24 * 60 * 60 * 1000

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const countOf = (count: number, word: string) => `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`

const utcDay = (date: Date) => Math.floor(date.getTime() / DAY_MS)

export function reportStatusText(status: ReportStatus | null, now: Date): string {
  if (!status) return "Not reported"
  if (status.suspendedAt) {
    const suspended = parseServerDateTime(status.suspendedAt)
    return `Suspended on ${MONTH_NAMES[suspended.getUTCMonth()]} ${suspended.getUTCDate()}, ${suspended.getUTCFullYear()}`
  }
  const days = Math.max(0, utcDay(now) - utcDay(parseServerDateTime(status.reportedAt)))
  return days === 0 ? "Reported today, not suspended yet" : `Reported ${countOf(days, "day")} ago, not suspended yet`
}

export const BULK_BLOCK_BATCH = 100

export function inBatches<T>(items: T[], size = BULK_BLOCK_BATCH): T[][] {
  const batches: T[][] = []
  for (let start = 0; start < items.length; start += size) batches.push(items.slice(start, start + size))
  return batches
}

export interface BulkBlockTotals {
  blocked: number
  skipped: DomainSkipped[]
  linksDeactivated: number
  heldLinksConverted: number
}

export const NO_BULK_BLOCKS: BulkBlockTotals = { blocked: 0, skipped: [], linksDeactivated: 0, heldLinksConverted: 0 }

export function addBulkBlock(totals: BulkBlockTotals, result: DomainBulkBlockResult): BulkBlockTotals {
  return {
    blocked: totals.blocked + result.blocked.length,
    skipped: [...totals.skipped, ...result.skipped],
    linksDeactivated: totals.linksDeactivated + result.linksDeactivated,
    heldLinksConverted: totals.heldLinksConverted + (result.heldLinksConverted ?? 0),
  }
}

export function blockSummaryText({ blocked, linksDeactivated, heldLinksConverted }: BulkBlockTotals): string {
  const summary = `Blocked ${countOf(blocked, "domain")}, ${countOf(linksDeactivated, "link")} turned off`
  return heldLinksConverted > 0 ? `${summary}, ${countOf(heldLinksConverted, "held link")} kept off` : summary
}

export const RETRYABLE_BLOCK_STATUSES: readonly number[] = [0, 503]

export type HoldState = "holding" | "off" | "ended"

export function campaignHoldState(
  { status, holding, holdingOff, activeUntil }: Pick<Campaign, "status" | "holding" | "holdingOff" | "activeUntil">,
  now: Date,
): HoldState | null {
  if (status !== "HOLDING") return null
  if (holdingOff === "switch") return "off"
  if (holding) return "holding"
  if (holdingOff === undefined && (!activeUntil || parseServerDateTime(activeUntil) > now)) return "off"
  return "ended"
}

export function campaignStatusLabel(campaign: Pick<Campaign, "status" | "holding" | "holdingOff" | "activeUntil">, now: Date): string {
  if (campaign.status === "ALLOWED") return "Allowed"
  if (campaign.status === "ALERT_ONLY") return "Alert only"
  const state = campaignHoldState(campaign, now)
  return state === "holding" ? "Holding" : state === "off" ? "Not holding" : "Hold ended"
}

export const HELD_LINKS_STAY_OFF = "Held links stay off until you allow the shape."

export function heldLinksStayOffText(state: HoldState | null, heldLinks: number): string | null {
  return (state === "off" || state === "ended") && heldLinks > 0 ? HELD_LINKS_STAY_OFF : null
}

const HOLD_OFF_FALLBACK = "Same-shape alert or Hold links with a campaign URL shape is off"

export function holdOffReason(settings: SettingResponse[] | undefined): string {
  const off = (key: string) => settings?.find((setting) => setting.key === key && setting.value === false)
  const setting = off("SAME_SHAPE_ALERT") ?? off("CAMPAIGN_HOLD")
  return setting ? `${setting.label} is off` : HOLD_OFF_FALLBACK
}

export function campaignRuleText(settings: SettingResponse[] | undefined): string | null {
  const number = (key: string) => {
    const value = settings?.find((setting) => setting.key === key)?.value
    return typeof value === "number" ? value : null
  }
  const links = number("CAMPAIGN_LINKS")
  const domains = number("CAMPAIGN_DOMAINS")
  const hours = number("CAMPAIGN_WINDOW_HOURS")
  if (links === null || domains === null || hours === null) return null
  return `One appears when ${countOf(links, "link")} without an account share a URL shape on ${countOf(domains, "domain")} within ${countOf(hours, "hour")}.`
}

export function campaignCountsText({ links, domains, clicks }: Pick<Campaign, "links" | "domains" | "clicks">): string {
  return `${countOf(links.total, "link")} (${links.active.toLocaleString("en-US")} active, ${links.held.toLocaleString("en-US")} held, ${links.blocked.toLocaleString("en-US")} blocked), ${countOf(domains, "domain")}, ${countOf(clicks, "click")}`
}

export function campaignReportsText({ domains, reports }: Pick<Campaign, "domains" | "reports">): string {
  return `${reports.reported.toLocaleString("en-US")} of ${countOf(domains, "domain")} reported, ${reports.suspended.toLocaleString("en-US")} suspended`
}

export const MAILTO_MAX_LENGTH = 2000

export function mailtoHref({ to, cc, subject, body }: Pick<AbuseReport, "to" | "cc" | "subject" | "body">): string | null {
  try {
    const fields = [
      ...(cc.length > 0 ? [`cc=${cc.map(encodeURIComponent).join(",")}`] : []),
      `subject=${encodeURIComponent(subject)}`,
      `body=${encodeURIComponent(body.replace(/\r?\n/g, "\r\n"))}`,
    ]
    const href = `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}?${fields.join("&")}`
    return href.length > MAILTO_MAX_LENGTH ? null : href
  } catch {
    return null
  }
}

export function markedStatus(existing: ReportStatus | null, registrar: string, now: Date): ReportStatus {
  return { reportedAt: now.toISOString(), reportedBy: existing?.reportedBy ?? "", registrar, suspendedAt: existing?.suspendedAt ?? null }
}

export function markedText(count: number): string {
  return `Marked ${countOf(count, "domain")} as reported`
}

export const LOOKUP_FAILED = "Lookup failed. Try again."

export type ReportCopyField = "to" | "cc" | "subject" | "body" | "all"

export function copyMarksReported(field: ReportCopyField): boolean {
  return field === "body" || field === "all"
}

export function reportAsText({ to, cc, subject, body }: Pick<AbuseReport, "to" | "cc" | "subject" | "body">): string {
  return [`To: ${to}`, ...(cc.length > 0 ? [`Cc: ${cc.join(", ")}`] : []), `Subject: ${subject}`, "", body].join("\n")
}

export function noContactText({ domain, registrar, lookupFailed, reason }: Pick<AbuseNoContact, "domain" | "registrar" | "lookupFailed" | "reason">): string {
  if (lookupFailed || reason === "lookupFailed") return LOOKUP_FAILED
  if (reason === "sharedSuffix") return "Shared hosting domain: report it to the hosting provider"
  if (reason === "notRegistered") return "The registry has no record of this domain"
  if (reason === "noRegistry") return `No registry lookup for .${domain.slice(domain.lastIndexOf(".") + 1)}`
  return `No abuse email in the registry record${registrar ? `. Registrar: ${registrar}` : ""}`
}

export function blockTotalsText(rows: DomainBlockPreview[]): string {
  const held = rows.reduce((sum, row) => sum + row.heldLinks, 0)
  const active = rows.reduce((sum, row) => sum + row.activeLinks, 0)
  return `${countOf(rows.length, "domain")}, ${countOf(held, "held link")}, ${countOf(active, "active link")} on the site`
}

export type ReviewBadgeCounts = { links: number; bioPages: number; domains: number; domainRequests: number; total: number }

export function reviewBadgeCounts(results: PromiseSettledResult<{ totalElements: number }>[]): ReviewBadgeCounts {
  if (results.every((result) => result.status === "rejected")) throw (results[0] as PromiseRejectedResult).reason
  const [links, bioPages, domains, domainRequests] = [0, 1, 2, 3].map((index) => {
    const result = results[index]
    return result?.status === "fulfilled" ? result.value.totalElements : 0
  })
  return { links, bioPages, domains, domainRequests, total: links + bioPages + domains + domainRequests }
}
