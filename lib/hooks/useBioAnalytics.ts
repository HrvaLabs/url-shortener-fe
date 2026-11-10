"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { bioApi, retryUnlessRefused } from "@/lib/api-client"
import { liveRefresh } from "@/lib/live"
import type { AnalyticsRange } from "@/lib/types"

export function useBioAnalytics(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "bio", days],
    queryFn: () => bioApi.analytics(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}
