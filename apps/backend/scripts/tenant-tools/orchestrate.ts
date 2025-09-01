import { config as loadEnv } from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from 'generated/prisma';

interface TenantBase {
  name: string;
  envFile: string; // absolute or relative path to .env.* file
}

interface ImportTenant extends TenantBase {
  action: 'import';
}

interface SeedTenant extends TenantBase {
  action: 'seed';
}

interface InitAdminTenant extends TenantBase {
  action: 'initAdmin';
  adminEmail: string;
  adminPassword: string;
}

type TenantConfig = ImportTenant | SeedTenant | InitAdminTenant;

const tenants: TenantConfig[] = [
  {
    name: 'fizmat-academy',
    envFile: path.join(__dirname, '../../../../.env.fizmat-academy'),
    action: 'import'
  },
  {
    name: 'demo-abai',
    envFile: path.join(__dirname, '../../../../.env.demo-abai'),
    action: 'seed'
  },
  {
    name: 'fizmat-school',
    envFile: path.join(__dirname, '../../../../.env.fizmat-school'),
    action: 'initAdmin',
    adminEmail: 'admin@fizmat-school.abai.live',
    adminPassword: 'Password123!'
  },
  {
    name: 'uib-college',
    envFile: path.join(__dirname, '../../../../.env.uib-college'),
    action: 'initAdmin',
    adminEmail: 'admin@uib-college.abai.live',
    adminPassword: 'Password123!'
  }
];

function log(title: string, msg: string) {
  console.log(`[${title}] ${msg}`);
}

function runPrismaDbPush(env: NodeJS.ProcessEnv) {
  const backendRoot = path.join(__dirname, '../..'); // apps/backend
  execSync('npx prisma db push', {
    stdio: 'inherit',
    env,
    cwd: backendRoot
  });
}

async function ensureAdmin(directUrl: string, email: string, password: string) {
  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      log('initAdmin', `Пользователь ${email} уже существует (role=${existing.role}) — пропуск`);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        role: 'ADMIN',
        name: 'Admin',
        surname: 'User',
        hashedPassword: hash
      }
    });
    log('initAdmin', `Создан админ ${email} / ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}

function loadTenantEnv(envFile: string) {
  // override чтобы переменные предыдущего tenant не залипали
  const res = loadEnv({ path: envFile, override: true });
  if (res.error) {
    throw new Error(`Не удалось загрузить env файл: ${envFile}: ${res.error.message}`);
  }
  const direct = process.env.DIRECT_URL || '';
  const database = process.env.DATABASE_URL || '';
  if (!direct && !database) {
    throw new Error(`В файле ${envFile} нет DIRECT_URL/DATABASE_URL`);
  }
  return { direct, database };
}

function buildEnvOverride(base: NodeJS.ProcessEnv, opts: { primary: string; direct?: string; database?: string }) {
  return {
    ...base,
    // сохраняем оба если есть
    DIRECT_URL: opts.direct || opts.primary,
    DATABASE_URL: opts.database || opts.primary
  };
}

function runImport(env: NodeJS.ProcessEnv) {
  // Reuse existing import-students.ts
  const importScript = path.join(__dirname, '..', 'import-students.ts');
  execSync(`npx tsx "${importScript}"`, { stdio: 'inherit', env });
}

function runSeed(env: NodeJS.ProcessEnv) {
  const seedScript = path.join(__dirname, '..', 'seed.ts');
  execSync(`npx tsx "${seedScript}"`, { stdio: 'inherit', env });
}

function runDbReset(env: NodeJS.ProcessEnv) {
  // Выполняем через lerna как просили: lerna run db:reset -- --force-reset
  const repoRoot = path.join(__dirname, '../../../../');
  execSync('npx lerna run db:reset --scope backend --stream', {
    stdio: 'inherit',
    env,
    cwd: repoRoot
  });
}

async function processTenant(t: TenantConfig) {
  log(t.name, `Начало обработки (env: ${t.envFile})`);
  const { direct: loadedDirect, database: loadedDatabase } = loadTenantEnv(t.envFile);
  log(t.name, `loaded DIRECT_URL=${loadedDirect ? loadedDirect.replace(/:[^:@/]+@/, ':****@') : '(empty)'}`);
  log(t.name, `loaded DATABASE_URL=${loadedDatabase ? loadedDatabase.replace(/:[^:@/]+@/, ':****@') : '(empty)'}`);

  // Предпочитаем DATABASE_URL (обычно другой порт 5433) как primary
  let primary = loadedDatabase || loadedDirect;
  // sanity: если primary указывает на порт 5432 а есть вторая переменная на 5433 — попробуем взять 5433
  if (primary && /:5432\//.test(primary) && loadedDatabase && /:5433\//.test(loadedDatabase)) {
    primary = loadedDatabase;
  }
  const fallbackCandidate = loadedDirect && loadedDatabase && loadedDirect !== loadedDatabase
    ? (primary === loadedDatabase ? loadedDirect : loadedDatabase)
    : null;

  if (!primary) {
    throw new Error('Нет валидного primary URL');
  }

  const maskedPrimary = primary.replace(/:[^:@/]+@/, ':****@');
  const envOverride = {
    ...buildEnvOverride(process.env, { primary, direct: loadedDirect, database: loadedDatabase }),
    DOTENV_PATH: t.envFile
  };

  log(t.name, 'db reset -> prisma migrate reset (через lerna)');
  try {
    runDbReset(envOverride);
  } catch (e:any) {
    log(t.name, `reset ошибка: ${e.message || e}`);
    // продолжаем всё равно
  }

  log(t.name, `db push primary -> ${maskedPrimary}`);
  try {
    runPrismaDbPush(envOverride);
  } catch (e: any) {
    if (fallbackCandidate && /P1001/.test(String(e))) {
      const maskedFallback = fallbackCandidate.replace(/:[^:@/]+@/, ':****@');
      log(t.name, `primary недоступен, пробуем fallback -> ${maskedFallback}`);
      const fallbackEnv = {
        ...buildEnvOverride(process.env, {
          primary: fallbackCandidate,
          direct: loadedDirect,
          database: loadedDatabase
        }),
        DOTENV_PATH: t.envFile
      };
      runPrismaDbPush(fallbackEnv);
      // используем fallback далее
      process.env.DATABASE_URL = fallbackEnv.DATABASE_URL;
      process.env.DIRECT_URL = fallbackEnv.DIRECT_URL;
    } else {
      throw e;
    }
  }

  switch (t.action) {
    case 'import':
      log(t.name, 'Запуск import-students');
      runImport(envOverride);
      break;
    case 'seed':
      log(t.name, 'Запуск seed');
      runSeed(envOverride);
      break;
    case 'initAdmin':
      log(t.name, `Создание/проверка админа ${t.adminEmail}`);
      await ensureAdmin(process.env.DIRECT_URL || process.env.DATABASE_URL || primary, t.adminEmail, t.adminPassword);
      break;
  }
  log(t.name, 'Готово');
}

async function main() {
  const started = Date.now();
  for (const tenant of tenants) {
    try {
      await processTenant(tenant);
    } catch (e) {
      console.error(`[${tenant.name}] Ошибка:`, e);
    }
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Все операции завершены за ${seconds}s`);
}

main().catch(e => {
  console.error('Fatal orchestrator error', e);
  process.exit(1);
});
