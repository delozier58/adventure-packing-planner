"use client"

import type { Section } from "@/lib/types"

// A little reward that pops up when you pack an item. Each section gets its own
// themed cartoon sticker + caption so checking things off feels fun.
const SECTION_STICKER: Record<Section, { src: string; captions: string[] }> = {
  Danielle: { src: "/celebrate/hiker.png", captions: ["Packed and proud!", "One less thing!", "Trail-ready!"] },
  Tommy: { src: "/celebrate/hiker.png", captions: ["Packed and proud!", "One less thing!", "Trail-ready!"] },
  Shared: { src: "/celebrate/tent.png", captions: ["Team effort!", "Squad goals!", "Base camp ready!"] },
  Food: { src: "/celebrate/marmot.png", captions: ["Snack secured!", "The marmot approves.", "Fuel locked in!"] },
  "Before Leaving": { src: "/celebrate/boots.png", captions: ["Ready to roll!", "Almost out the door!", "Let's go!"] },
}

export type Celebration = { nonce: number; src: string; caption: string }

// Build a fresh celebration for a section (random caption for variety).
export function celebrationForSection(section: Section): Celebration {
  const entry = SECTION_STICKER[section] ?? { src: "/celebrate/star.png", captions: ["Nice one!"] }
  const caption = entry.captions[Math.floor(Math.random() * entry.captions.length)]
  return { nonce: Date.now(), src: entry.src, caption }
}

export function CheckoffCelebration({
  celebration,
  onDone,
}: {
  celebration: Celebration | null
  onDone: () => void
}) {
  if (!celebration) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      aria-hidden="true"
    >
      <div
        key={celebration.nonce}
        className="flex animate-sticker-pop flex-col items-center gap-2"
        onAnimationEnd={onDone}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={celebration.src || "/placeholder.svg"} alt="" className="size-28 drop-shadow-xl sm:size-32" />
        <span className="rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background shadow-lg">
          {celebration.caption}
        </span>
      </div>
    </div>
  )
}
