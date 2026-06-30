"use client"

import { useMemo, useState } from "react"
import { Compass, Mountain, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChecklistView } from "@/components/checklist-view"
import { TripSetup } from "@/components/trip-setup"
import { newId } from "@/lib/gear-library"
import { useTrips } from "@/lib/use-trips"
import type { Trip } from "@/lib/types"

export default function Page() {
  const {
    hydrated,
    trips,
    activeTripId,
    setActiveTripId,
    upsertTrip,
    deleteTrip,
    toggleItem,
    clearPacked,
    addItem,
    removeItem,
    setItemOwner,
  } = useTrips()

  const [creating, setCreating] = useState(false)

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) ?? null,
    [trips, activeTripId],
  )

  const showSetup = creating || !activeTrip

  function handleCreate(trip: Trip) {
    upsertTrip(trip)
    setCreating(false)
  }

  function handleDuplicate(trip: Trip) {
    const copy: Trip = {
      ...trip,
      id: newId(),
      name: `${trip.name} (copy)`,
      createdAt: Date.now(),
      items: trip.items.map((i) => ({ ...i, id: newId(), packed: false })),
    }
    upsertTrip(copy)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10">
      {/* App header */}
      <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="size-4" aria-hidden="true" />
          </span>
          <h1 className="text-base font-semibold leading-none">Adventure Packing Planner</h1>
        </div>
        {!showSetup ? (
          <Button size="sm" variant="outline" className="h-9 rounded-lg" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New
          </Button>
        ) : null}
      </div>

      {!hydrated ? (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted-foreground">Loading…</div>
      ) : showSetup ? (
        <div className="flex flex-col gap-6 py-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <TripSetup
              onCreate={handleCreate}
              onCancel={creating && activeTrip ? () => setCreating(false) : undefined}
            />
          </div>

          {trips.length > 0 ? (
            <SavedTrips
              trips={trips}
              activeTripId={activeTripId}
              onOpen={(id) => {
                setActiveTripId(id)
                setCreating(false)
              }}
            />
          ) : null}
        </div>
      ) : (
        <div className="py-2">
          <ChecklistView
            trip={activeTrip}
            onToggleItem={(itemId) => toggleItem(activeTrip.id, itemId)}
            onAddItem={(item) => addItem(activeTrip.id, item)}
            onRemoveItem={(itemId) => removeItem(activeTrip.id, itemId)}
            onSetOwner={(itemId, owner, section) => setItemOwner(activeTrip.id, itemId, owner, section)}
            onClearPacked={() => clearPacked(activeTrip.id)}
            onDuplicate={() => handleDuplicate(activeTrip)}
            onDelete={() => deleteTrip(activeTrip.id)}
            onNewTrip={() => setCreating(true)}
          />
        </div>
      )}
    </main>
  )
}

function SavedTrips({
  trips,
  activeTripId,
  onOpen,
}: {
  trips: Trip[]
  activeTripId: string | null
  onOpen: (id: string) => void
}) {
  const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">Saved trips</h2>
      <ul className="flex flex-col gap-2">
        {sorted.map((trip) => {
          const packed = trip.items.filter((i) => i.packed).length
          const total = trip.items.length
          return (
            <li key={trip.id}>
              <button
                type="button"
                onClick={() => onOpen(trip.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted",
                  trip.id === activeTripId ? "border-primary" : "border-border",
                ].join(" ")}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Compass className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{trip.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {trip.type} · {trip.season} · {trip.nights} {trip.nights === 1 ? "night" : "nights"}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {packed}/{total}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
