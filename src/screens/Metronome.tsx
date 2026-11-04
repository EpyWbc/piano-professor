import { useEffect, useRef, useState } from 'react'
import { clampBpm, createMetronome, tapTempo, unlockAudio, type Metronome as Met } from '../audio'
import { getProgress, setProgress, useProgress } from '../store'
import './Metronome.css'

// Standard Italian tempo markings (approximate upper bounds, BPM).
const TEMPO_NAMES: [number, string, string][] = [
  [65, 'Largo', 'very slow'],
  [75, 'Adagio', 'slow'],
  [107, 'Andante', 'walking pace'],
  [119, 'Moderato', 'medium'],
  [Infinity, 'Allegro', 'fast'],
]
const tempoName = (bpm: number) => TEMPO_NAMES.find(([max]) => bpm <= max)!

function saveBpm(bpm: number) {
  if (getProgress().settings.bpm !== bpm) setProgress((p) => ({ ...p, settings: { ...p.settings, bpm } }))
}

export default function Metronome() {
  const saved = useProgress().settings.bpm
  const [bpm, setBpmState] = useState(saved)
  const [beats, setBeats] = useState(4)
  const [running, setRunning] = useState(false)
  const [active, setActive] = useState({ beat: -1, n: 0 }) // n changes every beat so the flash animation restarts
  const metro = useRef<Met | null>(null)
  const taps = useRef<number[]>([])
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  const getMetro = () => (metro.current ??= createMetronome((beat) => setActive((a) => ({ beat, n: a.n + 1 }))))
  const setBpm = (n: number) => setBpmState(clampBpm(n))

  // Live changes while playing.
  useEffect(() => metro.current?.setBpm(bpm), [bpm])
  useEffect(() => metro.current?.setBeatsPerBar(beats), [beats])

  // Save once the slider/buttons settle, not on every tick.
  useEffect(() => {
    const id = setTimeout(() => saveBpm(bpm), 600)
    return () => clearTimeout(id)
  }, [bpm])

  // Leaving the screen: stop the sound and keep the last tempo.
  useEffect(
    () => () => {
      metro.current?.stop()
      saveBpm(bpmRef.current)
    },
    [],
  )

  function toggle() {
    const m = getMetro()
    if (m.isRunning) {
      m.stop()
      setRunning(false)
      setActive((a) => ({ beat: -1, n: a.n }))
      saveBpm(bpm)
    } else {
      unlockAudio()
      m.start(bpm, beats)
      setRunning(true)
    }
  }

  function tap() {
    const now = performance.now()
    taps.current = [...taps.current.slice(-4), now]
    const t = tapTempo(taps.current)
    if (t) setBpm(t)
  }

  const [, name, hint] = tempoName(bpm)

  return (
    <div className="met">
      <section className="met-display" aria-label="Tempo">
        <div className="met-bpm" aria-live="polite">
          <span className="met-bpm-num">{bpm}</span>
          <span className="met-bpm-unit">beats per minute</span>
        </div>
        <p className="met-name">
          <strong>{name}</strong> · {hint}
        </p>
        <div className="met-dots" aria-hidden="true">
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i === active.beat ? `${i}-${active.n}` : i}
              className={`met-dot${i === 0 ? ' met-dot-accent' : ''}${i === active.beat ? ' met-dot-on' : ''}`}
            />
          ))}
        </div>
        <button className={`btn met-go${running ? ' met-go-stop' : ''}`} onClick={toggle}>
          {running ? '■ Stop' : '▶ Start'}
        </button>
      </section>

      <section className="met-controls" aria-label="Controls">
        <div className="met-steps">
          <button className="btn btn-quiet" onClick={() => setBpm(bpm - 5)} aria-label="Slower by 5">−5</button>
          <button className="btn btn-quiet" onClick={() => setBpm(bpm - 1)} aria-label="Slower by 1">−1</button>
          <button className="btn btn-quiet" onClick={() => setBpm(bpm + 1)} aria-label="Faster by 1">+1</button>
          <button className="btn btn-quiet" onClick={() => setBpm(bpm + 5)} aria-label="Faster by 5">+5</button>
        </div>
        <input
          className="met-slider"
          type="range"
          min={40}
          max={200}
          value={bpm}
          onChange={(e) => setBpm(+e.target.value)}
          aria-label="Tempo"
        />
        <div className="met-beats" role="group" aria-label="Beats per bar">
          <span>Beats per bar</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={`btn ${n === beats ? '' : 'btn-quiet'}`}
              aria-pressed={n === beats}
              onClick={() => setBeats(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="btn btn-quiet met-tap" onClick={tap}>
          Tap the beat
        </button>
      </section>
    </div>
  )
}
