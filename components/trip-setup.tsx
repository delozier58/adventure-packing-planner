"use client"

import { useState } from "react"
import { Compass, Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateChecklist, newId } from "@/lib/gear-library"
import {
  ACTIVITIES,
  emptyWeather,
  PEOPLE,
  SEASONS,
  WEATHER_KEYS,
  WEATHER_LABELS,
  type Activity,
  type Person,
  type Season,
  type Trip,
  type Weather,
} from "@/lib/types"

type Props = {
  onCreate: (trip: Trip) => void
  onCancel?: () => void
  submitting?: boolean
}

export function TripSetup({ onCreate, onCancel, submitting }: Props) {
  const [name, setName] = useState("")
  const [activities, setActivities] = useState<Activity[]>(["Backpacking"])
  const [season, setSeason] = useState<Season>("Summer")
  const [nights, setNights] = useState(2)
  const [people, setPeople] = useState<Person[]>(["Danielle", "Tommy"])
  const [weather, setWeather] = useState<Weather>(emptyWeather())

  function togglePerson(p: Person) {
    setPeople((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleActivity(a: Activity) {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  function toggleWeather(key: keyof Weather) {
    setWeather((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tripName = name.trim() || `${activities[0] ?? "New"} Trip`
    const base = { activities, season, nights, people, weather }
    const trip: Trip = {
      id: newId(),
      name: tripName,
      ...base,
      items: generateChecklist(base),
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
      <Field label="Trip name" htmlFor="trip-name">
        <input
          id="trip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wind River High Route"
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </Field>

      {/* Activities (multi-select) */}
      <Field label="Activities">
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
                {a}
              </button>
            )
          })}
        </div>
      </Field>

      {/* Season */}
      <Field label="Season" htmlFor="trip-season">
        <Select
          id="trip-season"
          value={season}
          onChange={(v) => setSeason(v as Season)}
          options={SEASONS as readonly string[]}
        />
      </Field>

      {/* Nights */}
      <Field label="Number of nights">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Decrease nights"
            onClick={() => setNights((n) => Math.max(0, n - 1))}
            className="size-11 rounded-lg"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {nights}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Increase nights"
            onClick={() => setNights((n) => Math.min(60, n + 1))}
            className="size-11 rounded-lg"
          >
            <Plus className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{nights === 1 ? "night" : "nights"}</span>
        </div>
      </Field>

      {/* People */}
      <Field label="Who's going?">
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

      {/* Weather toggles */}
      <Field label="Conditions">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WEATHER_KEYS.map((key) => {
            const active = weather[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleWeather(key)}
                aria-pressed={active}
                className={[
                  "flex h-11 items-center justify-between rounded-lg border px-4 text-sm font-medium transition-colors",
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-input bg-card text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {WEATHER_LABELS[key]}
                <span
                  className={[
                    "ml-2 flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                    active ? "bg-accent-foreground/30" : "bg-muted-foreground/30",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <span
                    className={[
                      "size-4 rounded-full bg-card transition-transform",
                      active ? "translate-x-4" : "translate-x-0",
                    ].join(" ")}
                  />
                </span>
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
        <Button type="submit" disabled={submitting || activities.length === 0} className="h-11 flex-1 rounded-lg text-base">
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
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
