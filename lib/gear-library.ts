import type { Activity, ChecklistItem, Person, Season, Trip, WeatherKey } from "./types"

// Category drives which section an item lands in.
// "personal" items are duplicated once per selected person.
export type Category = "personal" | "shared" | "food" | "before-leaving"

export const CATEGORY_LABELS: Record<Category, string> = {
  personal: "Personal (per person)",
  shared: "Shared gear",
  food: "Food",
  "before-leaving": "Before leaving",
}

/** A user-added item that should appear on every future matching list. */
export type CustomDefault = {
  id: string
  name: string
  category: Category
  /** Empty = applies to all trips; otherwise only when one of these activities is selected. */
  activities: Activity[]
  qty: number
  notes?: string
  /** Default owner for shared items. */
  defaultOwner?: Person
}

/** The shared, editable customization layer applied on top of the built-in library. */
export type ListDefaults = {
  /** Built-in gear ids that should be excluded from every new list. */
  hiddenIds: string[]
  /** Extra items to add to every new matching list. */
  customItems: CustomDefault[]
}

export function emptyDefaults(): ListDefaults {
  return { hiddenIds: [], customItems: [] }
}

/** Lightweight view of a built-in item for the defaults editor. */
export type BuiltInGear = {
  id: string
  name: string
  category: Category
  activities?: Activity[]
  seasons?: Season[]
  requiresAnyWeather?: WeatherKey[]
  notes?: string
}

type GearItem = {
  id: string
  name: string
  category: Category
  // Match rules. Omitting activities/seasons means "applies to all".
  // Item is included when ANY selected trip activity is in this list.
  activities?: Activity[]
  seasons?: Season[]
  // Item is only included when at least one of these weather flags is on.
  requiresAnyWeather?: WeatherKey[]
  // Default owner for shared items (when that person is on the trip).
  defaultOwner?: Person
  // Personal item that belongs to one specific person only (not duplicated per person).
  onlyPerson?: Person
  notes?: string
  // Quantity controls.
  qty?: number
  perNight?: boolean // quantity = base qty * nights
  perNightPlusOne?: boolean // quantity = nights + 1 (e.g. underwear/socks)
}

// ---------------------------------------------------------------------------
// Hidden master gear library
// ---------------------------------------------------------------------------
const GEAR: GearItem[] = [
  // ---- Personal: worn / clothing ----
  { id: "p-tshirts", name: "T-shirts", category: "personal", perNightPlusOne: true, notes: "1 per day" },
  { id: "p-sun-shirt", name: "Sun shirt / hoody", category: "personal", qty: 1 },
  { id: "p-shorts", name: "Shorts", category: "personal", qty: 1 },
  { id: "p-pants", name: "Hiking pants", category: "personal", qty: 1 },
  { id: "p-sleep-clothes", name: "Sleep clothes", category: "personal", qty: 1, notes: "Dedicated dry set for the tent" },
  { id: "p-car-outfit", name: "Car / travel outfit", category: "personal", qty: 1, notes: "Clean clothes for the drive home" },
  { id: "p-base-layers", name: "Base layer top + bottom", category: "personal", seasons: ["Shoulder Season", "Winter"] },
  { id: "p-insulation", name: "Insulated jacket", category: "personal", seasons: ["Shoulder Season", "Winter"] },
  { id: "p-puffy", name: "Down puffy", category: "personal", qty: 1 },
  { id: "p-rain-jacket", name: "Waterproof layer (rain shell)", category: "personal", qty: 1 },
  { id: "p-rain-pants", name: "Rain pants", category: "personal", requiresAnyWeather: ["rain"] },
  { id: "p-socks", name: "Hiking socks", category: "personal", perNightPlusOne: true, notes: "1 pair per day" },
  { id: "p-underwear", name: "Underwear", category: "personal", perNightPlusOne: true },
  { id: "p-sports-bras", name: "Sports bras", category: "personal", onlyPerson: "Danielle", perNightPlusOne: true },
  { id: "p-sun-hat", name: "Sun hat", category: "personal", seasons: ["Summer", "Shoulder Season"] },
  { id: "p-warm-hat", name: "Beanie", category: "personal", requiresAnyWeather: ["cold"] },
  { id: "p-gloves", name: "Gloves", category: "personal", seasons: ["Winter"] },
  { id: "p-sunglasses", name: "Sunglasses", category: "personal", qty: 1 },
  { id: "p-buff", name: "Buff / neck gaiter", category: "personal", qty: 1 },

  // ---- Personal: footwear by activity ----
  {
    id: "p-trail-runners",
    name: "Trail runners",
    category: "personal",
    activities: ["Fastpacking", "Backpacking"],
  },
  {
    id: "p-boots",
    name: "Hiking boots",
    category: "personal",
    activities: ["Backpacking", "Hut-to-Hut", "Car Camping"],
  },
  { id: "p-camp-shoes", name: "Camp shoes / sandals", category: "personal", activities: ["Backpacking", "Car Camping", "Kayaking", "Hut-to-Hut"] },
  { id: "p-bike-shoes", name: "Bike shoes", category: "personal", activities: ["Bikepacking"] },
  { id: "p-water-shoes", name: "Water shoes", category: "personal", activities: ["Kayaking"] },

  // ---- Personal: sleep system ----
  {
    id: "p-sleeping-bag",
    name: "Sleeping bag",
    category: "personal",
    activities: ["Backpacking", "Car Camping", "Bikepacking", "Fastpacking", "Kayaking"],
  },
  {
    id: "p-sleeping-pad",
    name: "Sleeping pad",
    category: "personal",
    activities: ["Backpacking", "Car Camping", "Bikepacking", "Fastpacking", "Kayaking"],
  },
  { id: "p-pillow", name: "Camp pillow", category: "personal", activities: ["Backpacking", "Car Camping", "Bikepacking", "Kayaking", "Hut-to-Hut"] },
  { id: "p-hut-liner", name: "Sleeping bag liner", category: "personal", activities: ["Hut-to-Hut"], notes: "Required in most huts" },

  // ---- Personal: pack / carry ----
  { id: "p-backpack", name: "Backpack", category: "personal", activities: ["Backpacking", "Hut-to-Hut", "Fastpacking"] },
  { id: "p-drybag", name: "Personal dry bag", category: "personal", activities: ["Kayaking"] },
  { id: "p-bike-bags", name: "Bikepacking bags", category: "personal", activities: ["Bikepacking"] },
  { id: "p-trekking-poles", name: "Trekking poles", category: "personal", activities: ["Backpacking", "Hut-to-Hut", "Fastpacking"] },
  { id: "p-headlamp", name: "Headlamp", category: "personal", qty: 1 },
  { id: "p-water-bottles", name: "Water bottles / reservoir", category: "personal", qty: 1 },
  { id: "p-toiletries", name: "Personal toiletries kit", category: "personal", qty: 1 },
  { id: "p-glasses-contacts", name: "Glasses & contacts", category: "personal", qty: 1, notes: "Glasses, contacts, lens solution, case" },
  { id: "p-meds", name: "Personal medications", category: "personal", qty: 1 },
  { id: "p-diabetes-tommy", name: "Diabetes supplies", category: "personal", onlyPerson: "Tommy", qty: 1, notes: "Insulin, glucose meter, test strips, snacks, backup pump supplies" },
  { id: "p-bug-headnet", name: "Bug head net", category: "personal", seasons: ["Summer", "Shoulder Season"] },
  { id: "p-passport", name: "Passport", category: "personal", requiresAnyWeather: ["international"] },

  // ---- Personal: city / town crossover ----
  { id: "p-casual-outfit", name: "Casual / town outfit", category: "personal", activities: ["City / town exploring"], qty: 1, notes: "For meals out & walking around town" },
  { id: "p-nicer-outfit", name: "Nicer outfit", category: "personal", activities: ["City / town exploring"], qty: 1, notes: "Dinner / going out" },
  { id: "p-walking-shoes", name: "Casual walking shoes", category: "personal", activities: ["City / town exploring"], qty: 1 },
  { id: "p-day-bag", name: "Day bag / crossbody", category: "personal", activities: ["City / town exploring"], qty: 1, notes: "Compact bag for exploring town" },

  // ---- Shared gear ----
  { id: "s-tent", name: "Tent", category: "shared", defaultOwner: "Tommy", activities: ["Backpacking", "Car Camping", "Bikepacking", "Fastpacking", "Kayaking"] },
  { id: "s-stove", name: "Stove + fuel", category: "shared", defaultOwner: "Tommy", activities: ["Backpacking", "Car Camping", "Bikepacking", "Kayaking", "Hut-to-Hut"] },
  { id: "s-cookset", name: "Cook pot + utensils", category: "shared", defaultOwner: "Danielle", activities: ["Backpacking", "Car Camping", "Bikepacking", "Kayaking"] },
  { id: "s-water-filter", name: "Water filter", category: "shared", defaultOwner: "Danielle", activities: ["Backpacking", "Bikepacking", "Fastpacking", "Kayaking"] },
  { id: "s-firstaid", name: "First aid kit", category: "shared", defaultOwner: "Danielle", qty: 1 },
  { id: "s-repair", name: "Repair kit + duct tape", category: "shared", defaultOwner: "Tommy", qty: 1 },
  { id: "s-bike-repair", name: "Bike tools + spare tube", category: "shared", defaultOwner: "Tommy", activities: ["Bikepacking"] },
  { id: "s-map", name: "Map + compass / GPS", category: "shared", defaultOwner: "Tommy", qty: 1 },
  { id: "s-inreach", name: "Satellite messenger", category: "shared", defaultOwner: "Tommy", activities: ["Backpacking", "Fastpacking", "Bikepacking", "Kayaking"] },
  { id: "s-bear-canister", name: "Bear canister / food bag", category: "shared", defaultOwner: "Danielle", activities: ["Backpacking", "Fastpacking"] },
  { id: "s-powerbank", name: "Power bank + cables", category: "shared", defaultOwner: "Danielle", qty: 1 },
  { id: "s-travel-adapter", name: "Travel power adapter", category: "shared", defaultOwner: "Danielle", requiresAnyWeather: ["international"], qty: 1 },
  { id: "s-walkie-talkie", name: "Walkie talkies", category: "shared", defaultOwner: "Tommy", qty: 2 },
  { id: "s-bug-spray", name: "Bug spray", category: "shared", defaultOwner: "Danielle", seasons: ["Summer", "Shoulder Season"] },
  { id: "s-sunscreen", name: "Sunscreen", category: "shared", defaultOwner: "Danielle", seasons: ["Summer", "Shoulder Season"] },
  { id: "s-tarp", name: "Extra tarp", category: "shared", defaultOwner: "Tommy", requiresAnyWeather: ["rain"] },
  { id: "s-paddles", name: "Paddles + PFDs", category: "shared", defaultOwner: "Tommy", activities: ["Kayaking"] },
  { id: "s-bilge", name: "Bilge pump + sponge", category: "shared", defaultOwner: "Tommy", activities: ["Kayaking"] },

  // ---- Food ----
  { id: "f-breakfast", name: "Breakfasts", category: "food", perNight: true, qty: 1, activities: ["Backpacking", "Car Camping", "Bikepacking", "Fastpacking", "Kayaking", "Hut-to-Hut"] },
  { id: "f-dinner", name: "Dinners", category: "food", perNight: true, qty: 1, activities: ["Backpacking", "Car Camping", "Bikepacking", "Fastpacking", "Kayaking", "Hut-to-Hut"] },
  { id: "f-lunch", name: "Lunches", category: "food", perNightPlusOne: true },
  { id: "f-snacks", name: "Trail snacks (bags)", category: "food", perNightPlusOne: true, notes: "~1 bag per person per day" },
  { id: "f-coffee", name: "Coffee / tea", category: "food", qty: 1 },
  { id: "f-electrolytes", name: "Electrolyte mix", category: "food", qty: 1 },
  { id: "f-emergency", name: "Emergency day of food", category: "food", qty: 1, activities: ["Backpacking", "Fastpacking", "Bikepacking", "Kayaking"] },

  // ---- Before leaving ----
  { id: "b-charge", name: "Charge all electronics", category: "before-leaving", qty: 1 },
  { id: "b-weather", name: "Check forecast + conditions", category: "before-leaving", qty: 1 },
  { id: "b-permit", name: "Confirm permits / reservations", category: "before-leaving", qty: 1, activities: ["Backpacking", "Hut-to-Hut", "Car Camping"] },
  { id: "b-itinerary", name: "Share itinerary with contact", category: "before-leaving", qty: 1 },
  { id: "b-fuel-up", name: "Fuel up vehicle", category: "before-leaving", qty: 1, activities: ["Car Camping", "Backpacking", "Bikepacking", "Fastpacking", "Kayaking"] },
  { id: "b-trash", name: "Empty fridge / trash", category: "before-leaving", qty: 1 },
  { id: "b-docs", name: "Pack passports + travel docs", category: "before-leaving", qty: 1, requiresAnyWeather: ["international"] },
  { id: "b-currency", name: "Get local currency / cards", category: "before-leaving", qty: 1, requiresAnyWeather: ["international"] },
  { id: "b-lodging", name: "Confirm lodging / hotel bookings", category: "before-leaving", qty: 1, activities: ["City / town exploring"] },
  { id: "b-offline-maps", name: "Download offline maps & transit apps", category: "before-leaving", qty: 1, activities: ["City / town exploring"] },
  { id: "b-shuttle", name: "Arrange shuttle / put-in logistics", category: "before-leaving", qty: 1, activities: ["Kayaking", "Backpacking"] },
]

/** Built-in items exposed for the defaults editor (metadata only). */
export function listBuiltInGear(): BuiltInGear[] {
  return GEAR.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    activities: g.activities,
    seasons: g.seasons,
    requiresAnyWeather: g.requiresAnyWeather,
    notes: g.notes,
  }))
}

function matches(item: GearItem, trip: Pick<Trip, "activities" | "season" | "weather">): boolean {
  if (item.activities && !item.activities.some((a) => trip.activities.includes(a))) return false
  if (item.seasons && !item.seasons.includes(trip.season)) return false
  if (item.requiresAnyWeather) {
    const ok = item.requiresAnyWeather.some((w) => trip.weather[w])
    if (!ok) return false
  }
  return true
}

function computeQuantity(item: GearItem, nights: number): string {
  const safeNights = Math.max(0, nights)
  if (item.perNight) return String(Math.max(1, (item.qty ?? 1) * Math.max(1, safeNights)))
  if (item.perNightPlusOne) return String(safeNights + 1)
  return String(item.qty ?? 1)
}

let counter = 0
function newId(): string {
  counter += 1
  return `item-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateChecklist(
  trip: Pick<Trip, "activities" | "season" | "nights" | "people" | "weather">,
  defaults?: ListDefaults,
): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const people = trip.people.length > 0 ? trip.people : []

  const hidden = new Set(defaults?.hiddenIds ?? [])
  // Built-in items that haven't been turned off, plus any custom recurring items.
  const customAsGear: GearItem[] = (defaults?.customItems ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    activities: c.activities.length > 0 ? c.activities : undefined,
    defaultOwner: c.defaultOwner,
    notes: c.notes,
    qty: c.qty,
  }))
  const activeGear = [...GEAR.filter((g) => !hidden.has(g.id)), ...customAsGear]

  for (const gear of activeGear) {
    if (!matches(gear, trip)) continue
    const quantity = computeQuantity(gear, trip.nights)

    if (gear.category === "personal") {
      // One item per selected person, placed in that person's section.
      // If onlyPerson is set, the item belongs to that one person only.
      const targets = gear.onlyPerson
        ? people.filter((p) => p === gear.onlyPerson)
        : people
      for (const person of targets) {
        items.push({
          id: newId(),
          name: gear.name,
          quantity,
          section: person,
          owner: person,
          notes: gear.notes,
          packed: false,
        })
      }
    } else if (gear.category === "shared") {
      const owner = gear.defaultOwner && people.includes(gear.defaultOwner) ? gear.defaultOwner : undefined
      items.push({
        id: newId(),
        name: gear.name,
        quantity,
        section: "Shared",
        owner,
        notes: gear.notes,
        packed: false,
      })
    } else if (gear.category === "food") {
      // Each person brings their own meals & snacks, so duplicate per person
      // and attribute ownership, while keeping everything grouped in Food.
      for (const person of people) {
        items.push({
          id: newId(),
          name: gear.name,
          quantity,
          section: "Food",
          owner: person,
          notes: gear.notes,
          packed: false,
        })
      }
    } else {
      items.push({
        id: newId(),
        name: gear.name,
        quantity,
        section: "Before Leaving",
        notes: gear.notes,
        packed: false,
      })
    }
  }

  return items
}

export { newId }
