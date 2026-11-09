import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

globalThis.localStorage = { getItem: () => "Bearer owner", setItem: () => {}, removeItem: () => {} }

const {
  EXPIRY_IN_PAST,
  TURN_ON_LABEL,
  CHECKING_OWNER_LINE,
  canTurnBackOn,
  changedDestination,
  changesLeftText,
  destinationLocked,
  editErrorField,
  editLinkBody,
  editLinkPrefill,
  expiryPrefill,
  goodStandingText,
  missingOf,
  requirementText,
  standingText,
  turnOnProblem,
  verdictHeading,
  verdictOf,
  OVERRIDE_LABELS,
  OVERRIDE_HINTS,
  HISTORY_SORTS,
  VIA_LABELS,
} = await import("../lib/link-edit.ts")
const { resolveStatus, servedFromFallback } = await import("../lib/status.ts")
const { urlApi } = await import("../lib/api-client.ts")

const zone = process.env.TZ ?? "UTC"

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name} (${zone})\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const link = (overrides = {}) => ({
  id: 7,
  longUrl: "https://example.com/page",
  visitLimit: 0,
  opens: 0,
  expirationDate: undefined,
  active: true,
  status: "ACTIVE",
  passwordProtected: false,
  tags: ["work"],
  ...overrides,
})

const expired = link({ active: false, status: "EXPIRED", expirationDate: "2026-10-01T10:00:37Z" })
const usedUp = link({ active: false, status: "LIMIT_REACHED", visitLimit: 5, opens: 5 })

check("an untouched form sends the stored values and nothing that changes the link", () => {
  const stored = link({ visitLimit: 10, expirationDate: "2027-01-01T08:30:15Z" })
  const body = editLinkBody(stored, editLinkPrefill(stored))
  assert.deepEqual(body, { id: 7, visitLimit: 10, expirationDate: "2027-01-01T08:30:15Z", tags: ["work"] })
})

check("the visit limit and the expiry are always in the JSON, null when removed", () => {
  const body = editLinkBody(link(), { ...editLinkPrefill(link()), visitLimit: "", expiry: "" })
  assert.equal(JSON.stringify(body), '{"id":7,"visitLimit":null,"expirationDate":null,"tags":["work"]}')
  assert.equal(editLinkBody(link(), { ...editLinkPrefill(link()), visitLimit: "0" }).visitLimit, null)
  assert.equal(editLinkBody(link(), { ...editLinkPrefill(link()), visitLimit: " 25 " }).visitLimit, 25)
})

check("an expired link's untouched expiry goes back to the second, so retagging it isn't refused", () => {
  const form = { ...editLinkPrefill(expired), tags: "work, old", turnOn: false }
  const body = editLinkBody(expired, form)
  assert.equal(body.expirationDate, "2026-10-01T10:00:37Z")
  assert.equal(body.active, undefined)
  assert.deepEqual(body.tags, ["work", "old"])
})

check("a changed expiry is sent as the instant the viewer picked", () => {
  const body = editLinkBody(expired, { ...editLinkPrefill(expired), expiry: "2027-03-04T05:06" })
  assert.equal(body.expirationDate, new Date("2027-03-04T05:06").toISOString())
  assert.equal(expiryPrefill(expired).length, 16)
})

check("the destination is sent only when it differs once the scheme is added", () => {
  assert.equal(changedDestination(link(), "example.com/page"), undefined)
  assert.equal(changedDestination(link(), "  https://example.com/page "), undefined)
  assert.equal(changedDestination(link(), ""), undefined)
  assert.equal(changedDestination(link(), "example.com/other"), "example.com/other")
  const body = editLinkBody(link(), editLinkPrefill(link()), { destination: "https://example.com/new?utm_source=x" })
  assert.equal(body.longUrl, "https://example.com/new?utm_source=x")
  assert.equal(editLinkBody(link(), editLinkPrefill(link()), { destination: "https://example.com/page" }).longUrl, undefined)
})

check("the password is set, removed or left", () => {
  const prefill = editLinkPrefill(link({ passwordProtected: true }))
  assert.equal(editLinkBody(link({ passwordProtected: true }), { ...prefill, removePassword: true }).password, "")
  assert.equal(editLinkBody(link(), { ...prefill, removePassword: true }).password, undefined)
  assert.equal(editLinkBody(link(), { ...prefill, password: "s3cret-pass" }).password, "s3cret-pass")
  assert.equal("password" in editLinkBody(link(), prefill), false)
})

check("expired and used-up links start with Turn back on ticked, turned-off ones don't, blocked ones can't", () => {
  assert.equal(editLinkPrefill(expired).turnOn, true)
  assert.equal(editLinkPrefill(usedUp).turnOn, true)
  assert.equal(editLinkPrefill(link({ active: false, status: "DEACTIVATED" })).turnOn, false)
  assert.equal(editLinkPrefill(link()).turnOn, false)
  assert.equal(editLinkPrefill(link({ visitLimit: 0 })).visitLimit, "")
  assert.equal(canTurnBackOn(link({ active: false, status: "BLOCKED" })), false)
  assert.equal(canTurnBackOn(link()), false)
  assert.equal(canTurnBackOn(expired), true)
  const blocked = link({ active: false, status: "BLOCKED" })
  assert.equal(editLinkBody(blocked, { ...editLinkPrefill(blocked), turnOn: true }).active, undefined)
  assert.equal(TURN_ON_LABEL, "Turn this link back on when I save")
})

check("a link held for checking can't be turned back on and shows as Being checked", () => {
  const held = link({ active: false, status: "CHECKING" })
  assert.equal(canTurnBackOn(held), false)
  assert.equal(editLinkPrefill(held).turnOn, false)
  assert.equal(editLinkBody(held, { ...editLinkPrefill(held), turnOn: true }).active, undefined)
  assert.deepEqual(resolveStatus("CHECKING", false), { label: "Being checked", variant: "warning" })
  assert.equal(CHECKING_OWNER_LINE, "This link is being checked. It comes back on its own if it looks fine.")
})

check("a source is from a fallback only when its last success is one of the fallback URLs", () => {
  const fallbacks = ["https://mirror.example/list.txt"]
  assert.equal(servedFromFallback({ lastSuccessUrl: "https://mirror.example/list.txt", fallbackUrls: fallbacks }), true)
  assert.equal(servedFromFallback({ lastSuccessUrl: "https://tranco-list.eu/download/746WX/1000000", fallbackUrls: fallbacks }), false)
  assert.equal(servedFromFallback({ lastSuccessUrl: null, fallbackUrls: fallbacks }), false)
  assert.equal(servedFromFallback({ lastSuccessUrl: "https://a.example/x", fallbackUrls: [] }), false)
})

check("Turn back on sends active: true, and force only when asked", () => {
  const later = { ...editLinkPrefill(expired), expiry: "2099-01-01T00:00" }
  assert.equal(editLinkBody(expired, later).active, true)
  assert.equal(editLinkBody(expired, { ...later, turnOn: false }).active, undefined)
  assert.equal(editLinkBody(link(), editLinkPrefill(link()), { force: true }).force, true)
  assert.equal("force" in editLinkBody(link(), editLinkPrefill(link())), false)
})

check("turning back on needs a later or no expiry and a limit above the clicks used", () => {
  const now = new Date("2026-11-01T12:00:00Z")
  assert.equal(turnOnProblem(expired, editLinkPrefill(expired), now), "Set a later expiry date, or clear it, to turn the link back on.")
  assert.equal(turnOnProblem(expired, { ...editLinkPrefill(expired), expiry: "" }, now), null)
  assert.equal(turnOnProblem(expired, { ...editLinkPrefill(expired), expiry: "2099-01-01T00:00" }, now), null)
  assert.equal(turnOnProblem(expired, { ...editLinkPrefill(expired), turnOn: false }, now), null)
  assert.equal(turnOnProblem(usedUp, editLinkPrefill(usedUp), now), "Set a visit limit above 5, or clear it, to turn the link back on.")
  assert.equal(turnOnProblem(usedUp, { ...editLinkPrefill(usedUp), visitLimit: "6" }, now), null)
  assert.equal(turnOnProblem(usedUp, { ...editLinkPrefill(usedUp), visitLimit: "" }, now), null)
  assert.equal(turnOnProblem(link({ active: false, status: "BLOCKED" }), { ...editLinkPrefill(expired), turnOn: true }, now), null)
})

const expectedDaily = {
  UTC: "This link's destination can change 5 times a day. Available from 1 November 2026 at 18:05",
  "America/Los_Angeles": "This link's destination can change 5 times a day. Available from 1 November 2026 at 10:05",
  "Pacific/Auckland": "This link's destination can change 5 times a day. Available from 2 November 2026 at 07:05",
}

const expectedRecent = {
  UTC: "One of your links was blocked. Available from 30 January 2027",
  "America/Los_Angeles": "One of your links was blocked. Available from 29 January 2027",
  "Pacific/Auckland": "One of your links was blocked. Available from 30 January 2027",
}

check("dates in the reasons are written in the reader's time zone, in the backend's style", () => {
  assert.equal(
    requirementText({ code: "DAILY_CHANGES_LEFT", text: "This link's destination can change 5 times a day. Available from 1 November 2026 at 18:05 UTC", availableFrom: "2026-11-01T18:05:00Z" }),
    expectedDaily[zone],
  )
  assert.equal(
    requirementText({ code: "NO_RECENT_BLOCKS", text: "One of your links was blocked. Available from 30 January 2027", availableFrom: "2027-01-30T00:30:00Z" }),
    expectedRecent[zone],
  )
  assert.equal(requirementText({ code: "ACCOUNT_AGE", text: "Available from 1 December 2026", availableFrom: "2026-12-01T10:00:00Z" }), "Available from 1 December 2026")
  assert.equal(requirementText({ code: "TWO_STEP_SIGN_IN", text: "Turn on two-step sign-in", availableFrom: null }), "Turn on two-step sign-in")
  assert.equal(requirementText({ code: "ACCOUNT_AGE", text: "Wait a little", availableFrom: "2026-12-01T10:00:00Z" }), "Wait a little")
  assert.equal(requirementText({ code: "ACCOUNT_AGE", text: "Available from soon", availableFrom: "not a date" }), "Available from soon")
})

check("the destination is locked until the info says it can change; admins never", () => {
  assert.equal(destinationLocked(true, undefined), false)
  assert.equal(destinationLocked(false, undefined), true)
  assert.equal(destinationLocked(false, { allowed: false, missing: [], changesLeft: 5 }), true)
  assert.equal(destinationLocked(false, { allowed: true, missing: [], changesLeft: 5 }), false)
  assert.equal(changesLeftText({ allowed: true, missing: [], changesLeft: 3 }), "The destination can change 5 times a day. 3 changes left today.")
  assert.equal(changesLeftText({ allowed: true, missing: [], changesLeft: 1 }), "The destination can change 5 times a day. 1 change left today.")
  assert.equal(changesLeftText({ allowed: true, missing: [], changesLeft: null }), null)
  assert.equal(changesLeftText({ allowed: false, missing: [], changesLeft: 0 }), null)
})

const refusal = (status, detail, members = {}) => ({ status, message: detail, fields: {}, problem: { type: "about:blank", status, detail, ...members } })

check("the 403's missing list and the admin 409's verdict are read from the problem", () => {
  const missing = [{ code: "TWO_STEP_SIGN_IN", text: "Turn on two-step sign-in", availableFrom: null }]
  assert.deepEqual(missingOf(refusal(403, "You can't change where this link points yet. Turn on two-step sign-in.", { missing })), missing)
  assert.equal(missingOf(refusal(403, "You don't have authorization for this action")), null)
  assert.equal(missingOf(refusal(403, "x", { missing: [] })), null)
  assert.equal(missingOf(refusal(403, "x", { missing: [{ code: "A" }] })), null)
  assert.equal(missingOf(new Error("plain")), null)
  assert.equal(missingOf(null), null)
  const flagged = refusal(409, "The link checks would send this destination to review: Young domain.", { verdict: { outcome: "FLAG", reasons: ["Young domain"] } })
  assert.deepEqual(verdictOf(flagged), { outcome: "FLAG", reasons: ["Young domain"] })
  assert.equal(verdictHeading(verdictOf(flagged)), "The link checks would send this destination to review")
  assert.equal(verdictHeading({ outcome: "BLOCK", reasons: [] }), "The link checks would block this destination")
  assert.equal(verdictOf(refusal(409, "This link has used all its clicks. Edit it to raise or remove its visit limit first.")), null)
  assert.equal(verdictOf(refusal(400, "x", { verdict: { outcome: "BLOCK", reasons: [] } })), null)
})

check("refusals show under the field they are about", () => {
  assert.equal(editErrorField({ status: 400, message: "p", fields: { password: "p" } }, true), "password")
  assert.equal(editErrorField({ status: 400, message: "Destination URL must be 2048 characters or fewer", fields: { longUrl: "x" } }, true), "destination")
  assert.equal(editErrorField(refusal(400, EXPIRY_IN_PAST), true), "expiry")
  assert.equal(editErrorField(refusal(409, "This link has used all its clicks. Edit it to raise or remove its visit limit first."), false), "visitLimit")
  assert.equal(editErrorField(refusal(429, "This link's destination can change 5 times a day. Try again in 43 minutes."), true), "destination")
  assert.equal(editErrorField(refusal(503, "Changing where a link points isn't available right now. Try again in a minute."), true), "destination")
  assert.equal(editErrorField(refusal(400, "This destination is on a blocklist and can't be shortened. If you think that's a mistake, write to support@hrva.cc."), true), "destination")
  assert.equal(editErrorField(refusal(400, "This link's domain isn't active, so the link can't be turned on."), false), "form")
  assert.equal(editErrorField(new Error("Can't reach hrva.cc right now."), true), "form")
})

check("the admin's standing lines and labels", () => {
  assert.equal(standingText({ override: "AUTOMATIC", allowed: false, inGoodStanding: false, missing: [] }), "Can't change destinations")
  assert.equal(standingText({ override: "ALWAYS", allowed: true, inGoodStanding: false, missing: [] }), "Can change destinations (Always allowed)")
  assert.equal(standingText({ override: "NEVER", allowed: false, inGoodStanding: true, missing: [] }), "Can't change destinations (Never allowed)")
  assert.equal(goodStandingText({ override: "AUTOMATIC", allowed: true, inGoodStanding: true, missing: [] }), "In good standing")
  assert.deepEqual(OVERRIDE_LABELS, { AUTOMATIC: "Automatic", ALWAYS: "Always allowed", NEVER: "Never allowed" })
  assert.deepEqual(Object.keys(OVERRIDE_HINTS), ["AUTOMATIC", "ALWAYS", "NEVER"])
  assert.deepEqual(VIA_LABELS, { WEB: "Signed in", API_KEY: "API key" })
  for (const option of HISTORY_SORTS) assert.match(option.value, /^(changedAt|changedBy|via),(asc|desc)$/)
})

const answers = []
globalThis.fetch = async () => answers.shift()()
const problemResponse = (status, body) => () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/problem+json" } })

await (async () => {
  answers.push(problemResponse(403, {
    type: "about:blank",
    title: "Forbidden",
    status: 403,
    detail: "You can't change where this link points yet. Turn on two-step sign-in.",
    missing: [{ code: "TWO_STEP_SIGN_IN", text: "Turn on two-step sign-in", availableFrom: null }],
  }))
  const refused = await urlApi.update(7, { id: 7, visitLimit: null, expirationDate: null, longUrl: "https://example.com/new" }).catch((error) => error)
  check("the API client keeps a problem's extension members on the error", () => {
    assert.equal(refused.status, 403)
    assert.equal(refused.message, "You can't change where this link points yet. Turn on two-step sign-in.")
    assert.deepEqual(missingOf(refused), [{ code: "TWO_STEP_SIGN_IN", text: "Turn on two-step sign-in", availableFrom: null }])
    assert.equal(editErrorField(refused, true), "destination")
  })

  answers.push(problemResponse(429, { type: "about:blank", title: "Too Many Requests", status: 429, detail: "This link's destination can change 5 times a day. Try again in 43 minutes." }))
  const limited = await urlApi.update(7, { id: 7, visitLimit: null, expirationDate: null, longUrl: "https://example.com/new" }).catch((error) => error)
  check("the daily limit's 429 keeps the backend's time left", () => {
    assert.equal(limited.status, 429)
    assert.equal(limited.message, "This link's destination can change 5 times a day. Try again in 43 minutes.")
    assert.equal(missingOf(limited), null)
  })

  answers.push(problemResponse(409, { type: "about:blank", title: "Conflict", status: 409, detail: "The link checks would block this destination: On a list.", verdict: { outcome: "BLOCK", reasons: ["On a list"] } }))
  const held = await urlApi.update(7, { id: 7, visitLimit: null, expirationDate: null, longUrl: "https://bad.example" }).catch((error) => error)
  check("an admin's 409 carries the verdict", () => {
    assert.deepEqual(verdictOf(held), { outcome: "BLOCK", reasons: ["On a list"] })
  })
})()

console.log("ok")
