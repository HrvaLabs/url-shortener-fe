import { getApiBaseUrl } from "./utils"
import { ADMIN_TWO_STEP_REQUIRED } from "./admin-two-step"
import type { AliasCheck, UrlResponse, ApiKeyResponse, UserDto, User, PeekUrl, CreateUrlDto, UrlUpdateDto, ApiKeyUpdateDto, ApiKeyExpiry, ApiKeyCreated, UserUpdateDto, UpdatePasswordDto, LinkPreviewResponse, Page, AdminStatsResponse, UrlFilters, UserFilters, AuditLog, EmailLog, AnalyticsOverview, AnalyticsRange, UrlAnalytics, ConnectRequestView, ConnectApproval, ConnectDenial, ConnectedApp, BlocklistSource, BlocklistSourceInput, DomainRule, DomainRuleType, DomainRuleInput, DomainRuleCreated, DomainBlockPreview, DomainBulkBlockResult, LinksAffected, ReviewEntry, ReviewQueueFilters, ReviewAction, ReviewBulkResolveResult, UrlCheckResult, LinkReport, TrafficStats, LinksStats, UsersStats, VisitStats, SafetyStats, SystemStats, ReservedAlias, ReservedAliasInput, LoginResponse, SignedIn, PasskeyOptions, CreationOptionsJSON, RequestOptionsJSON, RegistrationCredentialJSON, AssertionCredentialJSON, Passkey, SignInMethod, SignInMethodsResponse, TwoStepStatus, PublicStatsResponse, BioPage, BioPageUpdate, BioHandleAvailability, BioPageAnalytics, AdminBioPage, BioPageReviewEntry, BioPageReviewAction, ApiKeysDeleted, EmailNotificationType, NotificationConsent, NotificationChannel, NotificationChannelInput, ChannelTestResult, UnsubscribeResult, CustomDomain, MyDomains, DomainRemoval, DomainLinkMode, AdminDomain, AdminDomainFilters, DomainSummary, CloudflareCheck, DomainReconcile, DomainAllowance, DomainRequest, AdminDomainRequest, AdminDomainRequestFilters, ApiKeyFilters, AuditLogFilters, EmailLogFilters, LoginAttempt, Campaign, CampaignAllowed, CampaignDetail, CampaignLink, AbuseReportSource, AbuseReportResponse, SettingKey, SettingResponse, SettingValue, PublicSettings, DestinationChangeInfo, DestinationChangeStanding, DestinationChangeOverride, LinkDestinationChange, LinkInspection, VirusTotalView, SystemStatus } from "./types"
import type { SignupSource } from "./signup-source"

export const REQUEST_FAILED = "Request failed"

export const CANT_REACH = "Can't reach hrva.cc right now. Check your connection and try again."

export const SESSION_ENDED = "Your session ended. Sign in again."

const TOO_MANY_REQUESTS = "Too many attempts. Try again in a few minutes."

const TOKEN_KEY = "auth-token"

let sessionEndedListener: ((message: string) => void) | null = null

let adminTwoStepListener: ((message: string) => void) | null = null

export function onSessionEnded(listener: ((message: string) => void) | null) {
  sessionEndedListener = listener
}

export function onAdminTwoStepRequired(listener: ((message: string) => void) | null) {
  adminTwoStepListener = listener
}

function adminTwoStepRequired(status: number, message: string) {
  if (status === 403 && message === ADMIN_TWO_STEP_REQUIRED) adminTwoStepListener?.(message)
}

function keepRenewedToken(sentToken: string | null, response: Response) {
  const renewed = response.headers.get("Authorization")
  if (sentToken && renewed?.startsWith("Bearer ") && renewed !== sentToken && localStorage.getItem(TOKEN_KEY) === sentToken) {
    localStorage.setItem(TOKEN_KEY, renewed)
  }
}

function endedSession(sentToken: string | null, status: number, message: string) {
  if (status !== 401 || message !== SESSION_ENDED || !sentToken || localStorage.getItem(TOKEN_KEY) !== sentToken) return
  localStorage.removeItem(TOKEN_KEY)
  sessionEndedListener?.(message)
}

export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  problem: Record<string, unknown>
  constructor(message: string, status: number, fields: Record<string, string> = {}, problem: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.fields = fields
    this.problem = problem
    this.name = "ApiError"
  }
}

const RESTART_STATUSES = [0, 502, 503, 504]

const NETWORK_FAILURE = /^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i

/** The backend's 503 detail while it can't reach its database (`DatabaseOutages.UNREACHABLE`). */
export const DATABASE_UNREACHABLE = "hrva.cc can't reach its database right now. Try again in a minute."

export const RESTART_RETRY_WINDOW_MS = 120_000

const FIRST_RETRY_DELAY_MS = 1_000

const LONGEST_RETRY_DELAY_MS = 8_000

const RETRIES_OTHER_ERRORS = 1

/** A 503 that says the server is up but its database or cache isn't (`outage` member, or a v2.30 backend's database text): an outage, not a restart. */
export const isOutage = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.status === 503 &&
  (typeof error.problem.outage === "string" || error.problem.detail === DATABASE_UNREACHABLE)

export const isRestartError = (error: unknown): boolean =>
  error instanceof ApiError
    ? RESTART_STATUSES.includes(error.status) && !isOutage(error)
    : error instanceof TypeError && NETWORK_FAILURE.test(error.message)

export const retryDelay = (attempt: number): number =>
  Math.min(FIRST_RETRY_DELAY_MS * 2 ** attempt, LONGEST_RETRY_DELAY_MS)

let restartingSince: number | null = null

let outageSeen = false

let lastRecoveryAt = Number.NEGATIVE_INFINITY

const RECOVERY_NOTICE_GAP_MS = 5_000

const recoveryListeners = new Set<() => void>()

/** When the backend first stopped answering (a network failure, 502, or a 503/504 that isn't an outage); null once it answers again. The UI times "Reconnecting…" and "Can't reach hrva.cc" from this. */
export const backendRestartingSince = (): number | null => restartingSince

/** True once the backend has been silent for longer than `RESTART_RETRY_WINDOW_MS`. */
export const restartTooLong = (now: number): boolean => restartingSince !== null && !withinRestartWindow(restartingSince, now)

/** Called when the backend answers again after a restart, or a signed-in request gets a real answer after an outage; at most once every 5 seconds. */
export const onBackendRecovered = (listener: () => void): (() => void) => {
  recoveryListeners.add(listener)
  return () => {
    recoveryListeners.delete(listener)
  }
}

export const noteBackendFailed = (at: number): void => {
  restartingSince ??= at
}

const announceRecovery = (now: number): void => {
  if (now - lastRecoveryAt < RECOVERY_NOTICE_GAP_MS) return
  lastRecoveryAt = now
  for (const listener of recoveryListeners) listener()
}

const noteOutage = (now = Date.now()): void => {
  const wasRestarting = restartingSince !== null
  outageSeen = true
  restartingSince = null
  if (wasRestarting) announceRecovery(now)
}

export const noteBackendAnswered = (signedIn = false, now = Date.now()): void => {
  const recovered = restartingSince !== null || (outageSeen && signedIn)
  restartingSince = null
  if (signedIn) outageSeen = false
  if (recovered) announceRecovery(now)
}

/** True while less than `RESTART_RETRY_WINDOW_MS` of wall-clock time, requests included, has passed since `since`. */
export const withinRestartWindow = (since: number, now: number): boolean => now - since <= RESTART_RETRY_WINDOW_MS

/** Whether a retry chain that started at `chainStartedAt` should try again: never for an outage, through a restart for 2 minutes, once for anything else. */
export const shouldRetryFrom = (chainStartedAt: number, failureCount: number, error: Error, now = Date.now()): boolean => {
  if (isOutage(error)) return false
  if (!isRestartError(error)) return failureCount < RETRIES_OTHER_ERRORS
  noteBackendFailed(now)
  return withinRestartWindow(chainStartedAt, now)
}

let activeChainStart: number | null = null

let looseChainStart: number | null = null

/** A retry decision; inside `perQueryRetry` the window is the query's own, otherwise a chain starts at each first failure. */
export const shouldRetry = (failureCount: number, error: Error): boolean => {
  const now = Date.now()
  if (activeChainStart === null && (failureCount === 0 || looseChainStart === null)) looseChainStart = now
  return shouldRetryFrom(activeChainStart ?? looseChainStart ?? now, failureCount, error, now)
}

export const retryUnlessRefused = (failureCount: number, error: Error): boolean =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && shouldRetry(failureCount, error)

type RetryDecision<E> = (failureCount: number, error: E) => boolean

const chainStarts = new Map<string, number>()

const perQueryRetries = new WeakSet<object>()

/** Forgets a query's retry chain, when the query leaves the cache. */
export const forgetRetryChain = (queryHash: string): void => {
  chainStarts.delete(queryHash)
}

/** How many queries have a retry chain going. */
export const retryChainCount = (): number => chainStarts.size

/** Times `retry`'s restart window from this query's own first failure, so a query that starts failing late in a long outage still gets its 2 minutes. */
export const perQueryRetry = <E>(queryHash: string, retry: RetryDecision<E>): RetryDecision<E> => {
  if (perQueryRetries.has(retry)) return retry
  const wrapped: RetryDecision<E> = (failureCount, error) => {
    const now = Date.now()
    if (failureCount === 0 || !chainStarts.has(queryHash)) chainStarts.set(queryHash, now)
    activeChainStart = chainStarts.get(queryHash) ?? now
    try {
      const again = retry(failureCount, error)
      if (!again) chainStarts.delete(queryHash)
      return again
    } finally {
      activeChainStart = null
    }
  }
  perQueryRetries.add(wrapped)
  return wrapped
}

const noteAnswer = (startedAt: number, status: number, problem: Record<string, unknown>, signedIn: boolean) => {
  const error = new ApiError("", status, {}, problem)
  if (isRestartError(error)) noteBackendFailed(startedAt)
  else if (isOutage(error)) noteOutage()
  else noteBackendAnswered(signedIn)
}

interface PageWrapper {
  page: { totalPages: number; totalElements: number; number?: number; size?: number }
  totalPages?: number
  totalElements?: number
  number?: number
  size?: number
}

const isPageWrapper = (data: unknown): data is PageWrapper =>
  typeof data === "object" && data !== null && (data as PageWrapper).page?.totalPages != null

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type ListParam = string | number | boolean | null | undefined

const listParams = (page: number, size: number, sort?: string, order?: string, extra: Record<string, ListParam> = {}) => {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
  for (const [name, value] of Object.entries(extra)) {
    if (value != null && value !== "") params.set(name, String(value))
  }
  return params
}

/** The stored screenshot's path, versioned by `takenAt` so a retake never comes from the browser's cache of the last one. */
export const linkScreenshotPath = (urlId: number, takenAt: string): string =>
  `/admin/urls/${urlId}/inspection/screenshot?v=${encodeURIComponent(takenAt)}`

interface ProblemBody {
  title?: unknown
  detail?: unknown
  errors?: unknown
}

const asProblem = (body: unknown): ProblemBody | null =>
  typeof body === "object" && body !== null && !Array.isArray(body) ? (body as ProblemBody) : null

/** Every member of an RFC 9457 problem, extension members such as `missing` and `verdict` included. */
const problemMembers = (body: unknown): Record<string, unknown> => ({ ...asProblem(body) })

/** The message of an RFC 9457 problem: its `detail`, else its `title`. */
export function errorMessage(body: unknown, status: number): string {
  const fallback = status >= 500 ? CANT_REACH : status === 429 ? TOO_MANY_REQUESTS : REQUEST_FAILED
  const problem = asProblem(body)
  if (!problem) return fallback
  const message = typeof problem.detail === "string" && problem.detail ? problem.detail : problem.title
  return typeof message === "string" && message ? message : fallback
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
  cache?: RequestCache,
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const token = localStorage.getItem(TOKEN_KEY)

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    reqHeaders["Authorization"] = token
  }

  if (headers) {
    Object.assign(reqHeaders, headers)
  }

  const startedAt = Date.now()
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache,
    })
  } catch {
    noteBackendFailed(startedAt)
    throw new ApiError(CANT_REACH, 0)
  }

  if (!response.ok) {
    const errorBody = await readBody(response).catch(() => undefined)
    const message = errorMessage(errorBody, response.status)
    noteAnswer(startedAt, response.status, problemMembers(errorBody), token !== null)
    endedSession(token, response.status, message)
    adminTwoStepRequired(response.status, message)
    throw new ApiError(message, response.status, validationFields(errorBody), problemMembers(errorBody))
  }

  noteBackendAnswered(token !== null)
  keepRenewedToken(token, response)

  if (response.status === 204 || response.status === 202) return {} as T

  const data = await readBody(response)

  // Normalize Spring Page wrapper: some endpoints return
  // {"content":[...],"page":{"totalPages":2,"totalElements":13}}
  // instead of flat fields. Promote nested page fields to root.
  if (isPageWrapper(data)) {
    data.totalPages = data.page.totalPages
    data.totalElements = data.page.totalElements
    data.number = data.page.number ?? data.number
    data.size = data.page.size ?? data.size
  }

  return data as T
}

// Auth
async function download(path: string, cache?: RequestCache): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY)
  const startedAt = Date.now()
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { headers: token ? { Authorization: token } : {}, cache })
  } catch {
    noteBackendFailed(startedAt)
    throw new ApiError(CANT_REACH, 0)
  }

  if (!response.ok) {
    const errorBody = await readBody(response).catch(() => undefined)
    const message = errorMessage(errorBody, response.status)
    noteAnswer(startedAt, response.status, problemMembers(errorBody), token !== null)
    endedSession(token, response.status, message)
    adminTwoStepRequired(response.status, message)
    throw new ApiError(message, response.status, validationFields(errorBody), problemMembers(errorBody))
  }

  noteBackendAnswered(token !== null)
  keepRenewedToken(token, response)
  return response
}

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    request<LoginResponse>("POST", "/auth/login", data),
  exchangeOAuthCode: (code: string, verifier: string) =>
    request<LoginResponse>("POST", "/auth/oauth/exchange", { code, verifier }),
  secondStepTotp: (pendingToken: string, code: string) =>
    request<SignedIn>("POST", "/auth/2fa/totp", { pendingToken, code }),
  secondStepPasskeyOptions: (pendingToken: string) =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/auth/2fa/webauthn/options", { pendingToken }),
  secondStepPasskey: (pendingToken: string, ceremonyId: string, credential: AssertionCredentialJSON) =>
    request<SignedIn>("POST", "/auth/2fa/webauthn/verify", { pendingToken, ceremonyId, credential }),
  passkeyOptions: () =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/auth/passkeys/options"),
  passkeySignIn: (ceremonyId: string, credential: AssertionCredentialJSON, rememberMe: boolean) =>
    request<SignedIn>("POST", "/auth/passkeys/verify", { ceremonyId, credential, rememberMe }),
  setupTwoFactor: () =>
    request<{ secret: string; otpauthUri: string }>("POST", "/auth/2fa/setup"),
  enableTwoFactor: (code: string) =>
    request<{ recoveryCodes: string[] }>("POST", "/auth/2fa/enable", { code }),
  register: (data: { email: string; password: string }) =>
    request<void>("POST", "/auth/register", data),
  requestPasswordReset: (data: { email: string }) =>
    request<void>("POST", "/auth/password-reset", data),
  resetPassword: (data: { token: string; password: string }) =>
    request<void>("POST", "/auth/password-reset/confirm", data),
  verifyEmail: (token: string) =>
    request<void>("POST", "/auth/verify-email/confirm", { token }),
  resendVerification: (email: string) =>
    request<void>("POST", "/auth/verify-email/resend", { email }),
}

export const passkeyApi = {
  list: () =>
    request<Passkey[]>("GET", "/users/me/passkeys"),
  registrationOptions: (password?: string) =>
    request<PasskeyOptions<CreationOptionsJSON>>("POST", "/users/me/passkeys/registration/options", { password }),
  register: (ceremonyId: string, credential: RegistrationCredentialJSON, label: string) =>
    request<Passkey>("POST", "/users/me/passkeys", { ceremonyId, credential, label }),
  rename: (id: number, label: string) =>
    request<Passkey>("PATCH", `/users/me/passkeys/${id}`, { label }),
  remove: (id: number, password?: string) =>
    request<void>("DELETE", `/users/me/passkeys/${id}`, { password }),
}

export const signInMethodApi = {
  turnOff: (method: SignInMethod) =>
    request<SignInMethodsResponse>("POST", `/users/me/sign-in-methods/${method}/turn-off`),
  turnOn: (method: SignInMethod, password?: string) =>
    request<SignInMethodsResponse>("POST", `/users/me/sign-in-methods/${method}/turn-on`, password ? { password } : undefined),
  removePassword: (currentPassword: string) =>
    request<SignInMethodsResponse>("POST", "/users/me/password/remove", { currentPassword }),
}

export const twoStepApi = {
  status: () =>
    request<TwoStepStatus>("GET", "/users/me/two-step"),
  enable: () =>
    request<{ recoveryCodes: string[] }>("POST", "/users/me/two-step/enable"),
  disableOptions: () =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/users/me/two-step/disable/options"),
  disable: (confirmation: { code: string } | { ceremonyId: string; credential: AssertionCredentialJSON }) =>
    request<void>("POST", "/users/me/two-step/disable", confirmation),
  removeTotp: (code: string) =>
    request<void>("DELETE", "/users/me/two-step/totp", { code }),
}

// URL
export const urlApi = {
  create: (data: CreateUrlDto, apiKey?: string, humanCheckToken?: string) => {
    const headers = {
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
      ...(humanCheckToken ? { "X-Turnstile-Token": humanCheckToken } : {}),
    }
    return request<UrlResponse>("POST", "/urls", data, Object.keys(headers).length > 0 ? headers : undefined)
  },
  bulkCreate: (data: CreateUrlDto[]) =>
    request<UrlResponse[]>("POST", "/urls/bulk", data),
  getMyUrls: (filters: UrlFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.expired) params.set("expired", "true")
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.tag) params.set("tag", filters.tag)
    return request<Page<UrlResponse>>("GET", `/urls?${params}`)
  },
  getMyTags: () =>
    request<string[]>("GET", "/urls/tags"),
  getAllUrls: (filters: UrlFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.expired) params.set("expired", "true")
    if (filters.anonymous) params.set("anonymous", "true")
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.deadDestination) params.set("deadDestination", "true")
    return request<Page<UrlResponse>>("GET", `/urls/all?${params}`)
  },
  getByShort: (short: string, domain?: string | null) =>
    request<UrlResponse>("GET", `/urls/${short}${domainQuery(domain, "?")}`),
  unlock: (short: string, password: string, domain?: string | null) =>
    request<{ longUrl: string }>("POST", `/urls/${short}/unlock${domainQuery(domain, "?")}`, { password }),
  peek: (short: string, domain?: string | null) =>
    request<PeekUrl>("GET", `/urls/${short}/peek${domainQuery(domain, "?")}`),
  preview: (short: string, domain?: string | null) =>
    request<LinkPreviewResponse>("GET", `/urls/${short}/preview${domainQuery(domain, "?")}`),
  getQrCodeUrl: (short: string, size = 300, domain?: string | null) =>
    `${getApiBaseUrl()}/urls/${short}/qr?size=${size}${domainQuery(domain, "&")}`,
  update: (id: number, data: UrlUpdateDto) =>
    request<UrlResponse>("PUT", `/urls/${id}`, data),
  deactivate: (id: number) =>
    request<UrlResponse>("PATCH", `/urls/${id}/deactivate`),
  activate: (id: number) =>
    request<UrlResponse>("PATCH", `/urls/${id}/activate`),
  destinationChange: (id: number) =>
    request<DestinationChangeInfo>("GET", `/urls/${id}/destination-change`),
  delete: (id: number) =>
    request<void>("DELETE", `/urls/${id}`),
  exportCsv: async () => {
    const response = await download("/urls/export")
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-urls.csv"
    a.click()
    URL.revokeObjectURL(url)
  },
}

// API Key
export const apiKeyApi = {
  generate: (expiry: ApiKeyExpiry = {}) =>
    request<ApiKeyCreated>("POST", "/api-keys", expiry),
  getMyKeys: (active?: boolean) =>
    request<ApiKeyResponse[]>("GET", active == null ? "/api-keys" : `/api-keys?active=${active}`),
  getMyInactiveKeys: (page = 0, size = 10) =>
    request<Page<ApiKeyResponse>>("GET", `/api-keys/inactive?${listParams(page, size)}`),
  getAllKeys: (filters: ApiKeyFilters = {}, page = 0, size = 20, sort = "createDate", order = "desc") =>
    request<Page<ApiKeyResponse>>("GET", `/api-keys/all?${listParams(page, size, sort, order, { search: filters.search, active: filters.active })}`),
  update: (id: number, data: ApiKeyUpdateDto) =>
    request<ApiKeyResponse>("PUT", `/api-keys/${id}`, data),
  revoke: (id: number) =>
    request<ApiKeyResponse>("PATCH", `/api-keys/${id}/revoke`),
  delete: (id: number) =>
    request<void>("DELETE", `/api-keys/${id}`),
  deleteInactive: () =>
    request<ApiKeysDeleted>("DELETE", "/api-keys/inactive"),
}

// User
export const userApi = {
  getMe: () =>
    request<UserDto>("GET", "/users/me"),
  setSignupSource: (source: SignupSource) =>
    request<void>("PUT", "/users/me/signup-source", { source }),
  renewSession: () =>
    request<Record<string, never>>("POST", "/users/me/sessions/renew"),
  getAll: (filters: UserFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.possibleScammer) params.set("possibleScammer", "true")
    if (filters.signInMethod) params.set("signInMethod", filters.signInMethod)
    return request<Page<User>>("GET", `/users?${params}`)
  },
  update: (id: number, data: UserUpdateDto) =>
    request<User>("PUT", `/users/${id}`, data),
  updatePassword: (data: UpdatePasswordDto) =>
    request<User>("PATCH", "/users/password", data),
  delete: (id: number) =>
    request<void>("DELETE", `/users/${id}`),
  deleteMe: (data?: { password?: string }) =>
    request<void>("DELETE", "/users/me", data),
  endAllSessions: async () => {
    const sentToken = localStorage.getItem(TOKEN_KEY)
    const answer = await request<{ token: string | null }>("POST", "/users/me/sessions/end")
    if (answer.token?.startsWith("Bearer ") && sentToken && localStorage.getItem(TOKEN_KEY) === sentToken) {
      localStorage.setItem(TOKEN_KEY, answer.token)
    }
    return answer
  },
  exportMyData: async () => {
    const response = await download("/users/me/export")
    const data = await response.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-data.json"
    a.click()
    URL.revokeObjectURL(url)
  },
}

export const connectApi = {
  getRequest: (handle: string) =>
    request<ConnectRequestView>("GET", `/connect/requests/${encodeURIComponent(handle)}`),
  approve: (handle: string) =>
    request<ConnectApproval>("POST", `/connect/requests/${encodeURIComponent(handle)}/approve`),
  deny: (handle: string) =>
    request<ConnectDenial>("POST", `/connect/requests/${encodeURIComponent(handle)}/deny`),
}

export const connectedAppsApi = {
  list: () =>
    request<ConnectedApp[]>("GET", "/users/me/connected-apps"),
  disconnect: (clientId: string) =>
    request<void>("DELETE", `/users/me/connected-apps/${encodeURIComponent(clientId)}`),
}

// Analytics
export const analyticsApi = {
  getOverview: (days: AnalyticsRange) =>
    request<AnalyticsOverview>("GET", `/analytics/overview?days=${days}`),
  getUrlAnalytics: (id: number, days: AnalyticsRange) =>
    request<UrlAnalytics>("GET", `/analytics/urls/${id}?days=${days}`),
}

// Admin campaigns
export const campaignApi = {
  list: (page = 0, size = 20, sort = "lastSeenAt", order = "desc", search?: string) =>
    request<Page<Campaign>>("GET", `/admin/campaigns?${listParams(page, size, sort, order, { search })}`),
  detail: (id: number) =>
    request<CampaignDetail>("GET", `/admin/campaigns/${id}`),
  links: (id: number, page = 0, size = 20, sort = "createDate", order = "desc", search?: string) =>
    request<Page<CampaignLink>>("GET", `/admin/campaigns/${id}/links?${listParams(page, size, sort, order, { search })}`),
  allow: (id: number) =>
    request<CampaignAllowed>("POST", `/admin/campaigns/${id}/allow`),
  blockPreview: (id: number) =>
    request<DomainBlockPreview[]>("POST", `/admin/campaigns/${id}/block-preview`),
}

// Admin abuse reports
export const abuseReportApi = {
  prepare: (source: AbuseReportSource) =>
    request<AbuseReportResponse>("POST", "/admin/abuse-reports", source),
  markReported: (domains: string[], registrar: string | null, abuseEmail: string | null) =>
    request<void>("POST", "/admin/abuse-reports/reported", { domains, registrar, abuseEmail }),
}

// Admin
export const adminApi = {
  getStats: () =>
    request<AdminStatsResponse>("GET", "/admin/stats"),
  getSystemStatus: () =>
    request<SystemStatus>("GET", "/admin/system-status"),
  getTrafficStats: (days: AnalyticsRange) =>
    request<TrafficStats>("GET", `/admin/stats/traffic?days=${days}`),
  getLinksStats: (days: AnalyticsRange) =>
    request<LinksStats>("GET", `/admin/stats/links?days=${days}`),
  getUsersStats: (days: AnalyticsRange) =>
    request<UsersStats>("GET", `/admin/stats/users?days=${days}`),
  getVisitStats: (days: AnalyticsRange) =>
    request<VisitStats>("GET", `/admin/stats/visits?days=${days}`),
  getSafetyStats: (days: AnalyticsRange) =>
    request<SafetyStats>("GET", `/admin/stats/safety?days=${days}`),
  getSystemStats: (days: AnalyticsRange) =>
    request<SystemStats>("GET", `/admin/stats/system?days=${days}`),
  getAuditLog: (filters: AuditLogFilters = {}, page = 0, size = 50, sort = "performedAt", order = "desc") =>
    request<Page<AuditLog>>("GET", `/admin/audit-log?${listParams(page, size, sort, order, {
      action: filters.action,
      search: filters.search,
      from: filters.from,
      to: filters.to,
    })}`),
  getEmailLog: (filters: EmailLogFilters = {}, page = 0, size = 50, sort = "createdAt", order = "desc") =>
    request<Page<EmailLog>>("GET", `/admin/email-log?${listParams(page, size, sort, order, { status: filters.status, search: filters.search })}`),
  resendEmail: (id: number) =>
    request<EmailLog>("POST", `/admin/email-log/${id}/resend`),
  getLoginAttempts: (search?: string, page = 0, size = 20, sort = "attempts", order = "desc") =>
    request<Page<LoginAttempt>>("GET", `/admin/login-attempts?${listParams(page, size, sort, order, { search })}`),
  clearLoginAttempts: () =>
    request<void>("DELETE", "/admin/login-attempts"),
  getBlocklistSources: () =>
    request<BlocklistSource[]>("GET", "/admin/blocklist-sources"),
  createBlocklistSource: (input: BlocklistSourceInput) =>
    request<BlocklistSource>("POST", "/admin/blocklist-sources", input),
  updateBlocklistSource: (id: number, input: BlocklistSourceInput) =>
    request<BlocklistSource>("PUT", `/admin/blocklist-sources/${id}`, input),
  deleteBlocklistSource: (id: number) =>
    request<void>("DELETE", `/admin/blocklist-sources/${id}`),
  refreshBlocklistSource: (id: number) =>
    request<BlocklistSource>("POST", `/admin/blocklist-sources/${id}/refresh`),
  getDomainRules: (type: DomainRuleType, page = 0, size = 20, sort = "createdAt", order = "desc", search?: string) => {
    const params = new URLSearchParams()
    params.set("type", type)
    params.set("page", String(page))
    params.set("size", String(size))
    params.set("sort", `${sort},${order}`)
    if (search) params.set("search", search)
    return request<Page<DomainRule>>("GET", `/admin/domain-rules?${params}`)
  },
  createDomainRule: (input: DomainRuleInput) =>
    request<DomainRuleCreated>("POST", "/admin/domain-rules", input),
  deleteDomainRule: (id: number) =>
    request<void>("DELETE", `/admin/domain-rules/${id}`),
  previewBlockDomains: (urlIds: number[]) =>
    request<DomainBlockPreview[]>("POST", "/admin/domain-rules/bulk-preview", { urlIds }),
  blockDomains: (domains: string[], reason: string) =>
    request<DomainBulkBlockResult>("POST", "/admin/domain-rules/bulk", { domains, reason }),
  getReservedAliases: (search?: string, page = 0, size = 20, sort?: string, order = "asc") =>
    request<Page<ReservedAlias>>("GET", `/admin/reserved-aliases?${listParams(page, size, sort, order, { search })}`),
  reserveAlias: (input: ReservedAliasInput) =>
    request<ReservedAlias>("POST", "/admin/reserved-aliases", input),
  unreserveAlias: (id: number) =>
    request<void>("DELETE", `/admin/reserved-aliases/${id}`),
  getReviewQueue: ({ page = 0, size = 20, reason, olderThanDays, search, sort, order = "desc" }: ReviewQueueFilters = {}) =>
    request<Page<ReviewEntry>>("GET", `/admin/review-queue?${listParams(page, size, sort, order, { reason, olderThanDays, search })}`),
  resolveReview: (urlId: number, action: ReviewAction, domain?: string) =>
    request<void>("POST", `/admin/review-queue/${urlId}/resolve`, domain ? { action, domain } : { action }),
  resolveReviews: (urlIds: number[], action: ReviewAction) =>
    request<ReviewBulkResolveResult>("POST", "/admin/review-queue/resolve", { urlIds, action }),
  clearWarningPage: (id: number) =>
    request<UrlResponse>("DELETE", `/admin/urls/${id}/warning-page`),
  getLinkInspection: (urlId: number) =>
    request<LinkInspection>("GET", `/admin/urls/${urlId}/inspection`),
  getLinkScreenshot: async (urlId: number, takenAt: string): Promise<Blob> => {
    const response = await download(linkScreenshotPath(urlId, takenAt), "no-store")
    return response.blob()
  },
  takeLinkScreenshot: (urlId: number) =>
    request<void>("POST", `/admin/urls/${urlId}/inspection/screenshot`),
  sendToVirusTotal: (urlId: number) =>
    request<VirusTotalView>("POST", `/admin/urls/${urlId}/inspection/virustotal`),
  lookUpOnVirusTotal: (urlId: number) =>
    request<void>("POST", `/admin/urls/${urlId}/inspection/virustotal/lookup`),
  getDestinationChanges: (id: number, page = 0, size = 10, sort = "changedAt", order = "desc", search?: string) =>
    request<Page<LinkDestinationChange>>("GET", `/admin/urls/${id}/destination-changes?${listParams(page, size, sort, order, { search })}`),
  getDestinationStanding: (userId: number) =>
    request<DestinationChangeStanding>("GET", `/admin/users/${userId}/destination-changes`),
  setDestinationOverride: (userId: number, override: DestinationChangeOverride) =>
    request<DestinationChangeStanding>("PUT", `/admin/users/${userId}/destination-changes`, { override }),
  blockUser: (id: number) =>
    request<LinksAffected>("POST", `/admin/users/${id}/block`),
  unblockUser: (id: number) =>
    request<LinksAffected>("POST", `/admin/users/${id}/unblock`),
  getPossibleScammers: () =>
    request<number[]>("GET", "/admin/possible-scammers"),
  checkUrl: (url: string) =>
    request<UrlCheckResult>("POST", "/admin/url-check", { url }),
  exportUrlsCsv: async () => {
    const response = await download("/admin/urls/export")
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "all-urls.csv"
    a.click()
    URL.revokeObjectURL(url)
  },
}

// Reports
export const reportApi = {
  report: (data: LinkReport) =>
    request<void>("POST", "/reports", data),
}

// Public numbers
export const publicApi = {
  getStats: () => request<PublicStatsResponse>("GET", "/public/stats"),
  getSettings: (cache?: RequestCache) => request<PublicSettings>("GET", "/public/settings", undefined, undefined, cache),
  checkAlias: (name: string) =>
    request<AliasCheck>("GET", `/public/alias-check?name=${encodeURIComponent(name)}`, undefined, undefined, "no-store"),
}

// Bio pages
export const bioApi = {
  mine: () =>
    request<BioPage>("GET", "/bio-pages/me"),
  create: (handle: string) =>
    request<BioPage>("POST", "/bio-pages/me", { handle }),
  update: (data: BioPageUpdate) =>
    request<BioPage>("PUT", "/bio-pages/me", data),
  changeHandle: (handle: string) =>
    request<BioPage>("PUT", "/bio-pages/me/handle", { handle }),
  remove: () =>
    request<void>("DELETE", "/bio-pages/me"),
  availability: (handle: string) =>
    request<BioHandleAvailability>("GET", `/bio-pages/handles/${encodeURIComponent(handle)}/availability`),
  analytics: (days: AnalyticsRange) =>
    request<BioPageAnalytics>("GET", `/analytics/bio-page?days=${days}`),
}

export const adminBioApi = {
  list: ({ search, hiddenOnly }: { search?: string; hiddenOnly?: boolean } = {}, page = 0, size = 20, sort = "createdAt", order = "desc") =>
    request<Page<AdminBioPage>>("GET", `/admin/bio-pages?${listParams(page, size, sort, order, { search, hidden: hiddenOnly || undefined })}`),
  hide: (id: number, reason: string) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/hide`, { reason }),
  unhide: (id: number) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/unhide`),
  changeHandle: (id: number, handle: string) =>
    request<AdminBioPage>("PUT", `/admin/bio-pages/${id}/handle`, { handle }),
  revokeHandle: (id: number, reason: string, expectedHandle?: string | null) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/revoke-handle`, { reason, expectedHandle: expectedHandle ?? undefined }),
  reviews: (search?: string, page = 0, size = 20, sort = "flaggedAt", order = "desc") =>
    request<Page<BioPageReviewEntry>>("GET", `/admin/bio-page-reviews?${listParams(page, size, sort, order, { search })}`),
  resolveReview: (pageId: number, action: BioPageReviewAction, reason?: string) =>
    request<void>("POST", `/admin/bio-page-reviews/${pageId}/resolve`, reason ? { action, reason } : { action }),
}

/** The field errors of an RFC 9457 problem, from its `errors` object. */
export function validationFields(body: unknown): Record<string, string> {
  const errors = asProblem(body)?.errors
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) return {}
  return Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
}

export const notificationApi = {
  consents: () =>
    request<NotificationConsent[]>("GET", "/users/me/notifications"),
  setConsent: (type: EmailNotificationType, consented: boolean) =>
    request<NotificationConsent>("PUT", `/users/me/notifications/${type}`, { consented }),
  channels: () =>
    request<NotificationChannel[]>("GET", "/users/me/notification-channels"),
  createChannel: (input: NotificationChannelInput) =>
    request<NotificationChannel>("POST", "/users/me/notification-channels", input),
  updateChannel: (id: number, input: NotificationChannelInput) =>
    request<NotificationChannel>("PUT", `/users/me/notification-channels/${id}`, input),
  deleteChannel: (id: number) =>
    request<void>("DELETE", `/users/me/notification-channels/${id}`),
  testChannel: (id: number) =>
    request<ChannelTestResult>("POST", `/users/me/notification-channels/${id}/test`),
  newSigningSecret: (id: number) =>
    request<{ signingSecret: string }>("POST", `/users/me/notification-channels/${id}/signing-secret`),
  unsubscribe: (token: string) =>
    request<UnsubscribeResult>("POST", `/notifications/unsubscribe?token=${encodeURIComponent(token)}`),
}

function domainQuery(domain: string | null | undefined, separator: "?" | "&"): string {
  return domain ? `${separator}domain=${encodeURIComponent(domain)}` : ""
}

export const domainApi = {
  mine: () =>
    request<MyDomains>("GET", "/users/me/domains"),
  apply: (hostname: string, reason: string) =>
    request<CustomDomain>("POST", "/users/me/domains", { hostname, reason }),
  get: (id: number) =>
    request<CustomDomain>("GET", `/users/me/domains/${id}`),
  remove: (id: number, links: DomainLinkMode) =>
    request<DomainRemoval>("DELETE", `/users/me/domains/${id}?links=${links}`),
  retry: (id: number) =>
    request<CustomDomain>("POST", `/users/me/domains/${id}/retry`),
  useAgain: (id: number) =>
    request<CustomDomain>("POST", `/users/me/domains/${id}/use-again`),
  requestMore: (requestedTotal: number, reason: string) =>
    request<DomainRequest>("POST", "/users/me/domains/requests", { requestedTotal, reason }),
  withdrawRequest: (id: number) =>
    request<void>("DELETE", `/users/me/domains/requests/${id}`),
}

export const adminDomainApi = {
  list: ({ status, search, page, size, sort, order }: AdminDomainFilters) =>
    request<Page<AdminDomain>>("GET", `/admin/domains?${listParams(page, size, sort, order, { status, search })}`),
  summary: () =>
    request<DomainSummary>("GET", "/admin/domains/summary"),
  approve: (id: number, note?: string | null) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/approve`, { note: note || null }),
  reject: (id: number, note?: string | null) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/reject`, { note: note || null }),
  disable: (id: number, note: string) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/disable`, { note }),
  enable: (id: number) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/enable`),
  retry: (id: number) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/retry`),
  remove: (id: number, links: DomainLinkMode) =>
    request<DomainRemoval>("DELETE", `/admin/domains/${id}?links=${links}`),
  checkCloudflare: () =>
    request<CloudflareCheck>("POST", "/admin/domains/cloudflare-check"),
  reconcile: () =>
    request<DomainReconcile>("POST", "/admin/domains/reconcile"),
  allowance: (userId: number) =>
    request<DomainAllowance>("GET", `/admin/domains/allowances/${userId}`),
  setAllowance: (userId: number, maxDomains: number, reason: string) =>
    request<DomainAllowance>("PUT", `/admin/domains/allowances/${userId}`, { maxDomains, reason }),
  removeAllowance: (userId: number) =>
    request<void>("DELETE", `/admin/domains/allowances/${userId}`),
  requests: ({ status, search, page, size, sort, order }: AdminDomainRequestFilters) =>
    request<Page<AdminDomainRequest>>("GET", `/admin/domains/requests?${listParams(page, size, sort, order, { status, search })}`),
  approveRequest: (id: number, note?: string | null) =>
    request<AdminDomainRequest>("POST", `/admin/domains/requests/${id}/approve`, { note: note || null }),
  declineRequest: (id: number, note?: string | null) =>
    request<AdminDomainRequest>("POST", `/admin/domains/requests/${id}/decline`, { note: note || null }),
}

export const settingsApi = {
  list: () =>
    request<SettingResponse[]>("GET", "/admin/settings"),
  change: (key: SettingKey, value: SettingValue) =>
    request<SettingResponse>("PUT", `/admin/settings/${key}`, { value }),
  reset: (key: SettingKey) =>
    request<SettingResponse>("DELETE", `/admin/settings/${key}`),
}
