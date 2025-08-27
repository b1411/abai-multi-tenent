import { PrismaClient } from 'generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '../../.env' });

// Простой способ задать URL базы: впиши сюда. Если пусто, возьмёт DATABASE_URL из .env
const DB_URL = 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19tenIwNE5MU0RuU1hPR2RDRlhHQ2kiLCJhcGlfa2V5IjoiMDFLMTJUSDA4RURCODBTVEI1RTVZVEpYNkciLCJ0ZW5hbnRfaWQiOiJjYmY2OTk4ZTJmMmQwODc2YTllZDI2ZjdkMjU1OTY0NWE0NmU2MzQ5MWVjZWMyYTUwOTllMzhjZGRiNjVhODM0IiwiaW50ZXJuYWxfc2VjcmV0IjoiZmQ5YzgwM2UtYWE0NC00NzQwLTkzZmEtNGVkNzJkNjU1ZDU3In0.9Fimq73RHYEBjNUnLKP7hGQ84tYRdjJ2_avlGpLY4ek';
const dbUrl = DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('Не задан URL базы данных (заполните DB_URL или переменную окружения DATABASE_URL)');
    process.exit(1);
}
console.log('Подключение к БД:', dbUrl.replace(/:[^:@/]+@/, ':****@'));
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

/**
 * ВАЖНО: теперь
 *  - поле "Курс" в исходном JSON = название группы (строка)
 *  - поле "Группа" = номер курса (courseNumber, число)
 */
interface StudentJson {
    Email: string;
    "Фамилия": string;
    "Имя": string;
    "Отчество": string;
    "Телефон": string;
    "ДатаРождения": string;
    "Группа": string; // номер курса (число в строке)
    "Курс": string;   // название группы
    "Пароль": string;
}

interface NormalizedStudent {
    email: string;
    surname: string;
    name: string;
    middlename: string | null;
    phone: string | null;
    birthDate?: Date;
    rawGroupNumber: string; // из "Группа"
    rawGroupName: string;   // из "Курс"
    groupName: string;
    courseNumber: number;
    password: string; // plain before hash
}

// ---- TEACHERS ----
interface TeacherJson {
    Email: string;
    "Фамилия": string;
    "Имя": string;
    "Отчество": string;
    "Телефон": string;
    "ДатаРождения": string;
    "Пароль": string;
}

interface NormalizedTeacher {
    email: string;
    surname: string;
    name: string;
    middlename: string | null;
    phone: string | null;
    birthDate?: Date;
    password: string;
}

function normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return null;
    if (digits.length === 11 && digits.startsWith('87')) return '+7' + digits.substring(1);
    if (digits.length === 10 && digits.startsWith('7')) return '+7' + digits;
    return '+' + digits;
}

function normalizeDate(raw: string): Date | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? undefined : d;
    }
    if (/^(\d{2})[./-](\d{2})[./-](\d{4})$/.test(trimmed)) {
        const m = trimmed.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
        if (m) {
            const [, dd, mm, yyyy] = m;
            const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
            return isNaN(d.getTime()) ? undefined : d;
        }
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? undefined : d;
}

function getCommonPassword(): string {
    const COMMON_PASSWORD = 'Student123!';
    return COMMON_PASSWORD;
}

function capitalizeFioPart(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(/([\s-]+)/)
        .map(part => {
            const first = part.charAt(0);
            if (/[a-zа-яё]/i.test(first)) {
                return first.toUpperCase() + part.slice(1);
            }
            return part;
        })
        .join('');
}

function normalizeStudent(s: StudentJson): NormalizedStudent | null {
    if (!s.Email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.Email)) {
        console.warn(`Пропуск записи: некорректный email '${s.Email}'`);
        return null;
    }
    const groupNumberRaw = (s['Группа'] || '').trim(); // номер курса
    const groupNameRaw = (s['Курс'] || '').trim();     // название группы

    let courseNumber = 1;
    if (/^\d+$/.test(groupNumberRaw)) {
        courseNumber = parseInt(groupNumberRaw, 10);
    }

    const groupName = groupNameRaw || 'UNASSIGNED';

    return {
        email: s.Email.trim().toLowerCase(),
        surname: capitalizeFioPart((s['Фамилия'] || '').trim()) || 'Unknown',
        name: capitalizeFioPart((s['Имя'] || '').trim()) || 'Unknown',
        middlename: capitalizeFioPart((s['Отчество'] || '').trim()) || null,
        phone: normalizePhone(s['Телефон']),
        birthDate: normalizeDate(s['ДатаРождения']),
        rawGroupNumber: groupNumberRaw,
        rawGroupName: groupNameRaw,
        groupName,
        courseNumber,
        password: getCommonPassword()
    };
}

function normalizeTeacher(t: TeacherJson): NormalizedTeacher | null {
    if (!t.Email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.Email)) {
        console.warn(`Пропуск преподавателя: некорректный email '${t.Email}'`);
        return null;
    }
    return {
        email: t.Email.trim().toLowerCase(),
        surname: capitalizeFioPart((t['Фамилия'] || '').trim()) || 'Unknown',
        name: capitalizeFioPart((t['Имя'] || '').trim()) || 'Unknown',
        middlename: capitalizeFioPart((t['Отчество'] || '').trim()) || null,
        phone: normalizePhone(t['Телефон']),
        birthDate: normalizeDate(t['ДатаРождения']),
        password: (t['Пароль'] || '').trim() || 'Teacher123!'
    };
}

async function findOrCreateGroup(groupName: string, courseNumber: number) {
    let group = await prisma.group.findFirst({ where: { name: groupName, courseNumber } });
    if (!group) {
        group = await prisma.group.create({ data: { name: groupName, courseNumber } });
        console.log(`Создана группа '${groupName}' (courseNumber=${courseNumber})`);
    }
    return group;
}

async function upsertStudent(st: NormalizedStudent) {
    const existingUser = await prisma.user.findUnique({ where: { email: st.email } });
    if (existingUser) {
        const existingStudent = await prisma.student.findFirst({ where: { userId: existingUser.id } });
        if (!existingStudent) {
            const group = await findOrCreateGroup(st.groupName, st.courseNumber);
            await prisma.student.create({ data: { userId: existingUser.id, groupId: group.id } });
            console.log(`Добавлена сущность Student для существующего пользователя ${st.email}`);
        }
        return { status: 'skip-exists' as const };
    }

    const group = await findOrCreateGroup(st.groupName, st.courseNumber);
    const hashedPassword = await bcrypt.hash(st.password, 10);
    const user = await prisma.user.create({
        data: {
            email: st.email,
            name: st.name,
            surname: st.surname,
            middlename: st.middlename,
            phone: st.phone,
            birthDate: st.birthDate,
            role: 'STUDENT',
            hashedPassword
        }
    });
    await prisma.student.create({ data: { userId: user.id, groupId: group.id } });
    return { status: 'created' as const, password: st.password };
}

async function upsertTeacher(t: NormalizedTeacher) {
    const existingUser = await prisma.user.findUnique({ where: { email: t.email } });
    if (existingUser) {
        if (existingUser.role !== 'TEACHER') {
            const existingTeacher = await prisma.teacher.findFirst({ where: { userId: existingUser.id } });
            if (existingTeacher) return { status: 'skip-exists' as const };
            console.warn(`Пользователь ${t.email} с ролью ${existingUser.role} — пропущено (не меняем роль).`);
            return { status: 'role-mismatch' as const };
        }
        const existingTeacher = await prisma.teacher.findFirst({ where: { userId: existingUser.id } });
        if (!existingTeacher) {
            await prisma.teacher.create({ data: { userId: existingUser.id } });
            console.log(`Добавлена сущность Teacher для существующего пользователя ${t.email}`);
        }
        return { status: 'skip-exists' as const };
    }

    const hashedPassword = await bcrypt.hash(t.password, 10);
    const user = await prisma.user.create({
        data: {
            email: t.email,
            name: t.name,
            surname: t.surname,
            middlename: t.middlename,
            phone: t.phone,
            birthDate: t.birthDate,
            role: 'TEACHER',
            hashedPassword
        }
    });
    await prisma.teacher.create({ data: { userId: user.id } });
    return { status: 'created' as const };
}

async function ensureAdmins(admins: {
    email: string;
    name: string;
    surname: string;
}[], passwordPlain: string) {
    const hashed = await bcrypt.hash(passwordPlain, 10);
    for (const admin of admins) {
        let user = await prisma.user.findUnique({ where: { email: admin.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: admin.email,
                    name: admin.name,
                    surname: admin.surname,
                    role: 'ADMIN',
                    hashedPassword: hashed
                }
            });
            console.log(`Создан админ ${admin.email}`);
        } else if (user.role !== 'ADMIN') {
            console.warn(`Пользователь ${admin.email} уже существует с ролью ${user.role} (роль не меняем).`);
        }
    }
}

async function main() {
    function printProgress(label: string, current: number, total: number) {
        const barLength = 20;
        const ratio = total ? current / total : 0;
        const filled = Math.round(ratio * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        const pct = (ratio * 100).toFixed(1).padStart(5, ' ');
        process.stdout.write(`\r${label} ${bar} ${pct}% (${current}/${total})`);
        if (current === total) process.stdout.write('\n');
    }
    // --- Students ---
    const studentsPath = path.resolve(__dirname, 'students.json');
    const studentStats = { created: 0, skipped: 0, failed: 0 };
    if (fs.existsSync(studentsPath)) {
        try {
            const rawStudents = JSON.parse(fs.readFileSync(studentsPath, 'utf-8')) as unknown;
            if (Array.isArray(rawStudents)) {
                const studentsArr = rawStudents as StudentJson[];
                const totalStudents = studentsArr.length;
                let processed = 0;
                for (const s of studentsArr) {
                    const normalized = normalizeStudent(s);
                    if (!normalized) { studentStats.skipped++; processed++; printProgress('Студенты     ', processed, totalStudents); continue; }
                    try {
                        const res = await upsertStudent(normalized);
                        if (res.status === 'created') {
                            studentStats.created++;
                        } else {
                            studentStats.skipped++;
                        }
                    } catch (e) {
                        studentStats.failed++;
                        console.error(`\nОшибка при обработке студента ${s.Email}:`, e);
                    }
                    processed++;
                    printProgress('Студенты     ', processed, totalStudents);
                }
            } else {
                console.error('students.json: ожидался массив.');
            }
        } catch (e) {
            console.error('Ошибка чтения students.json:', e);
        }
    } else {
        console.warn('Файл students.json не найден — блок импорта студентов пропущен.');
    }

    // --- Teachers ---
    const teachersPath = path.resolve(__dirname, 'teachers.json');
    const teacherStats = { created: 0, skipped: 0, failed: 0, roleMismatch: 0 };
    if (fs.existsSync(teachersPath)) {
        try {
            const rawTeachers = JSON.parse(fs.readFileSync(teachersPath, 'utf-8')) as unknown;
            if (Array.isArray(rawTeachers)) {
                const teachersArr = rawTeachers as TeacherJson[];
                const totalTeachers = teachersArr.length;
                let processedT = 0;
                for (const t of teachersArr) {
                    const normalized = normalizeTeacher(t);
                    if (!normalized) { teacherStats.skipped++; processedT++; printProgress('Преподаватели', processedT, totalTeachers); continue; }
                    try {
                        const res = await upsertTeacher(normalized);
                        if (res.status === 'created') {
                            teacherStats.created++;
                        } else if (res.status === 'role-mismatch') {
                            teacherStats.roleMismatch++;
                        } else {
                            teacherStats.skipped++;
                        }
                    } catch (e) {
                        teacherStats.failed++;
                        console.error(`\nОшибка при обработке преподавателя ${t.Email}:`, e);
                    }
                    processedT++;
                    printProgress('Преподаватели', processedT, totalTeachers);
                }
            } else {
                console.error('teachers.json: ожидался массив.');
            }
        } catch (e) {
            console.error('Ошибка чтения teachers.json:', e);
        }
    } else {
        console.warn('Файл teachers.json не найден — блок импорта преподавателей пропущен.');
    }

    // --- Admins ---
    await ensureAdmins([{
        email: 'eraliev.dias@gmail.com',
        name: "Диас",
        surname: "Ералиев"
    }, {
        email: 'kambarbekalisher@gmail.com',
        name: "Алишер",
        surname: "Камбарбек"
    }], 'Password123!');

    // --- Summary ---
    console.log('\n=== Итог Импорта ===');
    console.log('Студенты: создано', studentStats.created, 'пропущено', studentStats.skipped, 'ошибок', studentStats.failed);
    console.log(`(Общий пароль студентов: ${getCommonPassword()})`);
    console.log('Преподаватели: создано', teacherStats.created, 'пропущено', teacherStats.skipped, 'ошибок', teacherStats.failed, 'roleMismatch', teacherStats.roleMismatch);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
