import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const moderation = await import("../lib/moderation.ts")

const { ANONYMOUS_PAUSED, SIGNUPS_PAUSED, ALIASES_PAUSED, ANONYMOUS_REFUSED, refusedSwitch, HUMAN_CHECK_REQUIRED, HUMAN_CHECK_UNCONFIRMED, humanCheckRefusal, NOT_AVAILABLE, switchUnavailable, switchChecked, HUMAN_CHECK_WAIT_MS, TURNSTILE_SCRIPT_URL, NO_TURNSTILE_TOKEN, nextTurnstileState, TURNSTILE_TOKEN_MAX_AGE_MS, freshTurnstileToken, turnstileNeedsReload, TICK_THE_BOX, humanCheckEnabled, noEffectText, SETTING_GROUP_LABELS, safetyOffLines, settingValueText, groupSettings, anonymousLinksPaused, anonymousLimitLine, anonymousLimitLineShown, linkEndsText, WARNING_PAGE_NOTE, WARNING_PAGE_REVIEW_NOTE, warningPageNote, providerShown, providersOff, providerButtonsLayout, providersOffText, providerDisabledText, providerDisabledHeading, FORGOT_PASSWORD_LABEL, providerOffSiteWide, SITE_OFF_TEXT, signupsPaused, aliasFieldShown, reportStatusText, BULK_BLOCK_BATCH, inBatches, NO_BULK_BLOCKS, addBulkBlock, blockSummaryText, RETRYABLE_BLOCK_STATUSES, campaignStatusLabel, campaignCountsText, campaignReportsText, MAILTO_MAX_LENGTH, mailtoHref, markedStatus, markedText, LOOKUP_FAILED, campaignHoldState, heldLinksStayOffText, HELD_LINKS_STAY_OFF, holdOffReason, campaignRuleText, copyMarksReported, reportAsText, noContactText, blockTotalsText, reviewBadgeCounts } = moderation

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

const setting = (overrides = {}) => ({
  key: "CAMPAIGN_LINKS",
  group: "ALERTS",
  type: "NUMBER",
  label: "Same-shape alert: links",
  description: "Links without an account that share one URL shape.",
  parent: "SAME_SHAPE_ALERT",
  safety: false,
  value: 3,
  defaultValue: 3,
  changed: false,
  changedBy: null,
  changedAt: null,
  min: 2,
  max: 50,
  nullable: false,
  noneLabel: null,
  unit: "links",
  available: true,
  unavailableReason: null,
  ...overrides,
})

const safetySwitch = (label, value, overrides = {}) =>
  setting({ key: "BLOCKLIST_CHECK", group: "SAFETY", type: "SWITCH", label, safety: true, value, defaultValue: true, parent: null, min: null, max: null, unit: null, ...overrides })

check("paused notices", () => {
  assert.equal(ANONYMOUS_PAUSED, "Making links without an account is paused.")
  assert.equal(SIGNUPS_PAUSED, "Creating new accounts is paused.")
})

check("refusal texts and the switch each one points at", () => {
  assert.equal(ALIASES_PAUSED, "Custom aliases are turned off right now.")
  assert.equal(ANONYMOUS_REFUSED, "Sign in to create short URLs")
  assert.equal(refusedSwitch("Sign in to create short URLs"), "anonymousLinks")
  assert.equal(refusedSwitch("Custom aliases are turned off right now."), "customAliases")
  assert.equal(HUMAN_CHECK_REQUIRED, "Complete the check and try again.")
  assert.equal(refusedSwitch("Complete the check and try again."), "humanCheck")
  assert.equal(refusedSwitch("We couldn't run the check. Try again in a minute."), null)
  assert.equal(refusedSwitch("Sign in to create short URLs."), null)
  assert.equal(refusedSwitch("Could not shorten that URL."), null)
  assert.equal(refusedSwitch(undefined), null)
})

check("humanCheckEnabled: signed-out visitors, links on, check on with a site key", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true, humanCheck: true, turnstileSiteKey: "1x00000000000000000000AA" }
  assert.equal(humanCheckEnabled(base, false, false), true)
  assert.equal(humanCheckEnabled(base, true, false), false)
  assert.equal(humanCheckEnabled(base, false, true), false)
  assert.equal(humanCheckEnabled(undefined, false, false), false)
  assert.equal(humanCheckEnabled({ ...base, anonymousLinks: false }, false, false), false)
  assert.equal(humanCheckEnabled({ ...base, humanCheck: false }, false, false), false)
  assert.equal(humanCheckEnabled({ ...base, turnstileSiteKey: null }, false, false), false)
  assert.equal(humanCheckEnabled({ ...base, turnstileSiteKey: "  " }, false, false), false)
  assert.equal(humanCheckEnabled({ anonymousLinks: true, newSignups: true, customAliases: true }, false, false), false)
})

check("the Turnstile script is Cloudflare's explicit-render URL and a pending check waits 5 s", () => {
  assert.equal(TURNSTILE_SCRIPT_URL, "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit")
  assert.equal(HUMAN_CHECK_WAIT_MS, 5000)
})

check("nextTurnstileState: a token arrives, expires or fails", () => {
  assert.deepEqual(NO_TURNSTILE_TOKEN, { token: null, receivedAt: null, interactive: false, boxShown: false })
  const ready = nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "token", token: "abc", at: 1000 })
  assert.deepEqual(ready, { token: "abc", receivedAt: 1000, interactive: false, boxShown: false })
  assert.deepEqual(nextTurnstileState(ready, { type: "token", token: "def", at: 2000 }), { token: "def", receivedAt: 2000, interactive: false, boxShown: false })
  assert.deepEqual(nextTurnstileState(ready, { type: "expired" }), NO_TURNSTILE_TOKEN)
  assert.deepEqual(nextTurnstileState(ready, { type: "error" }), NO_TURNSTILE_TOKEN)
  assert.deepEqual(nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "error" }), NO_TURNSTILE_TOKEN)
})

check("turnstileResetsAfterEveryAttempt", () => {
  const ready = nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "token", token: "abc", at: 1000 })
  assert.deepEqual(nextTurnstileState(ready, { type: "submitted" }), NO_TURNSTILE_TOKEN)
  assert.deepEqual(nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "submitted" }), NO_TURNSTILE_TOKEN)
  const again = nextTurnstileState(nextTurnstileState(ready, { type: "submitted" }), { type: "token", token: "fresh", at: 3000 })
  assert.deepEqual(again, { token: "fresh", receivedAt: 3000, interactive: false, boxShown: false })
})

check("nextTurnstileState: the box the visitor ticks is shown, then left", () => {
  const shown = nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "interactive" })
  assert.deepEqual(shown, { token: null, receivedAt: null, interactive: true, boxShown: true })
  const left = nextTurnstileState(shown, { type: "settled" })
  assert.deepEqual(left, { token: null, receivedAt: null, interactive: false, boxShown: true })
  assert.deepEqual(nextTurnstileState(shown, { type: "token", token: "abc", at: 5000 }), { token: "abc", receivedAt: 5000, interactive: false, boxShown: true })
  assert.deepEqual(nextTurnstileState(shown, { type: "error" }), { token: null, receivedAt: null, interactive: false, boxShown: true })
  assert.deepEqual(nextTurnstileState(shown, { type: "expired" }), { token: null, receivedAt: null, interactive: false, boxShown: true })
  assert.deepEqual(nextTurnstileState(shown, { type: "submitted" }), NO_TURNSTILE_TOKEN)
  assert.equal(TICK_THE_BOX, "Tick the box above to continue.")
})

check("humanCheckRefusal: an invisible check that fails says it couldn't confirm you; a shown box or no check says to complete it", () => {
  assert.equal(HUMAN_CHECK_UNCONFIRMED, "The check couldn't confirm you're a person. Try again, or sign in.")
  assert.equal(humanCheckRefusal(NO_TURNSTILE_TOKEN, true), "unconfirmed")
  assert.equal(humanCheckRefusal(nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "error" }), true), "unconfirmed")
  assert.equal(humanCheckRefusal(nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "token", token: "abc", at: 1 }), true), "unconfirmed")
  assert.equal(humanCheckRefusal(NO_TURNSTILE_TOKEN, false), "complete")
  const shown = nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "interactive" })
  assert.equal(humanCheckRefusal(shown, true), "complete")
  assert.equal(humanCheckRefusal(nextTurnstileState(shown, { type: "error" }), true), "complete")
  assert.equal(humanCheckRefusal(nextTurnstileState(shown, { type: "settled" }), true), "complete")
  assert.equal(humanCheckRefusal(nextTurnstileState(shown, { type: "submitted" }), true), "unconfirmed")
})

check("an unavailable switch is never shown as on", () => {
  assert.equal(NOT_AVAILABLE, "Not available")
  const base = { key: "HUMAN_CHECK", type: "SWITCH", value: true, available: true, unavailableReason: null }
  assert.equal(switchUnavailable(base), false)
  assert.equal(switchChecked(base), true)
  assert.equal(switchChecked({ ...base, value: false }), false)
  const blocked = { ...base, available: false, unavailableReason: "Turnstile keys aren't set, so no check runs." }
  assert.equal(switchUnavailable(blocked), true)
  assert.equal(switchChecked(blocked), false)
  assert.equal(switchUnavailable({ ...blocked, type: "NUMBER", value: 3 }), false)
})

check("freshTurnstileToken: a token older than 290 s counts as expired", () => {
  assert.equal(TURNSTILE_TOKEN_MAX_AGE_MS, 290_000)
  const ready = nextTurnstileState(NO_TURNSTILE_TOKEN, { type: "token", token: "abc", at: 1_000 })
  assert.equal(freshTurnstileToken(ready, 1_000), "abc")
  assert.equal(freshTurnstileToken(ready, 1_000 + 289_999), "abc")
  assert.equal(freshTurnstileToken(ready, 1_000 + 290_000), null)
  assert.equal(freshTurnstileToken(ready, 1_000 + 600_000), null)
  assert.equal(freshTurnstileToken(NO_TURNSTILE_TOKEN, 1_000), null)
})

check("turnstileNeedsReload: only a failed load with no widget loads the script again", () => {
  assert.equal(turnstileNeedsReload(false, true), true)
  assert.equal(turnstileNeedsReload(true, true), false)
  assert.equal(turnstileNeedsReload(false, false), false)
  assert.equal(turnstileNeedsReload(true, false), false)
})

check("noEffectText", () => {
  assert.equal(noEffectText("Same-shape alert"), "Has no effect while Same-shape alert is off.")
})

check("group labels, in the catalogue's order", () => {
  assert.deepEqual(Object.keys(SETTING_GROUP_LABELS), ["ACCESS", "LINKS", "SAFETY", "ALERTS", "DIGEST", "EMAILS", "ABUSE_REPORTS", "APP_DIRECTORIES"])
  assert.deepEqual(Object.values(SETTING_GROUP_LABELS), ["Access", "Links", "Safety", "Alerts", "Digest", "Emails", "Abuse reports", "App directories"])
})

check("safetyOffLines: nothing off", () => {
  assert.deepEqual(safetyOffLines([]), [])
  assert.deepEqual(safetyOffLines([safetySwitch("Blocklist check on new links and clicks", true)]), [])
})

check("safetyOffLines: one safety switch off", () => {
  assert.deepEqual(safetyOffLines([safetySwitch("Blocklist check on new links and clicks", false)]), ["Blocklist check on new links and clicks is off."])
})

check("safetyOffLines: only safety switches count", () => {
  const settings = [
    setting({ type: "SWITCH", label: "Weekly digest", value: false, safety: false }),
    setting({ type: "NUMBER", label: "Hold days", value: 0, safety: true }),
    safetySwitch("Suspicious-link check", false),
  ]
  assert.deepEqual(safetyOffLines(settings), ["Suspicious-link check is off."])
})

check("safetyOffLines: several, in the order given", () => {
  const settings = [safetySwitch("Nightly destination check", false), safetySwitch("Blocklist check on new links and clicks", true), safetySwitch("Nightly Safe Browsing recheck", false)]
  assert.deepEqual(safetyOffLines(settings), ["Nightly destination check is off.", "Nightly Safe Browsing recheck is off."])
})

check("safetyOffLines: a child switch is not listed while its parent is off", () => {
  const parent = safetySwitch("Google Safe Browsing check on new links", false, { key: "SAFE_BROWSING_CHECK" })
  const child = safetySwitch("Refuse links when Google Safe Browsing is down", false, { key: "SAFE_BROWSING_FAIL_CLOSED", parent: "SAFE_BROWSING_CHECK" })
  assert.deepEqual(safetyOffLines([parent, child]), ["Google Safe Browsing check on new links is off."])
  assert.deepEqual(safetyOffLines([child, parent]), ["Google Safe Browsing check on new links is off."])
})

check("safetyOffLines: a child switch is listed while its parent is on", () => {
  const parent = safetySwitch("Google Safe Browsing check on new links", true, { key: "SAFE_BROWSING_CHECK" })
  const child = safetySwitch("Refuse links when Google Safe Browsing is down", false, { key: "SAFE_BROWSING_FAIL_CLOSED", parent: "SAFE_BROWSING_CHECK" })
  assert.deepEqual(safetyOffLines([parent, child]), ["Refuse links when Google Safe Browsing is down is off."])
})

check("safetyOffLines: a grandchild follows the same rule", () => {
  const top = safetySwitch("Top", false, { key: "SAFE_BROWSING_CHECK" })
  const middle = setting({ key: "SAFE_BROWSING_FAIL_CLOSED", type: "NUMBER", parent: "SAFE_BROWSING_CHECK", value: 1 })
  const bottom = safetySwitch("Bottom", false, { key: "BLOCKLIST_CHECK", parent: "SAFE_BROWSING_FAIL_CLOSED" })
  assert.deepEqual(safetyOffLines([top, middle, bottom]), ["Top is off."])
})

const catalogue = () => [
  setting({ key: "ANONYMOUS_LINKS", group: "ACCESS", type: "SWITCH", label: "Links without an account", description: "Visitors can make short links without signing in.", parent: null, value: true, defaultValue: true }),
  setting({ key: "NEW_SIGNUPS", group: "ACCESS", type: "SWITCH", label: "New sign-ups", description: "New accounts can be created, with email or a sign-in provider.", parent: null, value: true, defaultValue: true }),
  setting({ key: "ANONYMOUS_LINKS_PER_HOUR", group: "ACCESS", label: "Links without an account per network per hour", description: "Counted over a fixed hour.", parent: "ANONYMOUS_LINKS", unit: "links" }),
  setting({ key: "CUSTOM_ALIASES", group: "LINKS", type: "SWITCH", label: "Custom aliases", description: "Signed-in users choose their own short link.", parent: null }),
  setting({ key: "SAME_SHAPE_ALERT", group: "ALERTS", type: "SWITCH", label: "Same-shape alert", description: "A Discord alert.", parent: null }),
  setting({ key: "CAMPAIGN_LINKS", group: "ALERTS", label: "Same-shape alert: links", description: "Links without an account that share one URL shape.", parent: "SAME_SHAPE_ALERT" }),
  setting({ key: "WEEKLY_DIGEST", group: "DIGEST", type: "SWITCH", label: "Weekly digest", description: "Monday's summary in Discord.", parent: null }),
  setting({ key: "CAMPAIGN_HOLD", group: "SAFETY", type: "SWITCH", label: "Hold links", description: "Holds the links of a same-shape alert.", parent: null }),
]

const layout = (groups) => groups.map((entry) => ({ group: entry.group, rows: entry.rows.map((row) => `${row.indented ? "  " : ""}${row.setting.key}`) }))

check("groupSettings: groups in the catalogue's order, children under their parent", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "")), [
    { group: "ACCESS", rows: ["ANONYMOUS_LINKS", "  ANONYMOUS_LINKS_PER_HOUR", "NEW_SIGNUPS"] },
    { group: "LINKS", rows: ["CUSTOM_ALIASES"] },
    { group: "SAFETY", rows: ["CAMPAIGN_HOLD"] },
    { group: "ALERTS", rows: ["SAME_SHAPE_ALERT", "  CAMPAIGN_LINKS"] },
    { group: "DIGEST", rows: ["WEEKLY_DIGEST"] },
  ])
})

const offParents = (groups) => Object.fromEntries(groups.flatMap((entry) => entry.rows.map((row) => [row.setting.key, row.offParent])))

check("groupSettings: a child under an off parent names it, any other row has none", () => {
  const settings = catalogue().map((entry) => (entry.key === "SAME_SHAPE_ALERT" ? { ...entry, value: false } : entry))
  const parents = offParents(groupSettings(settings, ""))
  assert.equal(parents.CAMPAIGN_LINKS, "Same-shape alert")
  assert.equal(parents.SAME_SHAPE_ALERT, null)
  assert.equal(parents.ANONYMOUS_LINKS_PER_HOUR, null)
  assert.equal(parents.CUSTOM_ALIASES, null)
})

check("groupSettings: a grandchild names the nearest off ancestor, and the parent is looked up past the filter", () => {
  const top = setting({ key: "SAME_SHAPE_ALERT", type: "SWITCH", label: "Top", parent: null, value: false })
  const middle = setting({ key: "CAMPAIGN_LINKS", type: "SWITCH", label: "Middle", parent: "SAME_SHAPE_ALERT", value: true })
  const bottom = setting({ key: "CAMPAIGN_HOLD", label: "Bottom", description: "Only this one matches.", parent: "CAMPAIGN_LINKS" })
  assert.equal(offParents(groupSettings([top, middle, bottom], "")).CAMPAIGN_HOLD, "Top")
  assert.equal(offParents(groupSettings([top, middle, bottom], "only this")).CAMPAIGN_HOLD, "Top")
})

check("groupSettings: a child under a number parent or an on parent has none", () => {
  const settings = catalogue()
  assert.equal(offParents(groupSettings(settings, "")).CAMPAIGN_LINKS, null)
})

check("groupSettings: a filter matches the label and the description, ignoring case", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "DISCORD ALERT")), [{ group: "ALERTS", rows: ["SAME_SHAPE_ALERT"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "custom ALIASES")), [{ group: "LINKS", rows: ["CUSTOM_ALIASES"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "  monday ")), [{ group: "DIGEST", rows: ["WEEKLY_DIGEST"] }])
})

check("groupSettings: every word has to match", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "shape account")), [{ group: "ALERTS", rows: ["CAMPAIGN_LINKS"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "shape nonsense")), [])
})

check("groupSettings: a child that matches without its parent is not indented", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "fixed hour")), [{ group: "ACCESS", rows: ["ANONYMOUS_LINKS_PER_HOUR"] }])
})

check("groupSettings: a parent that matches without its children shows alone, and empty groups are left out", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "discord alert")), [{ group: "ALERTS", rows: ["SAME_SHAPE_ALERT"] }])
  assert.deepEqual(layout(groupSettings([], "")), [])
})

check("settingValueText: switches", () => {
  const sw = setting({ type: "SWITCH", unit: null })
  assert.equal(settingValueText(sw, true), "On")
  assert.equal(settingValueText(sw, false), "Off")
})

check("settingValueText: numbers use thousands separators and the unit", () => {
  assert.equal(settingValueText(setting(), 3), "3 links")
  assert.equal(settingValueText(setting({ unit: "clicks" }), 1000), "1,000 clicks")
  assert.equal(settingValueText(setting({ unit: "clicks" }), 100000), "100,000 clicks")
  assert.equal(settingValueText(setting({ unit: "visits" }), 1000000), "1,000,000 visits")
  assert.equal(settingValueText(setting({ unit: "hours" }), 24), "24 hours")
})

check("settingValueText: one takes the singular", () => {
  assert.equal(settingValueText(setting(), 1), "1 link")
  assert.equal(settingValueText(setting({ unit: "days" }), 1), "1 day")
})

check("settingValueText: a percent sign sits next to the number", () => {
  assert.equal(settingValueText(setting({ unit: "%" }), 50), "50%")
  assert.equal(settingValueText(setting({ unit: "%" }), 1), "1%")
})

check("settingValueText: a number without a unit", () => {
  assert.equal(settingValueText(setting({ unit: null }), 12), "12")
})

check("settingValueText: no value shows the none label", () => {
  const never = setting({ unit: "days", nullable: true, noneLabel: "Never" })
  assert.equal(settingValueText(never, null), "Never")
  assert.equal(settingValueText(never, 30), "30 days")
  assert.equal(settingValueText(setting({ unit: "visits", nullable: true, noneLabel: "Unlimited" }), null), "Unlimited")
  assert.equal(settingValueText(setting({ noneLabel: null }), null), "None")
})

check("settingValueText: text", () => {
  const text = setting({ type: "TEXT", unit: null })
  assert.equal(settingValueText(text, "Karlo Hrva"), "Karlo Hrva")
  assert.equal(settingValueText(text, ""), "None")
})

check("settingValueText: addresses are joined with a comma and a space", () => {
  const addresses = setting({ type: "ADDRESSES", unit: null })
  assert.equal(settingValueText(addresses, ["abuse@hrva.cc"]), "abuse@hrva.cc")
  assert.equal(settingValueText(addresses, ["abuse@hrva.cc", "reportphishing@apwg.org"]), "abuse@hrva.cc, reportphishing@apwg.org")
  assert.equal(settingValueText(addresses, []), "None")
})

check("anonymousLinksPaused: only for a signed-out visitor once the settings say so", () => {
  const off = { anonymousLinks: false, newSignups: true, customAliases: true }
  const on = { ...off, anonymousLinks: true }
  assert.equal(anonymousLinksPaused(off, false, false), true)
  assert.equal(anonymousLinksPaused(on, false, false), false)
  assert.equal(anonymousLinksPaused(off, true, false), false)
})

check("anonymousLinksPaused: loading or failed settings and a loading sign-in leave the form alone", () => {
  const off = { anonymousLinks: false, newSignups: true, customAliases: true }
  assert.equal(anonymousLinksPaused(undefined, false, false), false)
  assert.equal(anonymousLinksPaused(off, false, true), false)
})

check("signupsPaused: only when the settings say so", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.equal(signupsPaused({ ...base, newSignups: false }), true)
  assert.equal(signupsPaused(base), false)
  assert.equal(signupsPaused(undefined), false)
})

check("aliasFieldShown: hidden only on hrva.cc links while aliases are off", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  const off = { ...base, customAliases: false }
  assert.equal(aliasFieldShown(off, null), false)
  assert.equal(aliasFieldShown(off, "go.example.com"), true)
  assert.equal(aliasFieldShown(base, null), true)
  assert.equal(aliasFieldShown(undefined, null), true)
})

check("anonymousLimitLine: days, visits, both, singular and none", () => {
  assert.equal(anonymousLimitLine(30, null), "Links made without an account stop working after 30 days.")
  assert.equal(anonymousLimitLine(null, 100), "Links made without an account stop working after 100 visits.")
  assert.equal(anonymousLimitLine(30, 100), "Links made without an account stop working after 30 days or 100 visits, whichever comes first.")
  assert.equal(anonymousLimitLine(1, null), "Links made without an account stop working after 1 day.")
  assert.equal(anonymousLimitLine(null, 1), "Links made without an account stop working after 1 visit.")
  assert.equal(anonymousLimitLine(1, 1), "Links made without an account stop working after 1 day or 1 visit, whichever comes first.")
  assert.equal(anonymousLimitLine(3650, 1000000), "Links made without an account stop working after 3,650 days or 1,000,000 visits, whichever comes first.")
  assert.equal(anonymousLimitLine(null, null), null)
})

check("anonymousLimitLineShown: signed-out visitors, settings loaded, links not paused", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true, anonymousExpiryDays: 30, anonymousVisitLimit: null }
  const line = "Links made without an account stop working after 30 days."
  assert.equal(anonymousLimitLineShown(base, false, false), line)
  assert.equal(anonymousLimitLineShown(base, true, false), null)
  assert.equal(anonymousLimitLineShown(base, false, true), null)
  assert.equal(anonymousLimitLineShown(undefined, false, false), null)
  assert.equal(anonymousLimitLineShown({ ...base, anonymousLinks: false }, false, false), null)
  assert.equal(anonymousLimitLineShown({ ...base, anonymousExpiryDays: null }, false, false), null)
  const old = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.equal(anonymousLimitLineShown(old, false, false), null)
  assert.equal(anonymousLimitLineShown({ ...base, anonymousExpiryDays: undefined, anonymousVisitLimit: 100 }, false, false), "Links made without an account stop working after 100 visits.")
})

check("providers: hidden only on an explicit false", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.equal(providerShown(undefined, "GOOGLE"), true)
  assert.equal(providerShown(base, "GITHUB"), true)
  assert.equal(providerShown({ ...base, googleSignIn: true, githubSignIn: true }, "GOOGLE"), true)
  assert.equal(providerShown({ ...base, googleSignIn: false }, "GOOGLE"), false)
  assert.equal(providerShown({ ...base, googleSignIn: false }, "GITHUB"), true)
  assert.equal(providerShown({ ...base, githubSignIn: false }, "GITHUB"), false)
  assert.deepEqual(providersOff(undefined), [])
  assert.deepEqual(providersOff({ ...base, githubSignIn: false }), ["GITHUB"])
  assert.deepEqual(providersOff({ ...base, googleSignIn: false, githubSignIn: false }), ["GOOGLE", "GITHUB"])
})

check("providerButtonsLayout: one column for one button, no divider for none", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.deepEqual(providerButtonsLayout(undefined), { shown: ["GOOGLE", "GITHUB"], columns: 2, divider: true })
  assert.deepEqual(providerButtonsLayout({ ...base, googleSignIn: false }), { shown: ["GITHUB"], columns: 1, divider: true })
  assert.deepEqual(providerButtonsLayout({ ...base, githubSignIn: false }), { shown: ["GOOGLE"], columns: 1, divider: true })
  assert.deepEqual(providerButtonsLayout({ ...base, googleSignIn: false, githubSignIn: false }), { shown: [], columns: 2, divider: false })
})

check("provider texts never send a provider-only account to its email and password", () => {
  assert.equal(
    providerDisabledText("GOOGLE"),
    "Google sign-in is turned off on hrva.cc right now. Sign in with your password or a passkey. No password yet? Use Forgot password to set one.",
  )
  assert.equal(providerDisabledText("GITHUB").startsWith("GitHub sign-in is turned off on hrva.cc right now."), true)
  assert.equal(providerDisabledText(null).startsWith("That sign-in is turned off on hrva.cc right now."), true)
  assert.ok(!providerDisabledText("GOOGLE").includes("email and password"))
  assert.equal(providerDisabledHeading("GOOGLE"), "Google sign-in is off")
  assert.equal(providerDisabledHeading("GITHUB"), "GitHub sign-in is off")
  assert.equal(providerDisabledHeading(null), "That sign-in is off")
  assert.equal(providerDisabledText("GOOGLE").split(FORGOT_PASSWORD_LABEL).length, 2)
  assert.equal(providersOffText([]), null)
  assert.equal(providersOffText(["GOOGLE"]), "Sign in with Google is turned off right now.")
  assert.equal(providersOffText(["GITHUB"]), "Sign in with GitHub is turned off right now.")
  assert.equal(providersOffText(["GOOGLE", "GITHUB"]), "Signing in with Google and GitHub is turned off right now.")
})

check("linkEndsText: only the parts that are set", () => {
  assert.equal(linkEndsText("2026-11-29T10:00:00", 500), "This link stops working on Nov 29, 2026 or after 500 visits, whichever comes first.")
  assert.equal(linkEndsText("2026-11-29T10:00:00", 0), "This link stops working on Nov 29, 2026.")
  assert.equal(linkEndsText(undefined, 1), "This link stops working after 1 visit.")
  assert.equal(linkEndsText(undefined, 1000), "This link stops working after 1,000 visits.")
  assert.equal(linkEndsText(undefined, 0), null)
  assert.equal(WARNING_PAGE_NOTE, "People who open this link see its address first, because the site is new or its name looks machine-made.")
})

check("warningPageNote: the review reason only when the backend says the link is being checked", () => {
  assert.equal(WARNING_PAGE_REVIEW_NOTE, "This link is being checked. People who open it see its address first until the check is done.")
  assert.equal(warningPageNote(true), WARNING_PAGE_REVIEW_NOTE)
  assert.equal(warningPageNote(false), WARNING_PAGE_NOTE)
  assert.equal(warningPageNote(null), WARNING_PAGE_NOTE)
  assert.equal(warningPageNote(undefined), WARNING_PAGE_NOTE)
})

check("providerOffSiteWide: only a provider whose public field is false", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.equal(SITE_OFF_TEXT, "Turned off on hrva.cc right now.")
  assert.equal(providerOffSiteWide({ ...base, googleSignIn: false }, "GOOGLE"), true)
  assert.equal(providerOffSiteWide({ ...base, googleSignIn: false }, "GITHUB"), false)
  assert.equal(providerOffSiteWide({ ...base, githubSignIn: false }, "PASSWORD"), false)
  assert.equal(providerOffSiteWide(undefined, "GOOGLE"), false)
})

check("reportStatusText: not reported", () => {
  assert.equal(reportStatusText(null, new Date("2026-10-30T12:00:00Z")), "Not reported")
})

check("reportStatusText: reported, not suspended yet", () => {
  const report = (reportedAt) => ({ reportedAt, reportedBy: "karlo@hrva.cc", registrar: "NameSilo, LLC", suspendedAt: null })
  const now = new Date("2026-10-30T12:00:00Z")
  assert.equal(reportStatusText(report("2026-10-30T00:05:00"), now), "Reported today, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-29T23:59:00"), now), "Reported 1 day ago, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-27T18:00:00Z"), now), "Reported 3 days ago, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-31T01:00:00"), now), "Reported today, not suspended yet")
  assert.equal(reportStatusText(report("2026-09-30T10:00:00"), now), "Reported 30 days ago, not suspended yet")
})

check("reportStatusText: suspended, in UTC MMM d, yyyy", () => {
  const suspended = (suspendedAt) => ({ reportedAt: "2026-10-20T10:00:00", reportedBy: "karlo@hrva.cc", registrar: null, suspendedAt })
  const now = new Date("2026-11-20T12:00:00Z")
  assert.equal(reportStatusText(suspended("2026-10-31T09:00:00"), now), "Suspended on Oct 31, 2026")
  assert.equal(reportStatusText(suspended("2026-11-01T23:30:00Z"), now), "Suspended on Nov 1, 2026")
  assert.equal(reportStatusText(suspended("2026-12-05T00:00:00+02:00"), now), "Suspended on Dec 4, 2026")
})

check("inBatches: at most 100, in order, none for nothing", () => {
  assert.equal(BULK_BLOCK_BATCH, 100)
  assert.deepEqual(inBatches([]), [])
  const domains = Array.from({ length: 250 }, (_, index) => `d${index}.example`)
  const batches = inBatches(domains)
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 50])
  assert.deepEqual(batches.flat(), domains)
  assert.deepEqual(inBatches(domains.slice(0, 100)).map((batch) => batch.length), [100])
  assert.deepEqual(inBatches([1, 2, 3], 2), [[1, 2], [3]])
})

check("addBulkBlock sums the batches", () => {
  const result = (blocked, skipped, linksDeactivated, heldLinksConverted) => ({
    blocked: blocked.map((domain) => ({ domain, linksDeactivated: 0, domainsDisabled: 0, heldLinksConverted: 0 })),
    skipped: skipped.map((domain) => ({ domain, reason: "Already blocked" })),
    linksDeactivated,
    heldLinksConverted,
  })
  const first = addBulkBlock(NO_BULK_BLOCKS, result(["a.example", "b.example"], [], 5, 3))
  const second = addBulkBlock(first, result(["c.example"], ["d.example"], 2, 4))
  assert.deepEqual(second, { blocked: 3, skipped: [{ domain: "d.example", reason: "Already blocked" }], linksDeactivated: 7, heldLinksConverted: 7 })
  assert.deepEqual(NO_BULK_BLOCKS, { blocked: 0, skipped: [], linksDeactivated: 0, heldLinksConverted: 0 })
})

check("blockSummaryText adds held links only when some were kept off", () => {
  const totals = (blocked, linksDeactivated, heldLinksConverted) => ({ blocked, skipped: [], linksDeactivated, heldLinksConverted })
  assert.equal(blockSummaryText(totals(2, 5, 0)), "Blocked 2 domains, 5 links turned off")
  assert.equal(blockSummaryText(totals(1, 1, 1)), "Blocked 1 domain, 1 link turned off, 1 held link kept off")
  assert.equal(blockSummaryText(totals(1200, 3400, 2500)), "Blocked 1,200 domains, 3,400 links turned off, 2,500 held links kept off")
})

check("a failed batch can be retried only for a 503 or a lost connection", () => {
  assert.deepEqual([...RETRYABLE_BLOCK_STATUSES], [0, 503])
})

check("campaignStatusLabel and campaignHoldState: holding, switched off, or run out", () => {
  const now = new Date("2026-10-30T12:00:00Z")
  const future = "2026-11-06T12:00:00"
  const past = "2026-10-29T12:00:00"
  const holding = (extra) => ({ status: "HOLDING", holding: false, activeUntil: future, ...extra })
  assert.equal(campaignStatusLabel(holding({ holding: true }), now), "Holding")
  assert.equal(campaignHoldState(holding({ holding: true }), now), "holding")
  assert.equal(campaignStatusLabel(holding({ holdingOff: "switch" }), now), "Not holding")
  assert.equal(campaignStatusLabel(holding({}), now), "Not holding")
  assert.equal(campaignStatusLabel(holding({ holdingOff: null }), now), "Hold ended")
  assert.equal(campaignStatusLabel(holding({ activeUntil: past }), now), "Hold ended")
  assert.equal(campaignHoldState(holding({ holdingOff: "switch", activeUntil: past }), now), "off")
  assert.equal(campaignStatusLabel({ status: "ALERT_ONLY", holding: false, activeUntil: null }, now), "Alert only")
  assert.equal(campaignStatusLabel({ status: "ALLOWED", holding: false, activeUntil: null }, now), "Allowed")
  assert.equal(campaignHoldState({ status: "ALLOWED", holding: false, activeUntil: null }, now), null)
})

check("heldLinksStayOffText says held links stay off while a campaign isn't holding", () => {
  assert.equal(HELD_LINKS_STAY_OFF, "Held links stay off until you allow the shape.")
  assert.equal(heldLinksStayOffText("off", 3), HELD_LINKS_STAY_OFF)
  assert.equal(heldLinksStayOffText("ended", 1), HELD_LINKS_STAY_OFF)
  assert.equal(heldLinksStayOffText("ended", 0), null)
  assert.equal(heldLinksStayOffText("holding", 3), null)
  assert.equal(heldLinksStayOffText(null, 3), null)
})

check("holdOffReason names the switch that is off", () => {
  const switches = (alert, hold) => [
    setting({ key: "SAME_SHAPE_ALERT", type: "SWITCH", label: "Same-shape alert", value: alert }),
    setting({ key: "CAMPAIGN_HOLD", type: "SWITCH", label: "Hold links with a campaign URL shape", value: hold }),
  ]
  assert.equal(holdOffReason(switches(true, false)), "Hold links with a campaign URL shape is off")
  assert.equal(holdOffReason(switches(false, true)), "Same-shape alert is off")
  assert.equal(holdOffReason(switches(false, false)), "Same-shape alert is off")
  assert.equal(holdOffReason(undefined), "Same-shape alert or Hold links with a campaign URL shape is off")
  assert.equal(holdOffReason(switches(true, true)), "Same-shape alert or Hold links with a campaign URL shape is off")
})

check("campaignRuleText reads the numbers from the settings", () => {
  const numbers = (links, domains, hours) => [
    setting({ key: "CAMPAIGN_LINKS", value: links }),
    setting({ key: "CAMPAIGN_DOMAINS", value: domains }),
    setting({ key: "CAMPAIGN_WINDOW_HOURS", value: hours }),
  ]
  assert.equal(campaignRuleText(numbers(3, 3, 24)), "One appears when 3 links without an account share a URL shape on 3 domains within 24 hours.")
  assert.equal(campaignRuleText(numbers(5, 1, 1)), "One appears when 5 links without an account share a URL shape on 1 domain within 1 hour.")
  assert.equal(campaignRuleText(undefined), null)
  assert.equal(campaignRuleText(numbers(3, 3, 24).slice(0, 2)), null)
})

check("campaignCountsText and campaignReportsText", () => {
  const campaign = { links: { total: 62, active: 0, held: 58, blocked: 4 }, domains: 39, clicks: 970, reports: { reported: 39, suspended: 12 } }
  assert.equal(campaignCountsText(campaign), "62 links (0 active, 58 held, 4 blocked), 39 domains, 970 clicks")
  assert.equal(campaignReportsText(campaign), "39 of 39 domains reported, 12 suspended")
  const small = { links: { total: 1, active: 1, held: 0, blocked: 0 }, domains: 1, clicks: 1, reports: { reported: 0, suspended: 0 } }
  assert.equal(campaignCountsText(small), "1 link (1 active, 0 held, 0 blocked), 1 domain, 1 click")
  assert.equal(campaignReportsText(small), "0 of 1 domain reported, 0 suspended")
  assert.equal(campaignCountsText({ ...campaign, links: { ...campaign.links, total: 1500 }, clicks: 12000 }), "1,500 links (0 active, 58 held, 4 blocked), 39 domains, 12,000 clicks")
})

check("mailtoHref: to, cc, subject and body, encoded", () => {
  const report = { to: "abuse@namesilo.com", cc: ["reportphishing@apwg.org", "a+b@example.com"], subject: "Phishing: 2 domains used in links to x.sbs", body: "Hello,\n\nI run hrva.cc & more: 50% (a/b)?" }
  assert.equal(
    mailtoHref(report),
    "mailto:abuse@namesilo.com?cc=reportphishing%40apwg.org,a%2Bb%40example.com&subject=Phishing%3A%202%20domains%20used%20in%20links%20to%20x.sbs&body=Hello%2C%0D%0A%0D%0AI%20run%20hrva.cc%20%26%20more%3A%2050%25%20(a%2Fb)%3F",
  )
  assert.equal(mailtoHref({ ...report, cc: [] }).includes("cc="), false)
  assert.equal(mailtoHref({ ...report, cc: [] }).startsWith("mailto:abuse@namesilo.com?subject="), true)
})

check("mailtoHref: null above MAILTO_MAX_LENGTH, the link itself at exactly that length", () => {
  assert.equal(MAILTO_MAX_LENGTH, 2000)
  const report = { to: "abuse@namesilo.com", cc: ["reportphishing@apwg.org"], subject: "Phishing", body: "" }
  const base = mailtoHref(report).length
  const at = (length) => mailtoHref({ ...report, body: "a".repeat(length - base) })
  assert.equal(at(1999).length, 1999)
  assert.equal(at(2000).length, 2000)
  assert.equal(at(2001), null)
  const withBreaks = (length) => mailtoHref({ ...report, body: "\n" + "a".repeat(length - base - 6) })
  assert.equal(withBreaks(2000).length, 2000)
  assert.equal(withBreaks(2001), null)
  const crlf = mailtoHref({ ...report, body: "a\nb\r\nc" })
  assert.ok(crlf.endsWith("body=a%0D%0Ab%0D%0Ac"))
  const lines = mailtoHref({ ...report, body: "line\n".repeat(200) })
  assert.equal(lines, null)
  assert.notEqual(mailtoHref({ ...report, body: "line\n".repeat(100) }), null)
})

check("mailtoHref: a lone surrogate gives null instead of throwing", () => {
  const report = { to: "abuse@namesilo.com", cc: [], subject: "Phishing", body: "see https://x.example/\ud800" }
  assert.equal(mailtoHref(report), null)
  assert.equal(mailtoHref({ ...report, body: "ok", subject: "bad\udc00" }), null)
  assert.equal(mailtoHref({ ...report, body: "ok", cc: ["a\ud800@example.com"] }), null)
  assert.notEqual(mailtoHref({ ...report, body: "ok" }), null)
})

check("markedText and markedStatus", () => {
  assert.equal(markedText(1), "Marked 1 domain as reported")
  assert.equal(markedText(39), "Marked 39 domains as reported")
  assert.equal(markedText(1200), "Marked 1,200 domains as reported")
  const now = new Date("2026-10-30T12:00:00Z")
  const fresh = markedStatus(null, "NameSilo, LLC", now)
  assert.deepEqual(fresh, { reportedAt: "2026-10-30T12:00:00.000Z", reportedBy: "", registrar: "NameSilo, LLC", suspendedAt: null })
  assert.equal(reportStatusText(fresh, now), "Reported today, not suspended yet")
  const suspended = { reportedAt: "2026-10-20T10:00:00", reportedBy: "karlo@hrva.cc", registrar: null, suspendedAt: "2026-10-25T09:00:00" }
  assert.equal(reportStatusText(markedStatus(suspended, "NameSilo, LLC", now), now), "Suspended on Oct 25, 2026")
  assert.equal(LOOKUP_FAILED, "Lookup failed. Try again.")
})

check("copying only To, Cc or Subject marks nothing; the body and the whole email mark", () => {
  assert.equal(copyMarksReported("to"), false)
  assert.equal(copyMarksReported("cc"), false)
  assert.equal(copyMarksReported("subject"), false)
  assert.equal(copyMarksReported("body"), true)
  assert.equal(copyMarksReported("all"), true)
})

check("reportAsText: To, Cc when there is one, Subject, a blank line, the body", () => {
  const report = { to: "abuse@namesilo.com", cc: ["a@example.com", "b@example.com"], subject: "Abuse report", body: "Hello\nBye" }
  assert.equal(reportAsText(report), "To: abuse@namesilo.com\nCc: a@example.com, b@example.com\nSubject: Abuse report\n\nHello\nBye")
  assert.equal(reportAsText({ ...report, cc: [] }), "To: abuse@namesilo.com\nSubject: Abuse report\n\nHello\nBye")
})

check("noContactText: lookup failed, no registry, or no abuse email", () => {
  const entry = { domain: "example.hr", registrar: null }
  assert.equal(noContactText({ ...entry, lookupFailed: true }), LOOKUP_FAILED)
  assert.equal(noContactText({ ...entry, lookupFailed: true, reason: "noRegistry" }), LOOKUP_FAILED)
  assert.equal(noContactText({ ...entry, reason: "noRegistry" }), "No registry lookup for .hr")
  assert.equal(noContactText({ domain: "a.b.co.uk", registrar: null, reason: "noRegistry" }), "No registry lookup for .uk")
  assert.equal(noContactText({ ...entry, reason: "lookupFailed" }), LOOKUP_FAILED)
  assert.equal(noContactText({ ...entry, reason: "sharedSuffix" }), "Shared hosting domain: report it to the hosting provider")
  assert.equal(noContactText({ ...entry, reason: "notRegistered" }), "The registry has no record of this domain")
  assert.equal(noContactText({ ...entry, reason: "noAbuseEmail" }), "No abuse email in the registry record")
  assert.equal(noContactText(entry), "No abuse email in the registry record")
  assert.equal(noContactText({ ...entry, reason: null, registrar: "NameSilo, LLC" }), "No abuse email in the registry record. Registrar: NameSilo, LLC")
})

check("blockTotalsText sums the domains, held links and active links", () => {
  const row = (heldLinks, activeLinks) => ({ domain: "x", hosts: ["x"], selectedLinks: 1, activeLinks, heldLinks, rule: null })
  assert.equal(blockTotalsText([row(1, 0), row(1, 0)]), "2 domains, 2 held links, 0 active links on the site")
  assert.equal(blockTotalsText([row(1, 1)]), "1 domain, 1 held link, 1 active link on the site")
})

check("reviewBadgeCounts keeps links, bio pages, domain applications and limit requests apart", () => {
  const found = (totalElements) => ({ status: "fulfilled", value: { totalElements } })
  const failed = { status: "rejected", reason: new Error("down") }
  assert.deepEqual(reviewBadgeCounts([found(0), found(0), found(1), found(0)]), { links: 0, bioPages: 0, domains: 1, domainRequests: 0, total: 1 })
  assert.deepEqual(reviewBadgeCounts([found(2), found(3), found(4), found(5)]), { links: 2, bioPages: 3, domains: 4, domainRequests: 5, total: 14 })
  assert.deepEqual(reviewBadgeCounts([found(2), failed, found(4), failed]), { links: 2, bioPages: 0, domains: 4, domainRequests: 0, total: 6 })
  assert.throws(() => reviewBadgeCounts([failed, failed, failed, failed]), /down/)
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/moderation.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/moderation.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(moderation))) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
