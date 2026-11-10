"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { adminApi, retryUnlessRefused } from "@/lib/api-client"
import { liveRefresh } from "@/lib/live"
import type { AnalyticsRange } from "@/lib/types"

export function useTrafficStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "traffic", days],
    queryFn: () => adminApi.getTrafficStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}

export function useLinksStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "links", days],
    queryFn: () => adminApi.getLinksStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}

export function useUsersStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "users", days],
    queryFn: () => adminApi.getUsersStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}

export function useSafetyStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "safety", days],
    queryFn: () => adminApi.getSafetyStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}

export function useSystemStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "system", days],
    queryFn: () => adminApi.getSystemStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
    ...liveRefresh(true),
  })
}

export function useVisitStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "visits", days],
    queryFn: () => adminApi.getVisitStats(days),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
