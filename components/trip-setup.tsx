"use client"

import { useState } from "react"
import { Calendar, CloudSun, Compass, Loader2, MapPin, Mountain, Tag, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateChecklist, newId, type ListDefaults } from "@/lib/gear-library"
import { checkWeather, type WeatherResult } from "@/app/actions/weather"
import {
  ACTIVITIES,
  emptyWeather,
  PEOPLE,
  type Activity,
  type Person,
  type Season,
  type Trip,
  type Weather,
} from "@/lib/types"

/** Nights between two ISO dates (0 if invalid or non-positive). */
function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0
  const a = new Date(`${start}T00:00:00`).getTime()
  const b = new Date(`${end}T00:00:00`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  const d = Math.round((b - a) / 86400000)
  return d > 0 ? d : 0
}

/**
 * Derive the trip season from a start date (Northern Hemisphere).
 * Jun–Aug = Summer, Dec–Feb = Winter, everything else = Shoulder Season.
 */
function seasonFromDate(start: string): Season {
  if (!start) return "Summer"
  const month = new Date(`${start}T00:00:00`).getMonth() // 0-11
  if (Number.isNaN(month)) return "Summer"
  if (month >= 5 && month <= 7) return "Summer"
  if (month === 11 || month <= 1) return "Winter"
  return "Shoulder Season"
}

type Props = {
  onCreate: (trip: Trip) => void
  onCancel?: () => void
  submitting?: boolean
  defaults?: ListDefaults
}

export function TripSetup({ onCreate, onCancel, submitting, defaults }: Props) {
  const [name, setName] = useState("")
  const [activities, setActivities] = useState<Activity[]>(["Backpacking"])
  const [people, setPeople] = useState<Person[]>(["Danielle", "Tommy"])
  const [weather, setWeather] = useState<Weather>(emptyWeather())

  // Dates & destinations for the weather lookup.
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [destinations, setDestinations] = useState<string[]>([])
  const [destInput, setDestInput] = useState("")
  const [minElevationFt, setMinElevationFt] = useState("")
  const [maxElevationFt, setMaxElevationFt] = useState("")
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherResult, setWeatherResult] = useState<WeatherResult | null>(null)

  const hasDates = Boolean(startDate && endDate)
  const derivedNights = hasDates ? nightsBetween(startDate, endDate) : 0
  // Nights come from the date range; fall back to 2 if dates aren't set yet.
  const effectiveNights = hasDates ? derivedNights : 2
  // Season is inferred from the start date (defaults to Summer until a date is set).
  const season = seasonFromDate(startDate)
  // Elevation only matters for land-based, camp-oriented activities.
  const ELEVATION_ACTIVITIES: Activity[] = ["Backpacking", "Hut-to-Hut", "Car Camping", "Bikepacking", "Fastpacking"]
  const showElevation = activities.some((a) => ELEVATION_ACTIVITIES.includes(a))

  function addDestination() {
    const value = destInput.trim()
    if (!value) return
    setDestinations((prev) => (prev.some((d) => d.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]))
    setDestInput("")
  }

  function removeDestination(value: string) {
    setDestinations((prev) => prev.filter((d) => d !== value))
  }

  async function handleCheckWeather() {
    if (destinations.length === 0 || !hasDates) return
    setWeatherLoading(true)
    try {
      const parseElev = (v: string) => {
        const n = v.trim() ? Number.parseInt(v, 10) : null
        return n != null && Number.isFinite(n) ? n : null
      }
      const result = await checkWeather(
        destinations,
        startDate,
        endDate,
        showElevation ? parseElev(minElevationFt) : null,
        showElevation ? parseElev(maxElevationFt) : null,
      )
      setWeatherResult(result)
      // Auto-set the conditions that drive gear selection from the lookup.
      setWeather((prev) => ({
        ...prev,
        rain: result.combined.rain,
        cold: result.combined.cold,
        international: result.combined.international,
      }))
    } catch {
      setWeatherResult({
        destinations: [],
        combined: { rain: false, cold: false, international: false },
        note: "",
        error: "Weather lookup failed. Try again.",
      })
    } finally {
      setWeatherLoading(false)
    }
  }

  function togglePerson(p: Person) {
    setPeople((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleActivity(a: Activity) {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tripName = name.trim() || `${activities[0] ?? "New"} Trip`
    const base = { activities, season, nights: effectiveNights, people, weather }
    const weatherNote = weatherResult?.destinations
      .filter((d) => d.found)
      .map((d) => `${d.resolvedName ?? d.query}: ${d.summary}`)
      .join(" ")
    const trip: Trip = {
      id: newId(),
      name: tripName,
      ...base,
      destinations: destinations.length > 0 ? destinations : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      weatherNote: weatherNote || undefined,
      items: generateChecklist(base, defaults),
      createdAt: Date.now(),
    }
    onCreate(trip)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Compass className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-balance text-xl font-semibold leading-tight">Plan a new trip</h2>
          <p className="text-sm text-muted-foreground">Set the details and we&apos;ll build your list.</p>
        </div>
      </div>

      {/* Trip name */}
      <Field label="Trip name" htmlFor="trip-name" icon={<Tag />}>
        <input
          id="trip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wind River High Route"
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </Field>

      {/* Dates */}
      <Field label="Trip dates" icon={<Calendar />} divided>
        <p className="-mt-1 text-xs text-muted-foreground">
          Add dates to auto-count nights and look up the weather.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Start
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            End
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
        </div>
        {hasDates ? (
          <p className="text-sm text-muted-foreground">
            {derivedNights} {derivedNights === 1 ? "night" : "nights"} · {season} — used to size your list.
          </p>
        ) : null}
      </Field>

      {/* Activities (multi-select) */}
      <Field label="Activities" icon={<Mountain />} divided>
        <p className="-mt-1 text-xs text-muted-foreground">Pick all that apply — mix outdoor and city time.</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => {
            const active = activities.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleActivity(a)}
                aria-pressed={active}
                className={[
                  "flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all duration-150 active:scale-[0.96]",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-input bg-card text-foreground hover:bg-muted hover:shadow-sm",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-5 items-center justify-center rounded-md border text-xs",
                    active ? "border-primary-foreground/60 bg-primary-foreground/20" : "border-border",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {active ? "✓" : ""}
                </span>
                {a}
              </button>
            )
          })}
        </div>
      </Field>

      {/* Destinations + weather lookup */}
      <Field label="Destinations" icon={<MapPin />} divided>
        <p className="-mt-1 text-xs text-muted-foreground">
          Add one or more places — we&apos;ll check the forecast and adjust your gear.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  addDestination()
                }
              }}
              placeholder="e.g. Aspen, CO"
              className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
          <Button type="button" variant="outline" onClick={addDestination} className="h-11 rounded-lg">
            Add
          </Button>
        </div>

        {destinations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {destinations.map((d) => (
              <span
                key={d}
                className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeDestination(d)}
                  aria-label={`Remove ${d}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {showElevation ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Elevation range (optional)</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Lowest (trailhead)
              <div className="relative">
                <Mountain
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={minElevationFt}
                  onChange={(e) => setMinElevationFt(e.target.value)}
                  placeholder="e.g. 6000"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-10 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ft
                </span>
              </div>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Highest (camp)
              <div className="relative">
                <Mountain
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={maxElevationFt}
                  onChange={(e) => setMaxElevationFt(e.target.value)}
                  placeholder="e.g. 9000"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-10 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ft
                </span>
              </div>
            </label>
          </div>
          <span className="text-xs font-normal text-muted-foreground">
            We cool the forecast ~3.5°F per 1,000 ft — daytime highs from your lowest point, nighttime lows from your
            highest camp. Enter either or both.
          </span>
        </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={handleCheckWeather}
          disabled={destinations.length === 0 || !hasDates || weatherLoading}
          className="h-11 rounded-lg"
        >
          {weatherLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CloudSun className="size-4" aria-hidden="true" />
          )}
          {weatherLoading ? "Checking weather…" : "Check weather & adjust list"}
        </Button>
        {!hasDates && destinations.length > 0 ? (
          <p className="text-xs text-muted-foreground">Add trip dates above to enable the weather check.</p>
        ) : null}

        {weatherResult ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3 duration-300 animate-in fade-in slide-in-from-top-1">
            {weatherResult.error ? (
              <p className="text-sm text-destructive">{weatherResult.error}</p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CloudSun className="size-4 text-accent-foreground" aria-hidden="true" />
                  Forecast summary
                </div>
                <ul className="flex flex-col gap-1.5">
                  {weatherResult.destinations.map((d) => (
                    <li key={d.query} className="text-sm">
                      <span className="font-medium">{d.resolvedName ?? d.query}</span>
                      <span className="text-muted-foreground"> — {d.summary}</span>
                    </li>
                  ))}
                </ul>
                {weatherResult.combined.rain ||
                weatherResult.combined.cold ||
                weatherResult.combined.international ? (
                  <p className="text-xs text-muted-foreground">
                    Adjusted your list for{" "}
                    {[
                      weatherResult.combined.rain ? "rain" : null,
                      weatherResult.combined.cold ? "cold nights" : null,
                      weatherResult.combined.international ? "international travel" : null,
                    ]
                      .filter(Boolean)
                      .join(" & ")}
                    .
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No rain, cold, or international conditions flagged.
                  </p>
                )}
                {weatherResult.note ? (
                  <p className="text-xs text-muted-foreground">{weatherResult.note}</p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </Field>

      {/* People */}
      <Field label="Who's going?" icon={<Users />} divided>
        <div className="flex flex-wrap gap-2">
          {PEOPLE.map((p) => {
            const active = people.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePerson(p)}
                aria-pressed={active}
                className={[
                  "flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-foreground hover:bg-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-5 items-center justify-center rounded-md border text-xs",
                    active ? "border-primary-foreground/60 bg-primary-foreground/20" : "border-border",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {active ? "✓" : ""}
                </span>
                {p}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="h-11 flex-1 rounded-lg sm:flex-none">
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={submitting || activities.length === 0}
          className="h-12 flex-1 rounded-lg text-base font-semibold shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.99]"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitting ? "Creating…" : "Generate packing list"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  icon,
  divided,
  children,
}: {
  label: string
  htmlFor?: string
  icon?: React.ReactNode
  divided?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={["flex flex-col gap-2", divided ? "border-t border-border/70 pt-6" : ""].join(" ")}>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon ? (
          <span
            className="flex size-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground [&>svg]:size-3.5"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        {label}
      </label>
      {children}
    </div>
  )
}
