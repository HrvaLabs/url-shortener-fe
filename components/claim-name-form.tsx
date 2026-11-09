"use client"

import { useId, useRef, useState } from "react"
import Link from "next/link"
import { ApiError, publicApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { aliasFromInput, CLAIM_RATE_LIMITED, CLAIM_RULES, claimMessage, claimNextPath, isAliasShaped, rulesLineNeeded } from "@/lib/claim"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Outcome =
  | { kind: "answer"; name: string; tone: "ok" | "no"; text: string }
  | { kind: "limited" }
  | { kind: "failed"; text: string }

export function ClaimNameForm() {
  const [input, setInput] = useState("")
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const latest = useRef(0)
  const { user } = useAuth()
  const id = useId()

  const check = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = aliasFromInput(input)
    const attempt = ++latest.current
    if (!isAliasShaped(name)) {
      setChecking(false)
      setOutcome({ kind: "answer", name, ...claimMessage("INVALID", CLAIM_RULES) })
      return
    }
    setChecking(true)
    try {
      const result = await publicApi.checkAlias(name)
      if (attempt !== latest.current) return
      setOutcome({ kind: "answer", name, ...claimMessage(result.status, result.reason) })
    } catch (err) {
      if (attempt !== latest.current) return
      if (err instanceof ApiError && err.status === 429) setOutcome({ kind: "limited" })
      else setOutcome({ kind: "failed", text: err instanceof Error && err.message ? err.message : "Couldn't check that name. Try again." })
    } finally {
      if (attempt === latest.current) setChecking(false)
    }
  }

  const change = (value: string) => {
    latest.current += 1
    setChecking(false)
    setInput(value)
    setOutcome(null)
  }

  return (
    <div>
      <form onSubmit={check} className="space-y-3">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <div className="flex min-h-10 overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
          <span className="flex select-none items-center border-r bg-muted/60 px-3 py-2 text-sm text-muted-foreground">hrva.cc/</span>
          <input
            id={`${id}-name`}
            value={input}
            onChange={(e) => change(e.target.value)}
            maxLength={64}
            placeholder="your-name"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={`${id}-result`}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={checking || input.trim() === ""}>
          {checking ? "Checking..." : "Check this name"}
        </Button>
      </form>

      <div id={`${id}-result`} aria-live="polite" className={outcome ? "mt-4" : undefined}>
        {outcome?.kind === "answer" && (
          <div className={cn("rounded-lg border p-4 text-sm", outcome.tone === "ok" ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/5")}>
            {outcome.tone === "ok" ? (
              <>
                <p className="font-medium text-foreground [overflow-wrap:anywhere]">hrva.cc/{outcome.name} is free right now.</p>
                <p className="mt-1 text-muted-foreground">Nobody holds it for you until you create the link.</p>
                <Link
                  href={user ? claimNextPath(outcome.name) : `/register?next=${encodeURIComponent(claimNextPath(outcome.name))}`}
                  className={cn(buttonVariants(), "mt-3")}
                >
                  {user ? "Create it now" : "Sign up free to claim it"}
                </Link>
              </>
            ) : (
              <>
                <p className="text-foreground [overflow-wrap:anywhere]">{outcome.text}</p>
                {rulesLineNeeded(outcome.text) && <p className="mt-1 text-muted-foreground">{CLAIM_RULES}</p>}
              </>
            )}
          </div>
        )}
        {outcome?.kind === "limited" && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">{CLAIM_RATE_LIMITED}</p>
        )}
        {outcome?.kind === "failed" && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground [overflow-wrap:anywhere]">{outcome.text}</p>
        )}
      </div>
    </div>
  )
}
