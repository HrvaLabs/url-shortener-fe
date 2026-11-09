import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const {
  PROBE_TIMEOUT_MS,
  STALE_CHUNK_RELOAD_KEY,
  STALE_CHUNK_RELOAD_WINDOW_MS,
  chunkFailureAction,
  chunkProbeNeeded,
  chunkStatusOf,
  isOwnStaticUrl,
  isStaleChunkElement,
  isStaleChunkError,
  probeChunk,
  recoverFromBackgroundChunkError,
  recoverFromChunkError,
  recoverInBackground,
  reloadMarker,
  reloadOnce,
  reloadedRecently,
  staleChunkUrl,
} = await import("../lib/stale-chunk.ts")

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const checkAsync = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const ORIGIN = "https://app.hrva.cc"

const namedError = (name, message, cause) => {
  const error = new Error(message, cause ? { cause } : undefined)
  error.name = name
  return error
}

const memoryStorage = (initial = {}) => {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    items,
  }
}

check("own static urls, relative or absolute", () => {
  assert.equal(isOwnStaticUrl("/_next/static/chunks/0a1b.js", ORIGIN), true)
  assert.equal(isOwnStaticUrl("https://app.hrva.cc/_next/static/css/a.css", ORIGIN), true)
  assert.equal(isOwnStaticUrl("https://app.hrva.cc/_next/image?url=x", ORIGIN), false)
  assert.equal(isOwnStaticUrl("https://challenges.cloudflare.com/turnstile/v0/api.js", ORIGIN), false)
  assert.equal(isOwnStaticUrl("https://evil.example/_next/static/chunks/a.js", ORIGIN), false)
  assert.equal(isOwnStaticUrl("", ORIGIN), false)
  assert.equal(isOwnStaticUrl(undefined, ORIGIN), false)
})

check("Turbopack's ChunkLoadError is a stale chunk", () => {
  const error = namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/0a1b2c.js from module 4521")
  assert.equal(isStaleChunkError(error, ORIGIN), true)
})

check("Turbopack's real shape: a relative chunk path, no cause", () => {
  const error = namedError("ChunkLoadError", "Failed to load chunk static/chunks/0a1b2c.js from module 4521")
  assert.equal(error.cause, undefined)
  assert.equal(isStaleChunkError(error, ORIGIN), true)
  assert.equal(isStaleChunkError(namedError("ChunkLoadError", "Loading chunk 812 failed."), ORIGIN), true)
})

check("CSS and dynamic import failures count only with an own /_next/static/ url", () => {
  assert.equal(
    isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: https://app.hrva.cc/_next/static/chunks/a.js"), ORIGIN),
    true,
  )
  assert.equal(
    isStaleChunkError(new TypeError("error loading dynamically imported module: https://app.hrva.cc/_next/static/chunks/a.js"), ORIGIN),
    true,
  )
  assert.equal(isStaleChunkError(new Error("Loading CSS chunk 77 failed. (/_next/static/css/a.css)"), ORIGIN), true)
  assert.equal(isStaleChunkError(new TypeError("Failed to fetch dynamically imported module"), ORIGIN), false)
  assert.equal(isStaleChunkError(new TypeError("error loading dynamically imported module"), ORIGIN), false)
  assert.equal(isStaleChunkError(new TypeError("Importing a module script failed."), ORIGIN), false)
  assert.equal(isStaleChunkError(new Error("Loading chunk 812 failed."), ORIGIN), false)
  assert.equal(isStaleChunkError(new Error("Loading CSS chunk 77 failed."), ORIGIN), false)
})

check("an own static url in an unrelated message is not a stale chunk", () => {
  assert.equal(isStaleChunkError(new Error("GET https://app.hrva.cc/_next/static/chunks/a.js 404"), ORIGIN), false)
})

check("a stale chunk wrapped as a cause is found", () => {
  const cause = namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/x.js from runtime")
  assert.equal(isStaleChunkError(new Error("Render failed", { cause }), ORIGIN), true)
})

check("another site's chunk is not ours", () => {
  assert.equal(
    isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: https://challenges.cloudflare.com/x.js"), ORIGIN),
    false,
  )
  assert.equal(isStaleChunkError(namedError("ChunkLoadError", "Failed to load chunk https://cdn.example/_next/static/a.js"), ORIGIN), false)
})

check("other errors are not stale chunks", () => {
  assert.equal(isStaleChunkError(new Error("Couldn't load these stats"), ORIGIN), false)
  assert.equal(isStaleChunkError(new TypeError("Failed to fetch"), ORIGIN), false)
  assert.equal(isStaleChunkError(null, ORIGIN), false)
  assert.equal(isStaleChunkError("Loading chunk 1 failed", ORIGIN), false)
  assert.equal(isStaleChunkError({ status: 503 }, ORIGIN), false)
})

check("own script and stylesheet elements count, others don't", () => {
  assert.equal(isStaleChunkElement({ tagName: "SCRIPT", src: `${ORIGIN}/_next/static/chunks/a.js` }, ORIGIN), true)
  assert.equal(isStaleChunkElement({ tagName: "LINK", rel: "stylesheet", href: `${ORIGIN}/_next/static/css/a.css` }, ORIGIN), true)
  assert.equal(isStaleChunkElement({ tagName: "LINK", rel: "preload", href: `${ORIGIN}/_next/static/chunks/a.js` }, ORIGIN), false)
  assert.equal(isStaleChunkElement({ tagName: "SCRIPT", src: "https://challenges.cloudflare.com/turnstile/v0/api.js" }, ORIGIN), false)
  assert.equal(isStaleChunkElement({ tagName: "IMG", src: `${ORIGIN}/_next/static/media/a.png` }, ORIGIN), false)
  assert.equal(isStaleChunkElement(null, ORIGIN), false)
})

check("the guard allows one reload per path in the window", () => {
  const now = 1_000_000
  const marker = reloadMarker("/admin/health", now)
  assert.equal(reloadedRecently(null, "/admin/health", now), false)
  assert.equal(reloadedRecently(marker, "/admin/health", now + 1), true)
  assert.equal(reloadedRecently(marker, "/admin/health", now + STALE_CHUNK_RELOAD_WINDOW_MS - 1), true)
  assert.equal(reloadedRecently(marker, "/admin/health", now + STALE_CHUNK_RELOAD_WINDOW_MS), false)
  assert.equal(reloadedRecently(marker, "/admin/dashboard", now + 1), false)
  assert.equal(reloadedRecently(marker, "/admin/health", now - 1), false)
  assert.equal(reloadedRecently("not json", "/admin/health", now), false)
  assert.equal(reloadedRecently(JSON.stringify({ path: "/admin/health" }), "/admin/health", now), false)
})

check("reloadOnce reloads, then refuses a second time on the same path", () => {
  const storage = memoryStorage()
  let reloads = 0
  const attempt = (now, path = "/admin/health") => reloadOnce({ storage: () => storage, path, now, online: true, reload: () => (reloads += 1) })
  assert.equal(attempt(5_000), true)
  assert.equal(reloads, 1)
  assert.equal(JSON.parse(storage.items.get(STALE_CHUNK_RELOAD_KEY)).path, "/admin/health")
  assert.equal(attempt(5_000 + 10_000), false)
  assert.equal(reloads, 1)
  assert.equal(attempt(5_000 + 10_000, "/admin/dashboard"), true)
  assert.equal(reloads, 2)
  assert.equal(attempt(5_000 + 10_000 + STALE_CHUNK_RELOAD_WINDOW_MS), true)
  assert.equal(reloads, 3)
})

check("no storage means no reload, so it can never loop", () => {
  let reloads = 0
  const blocked = () => {
    throw new Error("SecurityError")
  }
  const writeBlocked = () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError")
    },
  })
  assert.equal(reloadOnce({ storage: blocked, path: "/", now: 1, online: true, reload: () => (reloads += 1) }), false)
  assert.equal(reloadOnce({ storage: writeBlocked, path: "/", now: 1, online: true, reload: () => (reloads += 1) }), false)
  assert.equal(reloads, 0)
})

check("storage that silently drops writes means no reload", () => {
  let reloads = 0
  const silent = () => ({ getItem: () => null, setItem: () => undefined })
  assert.equal(reloadOnce({ storage: silent, path: "/", now: 1, online: true, reload: () => (reloads += 1) }), false)
  assert.equal(reloads, 0)
})

check("offline means no reload, and nothing is written", () => {
  const storage = memoryStorage()
  let reloads = 0
  assert.equal(reloadOnce({ storage: () => storage, path: "/", now: 1, online: false, reload: () => (reloads += 1) }), false)
  assert.equal(reloads, 0)
  assert.equal(storage.items.size, 0)
})

check("a probe's answer: 404 is a chunk a deploy removed, no answer is a network failure", () => {
  assert.equal(chunkStatusOf(404), "missing")
  assert.equal(chunkStatusOf(200), "present")
  assert.equal(chunkStatusOf(204), "present")
  assert.equal(chunkStatusOf(null), "network")
  for (const status of [0, 301, 403, 410, 500, 503]) assert.equal(chunkStatusOf(status), "unknown", String(status))
})

check("the chunk url an error names, as an absolute own url", () => {
  const chunk = `${ORIGIN}/_next/static/chunks/0rag9g83eo8_q.js`
  assert.equal(staleChunkUrl(namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/0rag9g83eo8_q.js from module 64893"), ORIGIN), chunk)
  assert.equal(staleChunkUrl(namedError("ChunkLoadError", "Failed to load chunk static/chunks/0rag9g83eo8_q.js from module 64893"), ORIGIN), chunk)
  assert.equal(staleChunkUrl(new TypeError(`Failed to fetch dynamically imported module: ${chunk}`), ORIGIN), chunk)
  assert.equal(staleChunkUrl(new Error("Render failed", { cause: namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/0rag9g83eo8_q.js from runtime") }), ORIGIN), chunk)
  assert.equal(staleChunkUrl(new Error("Loading CSS chunk 77 failed. (/_next/static/css/a.css)"), ORIGIN), `${ORIGIN}/_next/static/css/a.css`)
  assert.equal(staleChunkUrl(namedError("ChunkLoadError", "Loading chunk 812 failed."), ORIGIN), null)
  assert.equal(staleChunkUrl(namedError("ChunkLoadError", "Failed to load chunk https://cdn.example/_next/static/a.js"), ORIGIN), null)
  assert.equal(staleChunkUrl(new Error("Couldn't load these stats"), ORIGIN), null)
  assert.equal(staleChunkUrl(null, ORIGIN), null)
})

const NOW = 2_000_000
const decide = (overrides) =>
  chunkFailureAction({ kind: "page", status: "present", online: true, path: "/dashboard/analytics", now: NOW, lastReload: null, lastRetry: null, ...overrides })

check("a failed background load (a prefetch) reloads only for a chunk a deploy removed", () => {
  for (const status of ["network", "present", "unknown"]) assert.equal(decide({ kind: "background", status }), "none", status)
  assert.equal(decide({ kind: "background", status: "missing" }), "reload")
  assert.equal(decide({ kind: "background", status: "missing", lastReload: reloadMarker("/dashboard/analytics", NOW - 1_000) }), "none")
  assert.equal(decide({ kind: "background", status: "missing", lastReload: reloadMarker("/dashboard", NOW - 1_000) }), "reload")
  assert.equal(decide({ kind: "background", status: "missing", online: false }), "none")
})

check("an error page reloads for a removed chunk, once per path in the window", () => {
  assert.equal(decide({ status: "missing" }), "reload")
  assert.equal(decide({ status: "missing", lastReload: reloadMarker("/dashboard/analytics", NOW - 1_000) }), "none")
  assert.equal(decide({ status: "missing", lastReload: reloadMarker("/dashboard/analytics", NOW - STALE_CHUNK_RELOAD_WINDOW_MS) }), "reload")
  assert.equal(decide({ status: "missing", lastRetry: reloadMarker("/dashboard/analytics", NOW - 1_000) }), "reload", "a soft retry doesn't hold back a deploy's reload")
})

check("an error page retries once in place for a chunk that still answers, or can't be checked, and never reloads for it", () => {
  for (const status of ["present", "unknown"]) {
    assert.equal(decide({ status }), "retry", status)
    assert.equal(decide({ status, lastRetry: reloadMarker("/dashboard/analytics", NOW - 1_000) }), "none", status)
    assert.equal(decide({ status, lastRetry: reloadMarker("/dashboard", NOW - 1_000) }), "retry", status)
    assert.equal(decide({ status, lastRetry: reloadMarker("/dashboard/analytics", NOW - STALE_CHUNK_RELOAD_WINDOW_MS) }), "retry", status)
  }
})

check("an error page stays while the chunk can't be reached, and waits for the connection while offline", () => {
  assert.equal(decide({ status: "network" }), "none")
  for (const status of ["network", "missing", "present", "unknown"]) assert.equal(decide({ status, online: false }), "wait-online", status)
})

check("the chunk is only probed when its answer could change what happens", () => {
  const failure = { kind: "page", online: true, path: "/dashboard/analytics", now: NOW, lastReload: null, lastRetry: null }
  const recent = reloadMarker("/dashboard/analytics", NOW - 1_000)
  assert.equal(chunkProbeNeeded(failure), true)
  assert.equal(chunkProbeNeeded({ ...failure, lastRetry: recent }), true, "a 404 still reloads")
  assert.equal(chunkProbeNeeded({ ...failure, lastReload: recent }), true, "a chunk that answers still retries")
  assert.equal(chunkProbeNeeded({ ...failure, lastReload: recent, lastRetry: recent }), false)
  assert.equal(chunkProbeNeeded({ ...failure, online: false }), false)
  assert.equal(chunkProbeNeeded({ ...failure, kind: "background" }), true)
  assert.equal(chunkProbeNeeded({ ...failure, kind: "background", lastReload: recent }), false, "the guard already holds the reload")
  assert.equal(chunkProbeNeeded({ ...failure, kind: "background", online: false }), false)
})

const PATHS = { next: 0 }
const CHUNK_URL = `${ORIGIN}/_next/static/chunks/0rag9g83eo8_q.js`
const chunkError = () => namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/0rag9g83eo8_q.js from module 64893")
const answers = {
  missing: () => new Response("Not found", { status: 404 }),
  present: () => new Response("self.TURBOPACK=1", { status: 200 }),
  network: () => {
    throw new TypeError("Failed to fetch")
  },
  never: (init) => new Promise((resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal.reason))),
}

const fakeBrowser = ({ online = true, answer = answers.present } = {}) => {
  const browser = { reloads: 0, retries: 0, probes: [], signals: [], listeners: new Map(), online, answer, storage: memoryStorage() }
  globalThis.window = {
    location: { origin: ORIGIN, pathname: `/page-${(PATHS.next += 1)}`, reload: () => (browser.reloads += 1) },
    sessionStorage: browser.storage,
    addEventListener: (type, listener) => browser.listeners.set(type, listener),
    removeEventListener: (type, listener) => browser.listeners.get(type) === listener && browser.listeners.delete(type),
  }
  Object.defineProperty(globalThis, "navigator", { configurable: true, get: () => ({ onLine: browser.online }) })
  globalThis.fetch = async (url, init) => {
    browser.probes.push({ url, cache: init?.cache })
    browser.signals.push(init?.signal)
    return browser.answer(init)
  }
  browser.retry = () => (browser.retries += 1)
  return browser
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

await checkAsync("a probe asks the network, never the cache, and reads only the status", async () => {
  const browser = fakeBrowser({ answer: answers.missing })
  assert.equal(await probeChunk(CHUNK_URL), "missing")
  assert.deepEqual(browser.probes, [{ url: CHUNK_URL, cache: "no-store" }])
  browser.answer = answers.present
  assert.equal(await probeChunk(CHUNK_URL), "present")
  browser.answer = answers.network
  assert.equal(await probeChunk(CHUNK_URL), "network")
  assert.equal(await probeChunk(null), "unknown")
  assert.equal(browser.probes.length, 3, "no url, no request")
})

await checkAsync("a probe that never answers gives up after its timeout and counts as a network failure", async () => {
  const browser = fakeBrowser({ answer: answers.never })
  const stillWaiting = new Promise((resolve) => setTimeout(() => resolve("still waiting after 1 s"), 1_000))
  assert.equal(await Promise.race([probeChunk(CHUNK_URL, 20), stillWaiting]), "network")
  browser.answer = answers.present
  await probeChunk(CHUNK_URL)
  assert.ok(browser.signals.every((signal) => signal instanceof AbortSignal), "every probe, the default one included, carries a timeout signal")
  assert.equal(PROBE_TIMEOUT_MS, 10_000)
})

await checkAsync("a background chunk that fails in a network drop never reloads the page", async () => {
  for (const answer of [answers.network, answers.present]) {
    const browser = fakeBrowser({ answer })
    recoverInBackground(CHUNK_URL)
    await settle()
    assert.equal(browser.probes.length, 1)
    assert.equal(browser.reloads, 0)
    assert.equal(browser.storage.items.size, 0, "no reload marker armed")
  }
  const offline = fakeBrowser({ online: false, answer: answers.missing })
  recoverInBackground(CHUNK_URL)
  await settle()
  assert.equal(offline.probes.length, 0)
  assert.equal(offline.reloads, 0)
})

await checkAsync("a background chunk a deploy removed reloads once, and not while the visitor is typing", async () => {
  const browser = fakeBrowser({ answer: answers.missing })
  recoverInBackground(CHUNK_URL)
  await settle()
  assert.equal(browser.reloads, 1)
  recoverInBackground(CHUNK_URL)
  await settle()
  assert.equal(browser.reloads, 1, "the guard holds the second one")
  assert.equal(browser.probes.length, 1, "and the second one isn't probed")
  const typing = fakeBrowser({ answer: answers.missing })
  recoverInBackground(CHUNK_URL, () => false)
  await settle()
  assert.equal(typing.reloads, 0)
})

await checkAsync("a burst of failed chunks is checked one at a time", async () => {
  const browser = fakeBrowser({ answer: answers.network })
  for (let index = 0; index < 25; index++) recoverInBackground(`${ORIGIN}/_next/static/chunks/${index}.js`)
  await settle()
  assert.equal(browser.probes.length, 1)
  assert.equal(browser.reloads, 0)
})

await checkAsync("an unhandled chunk error follows the background rule; other errors aren't probed", async () => {
  const browser = fakeBrowser({ answer: answers.network })
  recoverFromBackgroundChunkError(chunkError())
  await settle()
  assert.deepEqual(browser.probes.map((probe) => probe.url), [CHUNK_URL])
  assert.equal(browser.reloads, 0)
  recoverFromBackgroundChunkError(new Error("Couldn't load these stats"))
  await settle()
  assert.equal(browser.probes.length, 1)
  const removed = fakeBrowser({ answer: answers.missing })
  recoverFromBackgroundChunkError(chunkError())
  await settle()
  assert.equal(removed.reloads, 1)
})

await checkAsync("an error page for a chunk that still answers retries once in place, then stays", async () => {
  const browser = fakeBrowser({ answer: answers.present })
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.retries, 1)
  assert.equal(browser.reloads, 0)
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.retries, 1, "the retry failed again: the page stays")
  assert.equal(browser.reloads, 0)
})

await checkAsync("an error page for a chunk a deploy removed reloads once, then stays", async () => {
  const browser = fakeBrowser({ answer: answers.missing })
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.reloads, 1)
  assert.equal(browser.retries, 0)
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.reloads, 1)
})

await checkAsync("an error page while the chunk can't be reached stays", async () => {
  const browser = fakeBrowser({ answer: answers.network })
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.probes.length, 1)
  assert.equal(browser.retries + browser.reloads, 0)
})

await checkAsync("offline, an error page waits for the connection, then checks again", async () => {
  const browser = fakeBrowser({ online: false, answer: answers.present })
  recoverFromChunkError(chunkError(), browser.retry)
  await settle()
  assert.equal(browser.probes.length, 0)
  assert.equal(browser.retries + browser.reloads, 0)
  assert.equal(typeof browser.listeners.get("online"), "function")
  browser.online = true
  browser.listeners.get("online")()
  await settle()
  assert.equal(browser.probes.length, 1)
  assert.equal(browser.retries, 1)
  assert.equal(browser.reloads, 0)
})

await checkAsync("leaving the error page cancels its recovery", async () => {
  const browser = fakeBrowser({ answer: answers.present })
  const cancel = recoverFromChunkError(chunkError(), browser.retry)
  cancel()
  await settle()
  assert.equal(browser.retries + browser.reloads, 0)
  const offline = fakeBrowser({ online: false })
  const stop = recoverFromChunkError(chunkError(), offline.retry)
  await settle()
  stop()
  assert.equal(offline.listeners.has("online"), false)
})

await checkAsync("an error page for any other error does nothing", async () => {
  const browser = fakeBrowser()
  recoverFromChunkError(new Error("Cannot read properties of undefined (reading 'map')"), browser.retry)
  await settle()
  assert.equal(browser.probes.length + browser.retries + browser.reloads, 0)
})

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

check("failed own scripts and stylesheets are probed before any reload", () => {
  const listener = source("../components/stale-chunk-reload.tsx")
  assert.doesNotMatch(listener, /reloadForStaleChunk\(|reloadIfStaleChunkError/)
  assert.match(listener, /recoverInBackground\(/)
  assert.match(listener, /recoverFromBackgroundChunkError\(event\.error\)/)
  assert.match(listener, /recoverFromBackgroundChunkError\(event\.reason\)/)
  const providers = source("../app/providers.tsx")
  assert.doesNotMatch(providers, /reloadIfStaleChunkError/)
  assert.match(providers, /recoverFromBackgroundChunkError\(error\)/)
})

check("error pages recover through useChunkErrorRecovery and keep the diagnostic line", () => {
  for (const page of ["../app/error.tsx", "../app/global-error.tsx", "../app/bio/[handle]/error.tsx"]) {
    const text = source(page)
    assert.match(text, /useChunkErrorRecovery\(error, retry\)/, page)
    assert.doesNotMatch(text, /reloadIfStaleChunkError/, page)
  }
  for (const page of ["../app/error.tsx", "../app/global-error.tsx"]) assert.match(source(page), /<ErrorFallback error=\{error\} retry=\{retry\} \/>/, page)
  assert.match(source("../components/error-fallback.tsx"), /errorSummary\(error\)/)
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
