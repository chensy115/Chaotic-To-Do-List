import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { roastProxy } from './vite-plugin-roast-proxy.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    roastProxy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og.png', 'og.svg', 'pwa-icon.svg'],
      manifest: {
        name: '赛博抬杠待办',
        short_name: '抬杠待办',
        description: '加任务被 AI 怼，完成按钮会逃跑。普通的 Todo 催你上进，这个劝你躺平。',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        lang: 'zh-CN',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        // 不缓存 /api/roast；仅预缓存构建产物
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
