"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mountain } from "lucide-react"
import { ChecklistView } from "@/components/checklist-view"
import { ShareDialog } from "@/components/share-dialog"
import { createTrip, deleteTrip } from "@/app/actions/trips"
import { forgetCode, rememberCode } from "@/lib/recent-trips"
import { newId } from "@/lib/gear-library"
import { useSharedTrip } from "@/lib/use-shared-trip"
import type { Trip } from "@/lib/types"

export function SharedTrip({ code, initialTrip }: { code: string; initialTrip: Trip }) {
  const router = useRouter()
  const [sharing, setSharing] = useState(false)
  const { trip, status, toggleItem, clearPacked, addItem, removeItem, setItemOwner } =
    useSharedTrip(code, initialTrip)

  // Visiting a link adds the trip to this device's recent list.
  useEffect(() => {
    rememberCode(code)
  }, [code])

  async function handleDuplicate() {
    const copy: Trip = {
      ...trip,
      id: newId(),
      name: `${trip.name} (copy)`,
      createdAt: Date.now(),
      items: trip.items.map((i) => ({ ...i, id: newId(), packed: false })),
    }
    const { code: newCode } = await createTrip(copy)
    rememberCode(newCode)
    router.push(`/t/${newCode}`)
  }

  async function handleDelete() {
    await deleteTrip(code)
    forgetCode(code)
    router.push("/")
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10">
      <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="size-4" aria-hidden="true" />
          </span>
          <h1 className="text-base font-semibold leading-none">Adventure Packing Planner</h1>
        </Link>
      </div>

      <div className="py-2">
        <ChecklistView
          trip={trip}
          syncStatus={status}
          onShare={() => setSharing(true)}
          onToggleItem={toggleItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSetOwner={setItemOwner}
          onClearPacked={clearPacked}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onNewTrip={() => router.push("/")}
        />
      </div>

      {sharing ? (
        <ShareDialog code={code} tripName={trip.name} onClose={() => setSharing(false)} />
      ) : null}
    </main>
  )
}
