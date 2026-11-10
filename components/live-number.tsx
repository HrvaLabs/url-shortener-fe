"use client"

import { useState } from "react"
import { firstCount, nextCount, type LiveStamp } from "@/lib/live"
import { cn } from "@/lib/utils"

interface LiveNumberProps {
  value: number
  stamp: LiveStamp
  scope?: string
  className?: string
}

export function LiveNumber({ value, stamp, scope = "", className }: LiveNumberProps) {
  const [count, setCount] = useState(() => firstCount(value, scope, stamp))
  const [shownBumps, setShownBumps] = useState(0)
  const next = nextCount(count, value, scope, stamp)
  if (next !== count) setCount(next)
  const bumping = next.bumps > shownBumps

  return (
    <span
      key={next.bumps}
      className={cn("inline-block", bumping && "animate-count-bump", className)}
      onAnimationEnd={() => setShownBumps(next.bumps)}
    >
      {value.toLocaleString()}
    </span>
  )
}
