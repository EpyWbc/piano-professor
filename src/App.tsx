import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'

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

export type ScreenProps = { params: string[] } // path segments after the section, e.g. ["ode-to-joy"]

// Each screen is its own chunk, so heavy ones (abcjs on Songs) load only when opened.
const ROUTES: Record<string, ComponentType<ScreenProps>> = {
  '': lazy(() => import('./screens/Today')),
  learn: lazy(() => import('./screens/Learn')),
  songs: lazy(() => import('./screens/Songs')),
  keyboard: lazy(() => import('./screens/Keyboard')),
  metronome: lazy(() => import('./screens/Metronome')),
  me: lazy(() => import('./screens/Me')),
}

const NAV = [
  { path: '', label: 'Today', icon: '☀️' },
  { path: 'learn', label: 'Learn', icon: '🎓' },
  { path: 'songs', label: 'Songs', icon: '🎵' },
  { path: 'keyboard', label: 'Keyboard', icon: '🎹' },
  { path: 'metronome', label: 'Tempo', icon: '⏱️' },
  { path: 'me', label: 'Me', icon: '🌱' },
]

export default function App() {
  const [section = '', ...params] = useRoute()
  const Screen = ROUTES[section]

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
        <Suspense fallback={null}>
          {Screen ? <Screen params={params} /> : <h1>That page doesn't exist (yet).</h1>}
        </Suspense>
      </main>
    </div>
  )
}
