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
            cwd: '/root/app', // <-- корень монорепо (поправь путь)
            script: 'npx',
            args: 'lerna run --scope backend start',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'frontend',
            cwd: '/root/app', // <-- корень монорепо
            script: 'npx',
            // сначала build, затем preview на 8122
            args: 'lerna run --scope frontend preview -- --port 8122',
            env: { NODE_ENV: 'production' }
        }
    ]
};

