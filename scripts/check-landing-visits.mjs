import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { landingVisitOf, writeLandingVisit } = await import("../lib/landing-visits.ts")

let failures = 0

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const requestOf = (path, { host = "app.hrva.cc", method = "GET", dest = "document", referer, cf } = {}) => {
  const headers = new Headers()
  if (dest !== null) headers.set("sec-fetch-dest", dest)
  if (referer !== undefined) headers.set("referer", referer)
  const request = new Request(`https://${host}${path}`, { method, headers })
  if (cf) Object.defineProperty(request, "cf", { value: cf })
  return request
}

const page = (status = 200) => new Response("<html></html>", { status, headers: { "content-type": "text/html" } })

const visitOf = (path, options, status) => landingVisitOf(requestOf(path, options), page(status))

await check("aChatGptCitationIsCountedAsUtm", () => {
  assert.deepEqual(visitOf("/?utm_source=chatgpt.com"), { source: "chatgpt.com", kind: "utm", page: "/" })
  assert.deepEqual(visitOf("/?utm_source=ChatGPT.com", { referer: "https://chatgpt.com/" }), { source: "chatgpt.com", kind: "utm", page: "/" })
})

await check("aRefererIsReducedToItsHost", () => {
  assert.deepEqual(visitOf("/", { referer: "https://www.google.com/search?q=x" }), { source: "google.com", kind: "referrer", page: "/" })
  assert.deepEqual(visitOf("/", { referer: "HTTPS://News.Example.ORG:8443/a/b?c=d#e" }), { source: "news.example.org", kind: "referrer", page: "/" })
})

await check("noRefererIsDirect", () => {
  assert.deepEqual(visitOf("/"), { source: "direct", kind: "direct", page: "/" })
  assert.deepEqual(visitOf("/", { referer: "" }), { source: "direct", kind: "direct", page: "/" })
  assert.deepEqual(visitOf("/", { referer: "not a url" }), { source: "direct", kind: "direct", page: "/" })
  assert.deepEqual(visitOf("/?utm_source=", { referer: "https://bing.com/" }), { source: "bing.com", kind: "referrer", page: "/" })
})

await check("aStrangeUtmSourceBecomesOther", () => {
  assert.deepEqual(visitOf("/?utm_source=%3Cscript%3E"), { source: "other", kind: "utm", page: "/" })
  assert.deepEqual(visitOf(`/?utm_source=${"a".repeat(65)}`), { source: "other", kind: "utm", page: "/" })
  assert.equal(visitOf(`/?utm_source=${"a".repeat(64)}`).source, "a".repeat(64))
})

await check("anInternalRefererIsNotCounted", () => {
  assert.equal(visitOf("/", { referer: "https://app.hrva.cc/x" }), null)
  assert.equal(visitOf("/", { referer: "https://hrva.cc/" }), null)
  assert.equal(visitOf("/?utm_source=chatgpt.com", { referer: "https://hrva.cc/" }), null)
  assert.notEqual(visitOf("/", { referer: "https://nothrva.cc/" }), null)
})

await check("theConnectBridgeIsNotALanding", () => {
  assert.equal(visitOf("/connect?client=x", { referer: "https://chatgpt.com/" }), null)
  assert.equal(visitOf("/connect/done", { referer: "https://chatgpt.com/" }), null)
})

await check("tokenPagesAreNeverCounted", () => {
  for (const path of ["/reset-password/abc", "/reset-password/abc?x=1", "/verify-email/xyz", "/unsubscribe?t=1", "/unsubscribe"]) assert.equal(visitOf(path), null, path)
})

await check("theQueryIsAlwaysDropped", () => {
  assert.equal(visitOf("/blog/hello?token=secret#frag").page, "/blog/hello")
  assert.equal(visitOf("/pricing?email=a%40b.c&utm_source=x").page, "/pricing")
  assert.equal(visitOf("/help/faq/?a=1").page, "/help/faq")
  assert.equal(visitOf("/", { referer: "https://example.com/p?token=1" }).page, "/")
})

await check("bioAndValidateAreCollapsed", () => {
  assert.equal(visitOf("/bio/karlo").page, "/bio/*")
  assert.equal(visitOf("/validate/abc123").page, "/validate/*")
})

await check("blogAndHelpPagesKeepTheirSlug", () => {
  assert.equal(visitOf("/blog/why-we-exist").page, "/blog/why-we-exist")
  assert.equal(visitOf("/help/api-keys").page, "/help/api-keys")
  assert.equal(visitOf("/blog/Bad_Slug").page, "/blog/*")
  assert.equal(visitOf(`/help/${"a".repeat(81)}`).page, "/help/*")
  assert.equal(visitOf("/blog").page, "/blog")
})

await check("aStrangeDeepPathIsOther", () => {
  assert.equal(visitOf("/a/b/c").page, "other")
  assert.equal(visitOf("/Some_Page").page, "other")
  assert.equal(visitOf("/pricing/x%20y").page, "other")
  assert.equal(visitOf("/about").page, "/about")
  assert.equal(visitOf("/legal/privacy").page, "/legal/privacy")
})

await check("onlyDocumentNavigationsCount", () => {
  assert.equal(visitOf("/", { dest: null }), null)
  assert.equal(visitOf("/", { dest: "empty" }), null)
  assert.equal(visitOf("/", { dest: "image" }), null)
  assert.equal(visitOf("/", { method: "POST" }), null)
  assert.equal(visitOf("/", { method: "HEAD" }), null)
})

await check("verifiedBotsAreSkipped", () => {
  assert.equal(visitOf("/", { cf: { verifiedBotCategory: "Search Engine Crawler" } }), null)
  assert.notEqual(visitOf("/", { cf: { botManagement: {} } }), null)
})

await check("notFoundAndRedirectsAreSkipped", () => {
  for (const status of [301, 302, 404, 410, 500]) assert.equal(visitOf("/", {}, status), null, String(status))
  assert.equal(visitOf("/wp-login.php"), null)
  assert.equal(visitOf("/.env"), null)
})

await check("adminAndDashboardAreSkipped", () => {
  for (const path of ["/admin", "/admin/settings", "/dashboard", "/dashboard/settings", "/auth/callback", "/launch", "/offline", "/share", "/protected/x", "/unavailable?reason=missing"]) assert.equal(visitOf(path), null, path)
})

await check("otherHostsAreSkipped", () => {
  assert.equal(visitOf("/", { host: "hrva.cc" }), null)
  assert.equal(visitOf("/", { host: "go.hrva.cc" }), null)
  assert.equal(visitOf("/", { host: "example.com" }), null)
})

await check("aMissingBindingIsIgnored", () => {
  const visit = { source: "direct", kind: "direct", page: "/" }
  assert.doesNotThrow(() => writeLandingVisit(undefined, visit))
  const points = []
  writeLandingVisit({ writeDataPoint: (point) => points.push(point) }, null)
  assert.deepEqual(points, [])
})

await check("aFailingDatasetNeverBreaksTheResponse", () => {
  const dataset = {
    writeDataPoint: () => {
      throw new Error("boom")
    },
  }
  assert.doesNotThrow(() => writeLandingVisit(dataset, { source: "direct", kind: "direct", page: "/" }))
  assert.doesNotThrow(() => writeLandingVisit({}, { source: "direct", kind: "direct", page: "/" }))
})

await check("theDataPointHasTheAgreedShape", () => {
  const points = []
  writeLandingVisit({ writeDataPoint: (point) => points.push(point) }, { source: "chatgpt.com", kind: "utm", page: "/blog/x" })
  assert.deepEqual(points, [{ blobs: ["chatgpt.com", "utm", "/blog/x"], doubles: [1], indexes: ["utm"] }])
})

await check("theWorkerCountsTheFinalResponseWithoutWaiting", async () => {
  const { readFile } = await import("node:fs/promises")
  const worker = await readFile(new URL("../custom-worker.mjs", import.meta.url), "utf8")
  assert.match(worker, /writeLandingVisit\(env\.LANDING_VISITS, landingVisitOf\(request, response\)\)\n\s+return response/)
  assert.doesNotMatch(worker, /await writeLandingVisit/)
  const config = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8")
  assert.match(config, /"binding": "LANDING_VISITS", "dataset": "hrva_landings"/)
})

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
