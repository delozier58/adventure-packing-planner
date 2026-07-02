"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDefaults, saveDefaults } from "@/app/actions/defaults"
import {
  CATEGORY_LABELS,
  emptyDefaults,
  listBuiltInGear,
  newId,
  type BuiltInGear,
  type Category,
  type CustomDefault,
  type ListDefaults,
} from "@/lib/gear-library"
import { ACTIVITIES, PEOPLE, WEATHER_LABELS, type Activity, type Person } from "@/lib/types"

const CATEGORY_ORDER: Category[] = ["personal", "shared", "food", "before-leaving"]

function applicability(item: BuiltInGear): string {
  const parts: string[] = []
  if (item.activities?.length) parts.push(item.activities.join(", "))
  if (item.seasons?.length) parts.push(item.seasons.join(", "))
  if (item.requiresAnyWeather?.length) parts.push(item.requiresAnyWeather.map((w) => WEATHER_LABELS[w]).join(", "))
  return parts.length > 0 ? parts.join(" · ") : "Every trip"
}

export function DefaultsEditor() {
  const builtIns = useMemo(() => listBuiltInGear(), [])
  const [defaults, setDefaults] = useState<ListDefaults>(emptyDefaults())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    getDefaults()
      .then((d) => {
        if (active) setDefaults(d)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const hidden = new Set(defaults.hiddenIds)

  function toggleHidden(id: string) {
    setSaved(false)
    setDefaults((prev) => {
      const set = new Set(prev.hiddenIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...prev, hiddenIds: [...set] }
    })
  }

  function addCustom(item: CustomDefault) {
    setSaved(false)
    setDefaults((prev) => ({ ...prev, customItems: [...prev.customItems, item] }))
  }

  function removeCustom(id: string) {
    setSaved(false)
    setDefaults((prev) => ({ ...prev, customItems: prev.customItems.filter((c) => c.id !== id) }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveDefaults(defaults)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: builtIns.filter((b) => b.category === cat),
    custom: defaults.customItems.filter((c) => c.category === cat),
  }))

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to trips
        </Link>
        <h2 className="mt-3 text-balance text-xl font-semibold leading-tight">Customize your defaults</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn off items you never pack or add your own. Changes apply to every new list you create — existing trips are
          untouched.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading defaults…
        </div>
      ) : (
        grouped.map(({ category, items, custom }) => (
          <section key={category} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-base font-semibold leading-tight">{CATEGORY_LABELS[category]}</h3>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const isHidden = hidden.has(item.id)
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className={["text-sm font-medium", isHidden ? "text-muted-foreground line-through" : ""].join(" ")}>
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{applicability(item)}</p>
                    </div>
                    <Toggle on={!isHidden} onClick={() => toggleHidden(item.id)} label={`Include ${item.name}`} />
                  </li>
                )
              })}
              {custom.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 bg-secondary/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {item.name}
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Custom
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.activities.length > 0 ? item.activities.join(", ") : "Every trip"}
                      {item.defaultOwner ? ` · ${item.defaultOwner}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustom(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <AddCustomRow category={category} onAdd={addCustom} />
          </section>
        ))
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="flex-1 text-xs text-muted-foreground">
            {defaults.hiddenIds.length} hidden · {defaults.customItems.length} added
          </p>
          <Button onClick={handleSave} disabled={saving} className="h-11 rounded-lg">
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : saved ? <Check className="size-4" aria-hidden="true" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save defaults"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={[
        "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
        on ? "bg-primary" : "bg-muted-foreground/30",
      ].join(" ")}
    >
      <span
        className={["size-5 rounded-full bg-card shadow-sm transition-transform", on ? "translate-x-5" : "translate-x-0"].join(" ")}
      />
    </button>
  )
}

function AddCustomRow({ category, onAdd }: { category: Category; onAdd: (item: CustomDefault) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [activities, setActivities] = useState<Activity[]>([])
  const [owner, setOwner] = useState<Person | "">("")
  const [notes, setNotes] = useState("")

  function toggleActivity(a: Activity) {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  function reset() {
    setName("")
    setActivities([])
    setOwner("")
    setNotes("")
    setOpen(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({
      id: newId(),
      name: trimmed,
      category,
      activities,
      qty: 1,
      notes: notes.trim() || undefined,
      defaultOwner: category === "shared" && owner ? (owner as Person) : undefined,
    })
    reset()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" />
        Add item to {CATEGORY_LABELS[category].toLowerCase()}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-border p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        aria-label="Item name"
        autoFocus
        className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Only for these activities (leave empty for every trip)</p>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map((a) => {
            const active = activities.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleActivity(a)}
                aria-pressed={active}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted",
                ].join(" ")}
              >
                {a}
              </button>
            )
          })}
        </div>
      </div>

      {category === "shared" ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Default owner (optional)</p>
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE.map((p) => {
              const active = owner === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOwner(active ? "" : p)}
                  aria-pressed={active}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        aria-label="Notes"
        className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={reset} className="h-10 flex-1 rounded-lg">
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()} className="h-10 flex-1 rounded-lg">
          Add item
        </Button>
      </div>
    </form>
  )
}
