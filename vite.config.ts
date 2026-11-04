import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH: "/piano-professor/" on GitHub Pages (set in the deploy workflow), "/" everywhere else (Vercel, local dev).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
