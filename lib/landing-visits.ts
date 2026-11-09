import { isJunkPath } from "./junk-paths"

export type LandingKind = "utm" | "referrer" | "direct"

export interface LandingVisit {
  source: string
  kind: LandingKind
  page: string
}

interface LandingDataset {
  writeDataPoint(point: unknown): void
}

const APP_HOST = "app.hrva.cc"

const OWN_DOMAIN = "hrva.cc"

const OTHER = "other"

const MAX_HOST_LENGTH = 253

const UTM_SOURCE = /^[a-z0-9.-]{1,64}$/

const SLUG = /^[a-z0-9-]{1,80}$/

const NOT_COUNTED = /^\/(?:connect|verify-email|reset-password|admin|dashboard)|^\/(?:auth|protected)\/|^\/(?:unsubscribe|launch|offline|share|unavailable)$/

const COLLAPSED_SEGMENTS = new Set(["bio", "validate"])

const SLUG_SEGMENTS = new Set(["blog", "help"])

const isOwnHost = (host: string) => host === OWN_DOMAIN || host.endsWith(`.${OWN_DOMAIN}`)

const refererHostOf = (request: Request): string | null => {
  const referer = request.headers.get("referer")
  if (!referer) return null
  try {
    const host = new URL(referer).hostname.toLowerCase()
    return host || null
  } catch {
    return null
  }
}

const pageOf = (pathname: string): string => {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
  if (path === "/") return path
  const segments = path.slice(1).split("/")
  const [first, second] = segments
  if (COLLAPSED_SEGMENTS.has(first) && segments.length > 1) return `/${first}/*`
  if (SLUG_SEGMENTS.has(first) && segments.length > 1) return segments.length === 2 && SLUG.test(second) ? path : `/${first}/*`
  if (segments.length > 2 || !segments.every((segment) => SLUG.test(segment))) return OTHER
  return path
}

export const landingVisitOf = (request: Request, response: Response): LandingVisit | null => {
  const url = new URL(request.url)
  if (request.method !== "GET" || request.headers.get("sec-fetch-dest") !== "document" || url.hostname !== APP_HOST) return null
  if ((request as { cf?: { verifiedBotCategory?: string } }).cf?.verifiedBotCategory) return null
  if (response.status < 200 || response.status > 299 || isJunkPath(url.pathname)) return null
  if (NOT_COUNTED.test(url.pathname)) return null
  const refererHost = refererHostOf(request)
  if (refererHost && isOwnHost(refererHost)) return null
  const page = pageOf(url.pathname)
  const utmSource = url.searchParams.get("utm_source")
  if (utmSource) {
    const source = utmSource.toLowerCase()
    return { source: UTM_SOURCE.test(source) ? source : OTHER, kind: "utm", page }
  }
  if (refererHost) return { source: refererHost.replace(/^www\./, "").slice(0, MAX_HOST_LENGTH), kind: "referrer", page }
  return { source: "direct", kind: "direct", page }
}

export const writeLandingVisit = (dataset: LandingDataset | undefined, visit: LandingVisit | null): void => {
  if (!dataset || !visit) return
  try {
    dataset.writeDataPoint({ blobs: [visit.source, visit.kind, visit.page], doubles: [1], indexes: [visit.kind] })
  } catch {
    return
  }
}
