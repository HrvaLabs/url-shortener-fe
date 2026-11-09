import Link from "next/link"
import { Button } from "@/components/ui/button"

export function errorReference(error: unknown): string | null {
  if (!(error instanceof Error)) return null
  const digest = (error as Error & { digest?: unknown }).digest
  return typeof digest === "string" && digest ? digest : null
}

export function errorSummary(error: unknown): string | null {
  if (!(error instanceof Error)) return null
  const message = error.message.replace(/\s+/g, " ").trim().slice(0, 120)
  return message ? `${error.name}: ${message}` : error.name || null
}

export function ErrorFallback({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = errorReference(error)
  const summary = reference ? null : errorSummary(error)

  return (
    <div className="text-center">
      <p className="font-mono text-sm text-muted-foreground">Error</p>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        This page didn&apos;t load. Try again, or go to the home page.
      </p>
      {reference && (
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground [overflow-wrap:anywhere]">
          Reference: <span className="font-mono">{reference}</span>
        </p>
      )}
      {summary && (
        <p className="mx-auto mt-3 max-w-md font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{summary}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
