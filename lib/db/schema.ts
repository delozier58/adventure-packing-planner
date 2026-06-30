import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import type { Trip } from "@/lib/types"

export const sharedTrips = pgTable("shared_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  data: jsonb("data").$type<Trip>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
