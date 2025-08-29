/**
 * Простой pm2 конфиг без TS чтобы не требовался bun/ts-node.
 * Сборка (один раз перед стартом):
 *   pnpm --filter backend run build && pnpm --filter frontend run build
 * Старт:
 *   pm2 start ecosystem.config.cjs
 */

module.exports = {
    apps: [
        {
            name: 'backend',
            script: 'pnpm',
            args: 'run start',
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
