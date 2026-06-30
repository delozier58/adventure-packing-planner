"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getTrip, saveTrip } from "@/app/actions/trips"
import type { ChecklistItem, Section, Trip } from "./types"

type SyncStatus = "synced" | "saving" | "error"

const POLL_MS = 5000
const DEBOUNCE_MS = 600

export function useSharedTrip(code: string, initialTrip: Trip) {
  const [trip, setTrip] = useState<Trip>(initialTrip)
  const [status, setStatus] = useState<SyncStatus>("synced")

  // Refs let the polling interval and debounced saver read the latest values
  // without re-subscribing on every keystroke.
  const tripRef = useRef<Trip>(initialTrip)
  const dirtyRef = useRef(false)
  const appliedServerUpdatedAtRef = useRef<number>(initialTrip.updatedAt ?? 0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  tripRef.current = trip

  const flush = useCallback(async () => {
    const current = tripRef.current
    dirtyRef.current = false
    setStatus("saving")
    try {
      const res = await saveTrip(code, current)
      if (res) {
        appliedServerUpdatedAtRef.current = res.updatedAt
        // Only mark synced if nothing changed while the save was in flight.
        setStatus(dirtyRef.current ? "saving" : "synced")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }, [code])

  const scheduleSave = useCallback(
    (next: Trip) => {
      tripRef.current = next
      dirtyRef.current = true
      setStatus("saving")
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(flush, DEBOUNCE_MS)
    },
    [flush],
  )

  // Apply a local change optimistically and queue a save.
  const mutate = useCallback(
    (updater: (t: Trip) => Trip) => {
      setTrip((prev) => {
        const next = updater(prev)
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  // Poll the server so collaborators' changes show up. We only adopt remote
  // data when we have no unsaved local edits and the server copy is newer.
  useEffect(() => {
    let cancelled = false
    const id = setInterval(async () => {
      if (dirtyRef.current) return
      try {
        const remote = await getTrip(code)
        if (cancelled || !remote) return
        const remoteUpdated = remote.updatedAt ?? 0
        if (!dirtyRef.current && remoteUpdated > appliedServerUpdatedAtRef.current) {
          appliedServerUpdatedAtRef.current = remoteUpdated
          tripRef.current = remote
          setTrip(remote)
        }
      } catch {
        // network blip; try again next tick
      }
    }, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [code])

  // Persist any pending edit if the user navigates away / closes the tab.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (dirtyRef.current) void saveTrip(code, tripRef.current)
    }
  }, [code])

  const toggleItem = useCallback(
    (itemId: string) =>
      mutate((t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)),
      })),
    [mutate],
  )

  const clearPacked = useCallback(
    () => mutate((t) => ({ ...t, items: t.items.map((i) => ({ ...i, packed: false })) })),
    [mutate],
  )

  const addItem = useCallback(
    (item: ChecklistItem) => mutate((t) => ({ ...t, items: [...t.items, item] })),
    [mutate],
  )

  const removeItem = useCallback(
    (itemId: string) => mutate((t) => ({ ...t, items: t.items.filter((i) => i.id !== itemId) })),
    [mutate],
  )

  const setItemOwner = useCallback(
    (itemId: string, owner: string | undefined, section?: Section) =>
      mutate((t) => ({
        ...t,
        items: t.items.map((i) =>
          i.id === itemId ? { ...i, owner, ...(section ? { section } : {}) } : i,
        ),
      })),
    [mutate],
  )

  return {
    trip,
    status,
    toggleItem,
    clearPacked,
    addItem,
    removeItem,
    setItemOwner,
  }
}
