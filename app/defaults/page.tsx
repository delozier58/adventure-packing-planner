import { Mountain } from "lucide-react"
import { DefaultsEditor } from "@/components/defaults-editor"

export default function DefaultsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10">
      <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="size-4" aria-hidden="true" />
          </span>
          <h1 className="text-base font-semibold leading-none">Adventure Packing Planner</h1>
        </div>
      </div>

      <div className="py-4">
        <DefaultsEditor />
      </div>
    </main>
  )
}
