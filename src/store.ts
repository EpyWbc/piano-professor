import { useSyncExternalStore } from 'react'

// All progress lives in one localStorage key. Bump `version` + add a step in migrate() if the shape changes.
export type Progress = {
  version: 1
  checked: Record<string, true>     // level item ids she has ticked
  canPlay: Record<string, string>   // songId → local date she marked "I can play this"
  log: Record<string, number>       // local 'YYYY-MM-DD' → minutes practiced
  settings: { keyboardId: string; name?: string; bpm: number } // name: undefined = never asked, '' = skipped
}

export const STORAGE_KEY = 'pp:v1'
export const BACKUP_KEY = 'pp:v1:backup'
const APP_NAME = 'Piano Professor'
const CURRENT_VERSION = 1

export const emptyProgress = (): Progress => ({
  version: 1,
  checked: {},
  canPlay: {},
  log: {},
  settings: { keyboardId: 'jikada-61', bpm: 80 },
})

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrate(JSON.parse(raw)) : emptyProgress()
  } catch {
    return emptyProgress() // no localStorage (tests) or corrupt JSON
  }
}

let state = load()
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => (listeners.add(cb), () => listeners.delete(cb))

export const getProgress = () => state

export function setProgress(next: Progress | ((p: Progress) => Progress)) {
  state = typeof next === 'function' ? next(state) : next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Progress not saved (storage full or blocked)', e) // in-memory state still works this session
  }
  listeners.forEach((l) => l())
}

/** React hook: re-renders when progress changes. */
export const useProgress = () => useSyncExternalStore(subscribe, getProgress)

/** Local calendar date as 'YYYY-MM-DD'. Not toISOString(): that's UTC and flips to "tomorrow" in the evening. */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ---- Minutes ----

export function addMinutes(minutes: number, date = localDate()) {
  if (!Number.isFinite(minutes) || minutes <= 0) return
  setProgress((p) => ({ ...p, log: { ...p.log, [date]: (p.log[date] ?? 0) + minutes } }))
}

export const minutesOn = (p: Progress, date: string) => p.log[date] ?? 0
export const totalMinutes = (p: Progress) => Object.values(p.log).reduce((a, b) => a + b, 0)

/**
 * How many days in a row she has practiced, counting back from `today` (both 'YYYY-MM-DD' local dates).
 *
 * Two design choices for you to make:
 *  1. Today with no practice *yet*: if she practiced yesterday and the day before, but hasn't opened the
 *     keyboard today, is her streak 2 or 0? Showing 0 at breakfast feels harsh; most apps keep the
 *     streak alive until today is over, then break it.
 *  2. What counts as a practice day: any day with ≥ 1 minute, or a minimum like 5 minutes so that
 *     opening the app by accident doesn't count?
 *
 * Hint: step back one day at a time. Build dates with `new Date(y, m - 1, d)` and format with
 * `localDate()`; don't add 86_400_000 ms (daylight-saving days are 23 or 25 hours long).
 * The `it.todo` cases in store.test.ts describe what to check; turn them into real tests.
 */
export function computeStreak(log: Record<string, number>, today: string): number {
  // TODO(you): implement
  void log; void today // keeps TypeScript's "unused parameter" check quiet; delete this line
  return 0
}

// ---- Migrate / export / import ----

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isMinutes = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/** 'YYYY-MM-DD' that is a real calendar date (rejects 2026-02-30). */
export function isDateKey(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  return localDate(new Date(y, m - 1, d)) === s
}

/** Keep only entries whose key and value pass. Object.fromEntries never touches the prototype. */
const pick = <T>(v: unknown, ok: (k: string, val: unknown) => boolean) =>
  Object.fromEntries(isObj(v) ? Object.entries(v).filter(([k, val]) => ok(k, val)) : []) as Record<string, T>

/**
 * Turn any saved/imported data into the current Progress shape. Lenient: missing or wrong fields get
 * defaults, unknown keys are dropped. (Strict checking for imports happens in validate().)
 */
export function migrate(raw: unknown): Progress {
  const r: Obj = isObj(raw) ? raw : {}
  // Future: if (r.version === 1) r = v1toV2(r); then read the v2 shape below and bump CURRENT_VERSION.
  const base = emptyProgress()
  const s: Obj = isObj(r.settings) ? r.settings : {}
  return {
    version: 1,
    checked: pick<true>(r.checked, (_, v) => v === true),
    canPlay: pick<string>(r.canPlay, (_, v) => isDateKey(v)),
    log: pick<number>(r.log, (k, v) => isDateKey(k) && isMinutes(v)),
    settings: {
      keyboardId: typeof s.keyboardId === 'string' ? s.keyboardId : base.settings.keyboardId,
      ...(typeof s.name === 'string' ? { name: s.name } : {}),
      bpm: typeof s.bpm === 'number' && Number.isFinite(s.bpm) && s.bpm > 0 ? s.bpm : base.settings.bpm,
    },
  }
}

export function exportProgress(): string {
  return JSON.stringify({ app: APP_NAME, exportedAt: new Date().toISOString(), ...state }, null, 2)
}

/** Strict shape check for a file from outside. Returns a friendly error, or null if it's fine. */
function validate(r: unknown): string | null {
  const bad = "This file looks damaged, so I didn't use it."
  if (!isObj(r)) return "That file isn't a Piano Professor progress file."
  if (typeof r.version !== 'number' || !Number.isInteger(r.version)) return "That file isn't a Piano Professor progress file."
  if (r.version > CURRENT_VERSION) return 'That file is from a newer Piano Professor. Update the app, then try again.'
  if (r.version < 1) return "That file isn't a Piano Professor progress file."
  const all = (v: unknown, ok: (k: string, val: unknown) => boolean) =>
    v === undefined || (isObj(v) && Object.entries(v).every(([k, val]) => ok(k, val)))
  if (!all(r.checked, (k, v) => k !== '' && v === true)) return bad
  if (!all(r.canPlay, (k, v) => k !== '' && isDateKey(v))) return bad
  if (!all(r.log, (k, v) => isDateKey(k) && isMinutes(v))) return bad
  const s = r.settings
  if (s !== undefined) {
    if (!isObj(s)) return bad
    if (s.keyboardId !== undefined && typeof s.keyboardId !== 'string') return bad
    if (s.name !== undefined && typeof s.name !== 'string') return bad
    if (s.bpm !== undefined && !(typeof s.bpm === 'number' && Number.isFinite(s.bpm) && s.bpm > 0)) return bad
  }
  return null
}

/** Trust boundary: replaces all progress with the file's, after backing up the current data. */
export function importProgress(json: string): { ok: true } | { ok: false; error: string } {
  if (json.length > 5_000_000) return { ok: false, error: "That file is far too big to be Piano Professor progress." }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: "I couldn't read that file. Is it the one you exported from Piano Professor?" }
  }
  const error = validate(raw)
  if (error) return { ok: false, error }
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(state))
  } catch {
    return { ok: false, error: "I couldn't save a backup of your current progress, so I didn't change anything." }
  }
  setProgress(migrate(raw))
  return { ok: true }
}
