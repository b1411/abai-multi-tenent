import { config as loadEnv } from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
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

// Фильтр: можно запустить для одного / нескольких тенантов:
//   --tenant=uib-college
//   --tenants=uib-college,fizmat-school
const tenantArg = process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];
const tenantsArg = process.argv.find(a => a.startsWith('--tenants='))?.split('=')[1];
let selectedTenants = tenants;
if (tenantsArg) {
  const list = tenantsArg.split(',').map(s => s.trim()).filter(Boolean);
  selectedTenants = tenants.filter(t => list.includes(t.name));
} else if (tenantArg) {
  selectedTenants = tenants.filter(t => t.name === tenantArg);
}
if (selectedTenants.length === 0) {
  if (tenantArg || tenantsArg) {
    console.error('Нет подходящих tenants для указанных аргументов');
    process.exit(1);
  }
}

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
      // Специальная логика для uib-college: преобразовать college-students.json -> students.json и выполнить импорт перед созданием админа
      if (t.name === 'uib-college') {
        try {
          const scriptsDir = path.join(__dirname, '..');
            const collegePath = path.join(scriptsDir, 'college-students.json');
            const studentsPath = path.join(scriptsDir, 'students.json');
            if (fs.existsSync(collegePath)) {
              const raw = JSON.parse(fs.readFileSync(collegePath, 'utf-8')) as any[];
              if (Array.isArray(raw)) {
                const transformed = raw.map(r => ({
                  Email: (r['Почта'] || '').toString().trim(),
                  "Фамилия": (r['Фамилия'] || '').toString().trim(),
                  "Имя": (r['Имя'] || '').toString().trim(),
                  "Отчество": (r['Отчество'] || '').toString().trim(),
                  "Телефон": (r['Номер телефона'] == null ? '' : String(r['Номер телефона'])).trim(),
                  "ДатаРождения": (r['Дата рождения'] || '').toString().trim(),
                  // В college-students.json "Группа" = название группы, "Курс" = номер курса
                  "Группа": (r['Курс'] == null ? '' : String(r['Курс'])).trim(), // номер курса (ожидается как строка числа)
                  "Курс": (r['Группа'] || '').toString().trim(), // название группы
                  "Пароль": '' // будет заменён скриптом import-students на общий пароль
                }));
                fs.writeFileSync(studentsPath, JSON.stringify(transformed, null, 2), 'utf-8');
                log(t.name, `Сформирован students.json (${transformed.length}) из college-students.json`);
                log(t.name, 'Запуск import-students (college, SKIP_TEACHERS=1)');
                const importEnv = { ...envOverride, SKIP_TEACHERS: '1' };
                runImport(importEnv);

                // Дополнительно: преподаватели колледжа
                // Преобразуем apps/backend/scripts/college_teachers.json -> teachers.json и запускаем импорт (без SKIP_TEACHERS)
                try {
                  const collegeTeachersPath = path.join(scriptsDir, 'college_teachers.json');
                  const teachersPath = path.join(scriptsDir, 'teachers.json');
                  if (fs.existsSync(collegeTeachersPath)) {
                    const rawT = JSON.parse(fs.readFileSync(collegeTeachersPath, 'utf-8')) as any[];
                    if (Array.isArray(rawT)) {
                      const transformedT = rawT.map(r => ({
                        Email: (r['почта '] || r['Почта'] || r['email'] || r['Email'] || '').toString().trim(),
                        "Фамилия": (r['Фамилия '] || r['Фамилия'] || '').toString().trim(),
                        "Имя": (r['Имя'] || '').toString().trim(),
                        "Отчество": (r['Отчество'] || '').toString().trim(),
                        "Телефон": ((r['номер телефона '] ?? r['Номер телефона'] ?? r['Телефон'] ?? '') + '').toString().trim(),
                        "ДатаРождения": (r['дата рождения '] ?? r['Дата рождения'] ?? r['ДатаРождения'] ?? '').toString().trim(),
                        "Пароль": ''
                      }));
                      fs.writeFileSync(teachersPath, JSON.stringify(transformedT, null, 2), 'utf-8');
                      log(t.name, `Сформирован teachers.json (${transformedT.length}) из college_teachers.json`);
                      log(t.name, 'Запуск import-students для преподавателей (college)');
                      runImport(envOverride);
                    } else {
                      log(t.name, 'college_teachers.json: ожидался массив');
                    }
                  } else {
                    log(t.name, 'college_teachers.json не найден — пропуск импорта преподавателей колледжа');
                  }
                } catch (e:any) {
                  log(t.name, `Ошибка преобразования college_teachers.json: ${e.message || e}`);
                }
              } else {
                log(t.name, 'college-students.json: ожидался массив');
              }
            } else {
              log(t.name, 'college-students.json не найден — пропуск импорта студентов колледжа');
            }
        } catch (e:any) {
          log(t.name, `Ошибка преобразования college-students.json: ${e.message || e}`);
        }
      }
      log(t.name, `Создание/проверка админа ${t.adminEmail}`);
      await ensureAdmin(process.env.DIRECT_URL || process.env.DATABASE_URL || primary, t.adminEmail, t.adminPassword);
      break;
  }
  log(t.name, 'Готово');
}

async function main() {
  const started = Date.now();
  for (const tenant of selectedTenants) {
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
