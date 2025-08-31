import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import dotenv from "dotenv"

const envFile = process.env.DOTENV_CONFIG_PATH
  ? path.resolve(process.cwd(), process.env.DOTENV_CONFIG_PATH)
  : path.resolve(process.cwd(), '.env');

if (envFile) {
  dotenv.config({ path: envFile })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    "allowedHosts": [
      "localhost",
      "*.abai.live"
    ],
  },
  preview: {
    allowedHosts: [
      "localhost",
      ".abai.live",
    ],
    host: "::"
  },
  define: {
    'import.meta.env': {
      ...process.env
    }
  }
})
