/**
 * PM2: один репо → 4 инстанса
 * Билд один раз:
 *   pnpm --filter backend run build && pnpm --filter frontend run build
 * Старт:
 *   pm2 start ecosystem.config.cjs && pm2 save
 */

const ROOT = '/root/app';

module.exports = {
    apps: [
        // =============== CLIENT 1 — fizmat-school ===============
        {
            name: 'backend-fizmat-school',
            cwd: ROOT,
            script: 'apps/backend/dist/main.js',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.fizmat-school'   // <-- лежит в корне монорепо
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },
        {
            name: 'frontend-fizmat-school',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8221 --strictPort',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.fizmat-school'   // для твоего кастомного vite.config с dotenv (если используешь)
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },

        // =============== CLIENT 2 — uib-college ===============
        {
            name: 'backend-uib-college',
            cwd: ROOT,
            script: 'apps/backend/dist/main.js',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.uib-college'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },
        {
            name: 'frontend-uib-college',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8222 --strictPort',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.uib-college'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },

        // =============== CLIENT 3 — fizmat-academy ===============
        {
            name: 'backend-fizmat-academy',
            cwd: ROOT,
            script: 'apps/backend/dist/main.js',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.fizmat-academy'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },
        {
            name: 'frontend-fizmat-academy',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8223 --strictPort',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.fizmat-academy'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },

        // =============== CLIENT 4 — demo-abai ===============
        {
            name: 'backend-demo',
            cwd: ROOT,
            script: 'apps/backend/dist/main.js',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.demo-abai'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },
        {
            name: 'frontend-demo',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8224 --strictPort',
            interpreter: 'node',
            node_args: '-r dotenv/config',
            env: {
                NODE_ENV: 'production',
                DOTENV_CONFIG_PATH: '.env.demo-abai'
            },
            exec_mode: 'fork', instances: 1, autorestart: true, restart_delay: 3000, max_memory_restart: '512M'
        },
    ]
};
