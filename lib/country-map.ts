import { alpha2ToNumeric as isoNumericCode } from "i18n-iso-countries/index.js"
import { breakdownLabel } from "./analytics"
import type { AnalyticsBreakdowns, BreakdownEntry } from "./types"

/** Country values in `breakdowns.countries` that aren't a country: they stay in the list but have no place on the map. */
const NOT_ON_THE_MAP = new Set(["other", "unknown", "tor"])

const ALPHA_2 = /^[A-Z]{2}$/

const TOP_COUNTRIES_IN_LABEL = 3

export const COLOUR_STEPS = 5

export interface MapCountry {
  code: string
  clicks: number
  step: number
}

/** The map's data: `countryMap` (every country, from v2.41), else the named entries of the top-10 `countries` list from an older backend. Clicks descending, then code. */
export function mapEntries(breakdowns: Pick<AnalyticsBreakdowns, "countries" | "countryMap">): BreakdownEntry[] {
  const source = breakdowns.countryMap ?? breakdowns.countries
  return source
    .filter((entry) => entry.clicks > 0 && !NOT_ON_THE_MAP.has(entry.value))
    .sort((a, b) => b.clicks - a.clicks || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
}

/** The ISO 3166-1 numeric code (`"191"` for HR), which the Natural Earth shapes in world-atlas use as their id. */
export function alpha2ToNumeric(code: string): string | undefined {
  const upper = code.toUpperCase()
  return ALPHA_2.test(upper) ? isoNumericCode(upper) : undefined
}

/** 0 for no clicks; otherwise 1 to 5 on a log scale from one click to `max`, and 5 for `max` itself. */
export function colourStep(clicks: number, max: number): number {
  if (!(clicks >= 1)) return 0
  if (!(max > 1) || clicks >= max) return COLOUR_STEPS
  return Math.min(COLOUR_STEPS, 1 + Math.floor((COLOUR_STEPS * Math.log(clicks)) / Math.log(max)))
}

export function share(clicks: number, total: number): string {
  if (!(clicks > 0) || !(total > 0)) return "0%"
  if (clicks >= total) return "100%"
  const percent = (clicks / total) * 100
  if (percent < 0.1) return "<0.1%"
  return `${Math.min(99.9, Math.round(percent * 10) / 10)}%`
}

export function clicksText(clicks: number): string {
  return `${clicks.toLocaleString()} ${clicks === 1 ? "click" : "clicks"}`
}

/** The countries the map colours, by shape id. Codes without a shape (Kosovo, very small countries) are left out, and so is their count from the max. */
export function mapCountries(entries: BreakdownEntry[], shapeIds: ReadonlySet<string>): Map<string, MapCountry> {
  const shown = new Map<string, BreakdownEntry>()
  for (const entry of entries) {
    const id = alpha2ToNumeric(entry.value)
    if (id && shapeIds.has(id) && !shown.has(id)) shown.set(id, entry)
  }
  const max = Math.max(0, ...[...shown.values()].map((entry) => entry.clicks))
  return new Map([...shown].map(([id, entry]) => [id, { code: entry.value, clicks: entry.clicks, step: colourStep(entry.clicks, max) }]))
}

/** The map figure's `aria-label`: the three countries with the most clicks. */
export function mapLabel(entries: BreakdownEntry[]): string {
  const top = entries.slice(0, TOP_COUNTRIES_IN_LABEL)
  if (top.length === 0) return "World map of clicks by country. No clicks from a known country in this range."
  const named = top.map((entry) => `${breakdownLabel("countries", entry.value)} ${clicksText(entry.clicks)}`)
  return `World map of clicks by country. Most clicks: ${named.join(", ")}.`
}
