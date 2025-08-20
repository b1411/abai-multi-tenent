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

interface StudentJson {
    Email: string;
    "Фамилия": string;
    "Имя": string;
    "Отчество": string;
    "Телефон": string;
    "ДатаРождения": string;
    "Группа": string;
    "Курс": string;
    "Пароль": string;
}

interface NormalizedStudent {
    email: string;
    surname: string;
    name: string;
    middlename: string | null;
    phone: string | null;
    birthDate?: Date;
    rawGroup: string;
    rawCourse: string;
    courseName: string | null;
    groupName: string;
    courseNumber: number; // fallback 1 when unknown
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
    "Пароль": string; // индивидуальный пароль (не меняем если пользователь уже существует)
}

interface NormalizedTeacher {
    email: string;
    surname: string;
    name: string;
    middlename: string | null;
    phone: string | null;
    birthDate?: Date;
    password: string; // plain before hash
}

function normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return null;
    // Kazakhstan / RU style starting with 87 -> +7
    if (digits.length === 11 && digits.startsWith('87')) {
        return '+7' + digits.substring(1);
    }
    if (digits.length === 10 && digits.startsWith('7')) {
        return '+7' + digits;
    }
    return '+' + digits; // generic fallback
}

function normalizeDate(raw: string): Date | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    // Try ISO first
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? undefined : d;
    }
    // Try dd.mm.yyyy
    if (/^(\d{2})[./-](\d{2})[./-](\d{4})$/.test(trimmed)) {
        const [, dd, mm, yyyy] = trimmed.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        return isNaN(d.getTime()) ? undefined : d;
    }
    // Fallback new Date
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? undefined : d;
}

// Теперь всегда возвращаем единый пароль (константа внутри функции)
function getCommonPassword(): string {
    const COMMON_PASSWORD = 'Student123!';
    return COMMON_PASSWORD;
}

function normalizeStudent(s: StudentJson): NormalizedStudent | null {
    if (!s.Email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.Email)) {
        console.warn(`Пропуск записи: некорректный email '${s.Email}'`);
        return null;
    }
    const groupRaw = (s['Группа'] || '').trim();
    const courseRaw = (s['Курс'] || '').trim();

    // Determine courseNumber (int) - try parse courseRaw else groupRaw else 1
    let courseNumber: number = 1;
    if (/^\d+$/.test(courseRaw)) courseNumber = parseInt(courseRaw, 10);
    else if (/^\d+$/.test(groupRaw)) courseNumber = parseInt(groupRaw, 10);

    // Determine group name: prefer groupRaw else courseRaw else 'UNASSIGNED'
    let groupName = groupRaw || courseRaw || 'UNASSIGNED';
    // Keep groupName concise
    groupName = groupName.toString();

    return {
        email: s.Email.trim().toLowerCase(),
        surname: (s['Фамилия'] || '').trim() || 'Unknown',
        name: (s['Имя'] || '').trim() || 'Unknown',
        middlename: (s['Отчество'] || '').trim() || null,
        phone: normalizePhone(s['Телефон']),
        birthDate: normalizeDate(s['ДатаРождения']),
        rawGroup: groupRaw,
        rawCourse: courseRaw,
        courseName: courseRaw || null,
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
        surname: (t['Фамилия'] || '').trim() || 'Unknown',
        name: (t['Имя'] || '').trim() || 'Unknown',
        middlename: (t['Отчество'] || '').trim() || null,
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

// Кэш для study plans и групп
const studyPlanCache = new Map<string, number>(); // name -> id
let defaultTeacherId: number | null | undefined = undefined;
let studyPlansCreated = 0;
let groupStudyPlanLinks = 0;

async function getDefaultTeacherId(): Promise<number | null> {
    if (defaultTeacherId !== undefined) return defaultTeacherId;
    const teacher = await prisma.teacher.findFirst({ orderBy: { id: 'asc' } });
    if (teacher) {
        defaultTeacherId = teacher.id;
        return defaultTeacherId;
    }
    // Создаем stub преподавателя
    const STUB_EMAIL = 'stub.teacher@local';
    const existingStubUser = await prisma.user.findUnique({ where: { email: STUB_EMAIL } });
    let stubTeacherId: number | null = null;
    if (existingStubUser) {
        const existingTeacher = await prisma.teacher.findFirst({ where: { userId: existingStubUser.id } });
        if (existingTeacher) {
            stubTeacherId = existingTeacher.id;
        }
    }
    if (!stubTeacherId) {
        const hashed = await bcrypt.hash('StubTeacher123!', 10);
        const user = await prisma.user.create({
            data: {
                email: STUB_EMAIL,
                name: 'Stub',
                surname: 'Teacher',
                middlename: 'Auto',
                role: 'TEACHER',
                hashedPassword: hashed
            }
        });
        const t = await prisma.teacher.create({ data: { userId: user.id } });
        stubTeacherId = t.id;
        console.log(`Создан stub преподаватель (email=${STUB_EMAIL}, id=${stubTeacherId}).`);
    }
    defaultTeacherId = stubTeacherId;
    return defaultTeacherId;
}

async function findOrCreateStudyPlan(name: string, groupId: number): Promise<number | null> {
    if (!name) return null;
    if (studyPlanCache.has(name)) {
        const id = studyPlanCache.get(name);
        // добавить группу к study plan (идемпотентно)
        try {
            await prisma.studyPlan.update({ where: { id }, data: { group: { connect: { id: groupId } } } });
            groupStudyPlanLinks++;
        } catch { /* ignore */ }
        return id;
    }
    const existing = await prisma.studyPlan.findFirst({ where: { name } });
    if (existing) {
        studyPlanCache.set(name, existing.id);
        try {
            await prisma.studyPlan.update({ where: { id: existing.id }, data: { group: { connect: { id: groupId } } } });
            groupStudyPlanLinks++;
        } catch { /* ignore */ }
        return existing.id;
    }
    const teacherId = await getDefaultTeacherId();
    if (!teacherId) return null; // нельзя создать
    const created = await prisma.studyPlan.create({
        data: {
            name,
            description: 'Автоматически создано при импорте студентов',
            teacher: { connect: { id: teacherId } },
            group: { connect: { id: groupId } }
        }
    });
    studyPlanCache.set(name, created.id);
    studyPlansCreated++;
    groupStudyPlanLinks++;
    console.log(`Создан StudyPlan '${name}' (id=${created.id}) и привязана группа id=${groupId}`);
    return created.id;
}

async function upsertStudent(st: NormalizedStudent) {
    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email: st.email } });
    if (existingUser) {
        // Ensure student entity exists & group assignment (skip password change)
        const existingStudent = await prisma.student.findFirst({ where: { userId: existingUser.id } });
        if (!existingStudent) {
            // Need group
            const group = await findOrCreateGroup(st.groupName, st.courseNumber);
            if (st.courseName) {
                await findOrCreateStudyPlan(st.courseName, group.id);
            }
            await prisma.student.create({ data: { userId: existingUser.id, groupId: group.id } });
            console.log(`Добавлена сущность Student для существующего пользователя ${st.email}`);
        }
        return { status: 'skip-exists' as const };
    }

    const group = await findOrCreateGroup(st.groupName, st.courseNumber);
    if (st.courseName) {
        await findOrCreateStudyPlan(st.courseName, group.id);
    }
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
        // Если пользователь есть, но роль не TEACHER — не трогаем (избегаем неожиданных изменений)
        if (existingUser.role !== 'TEACHER') {
            const existingTeacher = await prisma.teacher.findFirst({ where: { userId: existingUser.id } });
            if (existingTeacher) {
                return { status: 'skip-exists' as const };
            }
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

async function main() {
    // --- Students ---
    const studentsPath = path.resolve(__dirname, 'students.json');
    const studentStats = { created: 0, skipped: 0, failed: 0 };
    if (fs.existsSync(studentsPath)) {
        try {
            const rawStudents = JSON.parse(fs.readFileSync(studentsPath, 'utf-8')) as unknown;
            if (Array.isArray(rawStudents)) {
                for (const s of rawStudents as StudentJson[]) {
                    const normalized = normalizeStudent(s);
                    if (!normalized) { studentStats.skipped++; continue; }
                    try {
                        const res = await upsertStudent(normalized);
                        if (res.status === 'created') {
                            studentStats.created++;
                            console.log(`Создан студент: ${normalized.surname} ${normalized.name} (${normalized.email})`);
                        } else {
                            studentStats.skipped++;
                            console.log(`Пропуск студента (уже существует): ${normalized.email}`);
                        }
                    } catch (e) {
                        studentStats.failed++;
                        console.error(`Ошибка при обработке студента ${s.Email}:`, e);
                    }
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
                for (const t of rawTeachers as TeacherJson[]) {
                    const normalized = normalizeTeacher(t);
                    if (!normalized) { teacherStats.skipped++; continue; }
                    try {
                        const res = await upsertTeacher(normalized);
                        if (res.status === 'created') {
                            teacherStats.created++;
                            console.log(`Создан преподаватель: ${normalized.surname} ${normalized.name} (${normalized.email})`);
                        } else if (res.status === 'role-mismatch') {
                            teacherStats.roleMismatch++;
                        } else {
                            teacherStats.skipped++;
                            console.log(`Пропуск преподавателя (уже существует): ${normalized.email}`);
                        }
                    } catch (e) {
                        teacherStats.failed++;
                        console.error(`Ошибка при обработке преподавателя ${t.Email}:`, e);
                    }
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

    // --- Summary ---
    console.log('\n=== Итог Импорта ===');
    console.log('Студенты: создано', studentStats.created, 'пропущено', studentStats.skipped, 'ошибок', studentStats.failed);
    console.log(`(Общий пароль студентов: ${getCommonPassword()})`);
    console.log('Преподаватели: создано', teacherStats.created, 'пропущено', teacherStats.skipped, 'ошибок', teacherStats.failed, 'roleMismatch', teacherStats.roleMismatch);
    console.log('Создано учебных планов (StudyPlan):', studyPlansCreated);
    console.log('Привязок групп к учебным планам:', groupStudyPlanLinks);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
