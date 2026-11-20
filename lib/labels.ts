import type { BlockReason, DnsFilterStatus, UrlCheckOutcome } from "@/lib/types"

export const outcomeLabels: Record<UrlCheckOutcome, string> = {
  ALLOWED: "Allowed",
  BLOCK: "Blocked",
  FLAG: "Review",
  CLEAN: "Clean",
}

export const outcomeVariants: Record<UrlCheckOutcome, "success" | "destructive" | "warning" | "secondary"> = {
  ALLOWED: "success",
  BLOCK: "destructive",
  FLAG: "warning",
  CLEAN: "secondary",
}

export const dnsFilterStatusLabels: Record<DnsFilterStatus, string> = {
  BLOCKED: "Blocked",
  NOT_BLOCKED: "Not blocked",
  NO_ANSWER: "No answer",
}

export const dnsFilterStatusVariants: Record<DnsFilterStatus, "destructive" | "success" | "secondary"> = {
  BLOCKED: "destructive",
  NOT_BLOCKED: "success",
  NO_ANSWER: "secondary",
}

export const blockReasonLabels: Record<BlockReason, string> = {
  SAFE_BROWSING: "Google Safe Browsing",
  BLOCKLIST: "On a blocklist",
  DOMAIN_RULE: "Blocked domain",
  ADMIN: "Blocked by an admin",
  USER_BLOCKED: "Owner's account blocked",
  SCAM_SIGNALS: "Scam signals",
  DNS_FILTERS: "Security DNS filters",
  CAMPAIGN: "Campaign hold",
  SIGN_IN_FORM: "Sign-in form hold",
}
