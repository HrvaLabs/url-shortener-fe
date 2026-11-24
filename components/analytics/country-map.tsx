"use client"

import { geoEqualEarth, geoPath, type GeoPath } from "d3-geo"
import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import countries110m from "world-atlas/countries-110m.json"
import { breakdownLabel, countryFlag } from "@/lib/analytics"
import { clicksText, keyTarget, mapCountries, mapEntries, mapLabel, share, tabStop, type MapCountry } from "@/lib/country-map"
import type { AnalyticsBreakdowns } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAP_WIDTH = 960
const MAP_HEIGHT = 422

const ANTARCTICA = "010"
const TOOLTIP_GAP = 12

const STEP_FILLS = [
  "fill-muted",
  "fill-brand/20 dark:fill-brand/40",
  "fill-brand/35 dark:fill-brand/55",
  "fill-brand/50 dark:fill-brand/70",
  "fill-brand/70 dark:fill-brand/85",
  "fill-brand",
]
const LEGEND_SWATCHES = [
  "bg-brand/20 dark:bg-brand/40",
  "bg-brand/35 dark:bg-brand/55",
  "bg-brand/50 dark:bg-brand/70",
  "bg-brand/70 dark:bg-brand/85",
  "bg-brand",
]

type Point = [number, number]

interface Shape {
  id: string | null
  d: string
  anchor: Point
}

type CountryShape = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>

function anchorOf(country: CountryShape, path: GeoPath): Point {
  if (country.geometry.type !== "MultiPolygon") return path.centroid(country)
  const parts: GeoJSON.Polygon[] = country.geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }))
  const largest = parts.reduce((best, part) => (path.area(part) > path.area(best) ? part : best))
  return path.centroid(largest)
}

function worldShapes(): Shape[] {
  const world = countries110m as unknown as Topology<{ countries: GeometryCollection }>
  const land = feature(world, world.objects.countries).features.filter((country) => String(country.id) !== ANTARCTICA)
  const projection = geoEqualEarth().fitExtent(
    [
      [1, 1],
      [MAP_WIDTH - 1, MAP_HEIGHT - 1],
    ],
    { type: "FeatureCollection", features: land },
  )
  const path = geoPath(projection).digits(1)
  return land.map((country) => ({
    id: country.id == null ? null : String(country.id),
    d: path(country) ?? "",
    anchor: anchorOf(country, path),
  }))
}

const SHAPES = worldShapes()
const SHAPE_INDEX = new Map(SHAPES.flatMap((shape, index) => (shape.id ? [[shape.id, index] as const] : [])))
const SHAPE_IDS: ReadonlySet<string> = new Set(SHAPE_INDEX.keys())

interface Tip {
  index: number
  pointer: Point | null
}

const shapeIndexOf = (target: EventTarget): number | null => {
  const value = target instanceof Element ? target.getAttribute("data-index") : null
  return value == null ? null : Number(value)
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max))

const countryText = (country: MapCountry, total: number): string => `${clicksText(country.clicks)} (${share(country.clicks, total)})`

const PlainShapes = memo(function PlainShapes({ countries }: { countries: Map<string, MapCountry> }) {
  return SHAPES.map((shape, index) =>
    shape.id && countries.has(shape.id) ? null : (
      <path key={index} d={shape.d} className={STEP_FILLS[0]} vectorEffect="non-scaling-stroke" />
    ),
  )
})

interface CountryPathProps {
  index: number
  country: MapCountry
  total: number
  tabStop: boolean
  hintId: string
}

const CountryPath = memo(function CountryPath({ index, country, total, tabStop, hintId }: CountryPathProps) {
  return (
    <path
      d={SHAPES[index].d}
      data-index={index}
      tabIndex={tabStop ? 0 : -1}
      role="img"
      aria-label={`${breakdownLabel("countries", country.code)}: ${countryText(country, total)}`}
      aria-describedby={hintId}
      className={cn("cursor-pointer outline-none", STEP_FILLS[country.step])}
      vectorEffect="non-scaling-stroke"
    />
  )
})

interface CountryShapesProps {
  countries: Map<string, MapCountry>
  total: number
  stopId: string | undefined
  hintId: string
}

const CountryShapes = memo(function CountryShapes({ countries, total, stopId, hintId }: CountryShapesProps) {
  return (
    <g className="stroke-card" strokeWidth={0.5}>
      <PlainShapes countries={countries} />
      {[...countries].map(([id, country]) => {
        const index = SHAPE_INDEX.get(id)
        return index == null ? null : (
          <CountryPath key={index} index={index} country={country} total={total} tabStop={id === stopId} hintId={hintId} />
        )
      })}
    </g>
  )
})

interface CountryMapProps {
  breakdowns: AnalyticsBreakdowns
}

export function CountryMap({ breakdowns }: CountryMapProps) {
  const entries = useMemo(() => mapEntries(breakdowns), [breakdowns])
  const countries = useMemo(() => mapCountries(entries, SHAPE_IDS), [entries])
  const total = useMemo(() => breakdowns.countries.reduce((sum, entry) => sum + entry.clicks, 0), [breakdowns.countries])
  const [tip, setTip] = useState<Tip | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [lastFocused, setLastFocused] = useState<string | null>(null)
  const order = useMemo(() => [...countries.keys()], [countries])
  const stopId = tabStop(order, lastFocused)
  const hintId = useId()
  const frameRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const tipShape = tip ? SHAPES[tip.index] : undefined
  const tipCountry = tipShape?.id ? countries.get(tipShape.id) : undefined

  useLayoutEffect(() => {
    const frame = frameRef.current
    const tooltip = tipRef.current
    if (!tip || !frame || !tooltip) return
    const scale = frame.clientWidth / MAP_WIDTH
    const [x, y] = tip.pointer ?? [SHAPES[tip.index].anchor[0] * scale, SHAPES[tip.index].anchor[1] * scale]
    const left = clamp(x - tooltip.offsetWidth / 2, 0, frame.clientWidth - tooltip.offsetWidth)
    const above = y - TOOLTIP_GAP - tooltip.offsetHeight
    const top = clamp(above >= 0 ? above : y + TOOLTIP_GAP, 0, frame.clientHeight - tooltip.offsetHeight)
    tooltip.style.transform = `translate(${left}px, ${top}px)`
  }, [tip, tipCountry, total])

  const anchored = tip != null && tip.pointer == null
  useEffect(() => {
    if (!anchored) return
    const hideOutside = (event: globalThis.PointerEvent) => {
      if (!frameRef.current?.contains(event.target as Node)) setTip(null)
    }
    document.addEventListener("pointerdown", hideOutside)
    return () => document.removeEventListener("pointerdown", hideOutside)
  }, [anchored])

  const hidePointerTip = () => setTip((current) => (current?.pointer ? null : current))

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch") return
    const index = shapeIndexOf(event.target)
    const frame = frameRef.current
    if (index == null || !frame) {
      hidePointerTip()
      return
    }
    const box = frame.getBoundingClientRect()
    setTip({ index, pointer: [event.clientX - box.left, event.clientY - box.top] })
  }

  const onClick = (event: MouseEvent<SVGSVGElement>) => {
    if ((event.nativeEvent as globalThis.PointerEvent).pointerType === "mouse") return
    const index = shapeIndexOf(event.target)
    setTip(index == null ? null : { index, pointer: null })
  }

  const showFocused = (index: number) => {
    setFocused(index)
    setTip({ index, pointer: null })
  }

  const onFocus = (event: FocusEvent<SVGSVGElement>) => {
    const index = shapeIndexOf(event.target)
    if (index == null) return
    setLastFocused(SHAPES[index].id)
    if ((event.target as Element).matches(":focus-visible")) showFocused(index)
  }

  const onBlur = () => {
    setFocused(null)
    setTip((current) => (current && !current.pointer ? null : current))
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "Escape") {
      setTip(null)
      return
    }
    const index = shapeIndexOf(event.target)
    if (index == null) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setTip({ index, pointer: null })
      return
    }
    const target = keyTarget(event, order.indexOf(SHAPES[index].id ?? ""), order.length)
    if (target == null) return
    const nextId = order[target]
    const nextIndex = SHAPE_INDEX.get(nextId)
    if (nextIndex == null) return
    event.preventDefault()
    const next = event.currentTarget.querySelector(`[data-index="${nextIndex}"]`)
    if (next instanceof SVGElement) next.focus()
    setLastFocused(nextId)
    showFocused(nextIndex)
  }

  const outlined = [...new Set([tipCountry ? tip?.index : undefined, focused])].filter((index) => index != null)

  return (
    <figure aria-label={mapLabel(entries)}>
      <div ref={frameRef} className="relative aspect-[960/422]">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="absolute inset-0 size-full"
          onPointerMove={onPointerMove}
          onPointerLeave={hidePointerTip}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          <CountryShapes countries={countries} total={total} stopId={stopId} hintId={hintId} />
          {outlined.map((index) => (
            <path
              key={index}
              d={SHAPES[index].d}
              className="pointer-events-none fill-none stroke-foreground"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {tip && tipCountry && (
          <div
            ref={tipRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 w-max max-w-full rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_4px_12px_-2px_rgb(0_0_0/0.2)]"
          >
            <p className="flex items-center gap-1.5 font-medium">
              {countryFlag(tipCountry.code) && <span className="shrink-0">{countryFlag(tipCountry.code)}</span>}
              <span className="min-w-0 [overflow-wrap:anywhere]">{breakdownLabel("countries", tipCountry.code)}</span>
            </p>
            <p className="mt-0.5 tabular-nums text-muted-foreground">{countryText(tipCountry, total)}</p>
          </div>
        )}
      </div>
      {order.length > 0 && (
        <p id={hintId} className="sr-only">
          Arrow keys move between countries, from the most clicks to the fewest. Escape hides the details.
        </p>
      )}
      <div aria-hidden="true" className="mt-3 flex h-4 items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span>Fewer</span>
        {LEGEND_SWATCHES.map((swatch) => (
          <span key={swatch} className={cn("size-3 rounded-[3px]", swatch)} />
        ))}
        <span>More</span>
      </div>
    </figure>
  )
}
