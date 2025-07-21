import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    "allowedHosts": [
      "localhost",
      "*.abai.live"
    ], port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
  },
  preview: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    allowedHosts: [
      "localhost",
      "*.abai.live"
    ]
  },
})
