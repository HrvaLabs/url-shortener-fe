import { ApiError } from "./api-client"

export const LIVE_REFRESH_MS = 10_000

export type LiveState = "ok" | "stale" | "failed"

const refusesData = (error: Error): boolean => error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429

/** Whether a failed check keeps the last numbers on screen ("stale") or replaces them with the error ("failed"). */
export const liveState = (error: Error | null, hasData: boolean): LiveState => {
  if (!error) return "ok"
  return hasData && !refusesData(error) ? "stale" : "failed"
}

interface PolledQuery {
  state: { error: Error | null; data: unknown }
}

/** Every 10 s while the numbers are fine or only a check failed; never after a failed load or a refusal, which Retry, focus or the backend's recovery load again. */
export const liveInterval = (query: PolledQuery): number | false =>
  liveState(query.state.error, query.state.data !== undefined) === "failed" ? false : LIVE_REFRESH_MS

export interface LiveRefresh {
  refetchInterval?: typeof liveInterval
  staleTime?: number
  refetchIntervalInBackground?: boolean
}

/** Query options for a page whose numbers update while it's open: asked again every 10 s, never while the tab is hidden. */
export const liveRefresh = (live: boolean): LiveRefresh => (live ? { refetchInterval: liveInterval, staleTime: LIVE_REFRESH_MS } : {})

/** A rise lights up only when the number it replaces was loaded this long before: one check, or two when one failed. */
export const LIVE_RISE_WINDOW_MS = 3 * LIVE_REFRESH_MS

/** When the data on screen was loaded, and whether a check has run while this page, range or link was on screen (React Query's `isFetchedAfterMount`, which an error turns true too, so `nextCount` takes it only with newer data). */
export interface LiveStamp {
  updatedAt: number
  fresh: boolean
}

export const liveStamp = (query: { dataUpdatedAt: number; isFetchedAfterMount: boolean }): LiveStamp => ({
  updatedAt: query.dataUpdatedAt,
  fresh: query.isFetchedAfterMount,
})

export interface LiveCount extends LiveStamp {
  value: number
  scope: string
  bumps: number
}

export const firstCount = (value: number, scope: string, stamp: LiveStamp): LiveCount => ({ value, scope, ...stamp, bumps: 0 })

/**
 * Counts each rise of a number between two recent checks made while it was on screen, within one scope (a range, a link). A new
 * scope, a rise over cached data shown again, or one over a number loaded long before (a tab coming back) takes the number
 * without counting it as a rise.
 */
export const nextCount = (state: LiveCount, value: number, scope: string, stamp: LiveStamp): LiveCount => {
  if (scope !== state.scope) return { value, scope, ...stamp, bumps: state.bumps }
  const fresh = stamp.fresh && (state.fresh || stamp.updatedAt !== state.updatedAt)
  if (value === state.value) return stamp.updatedAt === state.updatedAt && fresh === state.fresh ? state : { ...state, updatedAt: stamp.updatedAt, fresh }
  const rose = value > state.value && state.fresh && stamp.updatedAt - state.updatedAt <= LIVE_RISE_WINDOW_MS
  return { value, scope, updatedAt: stamp.updatedAt, fresh, bumps: rose ? state.bumps + 1 : state.bumps }
}
