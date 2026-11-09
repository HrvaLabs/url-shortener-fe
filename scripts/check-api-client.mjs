import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
}
globalThis.document = { createElement: () => ({ click() {}, appendChild() {} }), createTextNode: () => ({}), getElementsByTagName: () => [{ appendChild() {} }], head: { appendChild() {} } }
URL.createObjectURL = () => "blob:check"
URL.revokeObjectURL = () => {}

const { ApiError, DATABASE_UNREACHABLE, publicApi, RESTART_RETRY_WINDOW_MS, SESSION_ENDED, adminApi, authApi, backendRestartingSince, isOutage, isRestartError, linkScreenshotPath, noteBackendAnswered, noteBackendFailed, onBackendRecovered, perQueryRetry, restartTooLong, onAdminTwoStepRequired, onSessionEnded, retryDelay, retryUnlessRefused, shouldRetry, urlApi, userApi, withinRestartWindow } = await import("../lib/api-client.ts")
const { ADMIN_TWO_STEP_REQUIRED } = await import("../lib/admin-two-step.ts")
const { VISIT_LIMIT_HINT, opensText, shortLinkOf } = await import("../lib/utils.ts")

let failures = 0
let answer = () => new Response("")
const sent = []
globalThis.fetch = async (url, init) => {
  sent.push({ url, method: init?.method, authorization: init?.headers?.Authorization, body: init?.body, cache: init?.cache })
  return answer()
}

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const problem = (status, detail) =>
  new Response(JSON.stringify({ type: "about:blank", title: "Unauthorized", status, detail }), { status, headers: { "Content-Type": "application/problem+json" } })

const downloads = [
  ["urlApi.exportCsv", () => urlApi.exportCsv(), "id,shortUrl\n"],
  ["userApi.exportMyData", () => userApi.exportMyData(), "{\"email\":\"ana@hrva.cc\"}"],
  ["adminApi.exportUrlsCsv", () => adminApi.exportUrlsCsv(), "id,shortUrl\n"],
]

const SIGN_IN_TO_CONTINUE = "Sign in to continue."
const base64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url")
const jwt = (expiresAt) => `Bearer ${base64url({ alg: "HS512" })}.${base64url({ sub: "ana@hrva.cc", exp: Math.floor(expiresAt / 1000) })}.signature`
const expiredToken = () => jwt(Date.now() - 60_000)
const liveToken = () => jwt(Date.now() + 3_600_000)

const listCalls = [
  ["urlApi.getMyUrls", () => urlApi.getMyUrls()],
  ["userApi.getMe", () => userApi.getMe()],
  ["userApi.renewSession", () => userApi.renewSession()],
]

for (const [name, call] of [...listCalls, ...downloads]) {
  await check(`${name} ends the session on a 401 for a stored token that has expired`, async () => {
    stored.set("auth-token", expiredToken())
    const heard = []
    onSessionEnded((message) => heard.push(message))
    answer = () => problem(401, SIGN_IN_TO_CONTINUE)
    await assert.rejects(call(), (error) => error instanceof ApiError && error.status === 401 && error.message === SESSION_ENDED)
    assert.equal(localStorage.getItem("auth-token"), null)
    assert.deepEqual(heard, [SESSION_ENDED])
    onSessionEnded(null)
  })

  await check(`${name} keeps a token that hasn't expired on a single 401`, async () => {
    const live = liveToken()
    stored.set("auth-token", live)
    const heard = []
    onSessionEnded((message) => heard.push(message))
    answer = () => problem(401, SIGN_IN_TO_CONTINUE)
    await assert.rejects(call(), (error) => error instanceof ApiError && error.status === 401 && error.message === SIGN_IN_TO_CONTINUE)
    assert.equal(localStorage.getItem("auth-token"), live)
    assert.deepEqual(heard, [])
    onSessionEnded(null)
  })
}

await check("an expired token replaced while the call ran is not signed out", async () => {
  const live = liveToken()
  stored.set("auth-token", expiredToken())
  const heard = []
  onSessionEnded((message) => heard.push(message))
  answer = () => {
    stored.set("auth-token", live)
    return problem(401, SIGN_IN_TO_CONTINUE)
  }
  await assert.rejects(urlApi.getMyUrls(), (error) => error.status === 401 && error.message === SIGN_IN_TO_CONTINUE)
  assert.equal(localStorage.getItem("auth-token"), live)
  assert.deepEqual(heard, [])
  onSessionEnded(null)
})

await check("an expired token is only signed out on a 401", async () => {
  const expired = expiredToken()
  const heard = []
  onSessionEnded((message) => heard.push(message))
  for (const status of [400, 403, 404, 429, 500]) {
    stored.set("auth-token", expired)
    answer = () => problem(status, "Nope")
    await assert.rejects(urlApi.getMyUrls(), (error) => error.status === status)
    assert.equal(localStorage.getItem("auth-token"), expired, String(status))
  }
  assert.deepEqual(heard, [])
  onSessionEnded(null)
})

await check("a 401 without a stored token ends no session", async () => {
  stored.delete("auth-token")
  const heard = []
  onSessionEnded((message) => heard.push(message))
  answer = () => problem(401, SIGN_IN_TO_CONTINUE)
  await assert.rejects(urlApi.getMyUrls(), (error) => error.status === 401 && error.message === SIGN_IN_TO_CONTINUE)
  assert.deepEqual(heard, [])
  onSessionEnded(null)
})

for (const [name, download, body] of downloads) {
  await check(`${name} signs out when the session ended elsewhere`, async () => {
    stored.set("auth-token", "Bearer ended")
    const heard = []
    onSessionEnded((message) => heard.push(message))
    answer = () => problem(401, SESSION_ENDED)
    await assert.rejects(download(), (error) => error.message === SESSION_ENDED && error.status === 401)
    assert.equal(localStorage.getItem("auth-token"), null)
    assert.deepEqual(heard, [SESSION_ENDED])
    onSessionEnded(null)
  })

  await check(`${name} keeps other errors' text and the token`, async () => {
    stored.set("auth-token", "Bearer kept")
    answer = () => problem(429, "Too many exports. Try again in an hour.")
    await assert.rejects(download(), (error) => error.message === "Too many exports. Try again in an hour." && error.status === 429)
    assert.equal(localStorage.getItem("auth-token"), "Bearer kept")
  })

  await check(`${name} keeps a renewed token`, async () => {
    stored.set("auth-token", "Bearer old")
    sent.length = 0
    answer = () => new Response(body, { status: 200, headers: { Authorization: "Bearer renewed" } })
    await download()
    assert.equal(sent[0].authorization, "Bearer old")
    assert.equal(localStorage.getItem("auth-token"), "Bearer renewed")
  })
}

await check("checkAlias encodes the name, is never cached and surfaces a 429", async () => {
  sent.length = 0
  answer = () => new Response(JSON.stringify({ name: "a b", status: "INVALID", reason: "x" }), { headers: { "Content-Type": "application/json" } })
  await publicApi.checkAlias("a b/c")
  assert.match(sent[0].url, /\/public\/alias-check\?name=a%20b%2Fc$/)
  assert.equal(sent[0].method, "GET")
  assert.equal(sent[0].cache, "no-store")
  answer = () => problem(429, "Too many requests")
  await assert.rejects(publicApi.checkAlias("karlo"), (error) => error instanceof ApiError && error.status === 429)
})

await check("a page's own toast of the session-ended error joins the sign-out toast", async () => {
  const { toast } = await import("sonner")
  const shown = []
  toast.error = (message, data) => shown.push({ message, id: data?.id })
  const { SESSION_ENDED_TOAST_ID, showSessionEndedOnce } = await import("../lib/session-ended-toast.ts")
  showSessionEndedOnce()
  showSessionEndedOnce()

  toast.error(SESSION_ENDED, { id: SESSION_ENDED_TOAST_ID })
  toast.error(SESSION_ENDED)
  toast.error(SESSION_ENDED, { duration: 5000 })
  toast.error("Too many exports. Try again in an hour.")

  assert.deepEqual(shown.map((entry) => entry.id), [SESSION_ENDED_TOAST_ID, SESSION_ENDED_TOAST_ID, SESSION_ENDED_TOAST_ID, undefined])
  assert.equal(new Set(shown.filter((entry) => entry.message === SESSION_ENDED).map((entry) => entry.id)).size, 1)
})

await check("an admin page answering the two-step 403 tells the listener and keeps the token", async () => {
  stored.set("auth-token", "Bearer admin")
  const heard = []
  onAdminTwoStepRequired((message) => heard.push(message))
  answer = () => problem(403, ADMIN_TWO_STEP_REQUIRED)
  await assert.rejects(adminApi.getReviewQueue({ size: 1 }), (error) => error.message === ADMIN_TWO_STEP_REQUIRED && error.status === 403)
  await assert.rejects(adminApi.exportUrlsCsv(), (error) => error.message === ADMIN_TWO_STEP_REQUIRED && error.status === 403)
  assert.deepEqual(heard, [ADMIN_TWO_STEP_REQUIRED, ADMIN_TWO_STEP_REQUIRED])
  assert.equal(localStorage.getItem("auth-token"), "Bearer admin")
  onAdminTwoStepRequired(null)
})

await check("any other 403 doesn't", async () => {
  stored.set("auth-token", "Bearer user")
  const heard = []
  onAdminTwoStepRequired((message) => heard.push(message))
  answer = () => problem(403, "Access denied")
  await assert.rejects(adminApi.getReviewQueue({ size: 1 }), (error) => error.message === "Access denied")
  assert.deepEqual(heard, [])
  onAdminTwoStepRequired(null)
})

await check("urlApi.create reads a 201 answer with its shortLink", async () => {
  stored.set("auth-token", "Bearer kept")
  const created = { id: 7, shortUrl: "Ab3", longUrl: "https://example.com", shortLink: "https://hrva.cc/Ab3" }
  answer = () => new Response(JSON.stringify(created), { status: 201, headers: { "Content-Type": "application/json", Location: "https://hrva.cc/api/v1/urls/Ab3/peek" } })
  const link = await urlApi.create({ longUrl: "https://example.com" })
  assert.equal(link.shortLink, "https://hrva.cc/Ab3")
  assert.equal(shortLinkOf(link), "https://hrva.cc/Ab3")
})

await check("a screenshot is fetched by its takenAt and never from the browser's cache", async () => {
  stored.set("auth-token", "Bearer kept")
  assert.equal(linkScreenshotPath(5, "2026-11-03T09:01:00Z"), "/admin/urls/5/inspection/screenshot?v=2026-11-03T09%3A01%3A00Z")
  assert.equal(linkScreenshotPath(5, "2026-11-03T09:01:00.123+01:00"), "/admin/urls/5/inspection/screenshot?v=2026-11-03T09%3A01%3A00.123%2B01%3A00")
  sent.length = 0
  answer = () => new Response(new Uint8Array([0xff, 0xd8]), { status: 200, headers: { "Content-Type": "image/jpeg" } })
  const first = await adminApi.getLinkScreenshot(5, "2026-11-03T09:01:00Z")
  await adminApi.getLinkScreenshot(5, "2026-11-03T10:15:00Z")
  assert.equal(first.size, 2)
  assert.equal(sent.length, 2)
  assert.match(sent[0].url, /\/admin\/urls\/5\/inspection\/screenshot\?v=2026-11-03T09%3A01%3A00Z$/)
  assert.match(sent[1].url, /\/admin\/urls\/5\/inspection\/screenshot\?v=2026-11-03T10%3A15%3A00Z$/)
  assert.deepEqual(sent.map((request) => request.cache), ["no-store", "no-store"])
  assert.equal(sent[0].authorization, "Bearer kept")
})

await check("a VirusTotal lookup posts to the lookup path and accepts the 202", async () => {
  sent.length = 0
  answer = () => new Response(null, { status: 202 })
  await adminApi.lookUpOnVirusTotal(9)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].method, "POST")
  assert.match(sent[0].url, /\/admin\/urls\/9\/inspection\/virustotal\/lookup$/)
  answer = () => problem(409, "VirusTotal isn't set up.")
  await assert.rejects(adminApi.lookUpOnVirusTotal(9), (error) => error.message === "VirusTotal isn't set up." && error.status === 409)
})

await check("shortLinkOf prefers the answer's shortLink and builds one for older answers", () => {
  assert.equal(shortLinkOf({ shortUrl: "menu", shortLink: "https://go.example.com/menu", domain: { id: 7, hostname: "go.example.com" } }), "https://go.example.com/menu")
  assert.equal(shortLinkOf({ shortUrl: "menu", domain: { id: 7, hostname: "go.example.com" } }), "https://go.example.com/menu")
  assert.match(shortLinkOf({ shortUrl: "Ab3" }), /\/Ab3$/)
})

await check("a visit limit counts clicks, not unique visitors", () => {
  assert.equal(VISIT_LIMIT_HINT, "Every click counts, not counting bots.")
  assert.equal(opensText({ opens: 3, visitLimit: 5 }), "3 of 5 clicks used")
  assert.equal(opensText({ opens: 1, visitLimit: 1 }), "1 of 1 click used")
  assert.equal(opensText({ visitLimit: 1200 }), "0 of 1,200 clicks used")
})

await check("the OAuth code is exchanged with the verifier of the browser that started the sign-in", async () => {
  sent.length = 0
  answer = () => new Response(JSON.stringify({ token: "Bearer jwt" }), { status: 200, headers: { "Content-Type": "application/json" } })
  await authApi.exchangeOAuthCode("one-time-code", "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
  assert.equal(sent.length, 1)
  assert.match(sent[0].url, /\/auth\/oauth\/exchange$/)
  assert.deepEqual(JSON.parse(sent[0].body), { code: "one-time-code", verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" })
})

await check("retries wait 1 s, 2 s, 4 s, then 8 s each", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 20].map(retryDelay), [1000, 2000, 4000, 8000, 8000, 8000, 8000])
})

const publicCall = () => fetch("/public").then(() => noteBackendAnswered(false))
const realNow = Date.now
let fakeNow = 0
const withClock = async (run) => {
  noteBackendAnswered()
  Date.now = () => fakeNow
  try {
    await run()
  } finally {
    Date.now = realNow
    noteBackendAnswered()
  }
}

await check("a restart is retried for 120 s of wall-clock time since the backend stopped answering, then given up", () =>
  withClock(() => {
    const restart = new ApiError("Can't reach hrva.cc right now.", 502)
    fakeNow = 1_000_000
    assert.equal(shouldRetry(0, restart), true)
    assert.equal(backendRestartingSince(), 1_000_000)
    fakeNow += 119_000
    assert.equal(shouldRetry(1, restart), true, "the failure count doesn't matter, only the time")
    fakeNow += 1_000
    assert.equal(shouldRetry(2, restart), true)
    fakeNow += 1
    assert.equal(shouldRetry(3, restart), false)
    assert.equal(shouldRetry(3, new TypeError("Failed to fetch")), false)
    assert.equal(retryUnlessRefused(3, new ApiError("down", 503)), false)
    assert.equal(shouldRetry(0, restart), true, "a new request starts its own window")
    assert.equal(RESTART_RETRY_WINDOW_MS, 120_000)
    assert.equal(withinRestartWindow(0, 120_000), true)
    assert.equal(withinRestartWindow(0, 120_001), false)
  }))

await check("the window counts the time a failing request took, from when it was sent", () =>
  withClock(async () => {
    fakeNow = 5_000_000
    answer = () => {
      fakeNow += 3_000
      return problem(502, undefined)
    }
    await assert.rejects(userApi.getMe(), (error) => error.status === 502 && isRestartError(error))
    assert.equal(backendRestartingSince(), 5_000_000)
    assert.equal(restartTooLong(5_000_000 + RESTART_RETRY_WINDOW_MS), false)
    assert.equal(restartTooLong(5_000_000 + RESTART_RETRY_WINDOW_MS + 1), true, "the outage is timed from when the failing request was sent")
  }))

await check("a network failure starts the window when the request was sent", () =>
  withClock(async () => {
    fakeNow = 7_000_000
    const realFetch = globalThis.fetch
    globalThis.fetch = async () => {
      fakeNow += 2_000
      throw new TypeError("Failed to fetch")
    }
    try {
      await assert.rejects(userApi.getMe(), (error) => error.status === 0 && isRestartError(error))
    } finally {
      globalThis.fetch = realFetch
    }
    assert.equal(backendRestartingSince(), 7_000_000)
  }))

await check("any answer from the backend closes the window: a success, a refusal, a 500 or a database outage", () =>
  withClock(async () => {
    const answers = [
      () => new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { "Content-Type": "application/json" } }),
      () => problem(404, "Not found"),
      () => problem(500, "Internal server error"),
      () => problem(503, DATABASE_UNREACHABLE),
    ]
    for (const next of answers) {
      fakeNow = 9_000_000
      assert.equal(shouldRetry(0, new ApiError("down", 502)), true)
      assert.equal(backendRestartingSince(), 9_000_000)
      answer = next
      await userApi.getMe().catch(() => undefined)
      assert.equal(backendRestartingSince(), null)
    }
  }))

await check("a cache outage 503 is an outage too, shown with the backend's text", async () => {
  noteBackendAnswered()
  const cache = "hrva.cc can't reach its cache right now. Try again in a minute."
  answer = () => new Response(JSON.stringify({ type: "about:blank", title: "Service Unavailable", status: 503, detail: cache, outage: "cache" }), { status: 503, headers: { "Content-Type": "application/problem+json" } })
  const error = await userApi.getMe().catch((caught) => caught)
  assert.equal(error.message, cache)
  assert.equal(isOutage(error), true)
  assert.equal(isRestartError(error), false)
  assert.equal(shouldRetry(0, error), false)
  assert.equal(backendRestartingSince(), null)
  assert.equal(isOutage(new ApiError("x", 503, {}, { outage: 1 })), false, "only a string outage member counts")
})

await check("a request made after a long restart gets a new window; the one still retrying gives up", () =>
  withClock(() => {
    const restart = new ApiError("Can't reach hrva.cc right now.", 502)
    fakeNow = 2_000_000
    assert.equal(shouldRetry(0, restart), true)
    fakeNow += RESTART_RETRY_WINDOW_MS + 1
    assert.equal(shouldRetry(5, restart), false, "the retrying request stops at the end of its window")
    assert.equal(backendRestartingSince(), 2_000_000)
    fakeNow += 60_000
    assert.equal(shouldRetry(0, restart), true, "a new request starts a new window")
    assert.equal(backendRestartingSince(), 2_000_000, "the outage itself still dates from its first failure")
    assert.equal(restartTooLong(fakeNow), true)
    fakeNow += 30_000
    assert.equal(shouldRetry(3, restart), true)
  }))

await check("each query times its retries from its own first failure, however long the outage has lasted", () =>
  withClock(() => {
    const restart = new ApiError("Can't reach hrva.cc right now.", 502)
    const badges = perQueryRetry("badges", shouldRetry)
    const analytics = perQueryRetry("analytics", retryUnlessRefused)
    fakeNow = 3_000_000
    assert.equal(badges(0, restart), true)
    fakeNow += 105_000
    assert.equal(analytics(0, restart), true, "a query that starts failing late opens its own window")
    fakeNow += 20_000
    assert.equal(badges(6, restart), false, "the early query gives up after its 2 minutes")
    assert.equal(analytics(4, restart), true, "the late query keeps going")
    fakeNow += 100_001
    assert.equal(analytics(9, restart), false, "and its chain is bounded too")
    assert.equal(perQueryRetry("badges", badges), badges, "wrapping twice keeps one wrapper")
    assert.equal(shouldRetry(0, restart), true, "a call outside a query starts its own chain")
  }))

await check("the backend coming back is announced once, so pages that failed load again", () =>
  withClock(async () => {
    let heard = 0
    const stop = onBackendRecovered(() => {
      heard += 1
    })
    fakeNow = realNow() + 86_400_000
    noteBackendFailed(fakeNow)
    noteBackendAnswered(false)
    assert.equal(heard, 1, "any answer after a restart")
    noteBackendAnswered(true)
    assert.equal(heard, 1, "only once")
    fakeNow += 6_000
    stored.set("auth-token", "Bearer kept")
    answer = () => problem(503, DATABASE_UNREACHABLE)
    await userApi.getMe().catch(() => undefined)
    answer = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
    stored.delete("auth-token")
    await publicCall()
    assert.equal(heard, 1, "an anonymous answer during an outage proves nothing")
    stored.set("auth-token", "Bearer kept")
    await userApi.getMe()
    assert.equal(heard, 2, "a signed-in answer after an outage")
    fakeNow += 6_000
    noteBackendFailed(fakeNow)
    answer = () => problem(503, DATABASE_UNREACHABLE)
    await userApi.getMe().catch(() => undefined)
    assert.equal(heard, 3, "a restart that ends in an outage answer counts too")
    stop()
  }))

await check("a database outage 503 is an outage: never retried, no Reconnecting, not a restart", async () => {
  noteBackendAnswered()
  answer = () => problem(503, DATABASE_UNREACHABLE)
  const error = await userApi.getMe().catch((caught) => caught)
  assert.equal(error.status, 503)
  assert.equal(error.message, DATABASE_UNREACHABLE)
  assert.equal(isOutage(error), true)
  assert.equal(isRestartError(error), false)
  assert.equal(shouldRetry(0, error), false)
  assert.equal(retryUnlessRefused(0, error), false)
  assert.equal(DATABASE_UNREACHABLE, "hrva.cc can't reach its database right now. Try again in a minute.")
  const marked = new ApiError("Something else", 503, {}, { outage: "database", detail: "Something else" })
  assert.equal(isOutage(marked), true, "the backend's outage member is enough")
  assert.equal(shouldRetry(0, marked), false)
  for (const other of [new ApiError(DATABASE_UNREACHABLE, 502, {}, { detail: DATABASE_UNREACHABLE }), new ApiError("busy", 503, {}, { detail: "Too busy right now." })]) {
    assert.equal(isOutage(other), false, `${other.status} ${other.message}`)
    assert.equal(isRestartError(other), true)
  }
  noteBackendAnswered()
})

await check("a network failure, 502, 503 and 504 are restart errors; nothing else is", () => {
  for (const status of [0, 502, 503, 504]) assert.equal(isRestartError(new ApiError("down", status)), true, String(status))
  for (const message of ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."]) {
    assert.equal(isRestartError(new TypeError(message)), true, message)
  }
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 501]) assert.equal(isRestartError(new ApiError("no", status)), false, String(status))
  assert.equal(isRestartError(new TypeError("undefined is not a function")), false)
  assert.equal(isRestartError(new TypeError("Failed to fetch dynamically imported module: https://hrva.cc/_next/static/x.js")), false)
  assert.equal(isRestartError(new TypeError("Cannot read properties of undefined (reading 'fetch')")), false)
  assert.equal(shouldRetry(5, new TypeError("Failed to fetch dynamically imported module: https://hrva.cc/_next/static/x.js")), false)
  assert.equal(isRestartError(new Error("Failed to fetch")), false)
  assert.equal(isRestartError(undefined), false)
})

await check("restart errors keep retrying and other errors retry once", () => {
  noteBackendAnswered()
  assert.equal(shouldRetry(5, new ApiError("down", 502)), true)
  assert.equal(shouldRetry(5, new ApiError("down", 503)), true)
  assert.equal(shouldRetry(5, new ApiError("down", 504)), true)
  assert.equal(shouldRetry(5, new TypeError("Failed to fetch")), true)
  assert.equal(shouldRetry(5, new ApiError("down", 0)), true)
  assert.equal(shouldRetry(0, new ApiError("Request failed", 400)), true)
  assert.equal(shouldRetry(1, new ApiError("Request failed", 400)), false)
  for (const status of [401, 403, 404, 409, 422, 429, 500]) assert.equal(shouldRetry(1, new ApiError("no", status)), false, String(status))
  assert.equal(shouldRetry(1, new Error("boom")), false)
})

await check("analytics queries ride out a restart and still give up on refusals at once", () => {
  noteBackendAnswered()
  assert.equal(retryUnlessRefused(5, new ApiError("down", 503)), true)
  noteBackendAnswered()
  for (const status of [400, 401, 403, 404, 429]) assert.equal(retryUnlessRefused(0, new ApiError("no", status)), false, String(status))
  assert.equal(retryUnlessRefused(0, new ApiError("down", 500)), true)
  assert.equal(retryUnlessRefused(1, new ApiError("down", 500)), false)
})

await check("refreshUser applies its result only while the token it asked with is still stored", async () => {
  const { readFileSync } = await import("node:fs")
  const source = readFileSync(new URL("../lib/auth-context.tsx", import.meta.url), "utf8")
  const body = source.slice(source.indexOf("const refreshUser"), source.indexOf("useEffect(() => {"))
  const guard = 'if (localStorage.getItem("auth-token") !== token) return'
  const apply = body.indexOf("setUser(userData)")
  const failure = body.indexOf("} catch (err) {")
  const removal = body.indexOf('localStorage.removeItem("auth-token")')
  assert.ok(apply > 0 && failure > 0 && removal > 0)
  assert.ok(body.lastIndexOf(guard, apply) > body.indexOf("await fetchMeThroughRestart(token)"), "no guard before setUser")
  assert.ok(body.lastIndexOf(guard, removal) > failure, "no guard in the error branch")
  const outage = body.indexOf("setUnavailable(err instanceof ApiError ? err.message : CANT_REACH)")
  assert.ok(outage > removal, "any other failure keeps the token and says the service is unavailable")
  assert.equal(body.slice(removal + 1).includes('localStorage.removeItem("auth-token")'), false, "only a 401 or 403 removes the token")
  assert.ok(body.indexOf("answerToRefusal(") > failure && body.indexOf("answerToRefusal(") < removal, "a 401 or 403 asks answerToRefusal before removing the token")
})

await check("the auth context guards its rechecks, resets refusals, renews on activity and recovers on its own", async () => {
  const { readFileSync } = await import("node:fs")
  const auth = readFileSync(new URL("../lib/auth-context.tsx", import.meta.url), "utf8")
  assert.match(auth, /if \(checking\.current\) return\s+checking\.current = true/, "a recheck is skipped while one runs")
  assert.match(auth, /setInterval\(recheck, UNAVAILABLE_RECHECK_MS\)/)
  assert.match(auth, /onBackendRecovered\(recheck\)/)
  assert.match(auth, /setUnavailable\(COULDNT_CHECK_SIGN_IN\)/)
  const signIn = auth.slice(auth.indexOf("const completeSignIn"), auth.indexOf("const login"))
  const endSession = auth.slice(auth.indexOf("const endSession"), auth.indexOf("const logout"))
  assert.match(signIn, /refusals\.current = 0/)
  assert.match(endSession, /refusals\.current = 0/)
  assert.match(auth, /dueForRenewal\(lastRenewedAt\.current, now\)/)
  assert.match(auth, /userApi\.renewSession\(\)/)
  assert.match(auth, /addEventListener\("pointerdown", renewOnActivity\)/)
  assert.match(auth, /addEventListener\("keydown", renewOnActivity\)/)
  const providers = readFileSync(new URL("../app/providers.tsx", import.meta.url), "utf8")
  assert.match(providers, /timeRetriesPerQuery\(client\)/)
  assert.match(providers, /refetchFailedQueriesOnRecovery\(client\)/)
})

await check("renewing a session posts to the renew endpoint and keeps the new token", async () => {
  noteBackendAnswered()
  sent.length = 0
  stored.set("auth-token", "Bearer old")
  answer = () => new Response(null, { status: 204, headers: { Authorization: "Bearer renewed" } })
  await userApi.renewSession()
  assert.equal(sent[0].method, "POST")
  assert.match(sent[0].url, /\/users\/me\/sessions\/renew$/)
  assert.equal(localStorage.getItem("auth-token"), "Bearer renewed")
})

await check("the signed-in pages show an outage instead of the sign-in form", async () => {
  const { readFileSync } = await import("node:fs")
  for (const file of ["../app/admin/layout.tsx", "../app/dashboard/layout.tsx", "../components/protected-route.tsx"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8")
    assert.match(source, /unavailable/, file)
    assert.match(source, /<ServiceUnavailable message=/, file)
  }
  const admin = readFileSync(new URL("../app/admin/layout.tsx", import.meta.url), "utf8")
  assert.match(admin, /if \(!isLoading && !\(unavailable && !user\)\)/)
  assert.match(admin, /pathname !== HEALTH_PAGE \? <ServiceUnavailable message=\{outage\} \/> : children/)
  const auth = readFileSync(new URL("../lib/auth-context.tsx", import.meta.url), "utf8")
  assert.match(auth, /if \(!unavailable \|\| user\) return\s+const timer = setInterval\(recheck, UNAVAILABLE_RECHECK_MS\)/)
})

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
