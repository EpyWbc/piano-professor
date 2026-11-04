import { describe, it, expect, beforeEach } from 'vitest'

// store.ts reads localStorage at import time, so install an in-memory one first, then import it.
const mem = new Map<string, string>()
const fakeStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
}
Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage, configurable: true, writable: true })
const store = await import('./store')
const { localDate, migrate, emptyProgress, exportProgress, importProgress, addMinutes, getProgress, setProgress, totalMinutes, minutesOn } = store

beforeEach(() => {
  mem.clear()
  setProgress(emptyProgress())
})

describe('localDate', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('importProgress (trust boundary)', () => {
  const v1 = (extra: object) => JSON.stringify({ version: 1, ...extra })

  it.each([
    ['not JSON', 'hello'],
    ['null', 'null'],
    ['an array', '[]'],
    ['no version', '{}'],
    ['a string version', '{"version":"1"}'],
    ['a future version', '{"version":99}'],
    ['log as an array', v1({ log: [] })],
    ['a bad date key', v1({ log: { '2026-13-01': 5 } })],
    ['an impossible date', v1({ log: { '2026-02-30': 5 } })],
    ['negative minutes', v1({ log: { '2026-01-01': -5 } })],
    ['string minutes', v1({ log: { '2026-01-01': '5' } })],
    ['checked not true', v1({ checked: { a: 1 } })],
    ['canPlay not a date', v1({ canPlay: { 'ode-to-joy': 'yesterday' } })],
    ['settings name a number', v1({ settings: { name: 7 } })],
  ])('rejects %s and leaves progress alone', (_, json) => {
    addMinutes(10, '2026-01-01')
    const before = getProgress()
    const r = importProgress(json)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/\w/)
    expect(getProgress()).toBe(before)
  })

  it('round-trips an export, drops unknown keys, and backs up the old data', () => {
    setProgress({
      version: 1,
      checked: { 'l1-posture': true },
      canPlay: { 'ode-to-joy': '2026-03-02' },
      log: { '2026-03-01': 12, '2026-03-02': 7.5 },
      settings: { keyboardId: 'jikada-61', name: 'Ana', bpm: 72 },
    })
    const saved = getProgress()
    const file = exportProgress()
    expect(JSON.parse(file)).toMatchObject({ app: 'Piano Professor', exportedAt: expect.any(String) })

    setProgress(emptyProgress())
    const withJunk = JSON.stringify({ ...JSON.parse(file), evil: 1, settings: { ...saved.settings, extra: true } })
    expect(importProgress(withJunk)).toEqual({ ok: true })
    expect(getProgress()).toEqual(saved)
    expect(JSON.parse(mem.get(store.BACKUP_KEY)!)).toEqual(emptyProgress())
  })
})

describe('migrate', () => {
  it('fills missing fields with defaults', () => {
    expect(migrate({ version: 1 })).toEqual(emptyProgress())
    expect(migrate(null)).toEqual(emptyProgress())
    const p = migrate({ version: 1, log: { '2026-01-01': 3 }, settings: { name: 'Ana' } })
    expect(p.log).toEqual({ '2026-01-01': 3 })
    expect(p.settings).toEqual({ keyboardId: 'jikada-61', name: 'Ana', bpm: 80 })
  })
})

describe('minutes', () => {
  it('addMinutes accumulates per day and ignores nonsense', () => {
    addMinutes(5, '2026-01-01')
    addMinutes(10, '2026-01-01')
    addMinutes(3, '2026-01-02')
    addMinutes(-4, '2026-01-02')
    addMinutes(NaN, '2026-01-02')
    const p = getProgress()
    expect(minutesOn(p, '2026-01-01')).toBe(15)
    expect(minutesOn(p, '2026-01-03')).toBe(0)
    expect(totalMinutes(p)).toBe(18)
  })
})

// For you to fill in once computeStreak is written (see the doc comment in store.ts).
describe('computeStreak', () => {
  it.todo('is 0 with an empty log')
  it.todo('is 1 when only today has practice')
  it.todo('counts consecutive days back from today (e.g. today + 2 days before = 3)')
  it.todo('stops at the first missed day (a gap two days ago keeps only the recent run)')
  it.todo('decide: today has no practice yet but yesterday does: streak kept, or 0?')
  it.todo('decide: a day with only 1–4 minutes: does it count?')
  it.todo('handles month and year boundaries (2026-03-01 back to 2026-02-28; 2027-01-01 back to 2026-12-31)')
  it.todo('ignores days in the future after today')
})
