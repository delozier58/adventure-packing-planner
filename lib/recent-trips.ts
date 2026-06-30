"use client"

// We only persist the list of share codes this device knows about. The trip
// data itself lives in the database, keyed by code, so any device with the
// code (or the share link) sees the same live list.

const KEY = "adventure-packing-planner:codes:v1"
const MAX = 50

export function getRecentCodes(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : []
  } catch {
    return []
  }
}

export function rememberCode(code: string) {
  if (typeof window === "undefined") return
  const next = [code, ...getRecentCodes().filter((c) => c !== code)].slice(0, MAX)
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore quota errors
  }
}

export function forgetCode(code: string) {
  if (typeof window === "undefined") return
  const next = getRecentCodes().filter((c) => c !== code)
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
