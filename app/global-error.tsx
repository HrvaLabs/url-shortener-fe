"use client"

import { useEffect } from "react"
import "./globals.css"
import { ErrorFallback } from "@/components/error-fallback"
import { Logo } from "@/components/logo"
import { useChunkErrorRecovery } from "@/lib/hooks/useChunkErrorRecovery"

function prefersDark() {
  try {
    const stored = localStorage.getItem("theme")
    return stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  } catch {
    return false
  }
}

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
    document.documentElement.classList.toggle("dark", prefersDark())
  }, [error])
  useChunkErrorRecovery(error, retry)

  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        <title>Something went wrong — hrva.cc</title>
        <div className="flex min-h-screen flex-col">
          <header className="container flex h-16 items-center">
            <Logo />
          </header>
          <main className="flex flex-1 items-center justify-center px-5 py-24">
            <ErrorFallback error={error} retry={retry} />
          </main>
        </div>
      </body>
    </html>
  )
}
