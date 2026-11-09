"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { safeNext } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { ProviderButtons } from "@/components/auth/provider-buttons"
import { PasskeySignInButton } from "@/components/auth/passkey-sign-in-button"
import { SecondStep } from "@/components/auth/second-step"
import { usePasskeyAutofill } from "@/lib/hooks/usePasskeyAutofill"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { SignedIn, TwoStepMethod } from "@/lib/types"
import { abortPasskeyRequest } from "@/lib/webauthn"

function LoginForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [secondStep, setSecondStep] = useState<{ pendingToken: string; methods: TwoStepMethod[] } | null>(null)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const focusEmailOnReturn = useRef<"focus" | "select" | null>(null)
  const { login, completeSignIn } = useAuth()
  const router = useRouter()
  const passkeysSupported = useWebAuthnSupported()

  const finishSignIn = useCallback(() => {
    setSignedIn(true)
    toast.success("Welcome back!")
    router.push(safeNext(next))
  }, [router, next])

  const handleSignedIn = useCallback((result: SignedIn) => {
    completeSignIn(result)
    finishSignIn()
  }, [completeSignIn, finishSignIn])

  usePasskeyAutofill({ enabled: !secondStep && !passkeyBusy && !loading && !signedIn, rememberMe, onSignedIn: handleSignedIn })

  useEffect(() => {
    const focusMode = focusEmailOnReturn.current
    if (secondStep || !focusMode) return
    focusEmailOnReturn.current = null
    emailRef.current?.focus()
    if (focusMode === "select") emailRef.current?.select()
  }, [secondStep])

  const handleExpired = (message: string) => {
    focusEmailOnReturn.current = "focus"
    setSecondStep(null)
    toast.error(message)
  }

  const handleUseDifferentAccount = () => {
    focusEmailOnReturn.current = "select"
    setPassword("")
    setSecondStep(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    abortPasskeyRequest()
    setLoading(true)
    try {
      const result = await login(email, password, rememberMe)
      if (result.status === "two-step") {
        setSecondStep({ pendingToken: result.pendingToken, methods: result.methods })
        setLoading(false)
        return
      }
      finishSignIn()
    } catch (err) {
      setLoading(false)
      const message = (err instanceof Error && err.message) || "Invalid credentials"
      if (message.toLowerCase().includes("verify")) {
        toast.error(message, {
          action: { label: "Resend", onClick: () => router.push("/verify-email/resend") },
        })
      } else {
        toast.error(message)
      }
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
            {secondStep ? (
              <SecondStep
                pendingToken={secondStep.pendingToken}
                methods={secondStep.methods}
                onSignedIn={handleSignedIn}
                onExpired={handleExpired}
                onUseDifferentAccount={handleUseDifferentAccount}
              />
            ) : (
              <>
                <div className="text-center">
                  <h1 className="font-display text-2xl">Welcome back</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your account</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      ref={emailRef}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username webauthn"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/reset-password"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <label className="flex w-fit cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-brand"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
                <div className="mt-4">
                  <PasskeySignInButton
                    rememberMe={rememberMe}
                    onSignedIn={handleSignedIn}
                    onBusyChange={setPasskeyBusy}
                  />
                  {passkeysSupported && (
                    <p className="mt-2 text-center text-sm">
                      <Link href="/help/passkeys" className="text-brand-link">How passkeys work</Link>
                    </p>
                  )}
                </div>
                <ProviderButtons next={next} explainOff />
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-brand hover:underline">
                    Register
                  </Link>
                </p>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

function LoginFormWithNext() {
  const searchParams = useSearchParams()
  return <LoginForm next={searchParams.get("next")} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm next={null} />}>
      <LoginFormWithNext />
    </Suspense>
  )
}
