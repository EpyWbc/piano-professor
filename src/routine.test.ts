import { describe, expect, it } from 'vitest'
import {
  clock, elapsed, finish, GRACE_MS, isEnding, next, pause, planFor, planMinutes, remaining, resume, shouldAdvance,
  songQueue, startRun, stay, STAY_MS, takeMinutes, type Run,
} from './routine'
import type { Song } from './songs'

const plan = planFor('normal')
const MIN = 60_000

describe('routine timing', () => {
  it('plans about 18 and 10 minutes', () => {
    expect(planMinutes(plan)).toBe(18)
    expect(planMinutes(planFor('short'))).toBe(10)
  })

  it('pausing does not count', () => {
    let r = startRun(0)
    r = pause(r, 1 * MIN)
    expect(elapsed(r, 50 * MIN)).toBe(1 * MIN)
    r = resume(r, 50 * MIN)
    expect(elapsed(r, 51 * MIN)).toBe(2 * MIN)
  })

  it('ends, waits out the grace, and stay adds 2 minutes', () => {
    const r = startRun(0) // warm-up: 3 min
    expect(isEnding(r, 3 * MIN - 1, plan)).toBe(false)
    expect(isEnding(r, 3 * MIN, plan)).toBe(true)
    expect(shouldAdvance(r, 3 * MIN + GRACE_MS, plan)).toBe(true)
    const s = stay(r)
    expect(remaining(s, 3 * MIN, plan)).toBe(STAY_MS)
    expect(isEnding(s, 3 * MIN + 5000, plan)).toBe(false)
  })

  it('logs each minute exactly once, in 0.1 steps, capping a forgotten segment', () => {
    let r: Run = startRun(0)
    const logged: number[] = []
    const take = (now: number) => {
      const [m, r2] = takeMinutes(r, now, plan)
      if (m) logged.push(m)
      r = r2
    }
    take(2400) // 0.04 min: too little, skipped (not lost: carried forward)
    expect(logged).toEqual([])
    r = next(r, 2.5 * MIN, plan)
    take(2.5 * MIN)
    take(2.5 * MIN) // no double count
    expect(logged).toEqual([2.5])
    // Technique left running for an hour in the background: counts 5 min + grace only.
    r = next(r, 2.5 * MIN + 60 * MIN, plan)
    r = finish(r, 2.5 * MIN + 60 * MIN, plan)
    take(999 * MIN)
    const total = logged.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(2.5 + 5 + GRACE_MS / MIN, 1)
  })

  it('formats the clock rounding up', () => {
    expect(clock(0)).toBe('0:00')
    expect(clock(1)).toBe('0:01')
    expect(clock(5 * MIN)).toBe('5:00')
    expect(clock(-5)).toBe('0:00')
  })
})

describe('songQueue', () => {
  const song = (id: string, level: number) => ({ id, level }) as Song
  it('suggests unplayed songs by level first, then the rest', () => {
    const q = songQueue([song('a', 2), song('b', 1), song('c', 1)], { b: '2026-01-01' })
    expect(q.map((s) => s.id)).toEqual(['c', 'a', 'b'])
  })
})
