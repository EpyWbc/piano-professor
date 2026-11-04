import routine from '../data/routine.json'
import type { Song } from './songs'

// Practice session timing as pure functions of (state, now). Time is always a timestamp delta (Date.now()),
// never a count of interval ticks: iOS throttles timers in the background.

export type Segment = { id: string; title: string; minutes: number; emoji: string; instructions: string[]; metronome?: boolean }
export type Variant = 'normal' | 'short'

const short: Record<string, number> = routine.short
export const planFor = (v: Variant): Segment[] =>
  routine.segments.map((s) => (v === 'short' ? { ...s, minutes: short[s.id] ?? s.minutes } : s))
export const planMinutes = (plan: Segment[]) => plan.reduce((a, s) => a + s.minutes, 0)

export const GRACE_MS = 10_000 // after the chime: "Next: …" shows this long before moving on
export const STAY_MS = 2 * 60_000

export type Run = {
  index: number // current segment; plan.length = finished
  acc: number // ms spent in this segment before `since`
  since: number | null // running since (ms timestamp); null = paused
  extraMs: number // "Stay here +2 min" added to this segment
  doneMs: number // practiced ms in finished segments
  loggedMs: number // ms already sent to addMinutes, so nothing is counted twice
}

export const startRun = (now: number): Run => ({ index: 0, acc: 0, since: now, extraMs: 0, doneMs: 0, loggedMs: 0 })
export const isDone = (r: Run, plan: Segment[]) => r.index >= plan.length
export const elapsed = (r: Run, now: number) => r.acc + (r.since == null ? 0 : Math.max(0, now - r.since))
export const targetMs = (r: Run, plan: Segment[]) => (isDone(r, plan) ? 0 : plan[r.index].minutes * 60_000 + r.extraMs)
export const remaining = (r: Run, now: number, plan: Segment[]) => targetMs(r, plan) - elapsed(r, now)
/** Time-up and in the grace window: time to show "Next: …". */
export const isEnding = (r: Run, now: number, plan: Segment[]) => !isDone(r, plan) && remaining(r, now, plan) <= 0
export const shouldAdvance = (r: Run, now: number, plan: Segment[]) => !isDone(r, plan) && remaining(r, now, plan) <= -GRACE_MS

// A segment never counts for more than its time + grace (e.g. the app sat in the background for an hour).
const credited = (r: Run, now: number, plan: Segment[]) =>
  isDone(r, plan) ? 0 : Math.min(elapsed(r, now), targetMs(r, plan) + GRACE_MS)
export const practicedMs = (r: Run, now: number, plan: Segment[]) => r.doneMs + credited(r, now, plan)

export const pause = (r: Run, now: number): Run => (r.since == null ? r : { ...r, acc: elapsed(r, now), since: null })
export const resume = (r: Run, now: number): Run => (r.since == null ? { ...r, since: now } : r)
export const stay = (r: Run): Run => ({ ...r, extraMs: r.extraMs + STAY_MS })
/** Next segment (or finished after the last). Starts running: tapping Next means "let's go". */
export const next = (r: Run, now: number, plan: Segment[]): Run => {
  const doneMs = practicedMs(r, now, plan)
  const index = Math.min(r.index + 1, plan.length)
  return { ...r, index, doneMs, acc: 0, extraMs: 0, since: index < plan.length ? now : null }
}
export const finish = (r: Run, now: number, plan: Segment[]): Run =>
  ({ ...r, index: plan.length, doneMs: practicedMs(r, now, plan), acc: 0, extraMs: 0, since: null })

/** Minutes practiced but not yet logged, rounded to 0.1 (0 if under 0.1), and the run with them marked logged. */
export function takeMinutes(r: Run, now: number, plan: Segment[]): [number, Run] {
  const m = Math.round((practicedMs(r, now, plan) - r.loggedMs) / 6_000) / 10
  return m >= 0.1 ? [m, { ...r, loggedMs: r.loggedMs + m * 60_000 }] : [0, r]
}

/** "4:05". Rounds up, so it shows 0:00 only when time is really up. */
export function clock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Songs to suggest, in order: ones she hasn't marked "I can play this" first (by level, then given order), then the rest. */
export function songQueue(songs: Song[], canPlay: Record<string, string>): Song[] {
  const byLevel = [...songs].sort((a, b) => a.level - b.level) // stable: keeps the given order within a level
  return [...byLevel.filter((s) => !canPlay[s.id]), ...byLevel.filter((s) => canPlay[s.id])]
}
