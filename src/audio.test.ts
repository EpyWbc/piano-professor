import { describe, expect, it } from 'vitest'
import { tapTempo } from './audio'

describe('tapTempo', () => {
  it('needs two taps', () => {
    expect(tapTempo([])).toBeNull()
    expect(tapTempo([1000])).toBeNull()
  })
  it('averages the last 4 intervals', () => {
    // early slow taps are ignored; last 4 intervals are 500ms → 120 BPM
    expect(tapTempo([0, 1500, 2000, 2500, 3000, 3500])).toBe(120)
  })
  it('ignores taps before a gap over 2s', () => {
    expect(tapTempo([0, 500, 3000])).toBeNull()
    expect(tapTempo([0, 500, 3000, 4000])).toBe(60)
  })
  it('clamps to 220 and allows the 2s edge (30 BPM)', () => {
    expect(tapTempo([0, 100])).toBe(220)
    expect(tapTempo([0, 2000])).toBe(30)
  })
})
