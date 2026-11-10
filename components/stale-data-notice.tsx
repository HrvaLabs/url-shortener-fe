"use client"

import { useLayoutEffect, useRef, type RefObject } from "react"
import { Button } from "@/components/ui/button"

interface StaleDataNoticeProps {
  message: string
  onRetry: () => void
  returnFocusTo: RefObject<HTMLElement | null>
}

/** Read as the notice goes away, not as it appears: a target that is the notice's ancestor (the stats panel) gets its ref only after the notice's layout effects run. */
const focusTarget = (target: RefObject<HTMLElement | null>) => target.current?.focus({ preventScroll: true })

export function StaleDataNotice({ message, onRetry, returnFocusTo }: StaleDataNoticeProps) {
  const noticeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const notice = noticeRef.current
    return () => {
      if (notice?.contains(document.activeElement)) focusTarget(returnFocusTo)
    }
  }, [returnFocusTo])

  return (
    <div
      ref={noticeRef}
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
    >
      <span className="[overflow-wrap:anywhere]">{message}</span>
      <Button size="sm" variant="outline" className="h-8" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
