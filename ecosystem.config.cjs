/**
 * PM2: 4 backend + 4 frontend (каждый фронт: build → preview)
 * Старт:
 *   pm2 start ecosystem.config.cjs && pm2 save
 *
 * Принудительный ребилд фронта:
 *   pm2 restart frontend-uib-college --update-env --env FORCE_REBUILD=1
 */

const ROOT = '/root/app';

// Однострочная команда для фронта: экспорт env → (опционально) build → preview
function feCmd(distDir, port, envFileAbs) {
  return `
    export DOTENV_CONFIG_PATH=${envFileAbs} NODE_OPTIONS='-r dotenv/config';
    if [ "$FORCE_REBUILD" = "1" ] || [ ! -d ${distDir} ]; then
      pnpm --filter frontend exec vite build --outDir ${distDir};
    fi;
    pnpm --filter frontend exec vite preview --host 0.0.0.0 --port ${port} --strictPort --outDir ${distDir}
  `.replace(/\n\s+/g, ' ').trim();
}

module.exports = {
  apps: [
    // ==================== BACKENDS ====================
    {
      name: 'backend-fizmat-school',
      cwd: ROOT,
      script: 'apps/backend/dist/src/main.js',
      interpreter: 'node',
      node_args: '-r dotenv/config',
      env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/root/app/.env.fizmat-school' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
    },
    {
      name: 'backend-uib-college',
      cwd: ROOT,
      script: 'apps/backend/dist/src/main.js',
      interpreter: 'node',
      node_args: '-r dotenv/config',
      env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/root/app/.env.uib-college' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
    },
    {
      name: 'backend-fizmat-academy',
      cwd: ROOT,
      script: 'apps/backend/dist/src/main.js',
      interpreter: 'node',
      node_args: '-r dotenv/config',
      env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/root/app/.env.fizmat-academy' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
    },
    {
      name: 'backend-demo',
      cwd: ROOT,
      script: 'apps/backend/dist/src/main.js',
      interpreter: 'node',
      node_args: '-r dotenv/config',
      env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/root/app/.env.demo-abai' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
    },

    // ==================== FRONTENDS (build → preview) ====================
    {
      name: 'frontend-fizmat-school',
      cwd: ROOT,
      script: 'bash',
      args: ['-lc', feCmd('apps/frontend/dist-fizmat-school', 8221, '/root/app/.env.fizmat-school')],
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 2000, max_memory_restart: '512M'
    },
    {
      name: 'frontend-uib-college',
      cwd: ROOT,
      script: 'bash',
      args: ['-lc', feCmd('apps/frontend/dist-uib-college', 8222, '/root/app/.env.uib-college')],
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 2000, max_memory_restart: '512M'
    },
    {
      name: 'frontend-fizmat-academy',
      cwd: ROOT,
      script: 'bash',
      args: ['-lc', feCmd('apps/frontend/dist-fizmat-academy', 8223, '/root/app/.env.fizmat-academy')],
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 2000, max_memory_restart: '512M'
    },
    {
      name: 'frontend-demo',
      cwd: ROOT,
      script: 'bash',
      args: ['-lc', feCmd('apps/frontend/dist-demo', 8224, '/root/app/.env.demo-abai')],
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 2000, max_memory_restart: '512M'
    },
  ]
};
