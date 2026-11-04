# Piano Professor: conventions

Plan: PLAN.md. Keyboard facts: research/keyboard.md (only VERIFIED facts may appear in the app).

## Rules
- **No new dependencies.** Installed: react, react-dom, abcjs, vite, vite-plugin-pwa, @vite-pwa/assets-generator, vitest, typescript.
- **Content lives in `data/`** (JSON), never hard-coded in components. Never invent keyboard tone/rhythm/button names.
- **Public-domain notation only.** Modern songs: title + link only.
- **Routing:** `src/App.tsx` `ROUTES` maps the first hash segment to a lazy screen in `src/screens/<Name>.tsx`. A screen gets `{ params }` (remaining segments). Link with `href="#/songs/ode-to-joy"`.
- **State:** `src/store.ts`. Read with `useProgress()`, write with `setProgress(p => ({ ...p, ... }))`. Dates are `localDate()`, never `toISOString()`.
- **Styles:** use tokens (`var(--accent)` etc.) and primitives (`.btn`, `.btn-quiet`, `.card`, `.stack`, `.row`) from `src/styles.css`. Screen-only CSS goes in `src/screens/<Name>.css`, imported by that screen, with class names prefixed by the screen (`.kb-…`, `.song-…`).
- **iPad at arm's length:** tap targets ≥ `var(--tap)` (64px), body text ≥ 20px, high contrast, minimal scrolling in landscape.
- **Fast:** keep heavy libs (abcjs) inside the screen that uses them so they load lazily. No work on every render that could be memoized.
- **Audio on iOS:** create/resume an AudioContext only inside a tap handler.
- **Verify:** `npm run build` (type-check + build) and `npm test` must pass before you commit.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
