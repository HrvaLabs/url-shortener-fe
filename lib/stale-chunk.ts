export const STATIC_PATH_PREFIX = "/_next/static/"
export const STALE_CHUNK_RELOAD_KEY = "hrva:stale-chunk-reload"
export const STALE_CHUNK_RELOAD_WINDOW_MS = 30_000

const CHUNK_LOAD_ERROR = "ChunkLoadError"
const FAILED_IMPORT_MESSAGE =
  /Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i
const URL_IN_MESSAGE = /(https?:\/\/[^\s"'`)]+|\/_next\/[^\s"'`)]+)/g
const MOST_CAUSES = 5

export const isOwnStaticUrl = (url: string | null | undefined, origin: string): boolean => {
  if (!url) return false
  try {
    const parsed = new URL(url, origin)
    return parsed.origin === origin && parsed.pathname.startsWith(STATIC_PATH_PREFIX)
  } catch {
    return false
  }
}

const isStaleChunkErrorItself = (error: unknown, origin: string): boolean => {
  if (typeof error !== "object" || error === null) return false
  const name = "name" in error ? String(error.name) : ""
  const message = "message" in error ? String(error.message) : ""
  const urls = message.match(URL_IN_MESSAGE) ?? []
  const namesOwnChunk = urls.some((url) => isOwnStaticUrl(url, origin))
  if (name === CHUNK_LOAD_ERROR) return urls.length === 0 || namesOwnChunk
  return FAILED_IMPORT_MESSAGE.test(message) && namesOwnChunk
}

export const isStaleChunkError = (error: unknown, origin: string): boolean => {
  let current = error
  for (let depth = 0; current && depth < MOST_CAUSES; depth++) {
    if (isStaleChunkErrorItself(current, origin)) return true
    current = typeof current === "object" && "cause" in current ? current.cause : undefined
  }
  return false
}

export interface ChunkElement {
  tagName: string
  src?: string
  href?: string
  rel?: string
}

export const isStaleChunkElement = (element: ChunkElement | null | undefined, origin: string): boolean => {
  if (!element) return false
  const tag = element.tagName.toUpperCase()
  if (tag === "SCRIPT") return isOwnStaticUrl(element.src, origin)
  if (tag === "LINK") return (element.rel ?? "").split(/\s+/).includes("stylesheet") && isOwnStaticUrl(element.href, origin)
  return false
}

export const reloadMarker = (path: string, now: number): string => JSON.stringify({ path, at: now })

export const reloadedRecently = (stored: string | null, path: string, now: number): boolean => {
  if (!stored) return false
  try {
    const marker: unknown = JSON.parse(stored)
    if (typeof marker !== "object" || marker === null || !("path" in marker) || !("at" in marker)) return false
    const at = Number(marker.at)
    return marker.path === path && Number.isFinite(at) && now - at >= 0 && now - at < STALE_CHUNK_RELOAD_WINDOW_MS
  } catch {
    return false
  }
}

export interface ReloadOnce {
  storage: () => Pick<Storage, "getItem" | "setItem">
  path: string
  now: number
  online: boolean
  reload: () => void
}

export const reloadOnce = ({ storage, path, now, online, reload }: ReloadOnce): boolean => {
  if (!online) return false
  try {
    const store = storage()
    if (reloadedRecently(store.getItem(STALE_CHUNK_RELOAD_KEY), path, now)) return false
    const marker = reloadMarker(path, now)
    store.setItem(STALE_CHUNK_RELOAD_KEY, marker)
    if (store.getItem(STALE_CHUNK_RELOAD_KEY) !== marker) return false
  } catch {
    return false
  }
  reload()
  return true
}

export const reloadForStaleChunk = (): boolean =>
  reloadOnce({
    storage: () => window.sessionStorage,
    path: window.location.pathname,
    now: Date.now(),
    online: navigator.onLine !== false,
    reload: () => window.location.reload(),
  })

const MISSING_CHUNK_STATUS = 404
const RELATIVE_CHUNK_PATH = /(?:^|[\s"'`(])(static\/(?:chunks|css|media)\/[^\s"'`)]+)/

/** How a failed chunk answers a fresh request: `missing` (404, a deploy removed it), `present`, `network` (no answer) or `unknown`. */
export type ChunkStatus = "missing" | "present" | "network" | "unknown"

/** `background`: a failed `<script>` or stylesheet, often a prefetch, or an unhandled chunk error; `page`: an error page showing the failure. */
export type ChunkFailureKind = "background" | "page"

export type ChunkFailureAction = "reload" | "retry" | "wait-online" | "none"

export interface ChunkFailure {
  kind: ChunkFailureKind
  status: ChunkStatus
  online: boolean
  path: string
  now: number
  lastReload: string | null
  lastRetry: string | null
}

export const chunkStatusOf = (status: number | null): ChunkStatus => {
  if (status === null) return "network"
  if (status === MISSING_CHUNK_STATUS) return "missing"
  return status >= 200 && status < 300 ? "present" : "unknown"
}

const ownChunkUrlItself = (error: unknown, origin: string): string | null => {
  if (typeof error !== "object" || error === null || !("message" in error)) return null
  const message = String(error.message)
  const own = (message.match(URL_IN_MESSAGE) ?? []).find((url) => isOwnStaticUrl(url, origin))
  if (own) return new URL(own, origin).href
  const relative = RELATIVE_CHUNK_PATH.exec(message)?.[1]
  return relative ? new URL(`/_next/${relative}`, origin).href : null
}

/** The own `/_next/static/` URL a chunk error names, through `cause` too; Turbopack's relative `static/chunks/…` is read under `/_next/`. */
export const staleChunkUrl = (error: unknown, origin: string): string | null => {
  let current = error
  for (let depth = 0; current && depth < MOST_CAUSES; depth++) {
    const url = ownChunkUrlItself(current, origin)
    if (url) return url
    current = typeof current === "object" && "cause" in current ? current.cause : undefined
  }
  return null
}

/**
 * What to do about a failed own chunk. Offline: an error page waits for the connection, a background failure does nothing.
 * A chunk that answers 404 was removed by a deploy: reload once per path in the window. Any other background failure (a prefetch
 * in a network drop) does nothing. An error page retries in place once per path in the window when the chunk answers or can't
 * be checked, and stays when the chunk can't be reached.
 */
export const chunkFailureAction = ({ kind, status, online, path, now, lastReload, lastRetry }: ChunkFailure): ChunkFailureAction => {
  if (!online) return kind === "page" ? "wait-online" : "none"
  if (status === "missing") return reloadedRecently(lastReload, path, now) ? "none" : "reload"
  if (kind === "background" || status === "network") return "none"
  return reloadedRecently(lastRetry, path, now) ? "none" : "retry"
}

const CHUNK_STATUSES: ChunkStatus[] = ["missing", "present", "network", "unknown"]

/** True when the chunk's answer could change `chunkFailureAction`; otherwise no request is made. */
export const chunkProbeNeeded = (failure: Omit<ChunkFailure, "status">): boolean =>
  new Set(CHUNK_STATUSES.map((status) => chunkFailureAction({ ...failure, status }))).size > 1

/** Asks the network (never the cache) how a chunk answers; only the status is read. */
export const probeChunk = async (url: string | null): Promise<ChunkStatus> => {
  if (!url) return "unknown"
  try {
    const response = await fetch(url, { cache: "no-store" })
    response.body?.cancel().catch(() => undefined)
    return chunkStatusOf(response.status)
  } catch {
    return "network"
  }
}

let lastSoftRetry: string | null = null

let backgroundCheck: Promise<void> | null = null

const storedReloadMarker = (): string | null => {
  try {
    return window.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)
  } catch {
    return null
  }
}

const currentFailure = (kind: ChunkFailureKind): Omit<ChunkFailure, "status"> => ({
  kind,
  online: navigator.onLine !== false,
  path: window.location.pathname,
  now: Date.now(),
  lastReload: storedReloadMarker(),
  lastRetry: lastSoftRetry,
})

const settleChunkFailure = async (kind: ChunkFailureKind, url: string | null): Promise<ChunkFailureAction> => {
  const before = currentFailure(kind)
  if (!chunkProbeNeeded(before)) return chunkFailureAction({ ...before, status: "unknown" })
  const status = await probeChunk(url)
  return chunkFailureAction({ ...currentFailure(kind), status })
}

/** A failed own `<script>` or stylesheet: reloads only when the chunk answers 404 and `canReload()` agrees; one check at a time. */
export const recoverInBackground = (url: string | null, canReload: () => boolean = () => true): void => {
  if (backgroundCheck) return
  backgroundCheck = settleChunkFailure("background", url)
    .then((action) => {
      if (action === "reload" && canReload()) reloadForStaleChunk()
    })
    .finally(() => {
      backgroundCheck = null
    })
}

/** An unhandled error or a failed query: the background rule, for own chunk errors only. */
export const recoverFromBackgroundChunkError = (error: unknown): void => {
  const origin = window.location.origin
  if (isStaleChunkError(error, origin)) recoverInBackground(staleChunkUrl(error, origin))
}

/** An error page's own chunk error: reload, retry in place, or wait for the connection (see `chunkFailureAction`); returns a cancel. */
export const recoverFromChunkError = (error: unknown, retry: () => void): (() => void) => {
  const origin = window.location.origin
  if (!isStaleChunkError(error, origin)) return () => undefined
  const url = staleChunkUrl(error, origin)
  let cancelled = false
  const settle = async () => {
    const action = await settleChunkFailure("page", url)
    if (cancelled) return
    if (action === "reload") reloadForStaleChunk()
    else if (action === "retry") {
      lastSoftRetry = reloadMarker(window.location.pathname, Date.now())
      retry()
    } else if (action === "wait-online") window.addEventListener("online", onOnline, { once: true })
  }
  const onOnline = () => {
    void settle()
  }
  void settle()
  return () => {
    cancelled = true
    window.removeEventListener("online", onOnline)
  }
}
