"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Compass, Loader2, Mountain, SlidersHorizontal } from "lucide-react"
import { TripSetup } from "@/components/trip-setup"
import { createTrip, getAllTripSummaries } from "@/app/actions/trips"
import { getDefaults } from "@/app/actions/defaults"
import { rememberCode } from "@/lib/recent-trips"
import { emptyDefaults, type ListDefaults } from "@/lib/gear-library"
import { tripActivities, type Trip, type TripSummary } from "@/lib/types"

export default function Page() {
  const router = useRouter()
  const [summaries, setSummaries] = useState<TripSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [defaults, setDefaults] = useState<ListDefaults>(emptyDefaults())

  useEffect(() => {
    getDefaults()
      .then(setDefaults)
      .catch(() => {})
  }, [])

  const loadTrips = useCallback(async () => {
    try {
      // Show every saved trip (newest first) so lists are visible on any device.
      const result = await getAllTripSummaries()
      setSummaries(result)
    } catch {
      setSummaries([])
    }
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  async function handleCreate(trip: Trip) {
    setCreating(true)
    try {
      const { code } = await createTrip(trip)
      rememberCode(code)
      router.push(`/t/${code}`)
    } catch {
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10">
      <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="size-4" aria-hidden="true" />
          </span>
          <h1 className="text-base font-semibold leading-none">Adventure Packing Planner</h1>
        </div>
        <Link
          href="/defaults"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Customize defaults</span>
          <span className="sm:hidden">Defaults</span>
        </Link>
      </div>

      <div className="flex flex-col gap-6 py-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <TripSetup onCreate={handleCreate} submitting={creating} defaults={defaults} />
        </div>

        <OpenByCode />

        {summaries === null ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading your trips…
          </div>
        ) : summaries.length > 0 ? (
          <SavedTrips trips={summaries} onOpen={(code) => router.push(`/t/${code}`)} />
        ) : (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            No trips yet. Plan a new trip above to get started.
          </p>
        )}
      </div>
    </main>
  )
}

function OpenByCode() {
  const router = useRouter()
  const [code, setCode] = useState("")
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = code.trim().toLowerCase()
        if (trimmed) router.push(`/t/${trimmed}`)
      }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Have a trip code? Enter it to join"
        aria-label="Trip code"
        className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        disabled={!code.trim()}
      >
        Join
      </button>
    </form>
  )
}

function SavedTrips({
  trips,
  onOpen,
}: {
  trips: TripSummary[]
  onOpen: (code: string) => void
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">Your trips</h2>
      <ul className="flex flex-col gap-2">
        {trips.map((trip) => (
          <li key={trip.code}>
            <button
              type="button"
              onClick={() => onOpen(trip.code)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{trip.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {tripActivities(trip).join(", ")} · {trip.season} · {trip.nights} {trip.nights === 1 ? "night" : "nights"}
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {trip.packed}/{trip.total}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
