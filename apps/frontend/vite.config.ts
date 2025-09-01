// apps/frontend/vite.config.ts (simplified: rely on PM2 dotenv preload)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['localhost', '.abai.live'],
    host: true
  },
  preview: {
    allowedHosts: ['localhost', '.abai.live'],
    host: true
  }
})
