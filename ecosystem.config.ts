/**
 * pm2 конфиг.
 * build: pnpm --filter backend run build && pnpm --filter frontend run build
 * start: pm2 start ecosystem.config.ts
 */
const config = {
  apps: [
    {
      name: 'backend',
      cwd: 'apps/backend',
      script: 'dist/main.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'frontend',
      cwd: 'apps/frontend',
      script: 'pnpm',
      args: 'run preview',
      env: { NODE_ENV: 'production' }
    }
  ]
};

export default config;
