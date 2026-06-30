"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Cloud,
  CloudOff,
  CopyPlus,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { newId } from "@/lib/gear-library"
import { PEOPLE, SECTIONS, tripActivities, type ChecklistItem, type Person, type Section, type Trip } from "@/lib/types"

type Props = {
  trip: Trip
  onToggleItem: (itemId: string) => void
  onAddItem: (item: ChecklistItem) => void
  onRemoveItem: (itemId: string) => void
  onSetOwner: (itemId: string, owner: string | undefined, section: Section) => void
  onClearPacked: () => void
  onDuplicate: () => void
  onDelete: () => void
  onNewTrip: () => void
  syncStatus?: "synced" | "saving" | "error"
  onShare?: () => void
}

const SECTION_HINT: Record<Section, string> = {
  Danielle: "Personal gear",
  Tommy: "Personal gear",
  Shared: "Carried between you",
  Food: "Meals & snacks",
  "Before Leaving": "Last-minute tasks",
}

type Focus = "Everyone" | Person

const FOCUS_STORAGE_KEY = "adventure-packing:focus"

export function ChecklistView({
  trip,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onSetOwner,
  onClearPacked,
  onDuplicate,
  onDelete,
  onNewTrip,
  syncStatus,
  onShare,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Per-device focus: "Everyone" or a specific person. Remembered across trips
  // so Tommy lands on his list and Danielle on hers.
  const [focus, setFocus] = useState<Focus>("Everyone")
  useEffect(() => {
    const saved = localStorage.getItem(FOCUS_STORAGE_KEY)
    if (saved) setFocus(saved as Focus)
  }, [])
  const updateFocus = (next: Focus) => {
    setFocus(next)
    localStorage.setItem(FOCUS_STORAGE_KEY, next)
  }

  const grouped = useMemo(() => {
    const map: Record<Section, ChecklistItem[]> = {
      Danielle: [],
      Tommy: [],
      Shared: [],
      Food: [],
      "Before Leaving": [],
    }
    for (const item of trip.items) map[item.section].push(item)
    return map
  }, [trip.items])

  // People actually on this trip, in case the saved focus is someone who isn't.
  const activeFocus: Focus =
    focus !== "Everyone" && !trip.people.includes(focus) ? "Everyone" : focus

  // When focused on a person, hide the OTHER person's personal section but keep
  // communal sections (Shared, Food, Before Leaving) visible.
  const isPersonSection = (s: Section) => (PEOPLE as readonly string[]).includes(s)
  const visibleSections = SECTIONS.filter((s) => {
    if (grouped[s].length === 0) return false
    if (activeFocus === "Everyone") return true
    if (isPersonSection(s)) return s === activeFocus
    return true
  })

  // Progress reflects what's currently visible so the count matches the view.
  const visibleItems = visibleSections.flatMap((s) => grouped[s])
  const total = visibleItems.length
  const packed = visibleItems.filter((i) => i.packed).length
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100)

  // Only show the filter when more than one person is on the trip.
  const showFilter = trip.people.length > 1

  return (
    <div className="flex flex-col gap-5">
      {/* Trip header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-balance text-xl font-semibold leading-tight">{trip.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{tripActivities(trip).join(", ")}</span>
              <Dot />
              <span>{trip.season}</span>
              <Dot />
              <span>
                {trip.nights} {trip.nights === 1 ? "night" : "nights"}
              </span>
              {trip.people.length > 0 ? (
                <>
                  <Dot />
                  <span>{trip.people.join(" & ")}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onShare ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-lg"
                onClick={onShare}
              >
                <Share2 className="size-4" />
                Share
              </Button>
            ) : null}
            <div className="relative">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Trip actions"
              aria-expanded={menuOpen}
              className="size-10 rounded-lg"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreVertical className="size-4" />
            </Button>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                  {onShare ? (
                    <MenuItem
                      icon={<Share2 className="size-4" />}
                      label="Share trip"
                      onClick={() => {
                        setMenuOpen(false)
                        onShare()
                      }}
                    />
                  ) : null}
                  <MenuItem
                    icon={<Plus className="size-4" />}
                    label="Start new trip"
                    onClick={() => {
                      setMenuOpen(false)
                      onNewTrip()
                    }}
                  />
                  <MenuItem
                    icon={<CopyPlus className="size-4" />}
                    label="Duplicate trip"
                    onClick={() => {
                      setMenuOpen(false)
                      onDuplicate()
                    }}
                  />
                  <MenuItem
                    icon={<RotateCcw className="size-4" />}
                    label="Clear packed status"
                    onClick={() => {
                      setMenuOpen(false)
                      onClearPacked()
                    }}
                  />
                  <MenuItem
                    icon={<Trash2 className="size-4" />}
                    label="Delete trip"
                    destructive
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  />
                </div>
              </>
            ) : null}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {packed} of {total} packed
            </span>
            <div className="flex items-center gap-3">
              {syncStatus ? <SyncBadge status={syncStatus} /> : null}
              <span className="tabular-nums text-muted-foreground">{pct}%</span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </header>

      {/* Person focus filter */}
      {showFilter ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Show items for</span>
          <div className="flex flex-wrap gap-2">
            <FocusChip label="Everyone" active={activeFocus === "Everyone"} onClick={() => updateFocus("Everyone")} />
            {trip.people.map((person) => (
              <FocusChip
                key={person}
                label={person}
                active={activeFocus === person}
                onClick={() => updateFocus(person)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Sections */}
      {visibleSections.map((section) => (
        <ChecklistSection
          key={section}
          section={section}
          hint={SECTION_HINT[section]}
          items={grouped[section]}
          onToggleItem={onToggleItem}
          onRemoveItem={onRemoveItem}
          onSetOwner={onSetOwner}
          onAddItem={onAddItem}
        />
      ))}
    </div>
  )
}

function FocusChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      }
    >
      {label}
    </button>
  )
}

function SyncBadge({ status }: { status: "synced" | "saving" | "error" }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Saving
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOff className="size-3.5" aria-hidden="true" />
        Offline
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Cloud className="size-3.5" aria-hidden="true" />
      Synced
    </span>
  )
}

function ChecklistSection({
  section,
  hint,
  items,
  onToggleItem,
  onRemoveItem,
  onSetOwner,
  onAddItem,
}: {
  section: Section
  hint: string
  items: ChecklistItem[]
  onToggleItem: (id: string) => void
  onRemoveItem: (id: string) => void
  onSetOwner: (id: string, owner: string | undefined, section: Section) => void
  onAddItem: (item: ChecklistItem) => void
}) {
  const [adding, setAdding] = useState(false)
  const packed = items.filter((i) => i.packed).length
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-base font-semibold leading-tight">{section}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {packed}/{items.length}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(item.id)}
            onRemove={() => onRemoveItem(item.id)}
            onSetOwner={(owner, sec) => onSetOwner(item.id, owner, sec)}
          />
        ))}
      </ul>
      {adding ? (
        <div className="border-t border-border p-3">
          <AddItemForm
            defaultSection={section}
            onCancel={() => setAdding(false)}
            onAdd={(item) => {
              onAddItem(item)
              setAdding(false)
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" />
          Add item
        </button>
      )}
    </section>
  )
}

function ItemRow({
  item,
  onToggle,
  onRemove,
  onSetOwner,
}: {
  item: ChecklistItem
  onToggle: () => void
  onRemove: () => void
  onSetOwner: (owner: string | undefined, section: Section) => void
}) {
  const [editingOwner, setEditingOwner] = useState(false)
  const isPersonSection = item.section === "Danielle" || item.section === "Tommy"

  function chooseOwner(owner: string | undefined) {
    // For personal sections, moving the owner moves the item to that person's list.
    if (isPersonSection && (owner === "Danielle" || owner === "Tommy")) {
      onSetOwner(owner, owner)
    } else {
      onSetOwner(owner, item.section)
    }
    setEditingOwner(false)
  }

  return (
    <li className="group flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.packed}
        aria-label={`Mark ${item.name} as ${item.packed ? "not packed" : "packed"}`}
        onClick={onToggle}
        className={[
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
          item.packed ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary",
        ].join(" ")}
      >
        {item.packed ? <Check className="size-4" /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={["text-sm font-medium", item.packed ? "text-muted-foreground line-through" : ""].join(" ")}>
            {item.name}
          </span>
          {item.quantity && item.quantity !== "1" ? (
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground tabular-nums">
              ×{item.quantity}
            </span>
          ) : null}
        </div>

        {item.notes ? <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p> : null}

        {/* Owner control — only for communal sections; personal items belong to their section's person */}
        {isPersonSection ? null : editingOwner ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {PEOPLE.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => chooseOwner(p)}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  item.owner === p ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => chooseOwner(undefined)}
              className={[
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                !item.owner ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted",
              ].join(" ")}
            >
              Unassigned
            </button>
            <button
              type="button"
              onClick={() => setEditingOwner(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close owner editor"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingOwner(true)}
            className="mt-1 inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3" />
            {item.owner ? `Owner: ${item.owner}` : "Assign owner"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
        className="mt-0.5 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

function AddItemForm({
  onAdd,
  onCancel,
  defaultSection = "Shared",
}: {
  onAdd: (item: ChecklistItem) => void
  onCancel: () => void
  defaultSection?: Section
}) {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [section, setSection] = useState<Section>(defaultSection)
  const [owner, setOwner] = useState<string>("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const isPersonSection = section === "Danielle" || section === "Tommy"
    onAdd({
      id: newId(),
      name: name.trim(),
      quantity: quantity.trim() || "1",
      section,
      owner: isPersonSection ? section : owner || undefined,
      packed: false,
      custom: true,
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
          aria-label="Quantity"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value as Section)}
          aria-label="Section"
          className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {section === "Shared" ? (
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          aria-label="Owner"
          className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <option value="">Unassigned</option>
          {PEOPLE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-11 flex-1 rounded-lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="h-11 flex-1 rounded-lg">
          Add item
        </Button>
      </div>
    </form>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        destructive ? "text-destructive hover:bg-destructive/10" : "hover:bg-muted",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  )
}

function Dot() {
  return <span className="text-muted-foreground/40">·</span>
}
