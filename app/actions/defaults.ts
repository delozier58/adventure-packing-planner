"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { listDefaults } from "@/lib/db/schema"
import { emptyDefaults, type ListDefaults } from "@/lib/gear-library"

// There is a single shared row of defaults for the whole app.
const DEFAULTS_ID = "shared"

/** Fetch the shared list defaults (customizations applied to every new trip). */
export async function getDefaults(): Promise<ListDefaults> {
  const rows = await db
    .select()
    .from(listDefaults)
    .where(eq(listDefaults.id, DEFAULTS_ID))
    .limit(1)
  if (rows.length === 0) return emptyDefaults()
  const data = rows[0].data
  return {
    hiddenIds: data.hiddenIds ?? [],
    customItems: data.customItems ?? [],
  }
}

/** Overwrite the shared list defaults. */
export async function saveDefaults(data: ListDefaults): Promise<{ ok: true }> {
  const clean: ListDefaults = {
    hiddenIds: data.hiddenIds ?? [],
    customItems: data.customItems ?? [],
  }
  await db
    .insert(listDefaults)
    .values({ id: DEFAULTS_ID, data: clean, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: listDefaults.id,
      set: { data: clean, updatedAt: new Date() },
    })
  return { ok: true }
}
