import type { AliasCheckStatus } from "@/lib/types"

export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/

export const CLAIM_RULES = "Use 1 to 32 letters, numbers, hyphens or underscores."

export const CLAIM_RATE_LIMITED = "You've checked a lot of names in a short time. Try again later."

const DASHBOARD = "/dashboard"

const FALLBACKS: Record<AliasCheckStatus, string> = {
  AVAILABLE: "This name is free right now.",
  TAKEN: "This short URL is already taken. Try another.",
  RESERVED: "This short URL is reserved. Try another.",
  INVALID: CLAIM_RULES,
  DISABLED: "Custom aliases are turned off right now.",
}

export const aliasFromInput = (raw: string): string =>
  raw
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^(?:app\.)?hrva\.cc\//i, "")
    .replace(/\/+$/, "")

export const isAliasShaped = (name: string): boolean => ALIAS_PATTERN.test(name)

export const claimNextPath = (name: string): string => `${DASHBOARD}?alias=${encodeURIComponent(name)}`

export const aliasFromNext = (next: string | null): string | null => {
  if (!next) return null
  const separator = next.indexOf("?")
  if (separator < 0 || next.slice(0, separator) !== DASHBOARD) return null
  const alias = new URLSearchParams(next.slice(separator + 1)).get("alias")
  return alias !== null && isAliasShaped(alias) ? alias : null
}

export const rulesLineNeeded = (status: string, text: string): boolean => status === "INVALID" && text !== CLAIM_RULES

const CAPITALS_NOTE = "Capital letters don't make a new name."

export const claimResultLine = (name: string, status: string, text: string): string => {
  const note = status === "TAKEN" && name !== name.toLowerCase() ? ` ${CAPITALS_NOTE}` : ""
  return name ? `hrva.cc/${name}: ${text}${note}` : `${text}${note}`
}

export const claimMessage = (status: string, reason: string | null): { tone: "ok" | "no"; text: string } => {
  const known = Object.hasOwn(FALLBACKS, status) ? FALLBACKS[status as AliasCheckStatus] : null
  if (status === "AVAILABLE") return { tone: "ok", text: known ?? FALLBACKS.AVAILABLE }
  return { tone: "no", text: reason || known || "This name can't be used. Try another." }
}
