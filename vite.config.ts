/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH: "/piano-professor/" on GitHub Pages (set in the deploy workflow), "/" everywhere else (Vercel, local dev).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeManifestIcons: false, // globPatterns already precaches public/*.png
      manifest: {
        name: 'Piano Professor',
        short_name: 'Piano Prof',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#FFF6EC',
        background_color: '#FFF6EC',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // the lazy abcjs Songs chunk is large
      },
    }),
  ],
  test: { passWithNoTests: true },
})
