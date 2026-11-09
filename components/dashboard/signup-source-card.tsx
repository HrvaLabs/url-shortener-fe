"use client"

import { useId, useState } from "react"
import { ApiError, userApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import {
  SIGNUP_SOURCES,
  SIGNUP_SOURCE_FAILED,
  SIGNUP_SOURCE_LABELS,
  SIGNUP_SOURCE_NOTE,
  SIGNUP_SOURCE_PICK_FIRST,
  SIGNUP_SOURCE_QUESTION,
  type SignupChoice,
  type SignupSource,
} from "@/lib/signup-source"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function SignupSourceCard() {
  const { user, refreshUser } = useAuth()
  const prefix = useId()
  const [choice, setChoice] = useState<SignupChoice | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [hidden, setHidden] = useState(false)

  if (!user?.askSignupSource || hidden) return null

  const answer = async (source: SignupSource) => {
    if (pending) return
    setPending(true)
    setError("")
    try {
      await userApi.setSignupSource(source)
      setHidden(true)
      await refreshUser()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setHidden(true)
      } else {
        setError(err instanceof Error && err.message ? err.message : SIGNUP_SOURCE_FAILED)
      }
    } finally {
      setPending(false)
    }
  }

  const handleSend = () => {
    if (!choice) {
      setError(SIGNUP_SOURCE_PICK_FIRST)
      return
    }
    void answer(choice)
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <fieldset className="space-y-2.5" aria-describedby={`${prefix}-note`}>
          <legend className="text-sm font-medium">{SIGNUP_SOURCE_QUESTION}</legend>
          <p id={`${prefix}-note`} className="text-sm text-muted-foreground">{SIGNUP_SOURCE_NOTE}</p>
          <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
            {SIGNUP_SOURCES.map((option) => {
              const id = `${prefix}-${option}`
              return (
                <div key={option} className="flex items-start gap-2.5">
                  <input
                    id={id}
                    type="radio"
                    name={`${prefix}-source`}
                    value={option}
                    checked={choice === option}
                    onChange={() => { setChoice(option); setError("") }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                  />
                  <label htmlFor={id} className="min-w-0 text-sm leading-snug [overflow-wrap:anywhere]">
                    {SIGNUP_SOURCE_LABELS[option]}
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={handleSend} aria-disabled={pending} aria-busy={pending} className="aria-disabled:opacity-50">
            Send
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void answer("SKIPPED")} aria-disabled={pending} className="aria-disabled:opacity-50">
            Skip
          </Button>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-destructive [overflow-wrap:anywhere] empty:hidden">{error}</p>
      </CardContent>
    </Card>
  )
}
