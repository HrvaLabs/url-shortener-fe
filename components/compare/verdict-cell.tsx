import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Verdict = "yes" | "no" | "unknown"

export interface VerdictCellProps {
  verdict: Verdict
  note?: string
  children?: ReactNode
}

const VerdictIcon = ({ verdict }: { verdict: Exclude<Verdict, "unknown"> }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={cn(
      "mr-1.5 inline-block size-4 shrink-0 align-[-0.2em]",
      verdict === "yes" ? "text-success" : "text-destructive",
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {verdict === "yes" ? <path d="M3 8.5l3.2 3.2L13 4.8" /> : <path d="M4 4l8 8M12 4l-8 8" />}
  </svg>
)

export const VerdictCell = ({ verdict, note, children }: VerdictCellProps) => (
  <>
    {verdict === "unknown" ? (
      <span className="text-muted-foreground">Not stated</span>
    ) : (
      <span className="font-semibold">
        <VerdictIcon verdict={verdict} />
        <span className="sr-only">{verdict === "yes" ? "Yes" : "No"}</span>
      </span>
    )}
    {note ? <span className="break-words">{" "}{note}</span> : null}
    {children ? <> {children}</> : null}
  </>
)
