import { defaultAssetName, defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// After editing public/icon.svg run `npx pwa-assets-generator`; the generated PNGs are committed.
// Maskable + Apple icons get a terracotta background so OS cropping shows no white/black corners.
const resizeOptions = { background: '#C2410C' }
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions }, // iOS only rounds corners, so less padding
    assetName: (type, size) => (type === 'apple' ? 'apple-touch-icon.png' : defaultAssetName(type, size)),
  },
  images: ['public/icon.svg'],
})
