"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Compass, Loader2, Mountain, SlidersHorizontal, Trash2 } from "lucide-react"
import { TripSetup } from "@/components/trip-setup"
import { createTrip, deleteTrip, getAllTripSummaries } from "@/app/actions/trips"
import { getDefaults } from "@/app/actions/defaults"
import { forgetCode, rememberCode } from "@/lib/recent-trips"
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

  async function handleDelete(code: string) {
    // Optimistically remove from the list, then delete server-side.
    setSummaries((prev) => (prev ? prev.filter((t) => t.code !== code) : prev))
    forgetCode(code)
    try {
      await deleteTrip(code)
    } catch {
      // If it fails, reload to restore the true state.
      loadTrips()
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10">
      {/* Hero header with topographic texture */}
      <header
        className="relative -mx-4 overflow-hidden rounded-b-3xl bg-[#15171a] px-5 pb-7 pt-8 text-white shadow-sm ring-1 ring-white/5"
        style={{
          backgroundImage: "url(/topo-hero-dark.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Soft green accent glow in the top-left, fading into the charcoal slate */}
        <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-[#3f9b6e]/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1113]/70 via-transparent to-transparent" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#3f9b6e]/20 text-[#7fd7a6] ring-1 ring-[#3f9b6e]/40 backdrop-blur-sm">
            <Mountain className="size-5" aria-hidden="true" />
          </span>
          <Link
            href="/defaults"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-sm font-medium text-white/85 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Customize defaults</span>
            <span className="sm:hidden">Defaults</span>
          </Link>
        </div>
        <div className="relative mt-5">
          <h1 className="text-pretty text-2xl font-bold leading-tight sm:text-3xl">Adventure Packing Planner</h1>
          <p className="mt-1.5 max-w-md text-pretty text-sm text-white/80">
            Smart, reusable packing lists that adapt to your dates, destinations, and the forecast.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 py-6">
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
          <SavedTrips
            trips={summaries}
            onOpen={(code) => router.push(`/t/${code}`)}
            onDelete={handleDelete}
          />
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
  onDelete,
}: {
  trips: TripSummary[]
  onOpen: (code: string) => void
  onDelete: (code: string) => void
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">Your trips</h2>
      <ul className="flex flex-col gap-2">
        {trips.map((trip) => (
          <SavedTripRow key={trip.code} trip={trip} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  )
}

function SavedTripRow({
  trip,
  onOpen,
  onDelete,
}: {
  trip: TripSummary
  onOpen: (code: string) => void
  onDelete: (code: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => onOpen(trip.code)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
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
      {confirming ? (
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onDelete(trip.code)}
            className="flex flex-1 items-center rounded-lg bg-destructive px-3 text-xs font-medium text-destructive-foreground transition-colors hover:opacity-90"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex flex-1 items-center rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${trip.name}`}
          className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
