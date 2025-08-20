/*
 * Comprehensive IDEMPOTENT seed script (phase 1 baseline).
 * Focus: core academic + finance + notifications + workloads + widgets.
 * Safe to re-run: uses find/upsert style helpers keyed by unique fields (email, names, composites).
 * Localized RU/KZ realistic sample data.
 * Extendable: add more domain seeds in clearly marked sections.
 */
import { PrismaClient, UserRole } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';
import { config } from "dotenv"

config({
    path: "../../.env.production"
});

console.log(process.env.DATABASE_URL)
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19MTVJXUUl0RlFGWTlWTnFDbTRLZHYiLCJhcGlfa2V5IjoiMDFLMzNQSDhSUEY0MEhEMFZOREIzSkRLNFQiLCJ0ZW5hbnRfaWQiOiIyYjk2MjQwYWMxNWQ3ZWQwOWIxM2U5OWU3NzdiN2ZiNWFiMDhiMDViY2I4YzVkNWNkNzNkZmRiOTg5MjliMzZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiNDRmZWM0NjItM2IyNy00ZTE3LThmYTgtOTFmMzU1MjBkOGMxIn0.qowlnIXZiDDqrIvqegEIVL3B4CjCNtLQxX92OBW646k"
        }
    }
});

const PASSWORD = 'password123';
let passwordHash: string | null = null;

// ---------- Generic helpers ----------
async function getPasswordHash() {
    if (!passwordHash) passwordHash = await bcrypt.hash(PASSWORD, 10);
    return passwordHash;
}

async function ensureUser(email: string, role: UserRole, name: string, surname: string, extra: Partial<{ middlename: string; phone: string; }> = {}) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    return prisma.user.create({ data: { email, role, name, surname, middlename: extra.middlename, phone: extra.phone, hashedPassword: await getPasswordHash() } });
}

async function ensureTeacher(userId: number, employmentType: 'STAFF' | 'PART_TIME' = 'STAFF') {
    const t = await prisma.teacher.findUnique({ where: { userId } });
    return t ?? prisma.teacher.create({ data: { userId, employmentType } });
}

async function ensureGroup(name: string, courseNumber: number) {
    const g = await prisma.group.findFirst({ where: { name } });
    return g ?? prisma.group.create({ data: { name, courseNumber } });
}

async function ensureStudent(userId: number, groupId: number) {
    const s = await prisma.student.findUnique({ where: { userId } });
    return s ?? prisma.student.create({ data: { userId, groupId } });
}

async function ensureParent(userId: number, relation: string, studentIds: number[]) {
    const p = await prisma.parent.findUnique({ where: { userId } });
    if (p) {
        await prisma.parent.update({ where: { id: p.id }, data: { students: { connect: studentIds.map(id => ({ id })) } } });
        return p;
    }
    return prisma.parent.create({ data: { userId, relation, students: { connect: studentIds.map(id => ({ id })) } } });
}

async function ensureClassroom(name: string, data: Partial<{ building: string; floor: number; capacity: number; type: string; equipment: string[]; description: string; }>) {
    const c = await prisma.classroom.findFirst({ where: { name } });
    return c ?? prisma.classroom.create({ data: { name, building: data.building || 'Негізгі корпус', floor: data.floor ?? 1, capacity: data.capacity ?? 30, type: data.type || 'LECTURE', equipment: data.equipment || [], description: data.description } });
}

async function ensureStudyPlan(name: string, teacherId: number, groupIds: number[], extra: Partial<{ description: string; normativeWorkload: number; }>) {
    let sp = await prisma.studyPlan.findFirst({ where: { name } });
    if (!sp) {
        sp = await prisma.studyPlan.create({ data: { name, description: extra.description, teacherId, normativeWorkload: extra.normativeWorkload, group: { connect: groupIds.map(id => ({ id })) } } });
    } else {
        const current = await prisma.studyPlan.findUnique({ where: { id: sp.id }, include: { group: true } });
        const toConnect = groupIds.filter(id => !current.group.some(g => g.id === id));
        if (toConnect.length) await prisma.studyPlan.update({ where: { id: sp.id }, data: { group: { connect: toConnect.map(id => ({ id })) } } });
    }
    return sp;
}

async function ensureSchedule(studyPlanId: number, groupId: number, dayOfWeek: number, start: string, end: string, teacherId: number, classroomId?: number) {
    const s = await prisma.schedule.findFirst({ where: { studyPlanId, groupId, dayOfWeek, startTime: start } });
    return s ?? prisma.schedule.create({ data: { studyPlanId, groupId, dayOfWeek, startTime: start, endTime: end, teacherId, classroomId } });
}

async function ensureLesson(studyPlanId: number, date: Date, name: string) {
    const l = await prisma.lesson.findFirst({ where: { studyPlanId, date } });
    return l ?? prisma.lesson.create({ data: { studyPlanId, date, name } });
}

async function ensureHomework(lessonId: number, title: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { homeworkId: true } });
    if (lesson?.homeworkId) return lesson.homeworkId;
    const hw = await prisma.homework.create({ data: { name: title, description: 'Домашнее задание', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } });
    await prisma.lesson.update({ where: { id: lessonId }, data: { homework: { connect: { id: hw.id } } } });
    return hw.id;
}

async function ensureLessonResult(lessonId: number, studentId: number, score: number | null) {
    const r = await prisma.lessonResult.findFirst({ where: { lessonId, studentId } });
    return r ?? prisma.lessonResult.create({ data: { lessonId, studentId, lessonScore: score ?? undefined, attendance: true } });
}
async function ensurePayment(studentId: number, serviceName: string, dueDate: Date, amount: number, status: string) {
    const existing = await prisma.payment.findFirst({ where: { studentId, serviceName, dueDate } });
    if (existing) return existing;
    return prisma.payment.create({ data: { studentId, serviceType: 'tuition', serviceName, amount, currency: 'KZT', dueDate, status, paidAmount: status === 'paid' ? amount : 0, paymentDate: status === 'paid' ? new Date() : null } });
}

async function ensureBudgetItem(name: string, period: string, type: 'INCOME' | 'EXPENSE', plannedAmount: number, category: string) {
    const b = await prisma.budgetItem.findFirst({ where: { name, period } });
    return b ?? prisma.budgetItem.create({ data: { name, period, type, plannedAmount, category } });
}

async function ensureNotification(userId: number, type: string, message: string) {
    const n = await prisma.notification.findFirst({ where: { userId, type, message } });
    return n ?? prisma.notification.create({ data: { userId, type, message } });
}

async function ensureCalendarEvent(title: string, date: Date, createdById: number) {
    const e = await prisma.calendarEvent.findFirst({ where: { title, startDate: date } });
    if (e) return e;
    return prisma.calendarEvent.create({
        data: {
            title,
            startDate: date,
            endDate: new Date(date.getTime() + 60 * 60 * 1000),
            createdById,
            description: undefined,
            location: undefined
        }
    });
}

async function ensureDashboardWidgets(userId: number, role: UserRole) {
    const existing = await prisma.dashboardWidget.findMany({ where: { userId } });
    if (existing.length) return;
    const byRole: Record<UserRole, string[]> = {
        ADMIN: ['system-stats', 'finance-overview', 'school-attendance', 'news'],
        TEACHER: ['teacher-schedule', 'grades', 'assignments', 'news'],
        STUDENT: ['schedule', 'assignments', 'grades', 'attendance'],
        PARENT: ['child-schedule', 'child-grades', 'child-homework', 'news'],
        FINANCIST: ['finance-overview', 'news'],
        HR: ['activity-monitoring', 'teacher-workload', 'news']
    };
    let pos = 0;
    for (const type of byRole[role] || []) {
        await prisma.dashboardWidget.create({ data: { userId, type, title: type, size: 'medium', position: { x: 0, y: pos }, order: pos, config: {} } });
        pos++;
    }
}

function weekdaysInMonth(year: number, month0: number, weekday: number, limit = 4) {
    const dates: Date[] = [];
    const d = new Date(year, month0, 1);
    while (d.getMonth() === month0 && dates.length < limit) {
        const wd = d.getDay() === 0 ? 7 : d.getDay();
        if (wd === weekday) dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

// Generic batching helper to limit concurrency
async function runBatched<T>(items: T[], batchSize: number, worker: (item: T, index: number) => Promise<void>) {
    for (let i = 0; i < items.length; i += batchSize) {
        await Promise.all(items.slice(i, i + batchSize).map((it, idx) => worker(it, i + idx)));
    }
}

// Build a map: studyPlanId -> array of studentIds (unique)
async function buildPlanStudentsMap(planIds: number[]): Promise<Map<number, number[]>> {
    const map = new Map<number, number[]>();
    if (!planIds.length) return map;
    const plans = await prisma.studyPlan.findMany({
        where: { id: { in: planIds } },
        include: { group: { include: { students: true } } }
    });
    for (const p of plans) {
        const ids = new Set<number>();
        for (const g of p.group) for (const st of g.students) ids.add(st.id);
        map.set(p.id, Array.from(ids));
    }
    return map;
}

// Bulk create lesson results (skip duplicates) with chunking
async function bulkLessonResults(entries: { lessonId: number; studentId: number; lessonScore?: number | null }[]) {
    if (!entries.length) return;
    const CHUNK = 300;
    for (let i = 0; i < entries.length; i += CHUNK) {
        const slice = entries.slice(i, i + CHUNK);
        try {
            await prisma.lessonResult.createMany({ data: slice.map(e => ({ lessonId: e.lessonId, studentId: e.studentId, lessonScore: e.lessonScore ?? undefined, attendance: true })), skipDuplicates: true });
    } catch {
            // Fallback to per-item ensure on error
            for (const r of slice) {
                await ensureLessonResult(r.lessonId, r.studentId, r.lessonScore ?? null);
            }
        }
    }
}

// ---------- Main seed ----------
async function main() {
    console.log('🌱 Start comprehensive idempotent seed (phase 1)');

    // Users
    const admin = await ensureUser('admin@abai.edu.kz', 'ADMIN', 'Ерлан', 'Админов');
    const financist = await ensureUser('financist@abai.edu.kz', 'FINANCIST', 'Гульмира', 'Қасымова');
    const hr = await ensureUser('hr@abai.edu.kz', 'HR', 'Айжан', 'Муканова');
    await ensureDashboardWidgets(admin.id, 'ADMIN');
    await ensureDashboardWidgets(financist.id, 'FINANCIST');
    await ensureDashboardWidgets(hr.id, 'HR');

    // Teachers
    const teacherDefs = [
        { email: 'math.teacher@abai.edu.kz', name: 'Алия', surname: 'Иманбаева', employment: 'STAFF' as const },
        { email: 'bio.teacher@abai.edu.kz', name: 'Динара', surname: 'Сарсенова', employment: 'STAFF' as const },
        { email: 'phys.teacher@abai.edu.kz', name: 'Руслан', surname: 'Токтасынов', employment: 'STAFF' as const },
        { email: 'chem.teacher@abai.edu.kz', name: 'Жанар', surname: 'Ахметова', employment: 'PART_TIME' as const }
    ];
    const teachers: { userId: number; teacherId: number; email: string }[] = [];
    for (const t of teacherDefs) {
        const u = await ensureUser(t.email, 'TEACHER', t.name, t.surname);
        const teacher = await ensureTeacher(u.id, t.employment);
        teachers.push({ userId: u.id, teacherId: teacher.id, email: t.email });
        await ensureDashboardWidgets(u.id, 'TEACHER');
    }
    // Groups
    const g10A = await ensureGroup('10А', 10);
    const g10B = await ensureGroup('10Б', 10);
    const g11A = await ensureGroup('11А', 11);
    const g11B = await ensureGroup('11Б', 11);
    const g9A = await ensureGroup('9А', 9);

    // Students
    const studentDefs = [
        { email: 'aida.student@abai.edu.kz', name: 'Аида', surname: 'Казыбекова', group: g10A.id },
        { email: 'arman.student@abai.edu.kz', name: 'Арман', surname: 'Жакипов', group: g10A.id },
        { email: 'temirlan.student@abai.edu.kz', name: 'Темирлан', surname: 'Байбеков', group: g10A.id },
        { email: 'aidana.student@abai.edu.kz', name: 'Айдана', surname: 'Нурланова', group: g10A.id },
        { email: 'dana.student@abai.edu.kz', name: 'Дана', surname: 'Сералиева', group: g10B.id },
        { email: 'amina.student@abai.edu.kz', name: 'Амина', surname: 'Жаксылыкова', group: g10B.id },
        { email: 'askar.student@abai.edu.kz', name: 'Асқар', surname: 'Муратов', group: g10B.id },
        { email: 'bekzat.student@abai.edu.kz', name: 'Бекзат', surname: 'Оразбаев', group: g11A.id },
        { email: 'zarina.student@abai.edu.kz', name: 'Зарина', surname: 'Касымова', group: g11A.id },
        { email: 'dias.student@abai.edu.kz', name: 'Диас', surname: 'Абдильдаев', group: g11B.id },
        { email: 'aruzhan.student@abai.edu.kz', name: 'Аружан', surname: 'Тлеубекова', group: g9A.id },
        { email: 'alibek.student@abai.edu.kz', name: 'Алибек', surname: 'Досымов', group: g9A.id }
    ];
    const students: { userId: number; studentId: number; groupId: number }[] = [];
    for (const s of studentDefs) {
        const u = await ensureUser(s.email, 'STUDENT', s.name, s.surname);
        const st = await ensureStudent(u.id, s.group);
        students.push({ userId: u.id, studentId: st.id, groupId: s.group });
        await ensureDashboardWidgets(u.id, 'STUDENT');
    }

    // Parents (subset)
    const motherAida = await ensureUser('mother.aida@abai.edu.kz', 'PARENT', 'Назым', 'Казыбекова');
    await ensureParent(motherAida.id, 'Мать', [students[0].studentId]);
    await ensureDashboardWidgets(motherAida.id, 'PARENT');
    const fatherArman = await ensureUser('father.arman@abai.edu.kz', 'PARENT', 'Болат', 'Жакипов');
    await ensureParent(fatherArman.id, 'Отец', [students[1].studentId]);
    await ensureDashboardWidgets(fatherArman.id, 'PARENT');

    // Classrooms
    const c101 = await ensureClassroom('101', { equipment: ['Проектор', 'Интерактивная панель'] });
    const c205 = await ensureClassroom('205', { floor: 2, capacity: 25 });
    const c305 = await ensureClassroom('305', { floor: 3, type: 'LABORATORY', equipment: ['Лаб.оборудование'] });

    // Study plans
    const mathTeacher = teachers.find(t => t.email === 'math.teacher@abai.edu.kz');
    const bioTeacher = teachers.find(t => t.email === 'bio.teacher@abai.edu.kz');
    const physTeacher = teachers.find(t => t.email === 'phys.teacher@abai.edu.kz');
    const chemTeacher = teachers.find(t => t.email === 'chem.teacher@abai.edu.kz');
    if (!mathTeacher || !bioTeacher || !physTeacher || !chemTeacher) throw new Error('Teacher initialization failed');

    const spAlg = await ensureStudyPlan('Алгебра 10 класс', mathTeacher.teacherId, [g10A.id, g10B.id], { description: 'Углублённый курс алгебры', normativeWorkload: 102 });
    const spBio = await ensureStudyPlan('Биология 10 класс', bioTeacher.teacherId, [g10B.id], { description: 'Общая биология', normativeWorkload: 68 });
    const spPhys = await ensureStudyPlan('Физика 11 класс', physTeacher.teacherId, [g11A.id, g11B.id], { description: 'МКТ и термодинамика', normativeWorkload: 85 });
    const spChem = await ensureStudyPlan('Химия 9 класс', chemTeacher.teacherId, [g9A.id], { description: 'Основы неорганической химии', normativeWorkload: 68 });

    // Schedule
    await ensureSchedule(spAlg.id, g10A.id, 1, '08:30', '09:15', mathTeacher.teacherId, c101.id);
    await ensureSchedule(spAlg.id, g10B.id, 1, '09:25', '10:10', mathTeacher.teacherId, c101.id);
    await ensureSchedule(spBio.id, g10B.id, 2, '10:25', '11:10', bioTeacher.teacherId, c205.id);
    await ensureSchedule(spPhys.id, g11A.id, 3, '11:25', '12:10', physTeacher.teacherId, c305.id);
    await ensureSchedule(spChem.id, g9A.id, 4, '12:20', '13:05', chemTeacher.teacherId, c305.id);

    // Lessons + homework + results (first 4 occurrences per plan in Sept 2025)
    const year = 2025; const month0 = 8; // September
    const planWeekday: [number, number][] = [[spAlg.id, 1], [spBio.id, 2], [spPhys.id, 3], [spChem.id, 4]];
    for (const [planId, weekday] of planWeekday) {
        const dates = weekdaysInMonth(year, month0, weekday, 4);
        for (const d of dates) {
            const lesson = await ensureLesson(planId, d, `Урок ${d.toLocaleDateString('ru-RU')}`);
            await ensureHomework(lesson.id, 'Домашнее задание');
            const plan = await prisma.studyPlan.findUnique({ where: { id: planId }, include: { group: { include: { students: true } } } });
            if (plan) {
                for (const g of plan.group) {
                    for (const st of g.students) {
                        const score = Math.random() > 0.25 ? [5, 4, 3][Math.floor(Math.random() * 3)] : null;
                        await ensureLessonResult(lesson.id, st.id, score);
                    }
                }
            }
        }
    }

    // Payments & budget
    const now = new Date();
    const augustDue = new Date(now.getFullYear(), 7, 25);
    const septDue = new Date(now.getFullYear(), 8, 25);
    for (const s of students.slice(0, 6)) {
        await ensurePayment(s.studentId, 'Обучение август', augustDue, 120000, 'paid');
        await ensurePayment(s.studentId, 'Обучение сентябрь', septDue, 120000, 'unpaid');
    }
    const period = `${now.getFullYear()} Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    await ensureBudgetItem('Доход: обучение', period, 'INCOME', 3000000, 'tuition');
    await ensureBudgetItem('Расход: зарплаты', period, 'EXPENSE', 1800000, 'salary');
    await ensureBudgetItem('Расход: инфраструктура', period, 'EXPENSE', 400000, 'infrastructure');

    // Notifications & calendar
    await ensureNotification(admin.id, 'system', 'Платформа обновлена – добавлены отчеты');
    for (const s of students.slice(0, 3)) await ensureNotification(s.userId, 'welcome', 'Добро пожаловать!');
    await ensureCalendarEvent('Педсовет', new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), admin.id);
    await ensureCalendarEvent('Родительское собрание 10А', new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), mathTeacher.userId);

    // ---------- Expansion: bulk generation ----------
    // Goals: many groups, students, teachers, study plans, schedules, lessons, grades, budget items
    console.log('📦 Expansion: bulk academic + finance dataset');
    console.time('expansion-total');

    // 1. Additional groups (grades 5-11, letters А, Б, В)
    const gradeLetters = ['А', 'Б', 'В'];
    const targetGrades = [5, 6, 7, 8, 9, 10, 11];
    const bulkGroups: { id: number; name: string; courseNumber: number }[] = [];
    for (const grade of targetGrades) {
        for (const letter of gradeLetters) {
            const name = `${grade}${letter}`;
            // Skip if already created earlier and captured
            const existing = await prisma.group.findFirst({ where: { name } });
            if (existing) {
                bulkGroups.push({ id: existing.id, name: existing.name, courseNumber: existing.courseNumber });
            } else {
                const g = await ensureGroup(name, grade);
                bulkGroups.push(g);
            }
        }
    }

    // Merge previously created specific groups (g10A etc) into bulkGroups if missing
    const existingGroupIds = new Set(bulkGroups.map(g => g.id));
    for (const g of [g10A, g10B, g11A, g11B, g9A]) {
        if (!existingGroupIds.has(g.id)) bulkGroups.push({ id: g.id, name: g.name, courseNumber: g.courseNumber });
    }

    // 2. Additional teachers (cover wide subject list)
    const subjectList = [
        'Математика', 'Алгебра', 'Геометрия', 'Физика', 'Химия', 'Биология', 'История', 'География', 'Литература', 'Информатика', 'Английский язык', 'Казахский язык'
    ];
    const teacherEmailBase = (i: number) => `teacher${i}@abai.edu.kz`;
    await runBatched(Array.from({ length: subjectList.length }, (_, i) => i), 5, async i => {
        const email = teacherEmailBase(i + 1);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
            const u = await ensureUser(email, 'TEACHER', subjectList[i].split(' ')[0] || 'Учитель', 'Педагожев');
            const tRec = await ensureTeacher(u.id, i % 4 === 0 ? 'PART_TIME' : 'STAFF');
            teachers.push({ userId: u.id, teacherId: tRec.id, email });
            await ensureDashboardWidgets(u.id, 'TEACHER');
        } else {
            const tRec = await ensureTeacher(existingUser.id, 'STAFF');
            if (!teachers.find(t => t.teacherId === tRec.id)) teachers.push({ userId: existingUser.id, teacherId: tRec.id, email });
        }
    });

    // 3. Bulk students per group (ensure at least 12 per group)
    const firstNames = ['Али', 'Медет', 'Серик', 'Еркен', 'Жанна', 'Алия', 'Диана', 'Нур', 'Самат', 'Айгерим', 'Олжас', 'Аружан', 'Мадина', 'Руслан', 'Айдос'];
    const lastNames = ['Тлеубеков', 'Нурланов', 'Касымов', 'Жаксылыков', 'Серикбаев', 'Оразбаев', 'Ахметов', 'Муканов', 'Иманбаев', 'Сарсенов'];
    let studentCounter = 1000; // high offset to not clash with handcrafted emails
    await runBatched(bulkGroups, 4, async g => {
        const currentStudents = await prisma.student.findMany({ where: { groupId: g.id }, include: { user: true } });
        if (currentStudents.length >= 12) return;
        const toCreate = 12 - currentStudents.length;
        const creations: Promise<void>[] = [];
        for (let k = 0; k < toCreate; k++) {
            creations.push((async () => {
                const fn = firstNames[(k + g.courseNumber) % firstNames.length];
                const ln = lastNames[(k + g.courseNumber * 2) % lastNames.length];
                const email = `student${studentCounter++}@abai.edu.kz`;
                const u = await ensureUser(email, 'STUDENT', fn, ln);
                const st = await ensureStudent(u.id, g.id);
                students.push({ userId: u.id, studentId: st.id, groupId: g.id });
                await ensureDashboardWidgets(u.id, 'STUDENT');
            })());
        }
        await Promise.all(creations);
    });

    // 4. Study plans (subjects x grades) – only one plan per (subject, grade)
    interface PlanMeta { planId: number; subject: string; grade: number; teacherId: number; }
    const planMetas: PlanMeta[] = [];
    for (const grade of targetGrades) {
        const gradeGroups = bulkGroups.filter(g => g.courseNumber === grade).map(g => g.id);
        for (let si = 0; si < subjectList.length; si++) {
            // Limit subjects per grade to first 6 to control explosion
            if (si >= 6) break;
            const subj = subjectList[si];
            const teacher = teachers[(si + grade) % teachers.length];
            const planName = `${subj} ${grade} класс`;
            const plan = await ensureStudyPlan(planName, teacher.teacherId, gradeGroups, { description: `Учебный план по предмету ${subj} для ${grade} класса`, normativeWorkload: 68 + (si % 3) * 17 });
            planMetas.push({ planId: plan.id, subject: subj, grade, teacherId: teacher.teacherId });
        }
    }

    // 5. Schedules (one weekly slot per plan for first group of grade)
    await runBatched(planMetas, 15, async meta => {
        const gradeGroupIds = bulkGroups.filter(g => g.courseNumber === meta.grade).map(g => g.id);
        const firstGroupId = gradeGroupIds[0];
        const dayOfWeek = (meta.grade + meta.planId) % 5 + 1;
        const startHour = 8 + ((meta.planId + meta.grade) % 6);
        const start = `${startHour.toString().padStart(2, '0')}:00`;
        const end = `${(startHour + 1).toString().padStart(2, '0')}:45`;
        await ensureSchedule(meta.planId, firstGroupId, dayOfWeek, start, end, meta.teacherId);
    });

    // 6. Lessons & grades (Sept & Oct current year, up to 4 per month per plan)
    const currYear = now.getFullYear();
    const months = [8, 9]; // September (8), October (9) zero-based
    const heavyPlans = planMetas.slice(0, 150);
    const planStudentMap = await buildPlanStudentsMap(heavyPlans.map(p => p.planId));
    await runBatched(heavyPlans, 6, async meta => {
        const studentIds = planStudentMap.get(meta.planId) || [];
        if (!studentIds.length) return;
        for (const m of months) {
            const weekday = ((meta.grade + meta.planId) % 5) + 1;
            const dates = weekdaysInMonth(currYear, m, weekday, 4);
            for (const d of dates) {
                const lesson = await ensureLesson(meta.planId, d, `${meta.subject} урок ${d.toLocaleDateString('ru-RU')}`);
                await ensureHomework(lesson.id, 'Домашнее задание');
                const resultsData = studentIds.map(stId => ({
                    lessonId: lesson.id,
                    studentId: stId,
                    lessonScore: Math.random() > 0.3 ? [5,4,3,2][Math.floor(Math.random()*4)] : null
                }));
                await bulkLessonResults(resultsData);
            }
        }
    });

    // 7. Budget expansion: monthly income/expense items for the year
    const incomeCats = ['tuition', 'grants', 'donations'];
    const expenseCats = ['salary', 'infrastructure', 'utilities', 'supplies'];
    await runBatched(Array.from({ length: 12 }, (_, i) => i), 6, async month => {
        const periodMonth = `${currYear}-${(month + 1).toString().padStart(2, '0')}`;
        await Promise.all([
            ...incomeCats.map(cat => ensureBudgetItem(`Доход: ${cat} ${periodMonth}`, periodMonth, 'INCOME', 500000 + Math.floor(Math.random() * 400000), cat)),
            ...expenseCats.map(cat => ensureBudgetItem(`Расход: ${cat} ${periodMonth}`, periodMonth, 'EXPENSE', 200000 + Math.floor(Math.random() * 300000), cat))
        ]);
    });

    // Teacher workload
    const academicYear = `${now.getFullYear()}/${now.getFullYear() + 1}`;
    await runBatched(teachers, 15, async t => {
        const tw = await prisma.teacherWorkload.upsert({ where: { teacherId_academicYear: { teacherId: t.teacherId, academicYear } }, update: { standardHours: 24, actualHours: 18 }, create: { teacherId: t.teacherId, academicYear, standardHours: 24, actualHours: 18 } });
        await prisma.monthlyWorkload.upsert({ where: { teacherWorkloadId_month_year: { teacherWorkloadId: tw.id, month: now.getMonth() + 1, year: now.getFullYear() } }, update: { actualHours: 18 }, create: { teacherWorkloadId: tw.id, month: now.getMonth() + 1, year: now.getFullYear(), standardHours: 24, actualHours: 18 } });
    });
    console.timeEnd('expansion-total');

    console.log('✅ Seed completed (phase 1).');
    console.log('Test accounts:');
    console.log('Admin: admin@abai.edu.kz /', PASSWORD);
    console.log('Teacher: math.teacher@abai.edu.kz /', PASSWORD);
    console.log('Student: aida.student@abai.edu.kz /', PASSWORD);
    console.log('Parent: mother.aida@abai.edu.kz /', PASSWORD);
}

// Execute (ignore returned promise for lint via void)
void main()
    .catch(e => { console.error('❌ Seed failed', e); process.exit(1); })
    .finally(() => { void prisma.$disconnect(); });
