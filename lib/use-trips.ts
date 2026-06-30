"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChecklistItem, Section, Trip } from "./types"

const STORAGE_KEY = "adventure-packing-planner:v1"

type Store = {
  trips: Trip[]
  activeTripId: string | null
}

function loadStore(): Store {
  if (typeof window === "undefined") return { trips: [], activeTripId: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { trips: [], activeTripId: null }
    const parsed = JSON.parse(raw) as Store
    if (!parsed || !Array.isArray(parsed.trips)) return { trips: [], activeTripId: null }
    return { trips: parsed.trips, activeTripId: parsed.activeTripId ?? null }
  } catch {
    return { trips: [], activeTripId: null }
  }
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load once on mount.
  useEffect(() => {
    const store = loadStore()
    setTrips(store.trips)
    setActiveTripId(store.activeTripId)
    setHydrated(true)
  }, [])

  // Persist automatically whenever data changes (debounced).
  useEffect(() => {
    if (!hydrated) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, activeTripId }))
      } catch {
        // ignore quota / serialization errors
      }
    }, 150)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [trips, activeTripId, hydrated])

  const upsertTrip = useCallback((trip: Trip) => {
    setTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === trip.id)
      if (idx === -1) return [trip, ...prev]
      const next = [...prev]
      next[idx] = trip
      return next
    })
    setActiveTripId(trip.id)
  }, [])

  const updateTrip = useCallback((id: string, updater: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }, [])

  const deleteTrip = useCallback(
    (id: string) => {
      setTrips((prev) => prev.filter((t) => t.id !== id))
      setActiveTripId((current) => {
        if (current !== id) return current
        return null
      })
    },
    [],
  )

  const toggleItem = useCallback(
    (tripId: string, itemId: string) => {
      updateTrip(tripId, (trip) => ({
        ...trip,
        items: trip.items.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)),
      }))
    },
    [updateTrip],
  )

  const clearPacked = useCallback(
    (tripId: string) => {
      updateTrip(tripId, (trip) => ({
        ...trip,
        items: trip.items.map((i) => ({ ...i, packed: false })),
      }))
    },
    [updateTrip],
  )

  const addItem = useCallback(
    (tripId: string, item: ChecklistItem) => {
      updateTrip(tripId, (trip) => ({ ...trip, items: [...trip.items, item] }))
    },
    [updateTrip],
  )

  const updateItem = useCallback(
    (tripId: string, itemId: string, changes: Partial<ChecklistItem>) => {
      updateTrip(tripId, (trip) => ({
        ...trip,
        items: trip.items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)),
      }))
    },
    [updateTrip],
  )

  const removeItem = useCallback(
    (tripId: string, itemId: string) => {
      updateTrip(tripId, (trip) => ({
        ...trip,
        items: trip.items.filter((i) => i.id !== itemId),
      }))
    },
    [updateTrip],
  )

  const setItemOwner = useCallback(
    (tripId: string, itemId: string, owner: string | undefined, section?: Section) => {
      updateItem(tripId, itemId, section ? { owner, section } : { owner })
    },
    [updateItem],
  )

  return {
    hydrated,
    trips,
    activeTripId,
    setActiveTripId,
    upsertTrip,
    deleteTrip,
    toggleItem,
    clearPacked,
    addItem,
    updateItem,
    removeItem,
    setItemOwner,
  }
}
