import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createMetronome, getAudioContext, unlockAudio, type Metronome } from '../audio'
import {
  clock, finish, GRACE_MS, isDone, isEnding, next, pause, planFor, planMinutes, practicedMs, remaining, resume,
  shouldAdvance, songQueue, startRun, stay, takeMinutes, type Run, type Variant,
} from '../routine'
import { allSongs } from '../songs'
import { addMinutes, localDate, minutesOn, useProgress } from '../store'
import { useWakeLock } from '../wakeLock'
import './Practice.css'

const Score = lazy(() => import('../components/Score')) // abcjs loads only when Song work comes up

type Session = { variant: Variant; run: Run; songIdx: number }
const SAVE_KEY = 'pp:practice' // sessionStorage: an accidental reload resumes (paused) instead of starting over

function save(s: Session, now: number) {
  try {
    if (isDone(s.run, planFor(s.variant))) sessionStorage.removeItem(SAVE_KEY)
    else sessionStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, savedAt: now }))
  } catch { /* private mode: no resume, nothing else breaks */ }
}

function restore(): Session | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(SAVE_KEY) ?? 'null')
    if (!v || typeof v.savedAt !== 'number' || !v.run || (v.variant !== 'normal' && v.variant !== 'short')) return null
    // Time between the last save and the reload didn't happen at the keys: resume paused at the save.
    return { variant: v.variant, run: pause(v.run, v.savedAt), songIdx: v.songIdx | 0 }
  } catch {
    return null
  }
}

/** Soft two-note bell. Silent if audio was never unlocked (the Start tap unlocks it). */
function chime() {
  const c = getAudioContext()
  if (c.state !== 'running') return
  ;[784, 1047].forEach((freq, i) => {
    const t = c.currentTime + i * 0.2
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq // G5, C6
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 1.5)
  })
}

export default function Practice() {
  const p = useProgress()
  const [s, setS] = useState(restore)
  const [now, setNow] = useState(Date.now)
  const [choice, setChoice] = useState<Variant>('normal')
  const sRef = useRef(s)

  /** Every change goes through here: logs any newly practiced minutes (each counted once) and saves for reload. */
  function apply(f: (s: Session, now: number) => Session) {
    if (!sRef.current) return
    const t = Date.now()
    const n = f(sRef.current, t)
    const [mins, run] = takeMinutes(n.run, t, planFor(n.variant))
    if (mins) addMinutes(mins)
    sRef.current = { ...n, run }
    setS(sRef.current)
    setNow(t)
    save(sRef.current, t)
  }
  const applyRef = useRef(apply)
  applyRef.current = apply

  function start() {
    unlockAudio() // so the segment chime can play later
    const t = Date.now()
    sRef.current = { variant: choice, run: startRun(t), songIdx: 0 }
    setS(sRef.current)
    setNow(t)
    save(sRef.current, t)
  }

  const plan = useMemo(() => planFor(s?.variant ?? choice), [s?.variant, choice])
  const run = s?.run
  const active = !!run && !isDone(run, plan)
  const ticking = active && run.since != null
  useWakeLock(active)

  // Re-render 4x a second while running. The ticks only trigger renders: time itself comes from Date.now().
  useEffect(() => {
    if (!ticking) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [ticking])

  // Leaving: log the partial segment and end the session. Backgrounded/closed: log + save (iOS may never unmount).
  useEffect(() => {
    if (sRef.current) save(sRef.current, Date.now()) // StrictMode's dev remount runs the cleanup below once
    const flush = () => applyRef.current((x) => x)
    const onHide = () => (document.visibilityState === 'hidden' ? flush() : setNow(Date.now()))
    document.addEventListener('visibilitychange', onHide)
    addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      removeEventListener('pagehide', flush)
      flush()
      try { sessionStorage.removeItem(SAVE_KEY) } catch { /* ignore */ }
    }
  }, [])

  // Time's up: chime once, then move on after the grace period (unless she taps "Stay here").
  const ending = !!run && isEnding(run, now, plan)
  const chimed = useRef('')
  useEffect(() => {
    if (!run) return
    const key = `${run.index}:${run.extraMs}`
    if (ending && chimed.current !== key) {
      chimed.current = key
      chime()
    }
    if (shouldAdvance(run, now, plan)) apply((x, t) => ({ ...x, run: next(x.run, t, plan) }))
  })

  // Metronome (Technique): stops on segment change, pause and unmount.
  const met = useRef<Metronome | null>(null)
  const [metOn, setMetOn] = useState(false)
  const [beat, setBeat] = useState(0)
  const stopMet = () => {
    met.current?.stop()
    setMetOn(false)
  }
  useEffect(() => stopMet, [run?.index, ticking])
  function toggleMet() {
    if (metOn) return stopMet()
    unlockAudio()
    met.current ??= createMetronome(() => setBeat((n) => n + 1))
    met.current.start(p.settings.bpm, 4)
    setMetOn(true)
  }

  const queue = useMemo(() => songQueue(allSongs, p.canPlay), [p.canPlay])

  if (!s || !run) return <StartScreen choice={choice} setChoice={setChoice} onStart={start} />

  if (!active) {
    const mins = practicedMs(run, now, plan) / 60_000
    const today = Math.round(minutesOn(p, localDate()))
    return (
      <div className="pr-end stack">
        <div className="pr-end-emoji" aria-hidden="true">🌟</div>
        <h1>
          You practiced {mins >= 1 ? `${Math.round(mins)} ${Math.round(mins) === 1 ? 'minute' : 'minutes'}` : 'a little'} today 🎉
        </h1>
        <p className="lead">That's {today} {today === 1 ? 'minute' : 'minutes'} at the keys today. Well done!</p>
        <a className="btn pr-big" href="#/">☀️ Back to Today</a>
      </div>
    )
  }

  const seg = plan[run.index]
  const upNext = plan[run.index + 1]
  const rem = remaining(run, now, plan)
  const song = queue.length ? queue[s.songIdx % queue.length] : undefined

  return (
    <div className="pr-run">
      <ol className="pr-strip" aria-label="Session plan">
        {plan.map((x, i) => (
          <li
            key={x.id}
            style={{ flexGrow: x.minutes }}
            className={i < run.index ? 'pr-strip-done' : i === run.index ? 'pr-strip-now' : ''}
            aria-current={i === run.index ? 'step' : undefined}
          >
            {x.emoji} <span className="pr-strip-label">{x.title}</span>
          </li>
        ))}
      </ol>

      <h1 className="pr-title">
        <span aria-hidden="true">{seg.emoji}</span> {seg.title}
      </h1>

      {ending && (
        <div className="pr-next card" role="status">
          <p>
            ⏰ Time's up! Next: <strong>{upNext ? `${upNext.emoji} ${upNext.title}` : 'All done 🎉'}</strong> in{' '}
            {Math.max(0, Math.ceil((GRACE_MS + rem) / 1000))}s
          </p>
          <div className="row">
            <button className="btn btn-quiet" onClick={() => apply((x) => ({ ...x, run: stay(x.run) }))}>
              Stay here +2 min
            </button>
            <button className="btn" onClick={() => apply((x, t) => ({ ...x, run: next(x.run, t, plan) }))}>
              Go now ▶
            </button>
          </div>
        </div>
      )}

      <div className={`pr-body${seg.id === 'song' ? ' pr-body-song' : ''}`}>
        <section className="pr-main">
          <ul className="pr-steps">
            {seg.instructions.map((t) => <li key={t}>{t}</li>)}
          </ul>
          {seg.id === 'song' && song && (
            <div className="pr-song">
              <div className="pr-song-head">
                <h2>{song.title}</h2>
                <button
                  className="btn btn-quiet"
                  onClick={() => apply((x) => ({ ...x, songIdx: x.songIdx + 1 }))}
                  disabled={queue.length < 2}
                >
                  🔀 Different song
                </button>
              </div>
              {song.tip && <p className="pr-song-tip">💡 {song.tip}</p>}
              <Suspense fallback={<p className="lead">Loading the music…</p>}>
                <Score abc={song.abc} />
              </Suspense>
            </div>
          )}
        </section>

        <aside className="pr-side">
          <div className={`pr-clock${ticking ? '' : ' pr-clock-paused'}`} role="timer" aria-label="Time left in this part">
            {clock(rem)}
          </div>
          {!ticking && <p className="pr-paused">Paused</p>}
          <button className={`btn pr-pause${ticking ? '' : ' pr-resume'}`} onClick={() => apply((x, t) => ({ ...x, run: ticking ? pause(x.run, t) : resume(x.run, t) }))}>
            {ticking ? '⏸ Pause' : '▶ Resume'}
          </button>
          <div className="pr-buttons">
            <button className="btn btn-quiet" onClick={() => apply((x, t) => ({ ...x, run: next(x.run, t, plan) }))}>
              {upNext ? 'Next ▶' : 'Finish ✓'}
            </button>
            <button className="btn btn-quiet" onClick={() => apply((x, t) => ({ ...x, run: finish(x.run, t, plan) }))}>
              End session
            </button>
          </div>
          {seg.metronome && (
            <div className="pr-met">
              <button className={`btn ${metOn ? '' : 'btn-quiet'}`} aria-pressed={metOn} onClick={toggleMet}>
                {metOn ? '■ Stop metronome' : `🥁 Metronome · ${p.settings.bpm}`}
              </button>
              <span key={beat} className={`pr-dot${metOn ? ' pr-dot-on' : ''}`} aria-hidden="true" />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function StartScreen({ choice, setChoice, onStart }: { choice: Variant; setChoice: (v: Variant) => void; onStart: () => void }) {
  const plan = planFor(choice)
  return (
    <div className="pr-start stack">
      <h1>Today's practice 🎹</h1>
      <div className="pr-choice" role="group" aria-label="How long">
        {(['normal', 'short'] as const).map((v) => (
          <button key={v} className={`btn ${v === choice ? '' : 'btn-quiet'}`} aria-pressed={v === choice} onClick={() => setChoice(v)}>
            {v === 'normal' ? 'Normal' : 'Short day'} · {planMinutes(planFor(v))} min
          </button>
        ))}
      </div>
      <ol className="card pr-plan">
        {plan.map((x) => (
          <li key={x.id}>
            <span>{x.emoji} {x.title}</span>
            <span className="pr-plan-min">{x.minutes} min</span>
          </li>
        ))}
      </ol>
      <button className="btn pr-big pr-go" onClick={onStart}>▶ Start</button>
    </div>
  )
}
