import { useRef, useState } from 'react'
import { computeStreak, exportProgress, importProgress, localDate, setProgress, totalMinutes, useProgress } from '../store'
import './Me.css'

// "ode-to-joy" → "Ode To Joy". ponytail: swap for real song titles once song data lands.
const prettify = (id: string) => id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

/** First day (Monday) of the current week, as a local date key. */
function weekStart(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return localDate(d)
}

export default function Me() {
  const p = useProgress()
  const today = localDate()
  const monday = weekStart()
  const streak = computeStreak(p.log, today)
  const week = Object.entries(p.log).reduce((sum, [d, m]) => (d >= monday && d <= today ? sum + m : sum), 0)
  const songs = Object.keys(p.canPlay)
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function exportFile() {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `piano-professor-progress-${today}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000) // Safari needs a moment before revoking
    setMessage({ ok: true, text: 'Saved! Keep that file somewhere safe.' })
  }

  async function importFile(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = '' // let her pick the same file again
    if (!file) return
    if (!confirm('Replace your progress on this device with the one in this file?')) return
    const r = importProgress(await file.text())
    setMessage(r.ok ? { ok: true, text: 'Welcome back! Your progress is restored.' } : { ok: false, text: r.error })
  }

  return (
    <div className="stack me">
      <h1>Me 🌱</h1>
      <p className="lead">Look how far you've come. Every minute counts.</p>

      <div className="me-stats">
        <Stat value={streak} label="day streak" />
        <Stat value={Math.round(totalMinutes(p))} label="minutes in total" />
        <Stat value={Math.round(week)} label="minutes this week" />
      </div>

      <section className="card stack">
        <h2>Songs I can play</h2>
        {songs.length ? (
          <ul className="me-songs">{songs.map((id) => <li key={id}>🎵 {prettify(id)}</li>)}</ul>
        ) : (
          <p>None yet, you'll get there!</p>
        )}
      </section>

      <section className="card stack">
        <h2>Your name</h2>
        <input
          className="me-input"
          type="text"
          autoComplete="given-name"
          placeholder="What should I call you?"
          value={p.settings.name ?? ''}
          onChange={(e) => {
            const name = e.target.value
            setProgress((q) => ({ ...q, settings: { ...q.settings, name } }))
          }}
        />
      </section>

      <section className="card stack">
        <h2>Keep your progress safe</h2>
        <div className="row">
          <button className="btn" onClick={exportFile}>⬇️ Export progress</button>
          <button className="btn btn-quiet" onClick={() => fileInput.current?.click()}>⬆️ Import progress</button>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        {message && <p role="status" className={message.ok ? 'me-ok' : 'me-err'}>{message.text}</p>}
        <p className="me-note">
          Always open Piano Professor from your home-screen icon; your progress lives there.
        </p>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card me-stat">
      <span className="me-stat-value">{value}</span>
      <span>{label}</span>
    </div>
  )
}
