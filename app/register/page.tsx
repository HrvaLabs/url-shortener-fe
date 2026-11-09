"use client"

import { Suspense, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApiError } from "@/lib/api-client"
import { aliasFromNext } from "@/lib/claim"
import { safeNext } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { SIGNUPS_PAUSED, signupsPaused } from "@/lib/moderation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { NewPasswordInput } from "@/components/auth/new-password-input"
import { ProviderButtons } from "@/components/auth/provider-buttons"
import { ArrowLeft } from "lucide-react"

function RegisterForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const { register } = useAuth()
  const { data: publicSettings } = usePublicSettings()
  const paused = signupsPaused(publicSettings)
  const claimedAlias = aliasFromNext(next)
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(email, password)
      setSentTo(email)
    } catch (err) {
      const fieldError = err instanceof ApiError ? err.fields.password : undefined
      if (fieldError) {
        setPasswordError(fieldError)
        passwordRef.current?.focus()
      } else {
        toast.error(err instanceof Error && err.message ? err.message : "Registration failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <Card className="p-8">
            <div className="text-center">
              <h1 className="font-display text-2xl">Create an account</h1>
              {!paused && <p className="mt-1.5 text-sm text-muted-foreground">Start managing your links</p>}
            </div>
            {sentTo ? (
              <div className="mt-8 space-y-4">
                <div role="status" className="rounded-lg bg-success/10 p-4 text-center text-sm text-success [overflow-wrap:anywhere]">
                  Check your inbox at {sentTo} for an email from hrva.cc. It says what to do next.
                </div>
                {claimedAlias && (
                  <p className="text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
                    Once your email is confirmed, sign in and create hrva.cc/{claimedAlias}. Nobody has it held for you until then.
                  </p>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  No email after a few minutes? Look in spam, or{" "}
                  <Link href="/verify-email/resend" className="font-medium text-brand hover:underline">send the verification email again</Link>.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/login${nextQuery}`}>Go to sign in</Link>
                </Button>
              </div>
            ) : paused ? (
              <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
                {SIGNUPS_PAUSED} <Link href={`/login${nextQuery}`} className="font-medium text-brand hover:underline">Sign in</Link> if you already have an account.
              </p>
            ) : (
              <>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <NewPasswordInput
                    ref={passwordRef}
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                    required
                    error={passwordError}
                    className="mt-2"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
              <ProviderButtons next={next} />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href={`/login${nextQuery}`} className="font-medium text-brand hover:underline">
                  Sign in
                </Link>
              </p>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                By creating an account you agree to the{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

function RegisterFormWithNext() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  return <RegisterForm next={next ? safeNext(next) : null} />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterForm next={null} />}>
      <RegisterFormWithNext />
    </Suspense>
  )
}
