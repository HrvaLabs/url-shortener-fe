export interface Authorities {
  id: number
  name: string
  active: boolean
}

export interface User {
  id: number
  name?: string
  email: string
  password?: string
  apiKeySlots: number
  authorities: Authorities[]
  createDate: string
  lastLogin: string
  active: boolean
  authProvider?: string
  signInMethods?: SignInMethodUse[]
  possibleScammer?: boolean
  destinationChanges?: DestinationChangeStanding
  askSignupSource?: boolean
}

/** The admin's choice for an account's destination changes on hrva.cc links. */
export type DestinationChangeOverride = "AUTOMATIC" | "ALWAYS" | "NEVER"

export type RequirementCode =
  | "LINK_WITH_ACCOUNT"
  | "CHANGES_TURNED_ON"
  | "ACCOUNT_TURNED_OFF"
  | "TWO_STEP_SIGN_IN"
  | "ACCOUNT_AGE"
  | "VERIFIED_EMAIL"
  | "NO_BLOCKED_LINKS"
  | "NO_LINKS_BEING_CHECKED"
  | "NO_RECENT_BLOCKS"
  | "DOMAIN_ACTIVE"
  | "LINK_NOT_BLOCKED"
  | "LINK_NOT_BEING_CHECKED"
  | "DAILY_CHANGES_LEFT"

/** One thing that stops a destination change, with the backend's final text. `availableFrom` is when it is met by itself. */
export interface MissingRequirement {
  code: RequirementCode | string
  text: string
  availableFrom: string | null
}

/** `GET /urls/{id}/destination-change`: whether the caller can change where the link points now. */
export interface DestinationChangeInfo {
  allowed: boolean
  missing: MissingRequirement[]
  changesLeft: number | null
}

/** An account's destination change standing, for admins: the override, the result and the live good standing. */
export interface DestinationChangeStanding {
  override: DestinationChangeOverride
  allowed: boolean
  inGoodStanding: boolean
  missing: MissingRequirement[]
}

export type DestinationChangeChannel = "WEB" | "API_KEY"

/** One row of a link's destination history (admin only). */
export interface LinkDestinationChange {
  id: number
  oldLongUrl: string
  newLongUrl: string
  changedBy: string
  via: DestinationChangeChannel
  changedAt: string
  forced?: boolean
}

export type SignInMethod = "PASSWORD" | "PASSKEY" | "GOOGLE" | "GITHUB"

export interface SignInMethodUse {
  method: SignInMethod
  firstUsedAt: string
  lastUsedAt: string
  turnedOffAt: string | null
}

export interface SignInMethodsResponse {
  signInMethods: SignInMethodUse[]
}

export interface UserDto {
  id: number
  name?: string
  email: string
  apiKeySlots: number
  authorities: Authorities[]
  createDate: string
  lastLogin: string
  authProvider?: string
  twoFactorEnabled?: boolean
  twoStepEnabled?: boolean
  passwordSet?: boolean
  signInMethods?: SignInMethodUse[]
  askSignupSource?: boolean
}

export interface Url {
  id: number
  longUrl: string
  shortUrl: string
  owner?: User
  apiKey?: ApiKey
  createDate: string
  lastAccessed?: string
  expirationDate?: string
  visits: number
  visitLimit: number
  lastSafeBrowsingCheck?: string
  platformType?: string
  threatType?: string
  active: boolean
}

/** New API response — slimmed down, no apiKey/internal fields */
export interface UrlResponse {
  id: number
  longUrl: string
  shortUrl: string
  createDate: string
  expirationDate?: string
  visits: number
  visitLimit: number
  opens?: number
  active: boolean
  status?: string
  tags?: string[]
  passwordProtected?: boolean
  ownerEmail?: string
  suspiciousReasons?: string[]
  blockReason?: BlockReason
  reviewOpen?: boolean
  ownerPossibleScammer?: boolean
  finalUrl?: string | null
  warningPage?: boolean
  warningPageForReview?: boolean | null
  shortLink?: string
}

export interface ApiKey {
  id: number
  keyPrefix: string
  owner: User
  apiCallsUsed: number
  lastUsedAt: string | null
  createDate: string
  expirationDate: string | null
  active: boolean
}

export type ApiKeyStatus = "ACTIVE" | "EXPIRED" | "REVOKED"

/** What every key list and update returns. The full key is never in it: the backend keeps only a hash. */
export interface ApiKeyResponse {
  id: number
  keyPrefix: string
  apiCallsUsed: number
  lastUsedAt: string | null
  createDate: string
  expirationDate: string | null
  active: boolean
  status: ApiKeyStatus
  ownerEmail?: string
}

/** The answer to creating a key, the only one that has the full key. It is shown once and not kept. */
export interface ApiKeyCreated extends ApiKeyResponse {
  key: string
}

export type AnalyticsRange = 7 | 30 | 90 | 365

export interface AnalyticsTotals {
  clicks: number
  uniqueVisitors: number
  botClicks: number
}

export interface AnalyticsDay {
  date: string
  clicks: number
  uniqueVisitors: number
  botClicks: number
}

export interface BreakdownEntry {
  value: string
  clicks: number
}

export interface AnalyticsBreakdowns {
  referrers: BreakdownEntry[]
  countries: BreakdownEntry[]
  devices: BreakdownEntry[]
  browsers: BreakdownEntry[]
  operatingSystems: BreakdownEntry[]
  sources: BreakdownEntry[]
}

export type BreakdownDimension = keyof AnalyticsBreakdowns

export interface AnalyticsLinkSummary {
  id: number
  shortUrl: string
  destinationHost: string
  status: string
  passwordProtected: boolean
  createDate?: string | null
  lastAccessed?: string | null
  visits: number
  longUrl?: string | null
}

export interface UrlAnalytics {
  link: AnalyticsLinkSummary
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  breakdowns: AnalyticsBreakdowns
}

export interface AnalyticsTopLink {
  id: number
  shortUrl: string
  destinationHost: string
  clicks: number
  uniqueVisitors: number
}

export interface AnalyticsOverview {
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  topLinks: AnalyticsTopLink[]
  breakdowns: AnalyticsBreakdowns
  totalUrls: number
  activeUrls: number
  expiredUrls: number
  totalVisits: number
}

export interface CountEntry {
  value: string
  count: number
}

export interface DailyCounts {
  date: string
  counts: Record<string, number>
}

export interface StackedSeries {
  keys: string[]
  daily: DailyCounts[]
}

export interface TrafficTopLink {
  id: number
  shortUrl: string
  destinationHost: string
  ownerEmail: string | null
  clicks: number
  uniqueVisitors: number
}

export interface TrafficStats {
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  anonymousClicks: number
  accountClicks: number
  topLinks: TrafficTopLink[]
  breakdowns: AnalyticsBreakdowns
  allTimeVisits: number
  bioPageViews?: { views: number; botViews: number }
}

export type CreatedVia = "WEB" | "API_KEY" | "BULK" | "MCP" | "ANONYMOUS_WEB" | "ANONYMOUS_MCP"

export interface NewestLink {
  id: number
  shortUrl: string
  destinationHost: string
  ownerEmail: string | null
  createdVia: CreatedVia | "unknown"
  createDate: string
  status: string
}

export interface LinksStats {
  days: AnalyticsRange
  from: string
  to: string
  created: StackedSeries
  createdInRange: {
    total: number
    account: number
    anonymous: number
    aiTagged: number
  }
  now: {
    total: number
    active: number
    inactive: number
    expired: number
    passwordProtected: number
    withVisitLimit: number
    withExpiry: number
    blockedByReason: CountEntry[]
  }
  topTags: CountEntry[]
  topDomains: CountEntry[]
  newest: NewestLink[]
}

export interface UsersStats {
  days: AnalyticsRange
  from: string
  to: string
  signups: StackedSeries
  now: {
    total: number
    active: number
    deactivated: number
    admins: number
    emailVerified: number
    twoFactorEnabled: number
    byProvider: CountEntry[]
  }
  activeLast7Days: number
  activeLast30Days: number
  apiKeys: {
    active: number
    expired: number
    revoked: number
    callsUsed: number
  }
  mcp: {
    connectedUsers: number
    registeredClients: number
  }
  bioPages?: { total: number; hidden: number }
}

export type ReviewSource = "SYSTEM" | "VISITOR"

export type ReviewResolution = "OK" | "DOMAIN_TRUSTED" | "LINK_BLOCKED" | "DOMAIN_BLOCKED" | "USER_BLOCKED" | "DESTINATION_CHANGED"

export interface SourceHealth {
  id: number
  name: string
  action: SourceAction
  enabled: boolean
  domainCount: number | null
  memoryBytes: number | null
  lastSuccessAt: string | null
  lastError: string | null
}

export interface SafetyStats {
  days: AnalyticsRange
  from: string
  to: string
  reviewsOpened: StackedSeries
  openReviews: number
  openVisitorReports: number
  resolved: CountEntry[]
  resolveTimes: {
    count: number
    medianMinutes: number | null
    p90Minutes: number | null
  }
  blocked: StackedSeries
  domainRules: {
    block: number
    allow: number
  }
  possibleScammers: number
  sources: SourceHealth[]
}

export interface RedirectTiming {
  source: "cache" | "db"
  count: number
  meanMs: number | null
  maxMs: number | null
}

export interface RedisKeyCounts {
  counts: Record<string, number>
  other: number
  scanned: number
  capped: boolean
}

export type EmailStatus = "SENT" | "FAILED" | "SENDING" | "RESENT" | "SKIPPED"

export interface SystemStats {
  days: AnalyticsRange
  from: string
  to: string
  appVersion: string
  startedAt: string
  uptime: string
  javaVersion: string
  activeProfiles: string[]
  jvmHeapUsedBytes: number
  jvmHeapMaxBytes: number
  redirects: RedirectTiming[]
  requests: {
    total: number
    serverErrors: number
  }
  cache: {
    hits: number
    misses: number
    hitRatio: number | null
  }
  health: {
    database: string
    redis: string
  }
  redis: {
    usedMemoryBytes: number | null
    maxMemoryBytes: number | null
    keys: RedisKeyCounts | null
  }
  database: {
    product: string
    version: string
    sizeBytes: number | null
    shortUrlUnique: boolean
  }
  emails: StackedSeries
}

export interface PeekUrl {
  longUrl: string | null
  shortUrl: string
  createDate: string
  passwordProtected?: boolean
}

export interface JWTTokenDto {
  token: string
  user: UserDto
}

export interface LoginDto {
  email: string
  password: string
  rememberMe?: boolean
}

export const TWO_STEP_METHODS = ["TOTP", "WEBAUTHN", "RECOVERY_CODE"] as const

export type TwoStepMethod = (typeof TWO_STEP_METHODS)[number]

export type PasskeyKind = "SYNCED" | "DEVICE_BOUND" | "SECOND_STEP_ONLY" | "UNKNOWN"

export interface LoginResponse {
  token?: string | null
  user?: UserDto | null
  twoFactorRequired?: boolean | null
  twoStepRequired?: boolean | null
  pendingToken?: string | null
  methods?: TwoStepMethod[] | null
}

export interface SignedIn {
  token: string
  user: UserDto
}

export interface PasskeyOptions<T> {
  ceremonyId: string
  options: T
}

export interface CredentialDescriptorJSON {
  type: "public-key"
  id: string
  transports?: string[]
}

export interface CreationOptionsJSON {
  rp: { id?: string; name: string }
  user: { id: string; name: string; displayName: string }
  challenge: string
  pubKeyCredParams: { type: "public-key"; alg: number }[]
  timeout?: number
  excludeCredentials?: CredentialDescriptorJSON[]
  authenticatorSelection?: AuthenticatorSelectionCriteria
  attestation?: AttestationConveyancePreference
  extensions?: { credProps?: boolean }
}

export interface RequestOptionsJSON {
  challenge: string
  timeout?: number
  rpId?: string
  allowCredentials?: CredentialDescriptorJSON[]
  userVerification?: UserVerificationRequirement
  extensions?: AuthenticationExtensionsClientInputs
}

export interface RegistrationCredentialJSON {
  id: string
  rawId: string
  type: "public-key"
  authenticatorAttachment: string | null
  clientExtensionResults: { credProps?: { rk?: boolean } }
  response: {
    clientDataJSON: string
    attestationObject: string
    transports: string[]
  }
}

export interface AssertionCredentialJSON {
  id: string
  rawId: string
  type: "public-key"
  authenticatorAttachment: string | null
  clientExtensionResults: { credProps?: { rk?: boolean } }
  response: {
    authenticatorData: string
    clientDataJSON: string
    signature: string
    userHandle: string | null
  }
}

export interface Passkey {
  id: number
  label: string
  kind: PasskeyKind
  backupEligible: boolean
  backedUp: boolean
  discoverable: boolean | null
  transports: string[]
  createdAt: string
  lastUsedAt: string | null
}

export interface TwoStepStatus {
  enabled: boolean
  totp: boolean
  passkeys: number
  recoveryCodesRemaining: number
}

/** New API — name field removed */
export interface UserRegisterDto {
  email: string
  password: string
}

export interface CreateUrlDto {
  longUrl: string
  shortUrl?: string
  visitLimit?: number
  expirationDate?: string
  tags?: string[]
  password?: string
}

/**
 * `PUT /urls/{id}`. `visitLimit` and `expirationDate` are replaced by what is sent (null removes them), so always send both.
 * `longUrl`, `tags`, `password` and `active` left out (or null) are left as they are; `password: ""` removes the password.
 */
export interface UrlUpdateDto {
  id: number
  longUrl?: string
  visitLimit: number | null
  expirationDate: string | null
  tags?: string[]
  password?: string
  active?: boolean
  force?: boolean
}

/** How long a key lasts: a number of days from now (1 to 3,650) or no end date. Send one of the two, never both. */
export interface ApiKeyExpiry {
  expiresInDays?: number
  neverExpires?: true
}

export interface ApiKeyUpdateDto extends ApiKeyExpiry {
  id: number
  expirationDate?: string
  active?: boolean
}

/** New API — name field removed */
export interface UserUpdateDto {
  id: number
  email?: string
  apiKeySlots?: number
  active?: boolean
}

export interface UpdatePasswordDto {
  oldPassword: string
  newPassword: string
}

export interface RequestPasswordResetDto {
  email: string
}

export interface PasswordResetDto {
  token: string
  email: string
  password: string
}

/** Link preview from OG/Twitter meta tags */
export interface LinkPreviewResponse {
  url: string
  title?: string
  description?: string
  imageUrl?: string
}

/** Generic paginated response (Spring Page<T>) */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface AdminStatsResponse {
  totalUsers: number
  newUsers7d: number
  newUsers30d: number
  totalUrls: number
  activeUrls: number
  totalApiKeys: number
  appVersion: string
  uptime: string
  cacheActive: boolean
  databaseActive: boolean
  javaVersion: string
  serverTime: string
  recentUrls: RecentUrlItem[]
  cacheHitRatio: string
  activeProfiles: string[]
  jvmMemoryUsed: string
  jvmMemoryMax: string
  requestsCount: number
  redirectAvgMs?: string
  redirectMaxMs?: string
  redirectCount?: number
  blocklists?: BlocklistStatus[]
}

export interface BlocklistStatus {
  id: number
  name: string
  refreshIntervalHours: number
  lastRefreshedAt: string | null
  consecutiveErrors: number
  stale: boolean
}

export interface SystemStatusProblem {
  /** Contains `{at}` exactly when `at` is set. */
  text: string
  at: string | null
  /** What stops working, or why it failed. */
  detail: string | null
}

export interface SystemStatusSummary {
  ok: boolean
  /** Whole sentences with any time in UTC; the v2.30 backend sends only these. */
  problems: string[]
  /** v2.31: the same problems, with the time for the page to format. */
  items?: SystemStatusProblem[]
}

export interface SystemStatusTraffic {
  windowMinutes: number
  requests: number
  redirects: number
  p50Ms: number | null
  p95Ms: number | null
  serverErrors: number
  recentMinutes?: number
  recentServerErrors?: number
}

export interface SystemStatusDatabase {
  up: boolean
  latencyMs: number | null
  poolActive: number | null
  poolMax: number | null
}

export interface SystemStatusRedis {
  up: boolean
  latencyMs: number | null
  hitRatio: number | null
}

export interface SystemStatusEmail {
  lastSentAt: string | null
  failures24h: number
}

export interface SystemStatusScreenshots {
  configured: boolean
  enabled: boolean
  browserSecondsToday: number | null
  browserSecondsLimit: number | null
  queued: number | null
  pausedUntil: string | null
}

export interface SystemStatusVirusTotal {
  configured: boolean
  enabled: boolean
  lookupsToday: number | null
  dailyLimit: number | null
  queued: number | null
  pausedUntil: string | null
}

export interface SystemStatusBlocklists {
  lastRefreshAt: string | null
  stale: string[]
}

export interface SystemStatusServer {
  version: string | null
  startedAt: string | null
  uptimeSeconds: number | null
  startupSeconds: number | null
  heapUsedBytes: number | null
  heapMaxBytes: number | null
  gcPauseMsTotal: number | null
}

export type JobOutcome = "OK" | "FAILED"

export interface SystemStatusJob {
  name: string
  label: string
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastOutcome: JobOutcome | null
  lastError: string | null
  /** v2.31: the last failure in plain words. */
  lastReason?: string | null
  /** v2.31: plumbing that keeps in-memory copies and metrics in step. */
  internal?: boolean
  /** v2.31: how often it runs, such as `Every 5 minutes` or `Daily`. */
  schedule?: string | null
  nextRunAt?: string | null
}

export interface SystemStatus {
  summary: SystemStatusSummary
  traffic: SystemStatusTraffic
  database: SystemStatusDatabase
  redis: SystemStatusRedis
  email: SystemStatusEmail
  screenshots: SystemStatusScreenshots
  virusTotal: SystemStatusVirusTotal
  blocklists: SystemStatusBlocklists
  server: SystemStatusServer
  jobs: SystemStatusJob[]
}

export interface RecentUrlItem {
  id: number
  shortUrl: string
  longUrl: string
  createDate: string
  visits: number
  ownerEmail?: string
}

export interface UrlFilters {
  search?: string
  active?: boolean
  expired?: boolean
  anonymous?: boolean
  dateFrom?: string
  dateTo?: string
  tag?: string
}

export interface ApiKeyFilters {
  search?: string
  active?: boolean
}

export interface AuditLogFilters {
  action?: AuditAction
  search?: string
  from?: string
  to?: string
}

export interface EmailLogFilters {
  status?: EmailStatus
  search?: string
}

export interface LoginAttempt {
  key: string
  attempts: number
}

export interface UserFilters {
  search?: string
  active?: boolean
  possibleScammer?: boolean
  signInMethod?: SignInMethod
}

export type AuditAction =
  | "CLEAR_LOGIN_ATTEMPTS"
  | "CLEAR_WARNING_PAGE"
  | "RESEND_EMAIL"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "UPDATE_URL"
  | "REVOKE_URL"
  | "ACTIVATE_URL"
  | "DELETE_URL"
  | "CREATE_SOURCE"
  | "UPDATE_SOURCE"
  | "DELETE_SOURCE"
  | "REFRESH_SOURCE"
  | "RESOLVE_REVIEW"
  | "BLOCK_LINK"
  | "BLOCK_DOMAIN"
  | "ALLOW_DOMAIN"
  | "REMOVE_DOMAIN_RULE"
  | "BLOCK_USER"
  | "REACTIVATE_USER"
  | "DELETE_LINK"
  | "RESERVE_ALIAS"
  | "UNRESERVE_ALIAS"
  | "HIDE_BIO_PAGE"
  | "UNHIDE_BIO_PAGE"
  | "RENAME_BIO_HANDLE"
  | "REVOKE_BIO_HANDLE"
  | "RESOLVE_BIO_REVIEW"
  | "APPROVE_DOMAIN"
  | "REJECT_DOMAIN"
  | "DISABLE_DOMAIN"
  | "ENABLE_DOMAIN"
  | "RETRY_DOMAIN"
  | "DELETE_DOMAIN"
  | "SET_DOMAIN_ALLOWANCE"
  | "REMOVE_DOMAIN_ALLOWANCE"
  | "APPROVE_DOMAIN_REQUEST"
  | "DECLINE_DOMAIN_REQUEST"
  | "CHANGE_SETTING"
  | "RESET_SETTING"
  | "TURN_OFF_SIGN_IN_METHOD"
  | "TURN_ON_SIGN_IN_METHOD"
  | "REMOVE_PASSWORD"
  | "ALLOW_CAMPAIGN_SHAPE"
  | "REPORT_DOMAINS"
  | "CHANGE_LINK_DESTINATION"
  | "SET_DESTINATION_CHANGE_OVERRIDE"
  | "TAKE_SCREENSHOT"
  | "SUBMIT_TO_VIRUSTOTAL"
  | "UNKNOWN"

export interface AuditLog {
  id: number
  performedBy: string
  action: AuditAction
  failed: boolean
  targetType: string
  targetIdentifier: string | null
  details: string | null
  performedAt: string
}

export interface EmailLog {
  id: number
  sender?: string | null
  recipient: string
  subject: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
  resendable?: boolean
}

export interface ConnectRequestView {
  clientName: string
  redirectHost: string | null
  loopback: boolean
  lookalike: boolean
  appScheme: string | null
  unknownDestination: boolean
}

export interface ConnectApproval {
  continueUrl: string
}

export interface ConnectDenial {
  redirectTo: string
}

export interface ConnectedApp {
  clientId: string
  clientName: string
  firstConnected: string
  lastUsed: string | null
}

export type BlockReason = "SAFE_BROWSING" | "BLOCKLIST" | "DOMAIN_RULE" | "ADMIN" | "USER_BLOCKED" | "SCAM_SIGNALS" | "CAMPAIGN" | "SIGN_IN_FORM"

export type SourceKind = "DOMAINS" | "LINKS" | "TOP_SITES" | "SHORTENERS" | "ENDINGS" | "BRAND_SITES"

export type SourceAction = "BLOCK" | "FLAG" | "TRUST" | "NOTE"

export interface BlocklistSource {
  id: number
  name: string
  url: string
  fallbackUrls: string[]
  kind: SourceKind
  action: SourceAction
  enabled: boolean
  refreshIntervalHours: number
  lastFetchedAt: string | null
  lastSuccessAt: string | null
  lastSuccessUrl: string | null
  domainCount: number | null
  listVersion: string | null
  lastError: string | null
  memoryBytes: number | null
}

export interface BlocklistSourceInput {
  name: string
  url: string
  kind: SourceKind
  action: SourceAction
  enabled: boolean
  refreshIntervalHours: number
  fallbackUrls: string[]
}

export type DomainRuleType = "BLOCK" | "ALLOW"

export interface ReservedAliasLink {
  id: number
  shortUrl: string
  ownerEmail: string | null
  active: boolean
}

export interface ReservedAlias {
  id: number | null
  alias: string
  reason: string
  builtIn: boolean
  createdAt: string | null
  createdBy: string | null
  inUse: ReservedAliasLink[]
}

export interface ReservedAliasInput {
  alias: string
  reason: string
}

export interface DomainRule {
  id: number
  domain: string
  type: DomainRuleType
  reason: string | null
  createdBy: string | null
  createdAt: string
}

export interface DomainRuleInput {
  domain: string
  type: DomainRuleType
  reason?: string
}

export interface DomainRuleCreated {
  rule: DomainRule
  linksAffected: number
}

export interface DomainBlockPreview {
  domain: string
  hosts: string[]
  selectedLinks: number
  activeLinks: number
  heldLinks: number
  rule: DomainRuleType | null
}

export interface DomainBlocked {
  domain: string
  linksDeactivated: number
  domainsDisabled: number
  heldLinksConverted: number
}

export interface DomainSkipped {
  domain: string
  reason: string
}

export interface DomainBulkBlockResult {
  blocked: DomainBlocked[]
  skipped: DomainSkipped[]
  linksDeactivated: number
  heldLinksConverted: number
}

export type CampaignStatus = "HOLDING" | "ALERT_ONLY" | "ALLOWED"

export interface ReportStatus {
  reportedAt: string
  reportedBy: string
  registrar: string | null
  suspendedAt: string | null
}

export type AbuseReportSource = { urlIds: number[] } | { campaignId: number }

export interface AbuseReportDomain {
  domain: string
  registeredOn: string | null
  report: ReportStatus | null
}

export interface AbuseReport {
  registrar: string
  to: string
  cc: string[]
  subject: string
  body: string
  domains: AbuseReportDomain[]
}

export type AbuseNoContactReason = "noRegistry" | "lookupFailed" | "noAbuseEmail" | "notRegistered" | "sharedSuffix"

export interface AbuseNoContact {
  domain: string
  registrar: string | null
  lookupFailed?: boolean
  reason?: AbuseNoContactReason | null
  report: ReportStatus | null
}

export interface AbuseReportResponse {
  reports: AbuseReport[]
  noContact: AbuseNoContact[]
}

export interface CampaignLinkCounts {
  total: number
  active: number
  held: number
  blocked: number
}

export interface CampaignReportCounts {
  reported: number
  suspended: number
}

export interface Campaign {
  id: number
  shape: string
  path: string
  queryNames: string[]
  status: CampaignStatus
  holding: boolean
  holdingOff?: "switch" | null
  firstSeenAt: string
  lastSeenAt: string
  activeUntil: string | null
  allowedBy: string | null
  allowedAt: string | null
  links: CampaignLinkCounts
  domains: number
  clicks: number
  reports: CampaignReportCounts
}

export interface CampaignLink {
  id: number
  shortUrl: string
  longUrl: string
  domain: string
  createDate: string
  active: boolean
  blockReason: BlockReason | null
  clicks: number
}

export interface CampaignDomain {
  domain: string
  links: number
  report: ReportStatus | null
}

export interface CampaignDetail {
  campaign: Campaign
  domains: CampaignDomain[]
}

export interface CampaignAllowed {
  linksAffected: number
}

export interface LinksAffected {
  linksAffected: number
}

export interface ReviewEntry {
  urlId: number
  shortUrl: string
  longUrl: string
  host: string | null
  registrableDomain: string | null
  ownerId: number | null
  ownerEmail: string | null
  ownerCreatedAt: string | null
  possibleScammer: boolean
  createDate: string
  reasons: string[]
  notice: boolean
  flaggedAt: string
  redirectChain: string[]
  screenshot: ScreenshotView | null
  virusTotal: VirusTotalView | null
}

export type InspectionState = "PENDING" | "DONE" | "FAILED" | "EXPIRED" | "NOT_FOUND"

export interface ScreenshotView {
  state: InspectionState | null
  requestedAt: string | null
  takenAt: string | null
  screenshotUrl: string | null
  pageTitle: string | null
  pageStatus: number | null
  failure: string | null
  configured: boolean
}

export interface VirusTotalView {
  state: InspectionState | null
  checkedUrl: string | null
  malicious: number | null
  suspicious: number | null
  harmless: number | null
  undetected: number | null
  analysedAt: string | null
  checkedAt: string | null
  submittedAt: string | null
  reportUrl: string | null
  failure: string | null
  configured: boolean
}

export interface LinkInspection {
  urlId: number
  longUrl: string
  redirectChain: string[]
  screenshot: ScreenshotView | null
  virusTotal: VirusTotalView | null
}

export interface ReviewQueueFilters {
  page?: number
  size?: number
  reason?: string
  olderThanDays?: number
  search?: string
  sort?: string
  order?: "asc" | "desc"
}

export type ReviewAction = "OK" | "TRUST_DOMAIN" | "BLOCK_LINK" | "BLOCK_DOMAIN" | "BLOCK_USER"

export interface ReviewResolveFailure {
  urlId: number
  error: string
}

export interface ReviewBulkResolveResult {
  resolved: number[]
  failed: ReviewResolveFailure[]
}

export type UrlCheckOutcome = "ALLOWED" | "BLOCK" | "FLAG" | "CLEAN"

export interface UrlCheckResult {
  outcome: UrlCheckOutcome
  reasons: string[]
  blockReason: BlockReason | null
  blockDetail: string | null
  host: string | null
  registrableDomain: string | null
}

export type ReportCategory = "PHISHING" | "MALWARE" | "SPAM" | "IMPERSONATION" | "OTHER"

export interface LinkReport {
  shortUrl: string
  category: ReportCategory
  details?: string
}

export interface PublicStatsResponse {
  from: string
  to: string
  activeLinks: number
  linksCreated: number
  clicks: number
  daily: { date: string; clicks: number }[]
  blocked: { allTime: number; last30Days: number }
  visitorReportsHandled: number
  averageReviewMinutes: number | null
  blocklists: { name: string; action: "BLOCK" | "FLAG"; entries: number }[]
  updatedAt: string
}

export type SettingKey =
  | "ANONYMOUS_LINKS"
  | "NEW_SIGNUPS"
  | "ANONYMOUS_LINKS_PER_HOUR"
  | "CUSTOM_ALIASES"
  | "SAFE_BROWSING_CHECK"
  | "SAFE_BROWSING_FAIL_CLOSED"
  | "BLOCKLIST_CHECK"
  | "SUSPICIOUS_LINK_CHECK"
  | "NIGHTLY_SAFE_BROWSING"
  | "NIGHTLY_DESTINATION_CHECK"
  | "SAME_SHAPE_ALERT"
  | "CAMPAIGN_LINKS"
  | "CAMPAIGN_DOMAINS"
  | "CAMPAIGN_WINDOW_HOURS"
  | "TRAFFIC_ALERTS"
  | "TRAFFIC_LINK_CLICKS"
  | "TRAFFIC_SHARE_PERCENT"
  | "TRAFFIC_MIN_ANONYMOUS_CLICKS"
  | "BURST_LINKS"
  | "WEEKLY_DIGEST"
  | "WEEKLY_DIGEST_EMAIL"
  | "SEND_EMAILS"
  | "EMAIL_LINK_BLOCKED"
  | "EMAIL_MALWARE_FOUND"
  | "EMAIL_DEAD_LINKS"
  | "EMAIL_LINK_EXPIRING"
  | "EMAIL_WEEKLY_SUMMARY"
  | "EMAIL_ADMIN_DAILY"
  | "EMAIL_NEW_USER_NOTICE"
  | "EMAIL_CUSTOM_DOMAIN"
  | "CAMPAIGN_HOLD"
  | "CAMPAIGN_HOLD_DAYS"
  | "ABUSE_REPORTER_NAME"
  | "ABUSE_REPORTER_ADDRESS"
  | "ABUSE_CC"
  | "ABUSE_RECHECK_DAYS"
  | "RANDOM_DOMAIN_REVIEW"
  | "RANDOM_DOMAIN_MAX_AGE_DAYS"
  | "WARNING_PAGE"
  | "WARNING_PAGE_MAX_AGE_DAYS"
  | "HUMAN_CHECK"
  | "ANONYMOUS_EXPIRY_DAYS"
  | "ANONYMOUS_VISIT_LIMIT"
  | "GOOGLE_SIGN_IN"
  | "GITHUB_SIGN_IN"
  | "API_KEY_REQUESTS_PER_HOUR"
  | "DESTINATION_CHANGES"
  | "SIGN_IN_FORM_TOP_SITES"
  | "SIGN_IN_FORM_ACCOUNT_LINKS"
  | "SIGN_IN_FORM_NEW_ACCOUNT_DAYS"
  | "BRAND_SITES_TOP_SITES"
  | "OPENAI_APPS_CHALLENGE"

export type SettingGroup = "ACCESS" | "LINKS" | "SAFETY" | "ALERTS" | "DIGEST" | "EMAILS" | "ABUSE_REPORTS" | "APP_DIRECTORIES"

export type SettingType = "SWITCH" | "NUMBER" | "TEXT" | "ADDRESSES"

export type SettingValue = boolean | number | string | string[] | null

export interface SettingResponse {
  key: SettingKey
  group: SettingGroup
  type: SettingType
  label: string
  description: string
  parent: SettingKey | null
  safety: boolean
  value: SettingValue
  defaultValue: SettingValue
  changed: boolean
  changedBy: string | null
  changedAt: string | null
  min: number | null
  max: number | null
  nullable: boolean
  noneLabel: string | null
  unit: string | null
  available: boolean
  unavailableReason: string | null
}

export type AliasCheckStatus = "AVAILABLE" | "TAKEN" | "RESERVED" | "INVALID" | "DISABLED"

export interface AliasCheck {
  name: string
  status: AliasCheckStatus
  reason: string | null
}

export interface PublicSettings {
  anonymousLinks: boolean
  newSignups: boolean
  customAliases: boolean
  humanCheck?: boolean
  turnstileSiteKey?: string | null
  anonymousExpiryDays?: number | null
  anonymousVisitLimit?: number | null
  googleSignIn?: boolean
  githubSignIn?: boolean
}

export type BioAccent = "BLUE" | "VIOLET" | "PINK" | "RED" | "ORANGE" | "GREEN" | "TEAL" | "SLATE"

export type BioTheme = "AUTO" | "LIGHT" | "DARK"

export type BioAvatarKind = "INITIALS" | "EMOJI"

export type BioIcon =
  | "WEBSITE"
  | "EMAIL"
  | "INSTAGRAM"
  | "TIKTOK"
  | "YOUTUBE"
  | "X"
  | "FACEBOOK"
  | "LINKEDIN"
  | "GITHUB"
  | "SPOTIFY"
  | "WHATSAPP"
  | "TELEGRAM"

export type BioLinkState = "LIVE" | "IN_REVIEW" | "DEACTIVATED" | "EXPIRED" | "LIMIT_REACHED" | "BLOCKED" | "DOMAIN_OFF"

export type BioPageReviewAction = "OK" | "HIDE"

export interface BioPageButton {
  id: number
  urlId: number
  shortUrl: string
  destinationHost: string
  title: string
  icon: BioIcon | null
  visible: boolean
  linkState: BioLinkState
  shownOnPage: boolean
}

export interface BioPage {
  id: number
  handle: string | null
  displayName: string
  bio: string
  avatarKind: BioAvatarKind
  avatarEmoji: string | null
  accent: BioAccent
  theme: BioTheme
  indexable: boolean
  hidden: boolean
  hiddenReason: string | null
  handleRevokedReason: string | null
  buttons: BioPageButton[]
  createdAt: string
  updatedAt: string
}

export interface BioPageButtonInput {
  urlId: number
  title: string
  icon: BioIcon | null
  visible: boolean
}

export interface BioPageUpdate {
  displayName: string
  bio: string
  avatarKind: BioAvatarKind
  avatarEmoji: string | null
  accent: BioAccent
  theme: BioTheme
  indexable: boolean
  buttons: BioPageButtonInput[]
}

export interface BioHandleAvailability {
  handle: string
  available: boolean
  reason: string | null
}

export interface PublicBioPageButton {
  title: string
  icon: BioIcon | null
  shortUrl: string
}

export interface PublicBioPage {
  handle: string
  displayName: string
  bio: string
  avatarKind: BioAvatarKind
  avatarEmoji: string | null
  accent: BioAccent
  theme: BioTheme
  indexable: boolean
  buttons: PublicBioPageButton[]
}

export interface BioViewDay {
  date: string
  views: number
  botViews: number
}

export interface BioButtonClicks {
  buttonId: number
  urlId: number
  shortUrl: string
  title: string
  shownOnPage: boolean
  fromHrvaPages: number
  allClicks: number
}

export interface BioPageAnalytics {
  days: AnalyticsRange
  from: string
  to: string
  handle: string | null
  views: number
  botViews: number
  daily: BioViewDay[]
  buttons: BioButtonClicks[]
}

export interface AdminBioPage {
  id: number
  handle: string | null
  displayName: string
  bio: string
  ownerId: number
  ownerEmail: string
  ownerActive: boolean
  hidden: boolean
  hiddenReason: string | null
  hiddenAt: string | null
  hiddenBy: string | null
  handleRevokedReason: string | null
  buttons: number
  visibleButtons: number
  reviewOpen: boolean
  createdAt: string
  updatedAt: string
}

export interface BioPageReviewEntry {
  reviewId: number
  pageId: number
  handle: string | null
  displayName: string
  ownerId: number
  ownerEmail: string
  hidden: boolean
  reasons: string[]
  flaggedAt: string
}

export interface BioPageUpdate {
  expectedUpdatedAt?: string
}

export interface BioButtonClicks {
  visible?: boolean
  linkState?: BioLinkState
}

export interface ApiKeysDeleted {
  deleted: number
}

export type EmailNotificationType = "DEAD_LINK_EMAIL" | "WEEKLY_SUMMARY_EMAIL" | "EXPIRY_REMINDER_EMAIL"

export type ChannelEvent = "LINK_DEAD" | "LINK_BACK" | "DAILY_SUMMARY" | "WEEKLY_SUMMARY"

export type ChannelType = "DISCORD" | "SLACK" | "TELEGRAM" | "NTFY" | "WEBHOOK"

export type DestinationStatus = "404" | "410" | "nxdomain" | "refused" | "tls"

export interface NotificationConsent {
  type: EmailNotificationType
  consented: boolean
  grantedAt: string | null
  description: string
}

export interface ChannelLastDelivery {
  status: "SENT" | "FAILED"
  at: string
  httpStatus: number | null
  error: string | null
}

export interface NotificationChannel {
  id: number
  name: string
  type: ChannelType
  enabled: boolean
  events: ChannelEvent[]
  maskedTarget: string
  chatId: string | null
  hasAccessToken: boolean
  autoDisabledAt: string | null
  lastDelivery: ChannelLastDelivery | null
  createdAt: string
  updatedAt: string
  signingSecret?: string | null
}

export interface NotificationChannelInput {
  name: string
  type: ChannelType
  enabled: boolean
  events: ChannelEvent[]
  target?: string | null
  botToken?: string | null
  chatId?: string | null
  accessToken?: string | null
}

export interface ChannelTestResult {
  delivered: boolean
  httpStatus: number | null
  error: string | null
}

export interface UnsubscribeResult {
  type: EmailNotificationType
  alreadyOff: boolean
}

export interface DestinationHealth {
  deadSince: string
  lastStatus: DestinationStatus
}

export interface Url {
  destinationHealth?: DestinationHealth | null
}

export interface UrlResponse {
  destinationHealth?: DestinationHealth | null
}

export interface AnalyticsLinkSummary {
  destinationHealth?: DestinationHealth | null
}

export interface LinksStats {
  deadDestinations?: { total: number; anonymous: number }
}

export interface UsersStats {
  signupSources?: CountEntry[]
  notifications?: { consents: CountEntry[]; channels: CountEntry[]; autoDisabledChannels: number }
}

export interface UrlFilters {
  deadDestination?: boolean
}

export type CustomDomainStatus =
  | "PENDING_REVIEW"
  | "APPROVED_PROVISIONING"
  | "AWAITING_DNS"
  | "ACTIVE"
  | "REJECTED"
  | "DISABLED"
  | "ERROR"
  | "DELETED"

export type DomainProblem =
  | "DNS_NOT_FOUND"
  | "CAA_BLOCKED"
  | "CERTIFICATE_TIMED_OUT"
  | "CNAME_REMOVED"
  | "CLOUDFLARE_BLOCKED"
  | "PROVISIONING_FAILED"
  | "DNS_TIMED_OUT"

export type DomainLinkMode = "MOVE" | "DEACTIVATE"

export type DomainUseAgain = "SKIPS_REVIEW" | "NEEDS_REVIEW" | "CLOUDFLARE_REMOVAL_PENDING"

export type CloudflareTokenStatus = "OK" | "MISSING" | "INVALID" | "NO_PERMISSION" | "UNREACHABLE"

export type DomainDisableReason = "ADMIN" | "USER_BLOCKED" | "DOMAIN_RULE" | "BLOCKLIST"

export interface DomainRef {
  id: number
  hostname: string
}

export interface DomainDnsRecord {
  type: "CNAME"
  name: string
  target: string
}

export interface DomainSteps {
  dnsFound: boolean
  certificateIssued: boolean
}

export interface CustomDomain {
  id: number
  hostname: string
  status: CustomDomainStatus
  reason: string
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
  activatedAt: string | null
  lastCheckedAt: string | null
  dnsRecord: DomainDnsRecord | null
  steps: DomainSteps | null
  problem: DomainProblem | null
  problemText: string | null
  disabledNote: string | null
  links: number
  useAgain: DomainUseAgain | null
}

export interface MyDomains {
  domains: CustomDomain[]
  limit: number
  used: number
  canApply: boolean
  request: DomainRequest | null
  canRequest: boolean
}

export type DomainRequestStatus = "WAITING" | "APPROVED" | "DECLINED"

export interface DomainRequest {
  id: number
  status: DomainRequestStatus
  requestedTotal: number
  reason: string
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface AdminDomainRequest extends DomainRequest {
  limitAtRequest: number
  currentLimit: number
  used: number
  reviewedBy: string | null
  owner: DomainOwnerSummary | null
}

export interface AdminDomainRequestFilters {
  status?: DomainRequestStatus
  search?: string
  page: number
  size: number
  sort?: string
  order?: "asc" | "desc"
}

export interface DomainRename {
  from: string
  to: string
}

export interface DomainRemoval {
  moved: number
  renamed: DomainRename[]
  deactivated: number
}

export interface DomainOwnerSummary {
  id: number
  email: string
  active: boolean
  createdAt: string
  links: number
  blockedLinks: number
  openReviews: number
  possibleScammer: boolean
}

export interface AdminDomain extends CustomDomain {
  owner: DomainOwnerSummary | null
  applyFlags: string[]
  cloudflareId: string | null
  cloudflareStatus: string | null
  sslStatus: string | null
  lastError: string | null
  disabledReason: DomainDisableReason | null
  disabledAt: string | null
  deletedAt: string | null
  clicks: number
}

export interface CloudflareCheck {
  status: CloudflareTokenStatus
  checkedAt: string | null
  message: string | null
}

export interface DomainReconcile {
  ranAt: string
  cloudflareTotal: number | null
  oursInCloudflare: number | null
  unknownHostnames: string[]
  missing: DomainRef[]
  ignored: string[]
  error: string | null
}

export interface DomainSummary {
  slotsInUse: number
  maxActive: number
  freeAllowance: number
  cloudflareTotal: number | null
  cloudflareQuota: { used: number; allocated: number } | null
  pending: number
  active: number
  token: CloudflareCheck
  reconcile: DomainReconcile | null
}

export interface DomainAllowance {
  userId: number
  maxDomains: number
  reason: string | null
  grantedBy: string | null
  grantedAt: string | null
}

export interface AdminDomainFilters {
  status?: CustomDomainStatus
  search?: string
  page: number
  size: number
  sort?: string
  order?: "asc" | "desc"
}

export interface Url {
  domain?: DomainRef | null
}

export interface UrlResponse {
  domain?: DomainRef | null
}

export interface AnalyticsLinkSummary {
  domain?: DomainRef | null
}

export interface AnalyticsTopLink {
  domain?: DomainRef | null
}

export interface ReviewEntry {
  domain?: string | null
}

export interface NewestLink {
  domain?: string | null
}

export interface TrafficTopLink {
  domain?: string | null
}

export interface BioPageButton {
  domain?: string | null
}

export interface PublicBioPageButton {
  domain?: string | null
}

export interface CreateUrlDto {
  domain?: string | null
}

export interface LinksStats {
  customDomains?: {
    active: number
    pending: number
    slotsInUse: number
    maxActive: number
    freeAllowance: number
    cloudflareTotal: number | null
  }
}

export interface SystemStats {
  cloudflare?: CloudflareCheck
}

export interface DomainRuleCreated {
  domainsDisabled?: number
}

export type VisitKind = "utm" | "referrer" | "direct"

export interface VisitSource {
  source: string
  kind: VisitKind
  visits: number
}

export interface VisitPage {
  page: string
  visits: number
}

export interface VisitStats {
  connected: boolean
  days: number
  requestedDays: number
  from: string
  to: string
  total: number
  sources: VisitSource[]
  pages: VisitPage[]
}
