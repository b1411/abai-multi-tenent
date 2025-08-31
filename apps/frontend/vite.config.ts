// apps/frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

// 1) Подтягиваем .env из DOTENV_CONFIG_PATH (если задан)
(function loadDotenvFromPm2() {
  const p = process.env.DOTENV_CONFIG_PATH
  if (!p) return
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
  if (fs.existsSync(abs)) {
    const env = dotenv.config({ path: abs })
    dotenvExpand.expand(env)
    console.log('[vite] loaded env from', abs)
  } else {
    console.warn('[vite] DOTENV_CONFIG_PATH points to missing file:', abs)
  }
})()

// 2) Собираем ТОЛЬКО VITE_* для встраивания в import.meta.env
const replacements = Object.fromEntries(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith('VITE_'))
    .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v ?? '')])
)
// + стандартные флаги Vite (иначе мы их затрём)
Object.assign(replacements, {
  'import.meta.env.MODE': JSON.stringify(process.env.MODE ?? 'production'),
  'import.meta.env.PROD': 'true',
  'import.meta.env.DEV': 'false'
})

export default defineConfig({
  plugins: [react()],
  server: {
    // точка в начале — все поддомены этого домена
    allowedHosts: ['localhost', '.abai.live'],
    host: true
  },
  preview: {
    allowedHosts: ['localhost', '.abai.live'],
    host: true
  },
  // 3) Встраиваем только нужные ключи
  define: replacements
})
