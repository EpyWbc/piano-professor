import { useEffect, useRef, useState } from 'react'
import { synth, TimingCallbacks, type MidiBuffer, type NoteTimingEvent, type TuneObject } from 'abcjs'
import type { ScreenProps } from '../App'
import { allSongs, externalSongs, songById, type Song } from '../songs'
import { localDate, setProgress, useProgress } from '../store'
import Score from '../components/Score'
import './Songs.css'

export default function Songs({ params }: ScreenProps) {
  const id = params[0]
  if (!id) return <SongList />
  const song = songById(id)
  if (!song) return <p className="lead">That song isn't here. <a href="#/songs">Back to songs</a></p>
  return <SongPage key={song.id} song={song} /> // key: switching songs remounts, which stops playback
}

const LEVELS = [1, 2, 3, 4, 5]
const GENRES = [...new Set(allSongs.flatMap((s) => s.genres))].sort()

function SongList() {
  const { canPlay } = useProgress()
  const [level, setLevel] = useState<number>()
  const [genre, setGenre] = useState<string>()
  const songs = allSongs.filter((s) => (!level || s.level === level) && (!genre || s.genres.includes(genre)))
  const modern = externalSongs.filter((s) => !level || s.level === level)

  return (
    <div className="stack">
      <h1>Songs</h1>
      <div className="row" role="group" aria-label="Level">
        <Chip on={!level} onClick={() => setLevel(undefined)}>All levels</Chip>
        {LEVELS.map((n) => <Chip key={n} on={level === n} onClick={() => setLevel(n)}>Level {n}</Chip>)}
      </div>
      <div className="row" role="group" aria-label="Style">
        <Chip on={!genre} onClick={() => setGenre(undefined)}>All styles</Chip>
        {GENRES.map((g) => <Chip key={g} on={genre === g} onClick={() => setGenre(g)}>{g}</Chip>)}
      </div>

      <div className="song-grid">
        {songs.map((s) => (
          <a key={s.id} href={`#/songs/${s.id}`} className="card song-card">
            <strong className="song-card-title">{s.title}</strong>
            <span className="song-meta">{s.composer}</span>
            <span className="row">
              <span className="song-level">Level {s.level}</span>
              {canPlay[s.id] && <span className="song-badge">✓ I can play this</span>}
            </span>
          </a>
        ))}
        {!songs.length && <p className="lead">No songs match. Try "All".</p>}
      </div>

      {!genre && modern.length > 0 && (
        <>
          <h2>Modern songs (opens a shop)</h2>
          <p className="song-meta">These are still under copyright, so we link to a sheet-music shop instead of showing the notes.</p>
          <div className="song-grid">
            {modern.map((s) => (
              <a key={s.id} href={s.link} target="_blank" rel="noopener noreferrer" className="card song-card">
                <strong className="song-card-title">{s.title} ↗</strong>
                <span className="song-meta">{s.artist}</span>
                <span className="song-level">Level {s.level}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={`btn song-chip${on ? '' : ' btn-quiet'}`} aria-pressed={on} onClick={onClick}>{children}</button>
}

// One AudioContext for the app session, created inside the first Play tap (iOS only allows it there).
let audio: AudioContext | undefined

type Hands = 'both' | 'right' | 'left'

function SongPage({ song }: { song: Song }) {
  const { canPlay } = useProgress()
  const [pct, setPct] = useState(100)
  const [hands, setHands] = useState<Hands>('both')
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [error, setError] = useState('')
  const tune = useRef<TuneObject>(null)
  const player = useRef<{ buffer: MidiBuffer; timer?: TimingCallbacks }>(null)
  const lit = useRef<Element[]>([])
  const bpm = Math.round((song.bpm * pct) / 100)

  const highlight = (ev: NoteTimingEvent | null) => {
    lit.current.forEach((e) => e.classList.remove('score-now'))
    lit.current = ev?.elements?.flat() ?? []
    lit.current.forEach((e) => e.classList.add('score-now'))
  }

  const stop = () => {
    player.current?.buffer.stop()
    player.current?.timer?.stop()
    player.current = null
    highlight(null)
    setStatus('idle')
  }
  useEffect(() => stop, []) // leaving the song (route change / unmount) stops the sound

  async function play() {
    // Must happen synchronously in the tap, before any await, or iOS keeps the audio locked.
    audio ??= new AudioContext()
    if (audio.state !== 'running') audio.resume()
    if (!tune.current) return
    const t = tune.current
    const buffer = new synth.CreateSynth()
    const me = { buffer } as { buffer: MidiBuffer; timer?: TimingCallbacks }
    player.current = me
    setStatus('loading')
    setError('')
    try {
      await buffer.init({
        visualObj: t,
        audioContext: audio,
        millisecondsPerMeasure: t.millisecondsPerMeasure(bpm),
        options: { voicesOff: hands === 'right' ? [1] : hands === 'left' ? [0] : undefined },
      })
      await buffer.prime()
      if (player.current !== me) return // Stop was tapped while the piano sounds loaded
      buffer.start()
      me.timer = new TimingCallbacks(t, {
        qpm: bpm,
        eventCallback: (ev) => {
          if (!ev) stop() // end of song
          else highlight(ev)
          return undefined
        },
      })
      me.timer.start()
      setStatus('playing')
    } catch (e) {
      console.error(e)
      if (player.current === me) stop()
      setError("Couldn't load the piano sound. It needs the internet the first time.")
    }
  }

  // Changing tempo or hands while playing stops it; the next Play uses the new settings.
  const change = <T,>(set: (v: T) => void) => (v: T) => { if (player.current) stop(); set(v) }
  const changePct = change(setPct)
  const changeHands = change(setHands)

  const done = canPlay[song.id]
  const toggleDone = () =>
    setProgress((p) => {
      const next = { ...p.canPlay }
      if (next[song.id]) delete next[song.id]
      else next[song.id] = localDate()
      return { ...p, canPlay: next }
    })

  return (
    <div className="song-page">
      <header className="song-head">
        <a href="#/songs" className="btn btn-quiet" aria-label="Back to songs">←</a>
        <div>
          <h1 className="song-title">{song.title}</h1>
          <span className="song-meta">{song.composer} · Level {song.level}</span>
        </div>
      </header>

      <div className="song-controls">
        {status === 'idle' ? (
          <button type="button" className="btn song-play" onClick={play}>▶ Play</button>
        ) : (
          <button type="button" className="btn song-play" onClick={stop}>■ {status === 'loading' ? 'Loading…' : 'Stop'}</button>
        )}
        <label className="song-tempo">
          <span>Tempo <strong>{bpm}</strong> BPM</span>
          <input type="range" min={40} max={160} step={5} value={pct} onChange={(e) => changePct(+e.target.value)} />
        </label>
        {song.hands === 'both' && (
          <div className="row" role="group" aria-label="Hands">
            {(['both', 'right', 'left'] as const).map((h) => (
              <button key={h} type="button" className={`btn song-hand${hands === h ? '' : ' btn-quiet'}`} aria-pressed={hands === h} onClick={() => changeHands(h)}>
                {h === 'both' ? 'Both' : h === 'right' ? 'Right' : 'Left'}
              </button>
            ))}
          </div>
        )}
        <button type="button" className={`btn song-done${done ? ' is-done' : ' btn-quiet'}`} aria-pressed={!!done} onClick={toggleDone}>
          {done ? '✓ I can play this' : 'I can play this! 🎉'}
        </button>
      </div>
      {error && <p className="song-error" role="alert">{error}</p>}

      <Score abc={song.abc} onRender={(t) => (tune.current = t)} dimVoice={hands === 'right' ? 1 : hands === 'left' ? 0 : undefined} />
      {song.tip && <p className="song-tip">💡 {song.tip}</p>}
    </div>
  )
}
