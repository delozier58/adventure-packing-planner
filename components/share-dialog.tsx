"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Link2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ShareDialog({
  code,
  tripName,
  onClose,
}: {
  code: string
  tripName: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null)
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/t/${code}`)
    }
  }, [code])

  async function copy(value: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      // clipboard unavailable; user can select manually
    }
  }

  // Close on Escape for accessibility.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share trip"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Link2 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold leading-tight">Share this trip</h2>
              <p className="text-xs text-muted-foreground">Anyone with the link can view and edit</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {'Send this link to anyone packing for '}
          <span className="font-medium text-foreground">{tripName}</span>
          {'. Their changes sync to everyone automatically.'}
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              aria-label="Share link"
              className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button className="h-10 shrink-0 rounded-lg" onClick={() => copy(url, "link")}>
              {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "link" ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Trip code</span>
              <span className="font-mono text-lg font-semibold tracking-widest">{code}</span>
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => copy(code, "code")}>
              {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "code" ? "Copied" : "Copy code"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
