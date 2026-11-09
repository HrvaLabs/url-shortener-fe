import type { CloudflareCheck, CloudflareTokenStatus, CustomDomain, CustomDomainStatus, DomainAllowance, DomainLinkMode, DomainProblem, DomainRef, DomainRemoval, DomainRequest, DomainRequestStatus, DomainSteps, MyDomains } from "./types"

export const HOSTNAME_PLACEHOLDER = "go.example.com"

export const REASON_MAX = 300

export const DOMAIN_STATUS_LABELS: Record<CustomDomainStatus, string> = {
  PENDING_REVIEW: "Waiting for review",
  APPROVED_PROVISIONING: "Approved, setting up",
  AWAITING_DNS: "Waiting for your DNS record",
  ACTIVE: "Active",
  REJECTED: "Not approved",
  DISABLED: "Turned off",
  ERROR: "Needs attention",
  DELETED: "Removed",
}

export const DOMAIN_STATUS_HINTS: Record<CustomDomainStatus, string> = {
  PENDING_REVIEW: "We'll email you when it's reviewed, usually within a day or two.",
  APPROVED_PROVISIONING: "Approved. We're getting your domain ready; this takes a minute.",
  AWAITING_DNS: "Add the CNAME record below. We check every minute at first, then less often, and finish on our own.",
  ACTIVE: "Ready. Pick this domain when you shorten a link.",
  REJECTED: "This application wasn't approved.",
  DISABLED: "This domain is turned off. Its links don't open.",
  ERROR: "Something needs your attention. See below.",
  DELETED: "This domain was removed.",
}

export const DOMAIN_STEP_LABELS: Record<keyof DomainSteps, string> = {
  dnsFound: "DNS record found",
  certificateIssued: "Certificate issued",
}

export const LINK_MODE_LABELS: Record<DomainLinkMode, string> = {
  MOVE: "Move its links to hrva.cc",
  DEACTIVATE: "Turn its links off",
}

export const LINK_MODE_HINTS: Record<DomainLinkMode, string> = {
  MOVE: "Links keep their alias when it's free and allowed on hrva.cc and get a new one otherwise.",
  DEACTIVATE: "Links stay in your list, turned off.",
}

export const TOKEN_STATUS_LABELS: Record<CloudflareTokenStatus, string> = {
  OK: "OK",
  MISSING: "Missing",
  INVALID: "Invalid",
  NO_PERMISSION: "No permission",
  UNREACHABLE: "Unreachable",
}

export const shortHost = (domain: DomainRef | null | undefined, primaryHost: string): string => domain?.hostname || primaryHost

export const canPickDomain = (domains: CustomDomain[]): boolean => domains.some((domain) => domain.status === "ACTIVE")

export const pickableHostnames = (domains: CustomDomain[], picked: string | null): string[] => {
  const active = domains.filter((domain) => domain.status === "ACTIVE").map((domain) => domain.hostname)
  return picked && !active.includes(picked) ? [...active, picked] : active
}

const HOSTNAME_SHAPE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

export const isHostnameShaped = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.length <= 253 && HOSTNAME_SHAPE.test(value.toLowerCase())

export const PROVISIONING_FAILED_TEXT = "Setting up your domain hit a problem. We'll keep trying, or try again now."

export const PROVISIONING_GAVE_UP_TEXT = "Setting up your domain failed. Try again now, or remove it."

export const DOMAIN_PROBLEM_FOLLOW_UPS: Record<Exclude<DomainProblem, "PROVISIONING_FAILED">, string> = {
  DNS_NOT_FOUND: "We keep checking on our own, or use Check now.",
  CAA_BLOCKED: "We check again on our own, or use Check now once it's fixed.",
  CERTIFICATE_TIMED_OUT: "We check again on our own, or use Check now once it's fixed.",
  CNAME_REMOVED: "We check again on our own, or use Check now once it's fixed.",
  CLOUDFLARE_BLOCKED: "We check again on our own. You don't need to do anything.",
  DNS_TIMED_OUT: "We don't check on our own any more. Use Check now to look again.",
}

export interface DomainProblemLines {
  text: string | null
  followUp: string | null
  retry: boolean
}

export const domainProblemLines = (domain: CustomDomain): DomainProblemLines | null => {
  if (!domain.problem) return null
  if (domain.problem === "PROVISIONING_FAILED") {
    return { text: domain.status === "ERROR" ? PROVISIONING_GAVE_UP_TEXT : PROVISIONING_FAILED_TEXT, followUp: null, retry: true }
  }
  return { text: domain.problemText, followUp: DOMAIN_PROBLEM_FOLLOW_UPS[domain.problem], retry: false }
}

const WAITING_FOR_SETUP: ReadonlySet<CustomDomainStatus> = new Set(["APPROVED_PROVISIONING", "AWAITING_DNS", "ERROR"])

export const isWaitingForSetup = (status: CustomDomainStatus): boolean => WAITING_FOR_SETUP.has(status)

export type DomainApplyState = "form" | "limit" | "off"

export const domainApplyState = ({ canApply, used, limit }: MyDomains): DomainApplyState =>
  canApply ? "form" : used >= limit ? "limit" : "off"

const countOf = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

export const domainLimitLine = (limit: number): string =>
  `You can have ${countOf(limit, "custom domain")}. Remove or withdraw one to apply for another.`

export const domainRemovalSummary = ({ moved, renamed, deactivated }: DomainRemoval): string | null => {
  if (moved > 0) return `${countOf(moved, "link")} moved, ${renamed.length} with a new alias.`
  if (deactivated > 0) return `${countOf(deactivated, "link")} turned off.`
  return null
}

export const splitRemovedDomains = (domains: CustomDomain[]): { live: CustomDomain[]; removed: CustomDomain[] } => ({
  live: domains.filter((domain) => domain.status !== "DELETED"),
  removed: domains.filter((domain) => domain.status === "DELETED"),
})

export const removedDomainsLabel = (count?: number): string => (count === undefined ? "Removed domains" : `Removed domains (${count})`)

export const REMOVED_PARAM_PREFIX = "removed"

export const hasRemovedDomainsParam = (names: Iterable<string>): boolean =>
  Array.from(names).some((name) => name.startsWith(REMOVED_PARAM_PREFIX) && /^[A-Z]/.test(name.slice(REMOVED_PARAM_PREFIX.length)))

export const USE_AGAIN_LABEL = "Use again"

export const USE_AGAIN_HINTS = {
  SKIPS_REVIEW: "You removed this domain yourself, so it's set up again without a review, unless a check flags it or there's no room for new domains right now.",
  NEEDS_REVIEW: "It's reviewed again before it's set up.",
} as const

export const USE_AGAIN_PENDING_LINE = "Still being removed from Cloudflare. Use again becomes available in a few minutes."

export interface UseAgainLines {
  button: boolean
  line: string | null
}

export const useAgainLines = ({ useAgain }: Pick<CustomDomain, "useAgain">): UseAgainLines => {
  if (useAgain === "SKIPS_REVIEW" || useAgain === "NEEDS_REVIEW") return { button: true, line: USE_AGAIN_HINTS[useAgain] }
  if (useAgain === "CLOUDFLARE_REMOVAL_PENDING") return { button: false, line: USE_AGAIN_PENDING_LINE }
  return { button: false, line: null }
}

export const DOMAIN_STATUSES = Object.keys(DOMAIN_STATUS_LABELS) as CustomDomainStatus[]

export const ADMIN_FILTER_STATUSES = DOMAIN_STATUSES.filter((status) => status !== "DELETED")

export const isDomainStatus = (value: string | null | undefined): value is CustomDomainStatus =>
  typeof value === "string" && (ADMIN_FILTER_STATUSES as string[]).includes(value)

export const ADMIN_LINK_MODE_HINTS: Record<DomainLinkMode, string> = {
  MOVE: "Links keep their alias when it's free and allowed on hrva.cc and get a new one otherwise.",
  DEACTIVATE: "Links stay in the owner's list, turned off.",
}

export const RECHECKED_PROBLEMS: ReadonlySet<DomainProblem> = new Set(["CERTIFICATE_TIMED_OUT", "CNAME_REMOVED", "CAA_BLOCKED", "CLOUDFLARE_BLOCKED"])

const TURNS_OFF: ReadonlySet<CustomDomainStatus> = new Set(["APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "ERROR"])

const REMOVABLE: ReadonlySet<CustomDomainStatus> = new Set(["APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "DISABLED", "ERROR"])

export const canTurnOff = (status: CustomDomainStatus): boolean => TURNS_OFF.has(status)

export const canRemoveDomain = (status: CustomDomainStatus): boolean => REMOVABLE.has(status)

export const canAdminRetry = ({ status, problem }: Pick<CustomDomain, "status" | "problem">): boolean =>
  status === "ERROR" || status === "AWAITING_DNS" || (status === "APPROVED_PROVISIONING" && problem === "PROVISIONING_FAILED")

export const ADMIN_RECHECK_HINTS = {
  rechecked: "Checked again every hour on its own.",
  stopped: "No longer checked on its own. Use Retry.",
  retrying: "Retried on its own for 24 hours. Retry now to try again right away.",
} as const

export const adminRecheckHint = ({ status, problem }: Pick<CustomDomain, "status" | "problem">): string | null => {
  if (!problem) return null
  if (status === "APPROVED_PROVISIONING" && problem === "PROVISIONING_FAILED") return ADMIN_RECHECK_HINTS.retrying
  if (status !== "ERROR") return null
  return RECHECKED_PROBLEMS.has(problem) ? ADMIN_RECHECK_HINTS.rechecked : ADMIN_RECHECK_HINTS.stopped
}

const DAY_MS = 24 * 60 * 60 * 1000

export const accountAgeLine = (createdAt: Date, now: Date): string => {
  const days = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / DAY_MS))
  return `Account ${countOf(days, "day")} old`
}

export const domainLimitText = ({ maxDomains, grantedBy, grantedAt, reason }: DomainAllowance, formatDate: (value: string) => string): string =>
  grantedBy ? `${maxDomains}, set by ${grantedBy}${grantedAt ? ` on ${formatDate(grantedAt)}` : ""}${reason ? `: ${reason}` : ""}` : `${maxDomains} (the default)`

export const DOMAIN_LIMIT_MIN = 1

export const DOMAIN_LIMIT_MAX = 20

export const DOMAIN_LIMIT_RANGE_ERROR = "Choose 1 to 20"

export const REASON_REQUIRED = "Reason is required"

export const NOTE_MAX = 500

export const domainLimitError = (value: string): string | null => {
  if (!/^\d+$/.test(value.trim())) return DOMAIN_LIMIT_RANGE_ERROR
  const parsed = Number(value.trim())
  return parsed < DOMAIN_LIMIT_MIN || parsed > DOMAIN_LIMIT_MAX ? DOMAIN_LIMIT_RANGE_ERROR : null
}

export type TokenTone = "success" | "destructive" | "warning" | "muted"

export const TOKEN_STATUS_TONES: Record<CloudflareTokenStatus, Exclude<TokenTone, "muted">> = {
  OK: "success",
  MISSING: "destructive",
  INVALID: "destructive",
  NO_PERMISSION: "destructive",
  UNREACHABLE: "warning",
}

export const TOKEN_NOT_CHECKED = "Not checked yet"

export interface CloudflareTokenLine {
  label: string
  tone: TokenTone
  message: string | null
  checkedAt: string | null
}

export const cloudflareTokenLine = ({ status, checkedAt, message }: CloudflareCheck): CloudflareTokenLine =>
  checkedAt == null && status !== "MISSING"
    ? { label: TOKEN_NOT_CHECKED, tone: "muted", message: null, checkedAt: null }
    : { label: TOKEN_STATUS_LABELS[status], tone: TOKEN_STATUS_TONES[status], message, checkedAt }

export const DOMAIN_REQUEST_MIN = 2

export const DOMAIN_REQUEST_RANGE_ERROR = `Choose ${DOMAIN_REQUEST_MIN} to ${DOMAIN_LIMIT_MAX}`

export const DOMAIN_REQUEST_STATUS_LABELS: Record<DomainRequestStatus, string> = {
  WAITING: "Waiting for review",
  APPROVED: "Approved",
  DECLINED: "Not approved",
}

export const DOMAIN_REQUEST_STATUSES = Object.keys(DOMAIN_REQUEST_STATUS_LABELS) as DomainRequestStatus[]

export const isDomainRequestStatus = (value: string | null | undefined): value is DomainRequestStatus =>
  typeof value === "string" && (DOMAIN_REQUEST_STATUSES as string[]).includes(value)

export const domainRequestTitle = ({ requestedTotal }: Pick<DomainRequest, "requestedTotal">): string =>
  `Request for ${countOf(requestedTotal, "custom domain")}`

export const domainRequestHint = ({ status }: Pick<DomainRequest, "status">, limit: number): string => {
  if (status === "WAITING") return "We'll email you when it's reviewed."
  if (status === "APPROVED") return `Your account can now have ${countOf(limit, "custom domain")}.`
  return `Your limit stays at ${countOf(limit, "custom domain")}. You can ask again.`
}

export const domainRequestTotalError = (value: string, limit: number): string | null => {
  if (!/^\d+$/.test(value.trim())) return DOMAIN_REQUEST_RANGE_ERROR
  const parsed = Number(value.trim())
  if (parsed < DOMAIN_REQUEST_MIN || parsed > DOMAIN_LIMIT_MAX) return DOMAIN_REQUEST_RANGE_ERROR
  return parsed <= limit ? `Choose more than your limit of ${limit}.` : null
}

export const domainRequestDefaultTotal = (limit: number): number => Math.min(DOMAIN_LIMIT_MAX, Math.max(DOMAIN_REQUEST_MIN, limit + 1))

export const DOMAIN_LIMIT_HIGHEST_LINE = `You have the highest limit, ${DOMAIN_LIMIT_MAX} custom domains.`

export const adminRequestLimitLine = ({ currentLimit, used, limitAtRequest, status }: { currentLimit: number; used: number; limitAtRequest: number; status: DomainRequestStatus }): string => {
  const now = `Limit ${currentLimit}, ${used} in use`
  return status === "WAITING" && limitAtRequest !== currentLimit ? `${now} (${limitAtRequest} when asked)` : now
}
