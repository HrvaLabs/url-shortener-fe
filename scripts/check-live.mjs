import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { LIVE_REFRESH_MS, LIVE_RISE_WINDOW_MS, liveInterval, liveRefresh, liveState, firstCount, nextCount } = await import("../lib/live.ts")
const { ApiError } = await import("../lib/api-client.ts")

let failures = 0
const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

check("live pages ask again every 10 seconds and count data older than that as stale", () => {
  assert.equal(LIVE_REFRESH_MS, 10_000)
  assert.deepEqual(liveRefresh(true), { refetchInterval: liveInterval, staleTime: 10_000 })
})

const polled = (error, data) => ({ state: { error, data } })

check("checking goes on while the data is fine or only a check failed", () => {
  assert.equal(liveInterval(polled(null, { clicks: 1 })), 10_000)
  assert.equal(liveInterval(polled(null, undefined)), 10_000, "a first load still in flight")
  assert.equal(liveInterval(polled(new ApiError("Bad gateway", 502), { clicks: 1 })), 10_000)
  assert.equal(liveInterval(polled(new ApiError("Too many requests", 429), { clicks: 1 })), 10_000)
})

check("checking stops on a failed load or a refusal, so the error isn't swapped for a skeleton every 10 seconds", () => {
  assert.equal(liveInterval(polled(new ApiError("Not found", 404), undefined)), false, "no bio page yet")
  assert.equal(liveInterval(polled(new ApiError("Not found", 404), { clicks: 1 })), false, "a link deleted while its page is open")
  assert.equal(liveInterval(polled(new ApiError("Bad gateway", 502), undefined)), false)
  assert.equal(liveInterval(polled(new ApiError("Too many requests", 429), undefined)), false)
})

check("a page that isn't live keeps the app's defaults", () => {
  assert.deepEqual(liveRefresh(false), {})
})

check("live checks stop while the tab is hidden", () => {
  assert.equal(liveRefresh(true).refetchIntervalInBackground, undefined, "React Query skips the interval in a hidden tab unless this is true")
})

check("without an error the page shows its data", () => {
  assert.equal(liveState(null, true), "ok")
  assert.equal(liveState(null, false), "ok")
})

check("a failed check keeps the numbers on screen when the server or the network failed", () => {
  for (const error of [new ApiError("Bad gateway", 502), new ApiError("Unavailable", 503), new ApiError("Server error", 500), new TypeError("Failed to fetch")]) {
    assert.equal(liveState(error, true), "stale", `${error.name} ${error.status ?? ""}`)
  }
})

check("a 429 is a busy server, so the numbers stay too", () => {
  assert.equal(liveState(new ApiError("Too many requests", 429), true), "stale")
})

check("a refusal replaces the numbers: the link was deleted or isn't yours any more", () => {
  for (const status of [400, 403, 404, 410]) assert.equal(liveState(new ApiError("Refused", status), true), "failed", String(status))
})

check("an error with nothing loaded yet is a failed load", () => {
  assert.equal(liveState(new ApiError("Bad gateway", 502), false), "failed")
  assert.equal(liveState(new TypeError("Failed to fetch"), false), "failed")
})

const T = 1_000_000
const loaded = (at) => ({ updatedAt: at, fresh: true })
const cached = (at) => ({ updatedAt: at, fresh: false })

check("a number shown for the first time doesn't light up", () => {
  assert.deepEqual(firstCount(5, "7", loaded(T)), { value: 5, scope: "7", updatedAt: T, fresh: true, bumps: 0 })
})

check("a number that went up between two checks lights up, and again on the next rise", () => {
  const once = nextCount(firstCount(5, "7", loaded(T)), 6, "7", loaded(T + 10_000))
  assert.deepEqual(once, { value: 6, scope: "7", updatedAt: T + 10_000, fresh: true, bumps: 1 })
  assert.equal(nextCount(once, 9, "7", loaded(T + 20_000)).bumps, 2)
})

check("a rise after one missed check still lights up", () => {
  assert.equal(LIVE_RISE_WINDOW_MS, 30_000)
  assert.equal(nextCount(firstCount(5, "7", loaded(T)), 6, "7", loaded(T + 30_000)).bumps, 1)
})

check("a rise over an older number doesn't light up: a hidden tab coming back, a long outage", () => {
  assert.equal(nextCount(firstCount(5, "7", loaded(T)), 9, "7", loaded(T + 30_001)).bumps, 0)
})

check("a rise over cached data shown again doesn't light up, however recent the cache: a quick page, range or link switch", () => {
  const back = firstCount(13, "7", cached(T))
  const caughtUp = nextCount(back, 14, "7", loaded(T + 2_000))
  assert.deepEqual(caughtUp, { value: 14, scope: "7", updatedAt: T + 2_000, fresh: true, bumps: 0 })
  assert.equal(nextCount(caughtUp, 15, "7", loaded(T + 12_000)).bumps, 1, "the next rise, between two checks made on screen, lights up")
})

check("a failed catch-up check doesn't make cached data count as loaded on screen", () => {
  const back = firstCount(13, "7", cached(T))
  const failedCheck = nextCount(back, 13, "7", { updatedAt: T, fresh: true })
  assert.equal(failedCheck.fresh, false, "isFetchedAfterMount turns true on an error too, but the data is still the cached one")
  assert.equal(nextCount(failedCheck, 14, "7", loaded(T + 11_000)).bumps, 0)
})

check("cached data replacing loaded data in the same scope marks the number as cached", () => {
  const state = nextCount(firstCount(5, "7", loaded(T)), 5, "7", cached(T - 5_000))
  assert.equal(state.fresh, false)
  assert.equal(nextCount(state, 6, "7", loaded(T + 1_000)).bumps, 0)
})

check("an unchanged number keeps its state while nothing new was loaded", () => {
  const state = firstCount(5, "7", loaded(T))
  assert.equal(nextCount(state, 5, "7", loaded(T)), state)
})

check("an unchanged number from a newer check moves its time on, so the next rise compares with that check", () => {
  const checked = nextCount(firstCount(5, "7", loaded(T)), 5, "7", loaded(T + 60_000))
  assert.deepEqual(checked, { value: 5, scope: "7", updatedAt: T + 60_000, fresh: true, bumps: 0 })
  assert.equal(nextCount(checked, 6, "7", loaded(T + 70_000)).bumps, 1)
})

check("a number that went down changes without lighting up", () => {
  assert.deepEqual(nextCount({ value: 9, scope: "7", updatedAt: T, fresh: true, bumps: 2 }, 4, "7", loaded(T + 10_000)), { value: 4, scope: "7", updatedAt: T + 10_000, fresh: true, bumps: 2 })
})

check("a new range or another link changes the number without lighting it up", () => {
  assert.deepEqual(nextCount({ value: 5, scope: "7", updatedAt: T, fresh: true, bumps: 1 }, 40, "30", loaded(T + 10_000)), { value: 40, scope: "30", updatedAt: T + 10_000, fresh: true, bumps: 1 })
  assert.deepEqual(nextCount({ value: 5, scope: "7", updatedAt: T, fresh: true, bumps: 1 }, 2, "30", cached(T - 10_000)), { value: 2, scope: "30", updatedAt: T - 10_000, fresh: false, bumps: 1 })
})

if (failures > 0) process.exit(1)
console.log("ok")
