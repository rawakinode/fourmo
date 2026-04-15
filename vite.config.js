/**
 * vite.config.js
 *
 * Vite dev server configuration with proxy rules:
 *   - /api/four-meme/* → rewrites to Four.meme API (CORS bypass in dev)
 *   - /api/*           → proxies to local Express backend on :3001
 *
 * The Four.meme proxy must be declared before the general /api proxy
 * to avoid route conflicts (more specific path wins).
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Four.meme API proxy — strips prefix and forwards to origin
      '/api/four-meme': {
        target: 'https://four.meme',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/four-meme/, '/meme-api/v1'),
      },
      // Express backend (AI generation, analysis, marketing kit)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
