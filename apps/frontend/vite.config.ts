import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    "allowedHosts": [
      "localhost",
      "*.abai.live"
    ]
  },
  preview: {
    allowedHosts: [
      "localhost",
      "*.abai.live"
    ],
    host: "::"
  },
})
