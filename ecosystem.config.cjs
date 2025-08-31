/**
 * PM2: один репо → 4 инстанса (fizmat-school, uib-college, fizmat-academy, client4)
 * Перед стартом один раз собери:
 *   pnpm --filter backend run build && pnpm --filter frontend run build
 * Запуск / перезапуск:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload all
 *   pm2 save
 */

const ROOT = '/root/app'; // корень монорепо

module.exports = {
    apps: [
        // ================== CLIENT 1 — fizmat-school ==================
        {
            name: 'backend-fizmat-school',
            cwd: ROOT,
            script: 'npx',
            args: 'lerna run --scope backend start', // внутри backend добавь dotenv.config({ path: process.env.ENV_FILE || ".env" })
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.fizmat-school' // backend сам читает этот файл (см. dotenv.config)
            },
            // опционально:
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },
        {
            name: 'frontend-fizmat-school',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8221 --strictPort',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.fizmat-school'
            },
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },

        // ================== CLIENT 2 — uib-college ==================
        {
            name: 'backend-uib-college',
            cwd: ROOT,
            script: 'npx',
            args: 'lerna run --scope backend start',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.uib-college'
            },
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },
        {
            name: 'frontend-uib-college',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8222 --strictPort',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.uib-college'
            },
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },

        // ================== CLIENT 3 — fizmat-academy ==================
        {
            name: 'backend-fizmat-academy',
            cwd: ROOT,
            script: 'npx',
            args: 'lerna run --scope backend start',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.fizmat-academy'
            },
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },
        {
            name: 'frontend-fizmat-academy',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8223 --strictPort',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.fizmat-academy'
            },
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            restart_delay: 3000,
            max_memory_restart: '512M'
        },

        // ================== CLIENT 4 — demo-abai ==================
        {
            name: 'backend-demo',
            cwd: ROOT,
            script: 'npx',
            args: 'lerna run --scope backend start',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.demo-abai'
            }
        },
        {
            name: 'frontend-demo',
            cwd: ROOT,
            script: 'pnpm',
            args: '--filter frontend run preview --host 0.0.0.0 --port 8224 --strictPort',
            env: {
                NODE_ENV: 'production',
                ENV_FILE: '.env.demo-abai'
            }
        }
    ]
};
