# Piano Professor 🎹

A warm, friendly piano-practice app for a beginner on a JIKADA JK-825 keyboard. It installs to the iPad/iPhone home screen and keeps all progress on the device (no accounts, no server).

Plan: [PLAN.md](PLAN.md) · Keyboard research: [research/keyboard.md](research/keyboard.md) · Credits: [research/licenses.md](research/licenses.md)

## Run it locally
```bash
npm install
npm run dev        # opens on http://localhost:5173 and on your Wi-Fi (the "Network" URL works on the iPad too)
npm run build      # type-check + production build into dist/
```

## Deploy (GitHub Pages)
Done once:
1. On GitHub, create a **private** repo named `piano-professor` (no README, no .gitignore; this folder already has them).
2. In this folder:
   ```bash
   git remote add origin https://github.com/<your-username>/piano-professor.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   (Private repos can use Pages thanks to GitHub Pro. The *site* is still public at its URL; only the code is private.)
4. Repo → **Actions** tab → if the first run failed because Pages wasn't enabled yet, open it and click **Re-run all jobs**.

After that, **every push to `main` redeploys automatically.**

### Verify a deploy
- **Actions** tab: the latest "Deploy to GitHub Pages" run has a green check ✅.
- Open `https://<your-username>.github.io/piano-professor/`, and the app loads.
- Changes not showing? Wait about 1 minute, then pull-to-refresh. (After M2 adds offline mode, the app updates itself on the next launch.)

### Moving to Vercel later
Import the repo in Vercel. Leave `BASE_PATH` unset (it defaults to `/`). No code changes needed.

## Install on iPad / iPhone
1. Open the site in **Safari** (it must be Safari on iOS).
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
3. **Always open Piano Professor from that icon.** The icon app keeps its own saved progress, separate from the Safari tab. Opening the website in Safari will look like a fresh start.
4. Use **Me → Export progress** now and then as a backup (arrives in M3).
