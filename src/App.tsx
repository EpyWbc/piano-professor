import { useEffect, useState } from 'react'

// Hash routing: "#/songs/ode-to-joy" → ["songs", "ode-to-joy"].
// Hashes never reach the server, so GitHub Pages can't 404 on a deep link or refresh.
function useRoute(): string[] {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

const NAV = [
  { path: '', label: 'Today', icon: '☀️' },
  { path: 'learn', label: 'Learn', icon: '🎓' },
  { path: 'songs', label: 'Songs', icon: '🎵' },
  { path: 'keyboard', label: 'My Keyboard', icon: '🎹' },
  { path: 'me', label: 'Me', icon: '🌱' },
]

// Placeholders until each screen's milestone lands (then they move to src/screens/).
const SCREENS: Record<string, { title: string; note: string }> = {
  '': { title: 'Hi there! 👋', note: 'Your daily practice lives here. Coming in M8.' },
  learn: { title: 'Learn', note: 'Five levels, one small step at a time. Coming in M7.' },
  songs: { title: 'Songs', note: 'Sheet music you can play along with. Coming in M5.' },
  keyboard: { title: 'My Keyboard', note: 'Every button on your JK-825, explained. Coming in M4.' },
  me: { title: 'Me', note: 'Your streak, minutes, and backups. Coming in M3.' },
}

export default function App() {
  const [section = ''] = useRoute()
  const screen = SCREENS[section] ?? { title: 'Oops', note: "That page doesn't exist (yet)." }

  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.path} href={`#/${n.path}`} className="nav-item" aria-current={n.path === section ? 'page' : undefined}>
            <span aria-hidden="true" className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <main className="main">
        <h1>{screen.title}</h1>
        <p className="lead">{screen.note}</p>
      </main>
    </div>
  )
}
