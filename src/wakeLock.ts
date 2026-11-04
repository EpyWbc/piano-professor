import { useEffect } from 'react'

// Keep the screen on while `active` (song, metronome). Silent no-op where unsupported.
// iOS drops the lock when the app is backgrounded, so re-acquire whenever the page becomes visible.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | undefined
    let done = false
    const request = () => {
      if (done || document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        l => (done ? void l.release().catch(() => {}) : (lock = l)),
        () => {}, // denied (low battery, not visible): ignore
      )
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      done = true
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => {})
    }
  }, [active])
}
