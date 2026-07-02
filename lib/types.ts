export const ACTIVITIES = [
  "Backpacking",
  "Kayaking",
  "Hut-to-Hut",
  "Car Camping",
  "Bikepacking",
  "Fastpacking",
  "City / town exploring",
] as const

export type Activity = (typeof ACTIVITIES)[number]

export const SEASONS = ["Summer", "Shoulder Season", "Winter"] as const
export type Season = (typeof SEASONS)[number]

export const PEOPLE = ["Danielle", "Tommy"] as const
export type Person = (typeof PEOPLE)[number]

export const WEATHER_KEYS = ["rain", "cold", "buggy", "international"] as const
export type WeatherKey = (typeof WEATHER_KEYS)[number]

export const WEATHER_LABELS: Record<WeatherKey, string> = {
  rain: "Rain expected",
  cold: "Cold nights",
  buggy: "Buggy",
  international: "International travel",
}

export type Weather = Record<WeatherKey, boolean>

export const SECTIONS = ["Danielle", "Tommy", "Shared", "Food", "Before Leaving"] as const
export type Section = (typeof SECTIONS)[number]

export type ChecklistItem = {
  id: string
  name: string
  quantity: string
  section: Section
  owner?: string
  notes?: string
  packed: boolean
  custom?: boolean
}

export type Trip = {
  id: string
  /** Short shareable code; also the DB key. */
  code?: string
  name: string
  activities: Activity[]
  season: Season
  nights: number
  people: Person[]
  weather: Weather
  /** Optional destinations used for the weather lookup. */
  destinations?: string[]
  /** Trip start/end dates (ISO yyyy-mm-dd) when set. */
  startDate?: string
  endDate?: string
  /** Short human-readable summary from the last weather lookup. */
  weatherNote?: string
  items: ChecklistItem[]
  createdAt: number
  /** Last server-write timestamp (ms), used for sync conflict resolution. */
  updatedAt?: number
  /** @deprecated Legacy single trip type kept for old saved trips. */
  type?: string
}

export type TripSummary = {
  code: string
  name: string
  activities: Activity[]
  season: Season
  nights: number
  packed: number
  total: number
  updatedAt: number
}

export function emptyWeather(): Weather {
  return { rain: false, cold: false, buggy: false, international: false }
}

/**
 * Returns the activities for a trip, falling back to the legacy single `type`
 * field for trips created before activities were multi-select.
 */
export function tripActivities(trip: { activities?: Activity[]; type?: string }): string[] {
  if (trip.activities && trip.activities.length > 0) return trip.activities
  if (trip.type) return [trip.type]
  return []
}
