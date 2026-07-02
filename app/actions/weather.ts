"use server"

/**
 * Weather lookup for trip destinations using the free Open-Meteo APIs
 * (no API key required).
 *  - Geocoding:  https://geocoding-api.open-meteo.com
 *  - Forecast:   https://api.open-meteo.com          (up to ~16 days out)
 *  - Historical: https://archive-api.open-meteo.com  (same dates last year,
 *                used as a typical-climate proxy for far-future trips)
 */

export type DestinationWeather = {
  query: string
  resolvedName: string | null
  found: boolean
  source: "forecast" | "historical"
  tempMaxF: number | null
  tempMinF: number | null
  precipInMax: number
  rain: boolean
  cold: boolean
  /** Elevation of the weather station / town (ft), when known. */
  stationElevationFt: number | null
  /** Degrees F subtracted for the elevation gain to the target camp. */
  elevationAdjustF: number
  summary: string
}

export type WeatherResult = {
  destinations: DestinationWeather[]
  combined: { rain: boolean; cold: boolean }
  note: string
  error?: string
}

// Thresholds that map raw forecast numbers onto the app's condition toggles.
const COLD_NIGHT_F = 40 // a night at/below this flips "Cold nights"
const RAIN_PRECIP_IN = 0.1 // a day at/above this flips "Rain expected"
const RAIN_PROB_PCT = 50 // ...or a day with this precip probability

// Standard atmospheric lapse rate: temps drop ~3.5°F per 1,000 ft of gain.
// Used to cool the town forecast down to your (higher) camp elevation.
const LAPSE_F_PER_FT = 3.5 / 1000
const M_TO_FT = 3.28084

const MS_DAY = 86400000

function shiftYear(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const shifted = new Date(Date.UTC(y + years, m - 1, d))
  return shifted.toISOString().slice(0, 10)
}

function round(n: number | null): number | null {
  return n == null ? null : Math.round(n)
}

async function geocode(
  query: string,
): Promise<{ name: string; lat: number; lon: number; elevationFt: number | null } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query,
  )}&count=1&language=en&format=json`
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: {
        name: string
        latitude: number
        longitude: number
        elevation?: number
        admin1?: string
        country?: string
      }[]
    }
    const r = data.results?.[0]
    if (!r) return null
    const parts = [r.name, r.admin1, r.country].filter(Boolean)
    return {
      name: parts.join(", "),
      lat: r.latitude,
      lon: r.longitude,
      elevationFt: typeof r.elevation === "number" ? Math.round(r.elevation * M_TO_FT) : null,
    }
  } catch {
    return null
  }
}

type DailyData = {
  tmax: number[]
  tmin: number[]
  precip: number[]
  precipProb?: number[]
}

async function fetchDaily(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<{ data: DailyData; source: "forecast" | "historical" } | null> {
  const todayMs = Date.now()
  const startMs = new Date(`${startDate}T00:00:00Z`).getTime()
  const daysUntilStart = Math.floor((startMs - todayMs) / MS_DAY)
  const useHistorical = daysUntilStart > 15 || daysUntilStart < -5

  const common = `latitude=${lat}&longitude=${lon}&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`

  try {
    if (useHistorical) {
      const s = shiftYear(startDate, -1)
      const e = shiftYear(endDate, -1)
      const url = `https://archive-api.open-meteo.com/v1/archive?${common}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) return null
      const j = (await res.json()) as { daily?: Record<string, number[]> }
      if (!j.daily) return null
      return {
        source: "historical",
        data: {
          tmax: j.daily.temperature_2m_max ?? [],
          tmin: j.daily.temperature_2m_min ?? [],
          precip: j.daily.precipitation_sum ?? [],
        },
      }
    }

    const url = `https://api.open-meteo.com/v1/forecast?${common}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const j = (await res.json()) as { daily?: Record<string, number[]> }
    if (!j.daily) return null
    return {
      source: "forecast",
      data: {
        tmax: j.daily.temperature_2m_max ?? [],
        tmin: j.daily.temperature_2m_min ?? [],
        precip: j.daily.precipitation_sum ?? [],
        precipProb: j.daily.precipitation_probability_max ?? [],
      },
    }
  } catch {
    return null
  }
}

function summarize(d: DestinationWeather): string {
  if (!d.found) return `Couldn't find "${d.query}".`
  const hi = d.tempMaxF != null ? `${d.tempMaxF}°` : "—"
  const lo = d.tempMinF != null ? `${d.tempMinF}°F` : "—"
  const wet = d.rain ? "rain expected" : "mostly dry"
  const cold = d.cold ? ", cold nights" : ""
  const src = d.source === "historical" ? " (typical for these dates)" : ""
  const adj =
    d.elevationAdjustF > 0
      ? ` (adjusted ${d.elevationAdjustF}°F colder for your camp elevation)`
      : ""
  return `Highs ${hi} / lows ${lo}, ${wet}${cold}${src}${adj}.`
}

export async function checkWeather(
  destinations: string[],
  startDate: string,
  endDate: string,
  targetElevationFt?: number | null,
): Promise<WeatherResult> {
  const queries = destinations.map((s) => s.trim()).filter(Boolean)
  if (queries.length === 0 || !startDate || !endDate) {
    return { destinations: [], combined: { rain: false, cold: false }, note: "", error: "Missing destinations or dates." }
  }
  const targetFt = typeof targetElevationFt === "number" && targetElevationFt > 0 ? targetElevationFt : null

  const results = await Promise.all(
    queries.map(async (query): Promise<DestinationWeather> => {
      const geo = await geocode(query)
      if (!geo) {
        const miss: DestinationWeather = {
          query,
          resolvedName: null,
          found: false,
          source: "forecast",
          tempMaxF: null,
          tempMinF: null,
          precipInMax: 0,
          rain: false,
          cold: false,
          stationElevationFt: null,
          elevationAdjustF: 0,
          summary: "",
        }
        miss.summary = summarize(miss)
        return miss
      }

      // How many degrees to subtract for climbing above the town/station.
      const gainFt = targetFt != null && geo.elevationFt != null ? Math.max(0, targetFt - geo.elevationFt) : 0
      const elevationAdjustF = Math.round(gainFt * LAPSE_F_PER_FT)

      const daily = await fetchDaily(geo.lat, geo.lon, startDate, endDate)
      if (!daily || daily.data.tmax.length === 0) {
        const miss: DestinationWeather = {
          query,
          resolvedName: geo.name,
          found: true,
          source: daily?.source ?? "forecast",
          tempMaxF: null,
          tempMinF: null,
          precipInMax: 0,
          rain: false,
          cold: false,
          stationElevationFt: geo.elevationFt,
          elevationAdjustF,
          summary: "No weather data available for those dates.",
        }
        return miss
      }

      const { tmax, tmin, precip, precipProb } = daily.data
      // Cool the town forecast down to the camp elevation before thresholds.
      const adjTmax = tmax.map((t) => t - elevationAdjustF)
      const adjTmin = tmin.map((t) => t - elevationAdjustF)
      const tempMaxF = round(Math.max(...adjTmax))
      const tempMinF = round(Math.min(...adjTmin))
      const precipInMax = Math.max(0, ...precip)
      const rainByAmount = precip.some((p) => p >= RAIN_PRECIP_IN)
      const rainByProb = (precipProb ?? []).some((p) => p >= RAIN_PROB_PCT)
      const rain = rainByAmount || rainByProb
      const cold = adjTmin.some((t) => t <= COLD_NIGHT_F)

      const d: DestinationWeather = {
        query,
        resolvedName: geo.name,
        found: true,
        source: daily.source,
        tempMaxF,
        tempMinF,
        precipInMax: Math.round(precipInMax * 100) / 100,
        rain,
        cold,
        stationElevationFt: geo.elevationFt,
        elevationAdjustF,
        summary: "",
      }
      d.summary = summarize(d)
      return d
    }),
  )

  // Combine: if ANY destination is rainy/cold, add that gear.
  const combined = {
    rain: results.some((r) => r.found && r.rain),
    cold: results.some((r) => r.found && r.cold),
  }
  const anyHistorical = results.some((r) => r.found && r.source === "historical")
  const anyElevation = results.some((r) => r.found && r.elevationAdjustF > 0)
  const note = [
    anyHistorical ? "Far-out dates use typical weather from the same time last year." : "",
    anyElevation ? "Temps cooled ~3.5°F per 1,000 ft for your camp elevation." : "",
  ]
    .filter(Boolean)
    .join(" ")

  return { destinations: results, combined, note }
}
