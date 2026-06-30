export const TRIP_TYPES = [
  "Backpacking",
  "Kayaking",
  "Hut-to-Hut",
  "Car Camping",
  "Bikepacking",
  "Fastpacking",
  "Day Hike",
] as const

export type TripType = (typeof TRIP_TYPES)[number]

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
  name: string
  type: TripType
  season: Season
  nights: number
  people: Person[]
  weather: Weather
  items: ChecklistItem[]
  createdAt: number
}

export function emptyWeather(): Weather {
  return { rain: false, cold: false, buggy: false, international: false }
}
