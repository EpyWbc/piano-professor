import { useState } from 'react'
import { computeStreak, localDate, minutesOn, setProgress, useProgress } from '../store'
import './Today.css'

function greeting(hour = new Date().getHours()) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

const saveName = (name: string) => setProgress((p) => ({ ...p, settings: { ...p.settings, name } }))

export default function Today() {
  const p = useProgress()
  const today = localDate()
  const streak = computeStreak(p.log, today)
  const mins = Math.round(minutesOn(p, today))
  const name = p.settings.name?.trim()

  // undefined = never asked (first launch); '' = she chose Skip, so don't ask again (she can set it in Me).
  if (p.settings.name === undefined) return <AskName />

  return (
    <div className="stack today">
      <h1>{greeting()}{name ? `, ${name}` : ''}! 👋</h1>
      <p className="lead">
        {mins > 0 ? "You've already played today. Lovely work!" : 'A few minutes at the keys is all it takes today.'}
      </p>

      <div className="today-stats">
        <div className="card today-stat">
          <span className="today-stat-value">🔥 {streak}</span>
          <span>{streak === 1 ? 'day in a row' : 'days in a row'}</span>
        </div>
        <div className="card today-stat">
          <span className="today-stat-value">⏱️ {mins}</span>
          <span>{mins === 1 ? 'minute today' : 'minutes today'}</span>
        </div>
      </div>

      <a className="btn today-start" href="#/practice">▶️ Start today's practice</a>
    </div>
  )
}

function AskName() {
  const [draft, setDraft] = useState('')
  return (
    <form
      className="card stack today-ask"
      onSubmit={(e) => {
        e.preventDefault()
        if (draft.trim()) saveName(draft.trim())
      }}
    >
      <h1>Welcome! 🎹</h1>
      <label className="lead" htmlFor="today-name">What should I call you?</label>
      <input
        id="today-name"
        className="today-input"
        type="text"
        autoComplete="given-name"
        placeholder="Your name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="row">
        <button className="btn" type="submit" disabled={!draft.trim()}>That's me!</button>
        <button className="btn btn-quiet" type="button" onClick={() => saveName('')}>Skip</button>
      </div>
    </form>
  )
}
