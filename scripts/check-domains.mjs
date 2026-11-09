import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const domains = await import("../lib/domains.ts")

const {
  DOMAIN_STATUS_HINTS,
  DOMAIN_STATUS_LABELS,
  DOMAIN_STEP_LABELS,
  HOSTNAME_PLACEHOLDER,
  LINK_MODE_HINTS,
  LINK_MODE_LABELS,
  REASON_MAX,
  TOKEN_STATUS_LABELS,
  TOKEN_STATUS_TONES,
  TOKEN_NOT_CHECKED,
  cloudflareTokenLine,
  DOMAIN_PROBLEM_FOLLOW_UPS,
  PROVISIONING_FAILED_TEXT,
  PROVISIONING_GAVE_UP_TEXT,
  canPickDomain,
  domainApplyState,
  domainLimitLine,
  domainProblemLines,
  domainRemovalSummary,
  isHostnameShaped,
  isWaitingForSetup,
  pickableHostnames,
  shortHost,
  DOMAIN_STATUSES,
  isDomainStatus,
  canTurnOff,
  canRemoveDomain,
  canAdminRetry,
  adminRecheckHint,
  accountAgeLine,
  domainLimitText,
  domainLimitError,
  DOMAIN_REQUEST_STATUS_LABELS,
  DOMAIN_REQUEST_STATUSES,
  DOMAIN_LIMIT_HIGHEST_LINE,
  isDomainRequestStatus,
  domainRequestTitle,
  domainRequestHint,
  domainRequestTotalError,
  domainRequestDefaultTotal,
  adminRequestLimitLine,
  USE_AGAIN_HINTS,
  USE_AGAIN_PENDING_LINE,
  USE_AGAIN_LABEL,
  hasRemovedDomainsParam,
  removedDomainsLabel,
  splitRemovedDomains,
  useAgainLines,
} = domains

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const NOT_ASCII = /[^\x00-\x7F]/

const stringsIn = (value) => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value !== null && typeof value === "object") return Object.entries(value).flatMap(([key, entry]) => [key, ...stringsIn(entry)])
  return []
}

const STATUSES = ["PENDING_REVIEW", "APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "REJECTED", "DISABLED", "ERROR", "DELETED"]

const domain = (overrides = {}) => ({
  id: 7,
  hostname: "go.example.com",
  status: "ACTIVE",
  reason: "Menu links for my cafe",
  reviewNote: null,
  createdAt: "2026-10-29T08:00:00",
  reviewedAt: "2026-10-29T09:00:00",
  activatedAt: "2026-10-29T09:05:00",
  lastCheckedAt: "2026-10-29T09:05:00",
  dnsRecord: { type: "CNAME", name: "go.example.com", target: "domains.hrva.cc" },
  steps: { dnsFound: true, certificateIssued: true },
  problem: null,
  problemText: null,
  disabledNote: null,
  links: 0,
  useAgain: null,
  ...overrides,
})

check("limits", () => {
  assert.equal(HOSTNAME_PLACEHOLDER, "go.example.com")
  assert.equal(REASON_MAX, 300)
})

check("status labels, every status once", () => {
  assert.deepEqual(Object.keys(DOMAIN_STATUS_LABELS), STATUSES)
  assert.deepEqual(DOMAIN_STATUS_LABELS, {
    PENDING_REVIEW: "Waiting for review",
    APPROVED_PROVISIONING: "Approved, setting up",
    AWAITING_DNS: "Waiting for your DNS record",
    ACTIVE: "Active",
    REJECTED: "Not approved",
    DISABLED: "Turned off",
    ERROR: "Needs attention",
    DELETED: "Removed",
  })
})

check("status hints, every status once", () => {
  assert.deepEqual(Object.keys(DOMAIN_STATUS_HINTS), STATUSES)
  assert.deepEqual(DOMAIN_STATUS_HINTS, {
    PENDING_REVIEW: "We'll email you when it's reviewed, usually within a day or two.",
    APPROVED_PROVISIONING: "Approved. We're getting your domain ready; this takes a minute.",
    AWAITING_DNS: "Add the CNAME record below. We check every minute at first, then less often, and finish on our own.",
    ACTIVE: "Ready. Pick this domain when you shorten a link.",
    REJECTED: "This application wasn't approved.",
    DISABLED: "This domain is turned off. Its links don't open.",
    ERROR: "Something needs your attention. See below.",
    DELETED: "This domain was removed.",
  })
})

check("step labels", () => {
  assert.deepEqual(DOMAIN_STEP_LABELS, { dnsFound: "DNS record found", certificateIssued: "Certificate issued" })
})

check("link mode labels and hints", () => {
  assert.deepEqual(LINK_MODE_LABELS, { MOVE: "Move its links to hrva.cc", DEACTIVATE: "Turn its links off" })
  assert.deepEqual(LINK_MODE_HINTS, {
    MOVE: "Links keep their alias when it's free and allowed on hrva.cc and get a new one otherwise.",
    DEACTIVATE: "Links stay in your list, turned off.",
  })
})

check("token status labels", () => {
  assert.deepEqual(TOKEN_STATUS_LABELS, {
    OK: "OK",
    MISSING: "Missing",
    INVALID: "Invalid",
    NO_PERMISSION: "No permission",
    UNREACHABLE: "Unreachable",
  })
})

check("token status tones: only an outage is a warning", () => {
  assert.deepEqual(TOKEN_STATUS_TONES, {
    OK: "success",
    MISSING: "destructive",
    INVALID: "destructive",
    NO_PERMISSION: "destructive",
    UNREACHABLE: "warning",
  })
})

check("cloudflareTokenLine", () => {
  const unreachable = "Cloudflare couldn't be reached. We'll check again."
  const missing = "CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID isn't set."
  assert.equal(TOKEN_NOT_CHECKED, "Not checked yet")
  for (const status of ["OK", "INVALID", "NO_PERMISSION", "UNREACHABLE"]) {
    assert.deepEqual(
      cloudflareTokenLine({ status, checkedAt: null, message: status === "UNREACHABLE" ? unreachable : null }),
      { label: "Not checked yet", tone: "muted", message: null, checkedAt: null },
      status,
    )
  }
  assert.deepEqual(cloudflareTokenLine({ status: "OK", message: null }), {
    label: "Not checked yet",
    tone: "muted",
    message: null,
    checkedAt: null,
  })
  assert.deepEqual(cloudflareTokenLine({ status: "MISSING", checkedAt: null, message: missing }), {
    label: "Missing",
    tone: "destructive",
    message: missing,
    checkedAt: null,
  })
  assert.deepEqual(cloudflareTokenLine({ status: "UNREACHABLE", checkedAt: "2026-10-29T10:00:00", message: unreachable }), {
    label: "Unreachable",
    tone: "warning",
    message: unreachable,
    checkedAt: "2026-10-29T10:00:00",
  })
  assert.deepEqual(cloudflareTokenLine({ status: "OK", checkedAt: "2026-10-29T10:00:00", message: null }), {
    label: "OK",
    tone: "success",
    message: null,
    checkedAt: "2026-10-29T10:00:00",
  })
})

check("shortHost", () => {
  assert.equal(shortHost(null, "hrva.cc"), "hrva.cc")
  assert.equal(shortHost(undefined, "hrva.cc"), "hrva.cc")
  assert.equal(shortHost({ id: 7, hostname: "go.example.com" }, "hrva.cc"), "go.example.com")
})

check("isHostnameShaped", () => {
  assert.equal(isHostnameShaped("go.example.com"), true)
  assert.equal(isHostnameShaped("www.go.example.com"), true)
  assert.equal(isHostnameShaped("Go.Example.COM"), true)
  assert.equal(isHostnameShaped("links.my-cafe.co.uk"), true)
  assert.equal(isHostnameShaped(`${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`), true)
  assert.equal(isHostnameShaped(`${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`), false)
  assert.equal(isHostnameShaped("localhost"), false)
  assert.equal(isHostnameShaped("go.example.com."), false)
  assert.equal(isHostnameShaped("go..example.com"), false)
  assert.equal(isHostnameShaped("go.example.com/menu"), false)
  assert.equal(isHostnameShaped("go.example.com:443"), false)
  assert.equal(isHostnameShaped("go example.com"), false)
  assert.equal(isHostnameShaped(`${String.fromCodePoint(0x10d)}okolada.hr`), false)
  assert.equal(isHostnameShaped(""), false)
  assert.equal(isHostnameShaped(null), false)
  assert.equal(isHostnameShaped(undefined), false)
})

check("canPickDomain needs an active domain", () => {
  assert.equal(canPickDomain([]), false)
  assert.equal(canPickDomain([domain({ status: "AWAITING_DNS" })]), false)
  assert.equal(canPickDomain([domain()]), true)
  assert.equal(canPickDomain([domain({ status: "DISABLED" }), domain({ id: 8, hostname: "links.example.org" })]), true)
})

check("pickableHostnames lists active domains and keeps the picked one", () => {
  const mixed = [
    domain({ id: 1, hostname: "a.example.com", status: "AWAITING_DNS" }),
    domain({ id: 2, hostname: "b.example.com" }),
    domain({ id: 3, hostname: "c.example.com", status: "DISABLED" }),
    domain({ id: 4, hostname: "d.example.com" }),
  ]
  assert.deepEqual(pickableHostnames([], null), [])
  assert.deepEqual(pickableHostnames(mixed, null), ["b.example.com", "d.example.com"])
  assert.deepEqual(pickableHostnames(mixed, "d.example.com"), ["b.example.com", "d.example.com"])
  assert.deepEqual(pickableHostnames(mixed, "c.example.com"), ["b.example.com", "d.example.com", "c.example.com"])
  assert.deepEqual(pickableHostnames([], "gone.example.com"), ["gone.example.com"])
})

check("problem follow-ups say who checks again", () => {
  assert.deepEqual(DOMAIN_PROBLEM_FOLLOW_UPS, {
    DNS_NOT_FOUND: "We keep checking on our own, or use Check now.",
    CAA_BLOCKED: "We check again on our own, or use Check now once it's fixed.",
    CERTIFICATE_TIMED_OUT: "We check again on our own, or use Check now once it's fixed.",
    CNAME_REMOVED: "We check again on our own, or use Check now once it's fixed.",
    CLOUDFLARE_BLOCKED: "We check again on our own. You don't need to do anything.",
    DNS_TIMED_OUT: "We don't check on our own any more. Use Check now to look again.",
  })
  assert.equal(PROVISIONING_FAILED_TEXT, "Setting up your domain hit a problem. We'll keep trying, or try again now.")
  assert.equal(PROVISIONING_GAVE_UP_TEXT, "Setting up your domain failed. Try again now, or remove it.")
})

check("domainProblemLines", () => {
  assert.equal(domainProblemLines(domain()), null)
  assert.deepEqual(
    domainProblemLines(domain({ status: "ERROR", problem: "CAA_BLOCKED", problemText: "CAA text" })),
    { text: "CAA text", followUp: DOMAIN_PROBLEM_FOLLOW_UPS.CAA_BLOCKED, retry: false },
  )
  assert.deepEqual(
    domainProblemLines(domain({ status: "ERROR", problem: "DNS_TIMED_OUT", problemText: "Timed out text" })),
    { text: "Timed out text", followUp: DOMAIN_PROBLEM_FOLLOW_UPS.DNS_TIMED_OUT, retry: false },
  )
  assert.deepEqual(
    domainProblemLines(domain({ status: "AWAITING_DNS", problem: "DNS_NOT_FOUND", problemText: null })),
    { text: null, followUp: DOMAIN_PROBLEM_FOLLOW_UPS.DNS_NOT_FOUND, retry: false },
  )
  assert.deepEqual(
    domainProblemLines(domain({ status: "APPROVED_PROVISIONING", problem: "PROVISIONING_FAILED", problemText: "Backend text" })),
    { text: PROVISIONING_FAILED_TEXT, followUp: null, retry: true },
  )
  assert.deepEqual(
    domainProblemLines(domain({ status: "ERROR", problem: "PROVISIONING_FAILED", problemText: "Backend text" })),
    { text: PROVISIONING_GAVE_UP_TEXT, followUp: null, retry: true },
  )
})

check("isWaitingForSetup", () => {
  assert.deepEqual(STATUSES.filter(isWaitingForSetup), ["APPROVED_PROVISIONING", "AWAITING_DNS", "ERROR"])
})

check("domainApplyState", () => {
  assert.equal(domainApplyState({ domains: [], limit: 1, used: 0, canApply: true }), "form")
  assert.equal(domainApplyState({ domains: [domain()], limit: 1, used: 1, canApply: false }), "limit")
  assert.equal(domainApplyState({ domains: [domain()], limit: 3, used: 4, canApply: false }), "limit")
  assert.equal(domainApplyState({ domains: [], limit: 1, used: 0, canApply: false }), "off")
})

check("domainLimitLine", () => {
  assert.equal(domainLimitLine(1), "You can have 1 custom domain. Remove or withdraw one to apply for another.")
  assert.equal(domainLimitLine(3), "You can have 3 custom domains. Remove or withdraw one to apply for another.")
})

check("domainRemovalSummary", () => {
  assert.equal(domainRemovalSummary({ moved: 0, renamed: [], deactivated: 0 }), null)
  assert.equal(domainRemovalSummary({ moved: 3, renamed: [{ from: "menu", to: "k3J9x" }], deactivated: 0 }), "3 links moved, 1 with a new alias.")
  assert.equal(domainRemovalSummary({ moved: 1, renamed: [], deactivated: 0 }), "1 link moved, 0 with a new alias.")
  assert.equal(domainRemovalSummary({ moved: 0, renamed: [], deactivated: 2 }), "2 links turned off.")
  assert.equal(domainRemovalSummary({ moved: 0, renamed: [], deactivated: 1 }), "1 link turned off.")
})

check("admin status filter", () => {
  assert.deepEqual(DOMAIN_STATUSES, Object.keys(DOMAIN_STATUS_LABELS))
  assert.equal(isDomainStatus("ACTIVE"), true)
  assert.equal(isDomainStatus("active"), false)
  assert.equal(isDomainStatus(null), false)
})

check("admin actions by status", () => {
  assert.deepEqual(DOMAIN_STATUSES.filter(canTurnOff), ["APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "ERROR"])
  assert.deepEqual(DOMAIN_STATUSES.filter(canRemoveDomain), ["APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "DISABLED", "ERROR"])
  assert.equal(canAdminRetry({ status: "ERROR", problem: "CAA_BLOCKED" }), true)
  assert.equal(canAdminRetry({ status: "AWAITING_DNS", problem: null }), true)
  assert.equal(canAdminRetry({ status: "APPROVED_PROVISIONING", problem: "PROVISIONING_FAILED" }), true)
  assert.equal(canAdminRetry({ status: "APPROVED_PROVISIONING", problem: null }), false)
  assert.equal(canAdminRetry({ status: "ACTIVE", problem: null }), false)
  assert.equal(canAdminRetry({ status: "DISABLED", problem: null }), false)
})

check("admin recheck hints", () => {
  for (const problem of ["CERTIFICATE_TIMED_OUT", "CNAME_REMOVED", "CAA_BLOCKED", "CLOUDFLARE_BLOCKED"]) {
    assert.equal(adminRecheckHint({ status: "ERROR", problem }), "Checked again every hour on its own.")
  }
  for (const problem of ["DNS_TIMED_OUT", "PROVISIONING_FAILED"]) {
    assert.equal(adminRecheckHint({ status: "ERROR", problem }), "No longer checked on its own. Use Retry.")
  }
  assert.equal(adminRecheckHint({ status: "APPROVED_PROVISIONING", problem: "PROVISIONING_FAILED" }), "Retried on its own for 24 hours. Retry now to try again right away.")
  assert.equal(adminRecheckHint({ status: "AWAITING_DNS", problem: "DNS_NOT_FOUND" }), null)
  assert.equal(adminRecheckHint({ status: "ERROR", problem: null }), null)
})

check("accountAgeLine", () => {
  const now = new Date("2026-10-29T12:00:00Z")
  assert.equal(accountAgeLine(new Date("2026-10-29T08:00:00Z"), now), "Account 0 days old")
  assert.equal(accountAgeLine(new Date("2026-10-28T08:00:00Z"), now), "Account 1 day old")
  assert.equal(accountAgeLine(new Date("2026-10-26T12:00:00Z"), now), "Account 3 days old")
  assert.equal(accountAgeLine(new Date("2026-10-30T12:00:00Z"), now), "Account 0 days old")
})

check("domainLimitText", () => {
  const date = (value) => `on-${value}`
  assert.equal(domainLimitText({ userId: 5, maxDomains: 1, reason: null, grantedBy: null, grantedAt: null }, date), "1 (the default)")
  assert.equal(
    domainLimitText({ userId: 5, maxDomains: 3, reason: "Agency with three brands", grantedBy: "admin@localhost", grantedAt: "2026-10-29T10:00:00" }, (value) => value.slice(0, 10)),
    "3, set by admin@localhost on 2026-10-29: Agency with three brands",
  )
})

check("domainLimitError", () => {
  for (const bad of ["0", "21", "", " ", "1.5", "-1", "abc"]) assert.equal(domainLimitError(bad), "Choose 1 to 20", bad)
  for (const good of ["1", "20", " 3 "]) assert.equal(domainLimitError(good), null, good)
})

check("domain request labels match the backend statuses", () => {
  assert.deepEqual(DOMAIN_REQUEST_STATUSES, ["WAITING", "APPROVED", "DECLINED"])
  assert.equal(DOMAIN_REQUEST_STATUS_LABELS.WAITING, "Waiting for review")
  assert.equal(DOMAIN_REQUEST_STATUS_LABELS.DECLINED, "Not approved")
  assert.ok(isDomainRequestStatus("APPROVED"))
  for (const bad of ["ALL", "PENDING", "", null, undefined]) assert.ok(!isDomainRequestStatus(bad), String(bad))
})

check("domainRequestTotalError matches the backend texts", () => {
  for (const bad of ["1", "0", "21", "", " ", "2.5", "-3", "abc"]) assert.equal(domainRequestTotalError(bad, 1), "Choose 2 to 20", bad)
  assert.equal(domainRequestTotalError("3", 3), "Choose more than your limit of 3.")
  assert.equal(domainRequestTotalError("2", 3), "Choose more than your limit of 3.")
  for (const good of ["2", " 5 ", "20"]) assert.equal(domainRequestTotalError(good, 1), null, good)
})

check("domainRequestDefaultTotal stays within 2 to 20", () => {
  assert.equal(domainRequestDefaultTotal(1), 2)
  assert.equal(domainRequestDefaultTotal(4), 5)
  assert.equal(domainRequestDefaultTotal(19), 20)
  assert.equal(domainRequestDefaultTotal(20), 20)
})

check("domain request lines", () => {
  assert.equal(domainRequestTitle({ requestedTotal: 3 }), "Request for 3 custom domains")
  assert.equal(domainRequestHint({ status: "WAITING" }, 1), "We'll email you when it's reviewed.")
  assert.equal(domainRequestHint({ status: "APPROVED" }, 3), "Your account can now have 3 custom domains.")
  assert.equal(domainRequestHint({ status: "DECLINED" }, 1), "Your limit stays at 1 custom domain. You can ask again.")
  assert.equal(DOMAIN_LIMIT_HIGHEST_LINE, "You have the highest limit, 20 custom domains.")
  assert.equal(adminRequestLimitLine({ currentLimit: 1, used: 1, limitAtRequest: 1, status: "WAITING" }), "Limit 1, 1 in use")
  assert.equal(adminRequestLimitLine({ currentLimit: 2, used: 1, limitAtRequest: 1, status: "WAITING" }), "Limit 2, 1 in use (1 when asked)")
  assert.equal(adminRequestLimitLine({ currentLimit: 3, used: 1, limitAtRequest: 1, status: "APPROVED" }), "Limit 3, 1 in use")
})

check("removed domains are split from live ones and counted in the label", () => {
  const live = [domain({ id: 1 }), domain({ id: 3, status: "DISABLED" })]
  const removed = [domain({ id: 2, status: "DELETED", useAgain: "SKIPS_REVIEW" }), domain({ id: 4, status: "DELETED", useAgain: null })]
  assert.deepEqual(splitRemovedDomains([live[0], removed[0], live[1], removed[1]]), { live, removed })
  assert.deepEqual(splitRemovedDomains([]), { live: [], removed: [] })
  assert.deepEqual(splitRemovedDomains(live), { live, removed: [] })
  assert.deepEqual(splitRemovedDomains(removed), { live: [], removed })
  assert.equal(removedDomainsLabel(0), "Removed domains (0)")
  assert.equal(removedDomainsLabel(3), "Removed domains (3)")
  assert.equal(removedDomainsLabel(), "Removed domains")
})

check("use again copy", () => {
  assert.equal(USE_AGAIN_LABEL, "Use again")
  assert.deepEqual(USE_AGAIN_HINTS, {
    SKIPS_REVIEW: "You removed this domain yourself, so it's set up again without a review, unless a check flags it or there's no room for new domains right now.",
    NEEDS_REVIEW: "It's reviewed again before it's set up.",
  })
  assert.equal(USE_AGAIN_PENDING_LINE, "Still being removed from Cloudflare. Use again becomes available in a few minutes.")
})

check("useAgainLines by what the API allows", () => {
  const removed = (useAgain) => domain({ status: "DELETED", useAgain })
  assert.deepEqual(useAgainLines(removed("SKIPS_REVIEW")), { button: true, line: USE_AGAIN_HINTS.SKIPS_REVIEW })
  assert.deepEqual(useAgainLines(removed("NEEDS_REVIEW")), { button: true, line: USE_AGAIN_HINTS.NEEDS_REVIEW })
  assert.deepEqual(useAgainLines(removed("CLOUDFLARE_REMOVAL_PENDING")), { button: false, line: USE_AGAIN_PENDING_LINE })
  assert.deepEqual(useAgainLines(removed(null)), { button: false, line: null })
  assert.deepEqual(useAgainLines(domain()), { button: false, line: null })
})

check("use again refetches the domains after a refusal too", () => {
  const source = readFileSync(new URL("../lib/hooks/useDomains.ts", import.meta.url), "utf8")
  const hook = source.slice(source.indexOf("export function useUseAgainDomain"), source.indexOf("export function useRequestMoreDomains"))
  assert.match(hook, /onSettled: \(\) => queryClient\.invalidateQueries\(\{ queryKey: DOMAINS_KEY \}\)/)
  assert.doesNotMatch(hook, /onSuccess/)
})

check("the removed domains section opens on load when the address holds one of its parameters", () => {
  for (const name of ["removedPage", "removedSize", "removedSort", "removedOrder", "removedSearch"]) assert.equal(hasRemovedDomainsParam([name]), true, name)
  assert.equal(hasRemovedDomainsParam(["page", "size", "sort", "order", "search", "status", "id"]), false)
  assert.equal(hasRemovedDomainsParam(["removed"]), false)
  assert.equal(hasRemovedDomainsParam(["removedomains"]), false)
  assert.equal(hasRemovedDomainsParam(new URLSearchParams("page=1&removedPage=2").keys()), true)
  assert.equal(hasRemovedDomainsParam([]), false)
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/domains.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/domains.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(domains))) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
