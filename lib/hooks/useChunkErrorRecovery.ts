"use client"

import { useEffect, useRef } from "react"
import { recoverFromChunkError } from "@/lib/stale-chunk"

/** On an error page: recovers from an own chunk error by `recoverFromChunkError`, with the latest `retry`. */
export function useChunkErrorRecovery(error: unknown, retry: () => void) {
  const latestRetry = useRef(retry)

  useEffect(() => {
    latestRetry.current = retry
  }, [retry])

  useEffect(() => recoverFromChunkError(error, () => latestRetry.current()), [error])
}
