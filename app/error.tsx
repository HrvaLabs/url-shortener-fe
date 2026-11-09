"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/error-fallback"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useChunkErrorRecovery } from "@/lib/hooks/useChunkErrorRecovery"

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  useChunkErrorRecovery(error, retry)

  return (
    <div className="flex min-h-screen flex-col">
      <title>Something went wrong — hrva.cc</title>
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <ErrorFallback error={error} retry={retry} />
      </main>
    </div>
  )
}
