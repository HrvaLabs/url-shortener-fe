import { SESSION_ENDED, tokenExpired } from "./api-client"

export { tokenExpired }

export type RefusalAnswer = "sign-out" | "wait"

/** Shown instead of the backend's refusal while a first refusal waits for the next check. */
export const COULDNT_CHECK_SIGN_IN = "hrva.cc couldn't check your sign-in."

/** How often activity renews the sign-in at most. */
export const RENEW_EVERY_MS = 5 * 60 * 1000

/** True when activity should renew the sign-in: never renewed in this tab yet, or the last renewal is 5 minutes old. */
export const dueForRenewal = (lastRenewedAt: number | null, now: number): boolean => lastRenewedAt === null || now - lastRenewedAt >= RENEW_EVERY_MS

/**
 * What a 401 or 403 from `/users/me` means: a session ended elsewhere, an expired or unreadable token, or a second refusal in a row
 * signs out; a first refusal of a token that hasn't expired waits for the next check.
 */
export function answerToRefusal(token: string | null, now: number, earlierRefusals: number, message: string): RefusalAnswer {
  if (message === SESSION_ENDED || tokenExpired(token, now) || earlierRefusals >= 1) return "sign-out"
  return "wait"
}
