"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

function CountryMapSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[960/422] w-full motion-reduce:animate-none" />
      <div className="mt-3 h-4" />
    </div>
  )
}

/** The country map, loaded only in the browser and only when a Countries card has entries; the skeleton has the map's size, so the card doesn't jump. */
export const CountryMapLazy = dynamic(() => import("@/components/analytics/country-map").then((loaded) => loaded.CountryMap), {
  ssr: false,
  loading: CountryMapSkeleton,
})
