"use client"

import { useRef, type ReactNode } from "react"
import type { UseQueryResult } from "@tanstack/react-query"
import { AnalyticsError, AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { StaleDataNotice } from "@/components/stale-data-notice"
import { liveStamp, liveState, type LiveStamp } from "@/lib/live"
import { cn } from "@/lib/utils"

interface StatsPanelProps<T> {
  query: UseQueryResult<T, Error>
  children: (data: T, stamp: LiveStamp) => ReactNode
}

export function StatsPanel<T>({ query, children }: StatsPanelProps<T>) {
  const panelRef = useRef<HTMLDivElement>(null)
  if (query.isPending) return <AnalyticsSkeleton variant="panel" />
  if (query.isLoadingError || (query.isRefetchError && liveState(query.error, true) === "failed")) {
    return (
      <AnalyticsError
        error={query.error}
        retrying={query.isRefetching}
        onRetry={() => query.refetch()}
        message="Couldn't load these stats. Try again."
      />
    )
  }
  const refreshing = query.isPlaceholderData
  return (
    <div ref={panelRef} tabIndex={-1} className={cn("space-y-6 transition-opacity focus-visible:outline-none", refreshing && "opacity-60")} aria-busy={refreshing}>
      {query.isRefetchError && (
        <StaleDataNotice message="Couldn't refresh these stats. They may be out of date." onRetry={() => query.refetch()} returnFocusTo={panelRef} />
      )}
      {children(query.data, liveStamp(query))}
    </div>
  )
}
