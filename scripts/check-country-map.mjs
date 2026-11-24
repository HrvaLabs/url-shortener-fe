import assert from "node:assert/strict"
import { createRequire } from "node:module"
import "./resolve-ts-imports.mjs"

const { alpha2ToNumeric, clicksText, colourStep, mapCountries, mapEntries, mapLabel, share } = await import("../lib/country-map.ts")
const { getAlpha2Codes, numericToAlpha2 } = await import("i18n-iso-countries/index.js")

const world = createRequire(import.meta.url)("world-atlas/countries-110m.json")
const ANTARCTICA = "010"
const shapeIds = new Set(world.objects.countries.geometries.map((shape) => shape.id).filter((id) => id != null && id !== ANTARCTICA))

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const entry = (value, clicks) => ({ value, clicks })

check("mapEntries uses countryMap when the backend sends it", () => {
  const countryMap = [entry("HR", 10), entry("DE", 3), entry("XK", 2)]
  assert.deepEqual(mapEntries({ countries: [entry("HR", 10), entry("other", 5)], countryMap }), countryMap)
})

check("an empty countryMap wins over the countries list", () => {
  assert.deepEqual(mapEntries({ countries: [entry("unknown", 4)], countryMap: [] }), [])
})

check("without countryMap the named countries are used, without other, unknown and tor", () => {
  const countries = [entry("HR", 10), entry("unknown", 4), entry("DE", 3), entry("tor", 2), entry("other", 9)]
  assert.deepEqual(mapEntries({ countries }), [entry("HR", 10), entry("DE", 3)])
  assert.deepEqual(mapEntries({ countries, countryMap: null }), [entry("HR", 10), entry("DE", 3)])
  assert.deepEqual(mapEntries({ countries: [entry("unknown", 4), entry("tor", 1)] }), [])
})

check("mapEntries orders by clicks, then by code, and leaves its input alone", () => {
  const countryMap = [entry("DE", 3), entry("AT", 3), entry("HR", 10), entry("SI", 0)]
  assert.deepEqual(mapEntries({ countries: [], countryMap }), [entry("HR", 10), entry("AT", 3), entry("DE", 3)])
  assert.deepEqual(countryMap.map((item) => item.value), ["DE", "AT", "HR", "SI"])
})

check("alpha2ToNumeric gives the ISO numeric code the map shapes use", () => {
  assert.equal(alpha2ToNumeric("HR"), "191")
  assert.equal(alpha2ToNumeric("hr"), "191")
  assert.equal(alpha2ToNumeric("DE"), "276")
  assert.equal(alpha2ToNumeric("US"), "840")
  assert.equal(alpha2ToNumeric("AF"), "004")
  assert.equal(alpha2ToNumeric("XK"), "983")
})

check("alpha2ToNumeric gives nothing for values that aren't country codes", () => {
  for (const value of ["unknown", "tor", "other", "", "ZZ", "H", "HRV", "constructor", "__proto__", "1A"]) {
    assert.equal(alpha2ToNumeric(value), undefined, value)
  }
})

check("every shape on the map has a country code", () => {
  assert.ok(shapeIds.size > 150, `only ${shapeIds.size} shapes`)
  for (const id of shapeIds) assert.ok(numericToAlpha2(id), `shape ${id} has no alpha-2 code`)
  for (const code of ["HR", "DE", "US", "FR", "RU", "CN", "BR", "AU", "IN", "ZA"]) assert.ok(shapeIds.has(alpha2ToNumeric(code)), code)
  assert.equal(shapeIds.has(alpha2ToNumeric("XK")), false)
})

check("colourStep: no clicks is 0", () => {
  assert.equal(colourStep(0, 100), 0)
  assert.equal(colourStep(-3, 100), 0)
  assert.equal(colourStep(Number.NaN, 100), 0)
  assert.equal(colourStep(0, 0), 0)
})

check("colourStep: the largest count, or a max equal to the smallest, is 5", () => {
  assert.equal(colourStep(1000, 1000), 5)
  assert.equal(colourStep(1, 1), 5)
  assert.equal(colourStep(7, 7), 5)
  assert.equal(colourStep(3, 0), 5)
  assert.equal(colourStep(3, Number.NaN), 5)
})

check("colourStep: a log scale from one click to the max", () => {
  assert.equal(colourStep(1, 1000), 1)
  assert.equal(colourStep(2, 100), 1)
  assert.equal(colourStep(3, 100), 2)
  assert.equal(colourStep(10, 100), 3)
  assert.equal(colourStep(20, 100), 4)
  assert.equal(colourStep(50, 100), 5)
  assert.equal(colourStep(1, 2), 1)
  assert.equal(colourStep(2, 2), 5)
})

check("colourStep: whole steps 1 to 5, rising with the clicks", () => {
  for (const max of [2, 5, 37, 1000, 123456]) {
    let previous = 1
    const seen = new Set()
    for (let clicks = 1; clicks <= max; clicks += Math.max(1, Math.floor(clicks / 50))) {
      const step = colourStep(clicks, max)
      assert.ok(Number.isInteger(step) && step >= 1 && step <= 5, `${clicks} of ${max} gave ${step}`)
      assert.ok(step >= previous, `${clicks} of ${max} went down to ${step}`)
      previous = step
      seen.add(step)
    }
    assert.equal(colourStep(max, max), 5)
    if (max >= 37) assert.deepEqual([...seen].sort(), [1, 2, 3, 4, 5], `max ${max}`)
  }
})

check("share is the percentage of all clicks", () => {
  assert.equal(share(1, 4), "25%")
  assert.equal(share(1, 3), "33.3%")
  assert.equal(share(2, 3), "66.7%")
  assert.equal(share(5, 5), "100%")
  assert.equal(share(1, 1000), "0.1%")
  assert.equal(share(1, 2001), "<0.1%")
  assert.equal(share(9999, 10000), "99.9%")
})

check("share with no clicks or no total is 0%", () => {
  assert.equal(share(0, 10), "0%")
  assert.equal(share(5, 0), "0%")
  assert.equal(share(0, 0), "0%")
})

check("clicksText", () => {
  assert.equal(clicksText(1), "1 click")
  assert.equal(clicksText(0), "0 clicks")
  assert.equal(clicksText(2), "2 clicks")
  assert.equal(clicksText(1234), `${(1234).toLocaleString()} clicks`)
})

check("mapCountries colours only countries with a shape, by their own max", () => {
  const countries = mapCountries([entry("XK", 50), entry("HR", 10), entry("MT", 8), entry("DE", 3)], shapeIds)
  assert.deepEqual([...countries.keys()], ["191", "276"])
  assert.deepEqual(countries.get("191"), { code: "HR", clicks: 10, step: 5 })
  assert.deepEqual(countries.get("276"), { code: "DE", clicks: 3, step: 3 })
})

check("mapCountries: clicks only from codes without a shape colour nothing", () => {
  assert.equal(mapCountries([entry("XK", 5), entry("MT", 2), entry("SG", 1)], shapeIds).size, 0)
  assert.equal(mapCountries([], shapeIds).size, 0)
})

check("mapCountries: one country with all the clicks gets the strongest colour", () => {
  assert.deepEqual([...mapCountries([entry("HR", 1)], shapeIds).values()], [{ code: "HR", clicks: 1, step: 5 }])
  assert.deepEqual([...mapCountries([entry("hr", 42)], shapeIds).values()], [{ code: "hr", clicks: 42, step: 5 }])
})

check("mapCountries: every country with clicks at once", () => {
  const codes = Object.keys(getAlpha2Codes()).sort()
  const entries = codes.map((code, index) => entry(code, codes.length - index))
  const countries = mapCountries(entries, shapeIds)
  assert.equal(countries.size, shapeIds.size)
  for (const country of countries.values()) assert.ok(Number.isInteger(country.step) && country.step >= 1 && country.step <= 5, country.code)
  assert.equal(Math.max(...[...countries.values()].map((country) => country.step)), 5)
})

check("mapLabel names the top three countries and their clicks", () => {
  assert.equal(
    mapLabel([entry("HR", 120), entry("DE", 40), entry("US", 1), entry("AT", 1)]),
    "World map of clicks by country. Most clicks: Croatia 120 clicks, Germany 40 clicks, United States 1 click.",
  )
  assert.equal(mapLabel([entry("XK", 2)]), "World map of clicks by country. Most clicks: Kosovo 2 clicks.")
})

check("mapLabel without a known country", () => {
  assert.equal(mapLabel([]), "World map of clicks by country. No clicks from a known country in this range.")
})

if (failures > 0) process.exit(1)

console.log("ok")
