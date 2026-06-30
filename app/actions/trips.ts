"use server"

import { customAlphabet } from "nanoid"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { sharedTrips } from "@/lib/db/schema"
import { tripActivities, type Activity, type Trip, type TripSummary } from "@/lib/types"

// Unambiguous alphabet (no 0/O/1/I/l) for human-friendly share codes.
const makeCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 7)

function summarize(code: string, data: Trip, updatedAt: Date): TripSummary {
  const items = data.items ?? []
  return {
    code,
    name: data.name,
    activities: tripActivities(data) as Activity[],
    season: data.season,
    nights: data.nights,
    packed: items.filter((i) => i.packed).length,
    total: items.length,
    updatedAt: updatedAt.getTime(),
  }
}

/** Create a new shared trip and return its share code. */
export async function createTrip(trip: Trip): Promise<{ code: string }> {
  let code = makeCode()
  // Extremely unlikely collision; retry a few times to be safe.
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db
      .select({ code: sharedTrips.code })
      .from(sharedTrips)
      .where(eq(sharedTrips.code, code))
      .limit(1)
    if (existing.length === 0) break
    code = makeCode()
  }

  const now = Date.now()
  const data: Trip = { ...trip, code, updatedAt: now }
  await db.insert(sharedTrips).values({ code, data })
  return { code }
}

/** Fetch a single shared trip by its code. */
export async function getTrip(code: string): Promise<Trip | null> {
  const rows = await db
    .select()
    .from(sharedTrips)
    .where(eq(sharedTrips.code, code))
    .limit(1)
  if (rows.length === 0) return null
  const row = rows[0]
  return { ...row.data, code: row.code, updatedAt: row.updatedAt.getTime() }
}

/** Overwrite a shared trip's data. Returns the new server timestamp. */
export async function saveTrip(code: string, trip: Trip): Promise<{ updatedAt: number } | null> {
  const now = new Date()
  const data: Trip = { ...trip, code, updatedAt: now.getTime() }
  const updated = await db
    .update(sharedTrips)
    .set({ data, updatedAt: now })
    .where(eq(sharedTrips.code, code))
    .returning({ code: sharedTrips.code })
  if (updated.length === 0) return null
  return { updatedAt: now.getTime() }
}

/** Delete a shared trip. */
export async function deleteTrip(code: string): Promise<void> {
  await db.delete(sharedTrips).where(eq(sharedTrips.code, code))
}

/** Fetch lightweight summaries for a set of codes (for the home screen list). */
export async function getTripSummaries(codes: string[]): Promise<TripSummary[]> {
  if (codes.length === 0) return []
  const rows = await db
    .select()
    .from(sharedTrips)
    .where(inArray(sharedTrips.code, codes))
  return rows.map((row) => summarize(row.code, row.data, row.updatedAt))
}
