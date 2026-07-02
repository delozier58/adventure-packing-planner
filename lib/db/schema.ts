import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import type { Trip } from "@/lib/types"
import type { ListDefaults } from "@/lib/gear-library"

export const sharedTrips = pgTable("shared_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  data: jsonb("data").$type<Trip>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Single shared row holding the customizations applied to every newly
 * generated packing list: built-in items that have been turned off, plus
 * user-added recurring items. Keyed by a fixed id so there is always one row.
 */
export const listDefaults = pgTable("list_defaults", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<ListDefaults>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
