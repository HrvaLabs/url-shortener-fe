"use client"

import { useEffect } from "react"
import { isStaleChunkElement, recoverFromBackgroundChunkError, recoverInBackground } from "@/lib/stale-chunk"

const isEditing = () => {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false
  return active.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)
}

export function StaleChunkReload() {
  useEffect(() => {
    const onError = (event: Event) => {
      if (event instanceof ErrorEvent) {
        recoverFromBackgroundChunkError(event.error)
        return
      }
      const target = event.target
      if (!(target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)) return
      const element = target instanceof HTMLScriptElement
        ? { tagName: target.tagName, src: target.src }
        : { tagName: target.tagName, href: target.href, rel: target.rel }
      if (!isStaleChunkElement(element, window.location.origin)) return
      recoverInBackground(target instanceof HTMLScriptElement ? target.src : target.href, () => !isEditing())
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      recoverFromBackgroundChunkError(event.reason)
    }

    window.addEventListener("error", onError, true)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError, true)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
