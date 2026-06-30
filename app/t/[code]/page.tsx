import Link from "next/link"
import { Mountain } from "lucide-react"
import { getTrip } from "@/app/actions/trips"
import { SharedTrip } from "@/components/shared-trip"

export default async function TripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const trip = await getTrip(code)

  if (!trip) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Mountain className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Trip not found</h1>
        <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
          This packing list may have been deleted, or the link is incorrect. Check the link and try
          again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Go to planner
        </Link>
      </main>
    )
  }

  return <SharedTrip code={code} initialTrip={trip} />
}
