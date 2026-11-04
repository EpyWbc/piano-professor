// Shared Web Audio + a framework-free metronome (the Metronome screen and the M8 practice routine both use it).

let ctx: AudioContext | null = null

/** One shared AudioContext, created on first use. On iOS it stays silent until unlockAudio() runs in a tap. */
export const getAudioContext = () => (ctx ??= new AudioContext())

/** Call from a tap handler only (iOS only lets a user gesture start audio). */
export function unlockAudio() {
  const c = getAudioContext()
  if (c.state !== 'running') void c.resume()
  return c
}

export const MIN_BPM = 30
export const MAX_BPM = 220
export const clampBpm = (bpm: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))

/** Tap tempo from tap times in ms: average of the last ≤4 intervals, stopping at any gap > 2s. Null if < 2 taps in a row. */
export function tapTempo(timestamps: number[]): number | null {
  const intervals: number[] = []
  for (let i = timestamps.length - 1; i > 0 && intervals.length < 4; i--) {
    const gap = timestamps[i] - timestamps[i - 1]
    if (gap > 2000 || gap <= 0) break
    intervals.push(gap)
  }
  if (!intervals.length) return null
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  return clampBpm(60000 / avg)
}

const LOOKAHEAD_S = 0.1 // schedule clicks this far ahead on the audio clock
const TICK_MS = 25 // how often the scheduler wakes up

export type Metronome = {
  start(bpm: number, beatsPerBar: number): void
  stop(): void
  setBpm(bpm: number): void
  setBeatsPerBar(n: number): void
  readonly isRunning: boolean
}

/**
 * Lookahead scheduler: a 25ms timer queues clicks ~100ms ahead on the AudioContext clock, so the beat stays steady
 * even if the UI thread hiccups. onBeat(beatIndex, audioTime) fires (via setTimeout) when the click is heard; beat 0 is the accent.
 */
export function createMetronome(onBeat?: (beatIndex: number, time: number) => void): Metronome {
  let bpm = 80
  let beatsPerBar = 4
  let running = false
  let beat = 0
  let nextTime = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const uiTimers = new Set<ReturnType<typeof setTimeout>>()

  function click(c: AudioContext, time: number, accent: boolean) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = accent ? 1760 : 1046 // A6 vs C6: beat 1 is higher and louder
    // Fast attack + exponential decay = a clean "tick" with no pop.
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(accent ? 1 : 0.55, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
    osc.connect(gain).connect(c.destination)
    osc.start(time)
    osc.stop(time + 0.07)
  }

  function schedule() {
    const c = getAudioContext()
    while (nextTime < c.currentTime + LOOKAHEAD_S) {
      const b = beat
      const t = nextTime
      click(c, t, b === 0)
      if (onBeat) {
        // ponytail: outputLatency is 0/undefined on some browsers; if the flash leads the sound on the iPad, add a fixed offset here.
        const latency = c.outputLatency || c.baseLatency || 0
        const id = setTimeout(() => {
          uiTimers.delete(id)
          onBeat(b, t)
        }, Math.max(0, (t - c.currentTime + latency) * 1000))
        uiTimers.add(id)
      }
      nextTime += 60 / bpm
      beat = (beat + 1) % beatsPerBar
    }
    timer = setTimeout(schedule, TICK_MS)
  }

  function stop() {
    running = false
    clearTimeout(timer)
    uiTimers.forEach(clearTimeout)
    uiTimers.clear()
  }

  return {
    start(newBpm, newBeats) {
      stop()
      bpm = clampBpm(newBpm)
      beatsPerBar = Math.max(1, Math.round(newBeats))
      beat = 0
      running = true
      nextTime = getAudioContext().currentTime + 0.05
      schedule()
    },
    stop,
    setBpm(n) {
      bpm = clampBpm(n)
    },
    setBeatsPerBar(n) {
      beatsPerBar = Math.max(1, Math.round(n))
      beat %= beatsPerBar
    },
    get isRunning() {
      return running
    },
  }
}
