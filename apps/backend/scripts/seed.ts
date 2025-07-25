import { PrismaClient } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Начинаем заполнение базы данных...');

    // // Очистка существующих данных
    // console.log('🧹 Очищаем существующие данные...');
    // await prisma.lessonResult.deleteMany();
    // await prisma.lesson.deleteMany();
    // await prisma.studyPlan.deleteMany();
    // await prisma.student.deleteMany();
    // await prisma.teacher.deleteMany();
    // await prisma.parent.deleteMany();
    // await prisma.group.deleteMany();
    // await prisma.classroom.deleteMany();
    // await prisma.user.deleteMany();

    console.log('📝 Создаем пользователей...');

    // Хешируем пароль для всех пользователей
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Создаем администратора
    const admin = await prisma.user.create({
        data: {
            email: 'admin@abai.edu.kz',
            name: 'Админ',
            surname: 'Администратов',
            middlename: 'Системович',
            phone: '+7 700 000 0001',
            role: 'ADMIN',
            hashedPassword,
        },
    });

    // Создаем преподавателей
    const teachers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'ivanova@abai.edu.kz',
                name: 'Лариса',
                surname: 'Иванова',
                middlename: 'Петровна',
                phone: '+7 700 000 0002',
                role: 'TEACHER',
                hashedPassword,
                teacher: {
                    create: {
                        employmentType: 'STAFF',
                    },
                },
            },
            include: { teacher: true },
        }),
        prisma.user.create({
            data: {
                email: 'aliev@abai.edu.kz',
                name: 'Азамат',
                surname: 'Алиев',
                middlename: 'Серикович',
                phone: '+7 700 000 0003',
                role: 'TEACHER',
                hashedPassword,
                teacher: {
                    create: {
                        employmentType: 'STAFF',
                    },
                },
            },
            include: { teacher: true },
        }),
        prisma.user.create({
            data: {
                email: 'tulegenov@abai.edu.kz',
                name: 'Марат',
                surname: 'Тулегенов',
                middlename: 'Асылханович',
                phone: '+7 700 000 0004',
                role: 'TEACHER',
                hashedPassword,
                teacher: {
                    create: {
                        employmentType: 'STAFF',
                    },
                },
            },
            include: { teacher: true },
        }),
        prisma.user.create({
            data: {
                email: 'nazarbayeva@abai.edu.kz',
                name: 'Айгуль',
                surname: 'Назарбаева',
                middlename: 'Ермековна',
                phone: '+7 700 000 0005',
                role: 'TEACHER',
                hashedPassword,
                teacher: {
                    create: {
                        employmentType: 'PART_TIME',
                    },
                },
            },
            include: { teacher: true },
        }),
    ]);

    console.log('👥 Создаем группы...');

    // Создаем группы
    const groups = await Promise.all([
        prisma.group.create({
            data: {
                name: '10А',
                courseNumber: 10,
            },
        }),
        prisma.group.create({
            data: {
                name: '10Б',
                courseNumber: 10,
            },
        }),
        prisma.group.create({
            data: {
                name: '11А',
                courseNumber: 11,
            },
        }),
        prisma.group.create({
            data: {
                name: '11Б',
                courseNumber: 11,
            },
        }),
        prisma.group.create({
            data: {
                name: '9А',
                courseNumber: 9,
            },
        }),
    ]);

    console.log('🎓 Создаем студентов...');

    // Создаем студентов
    const studentUsers = await Promise.all([
        // Студенты 10А
        prisma.user.create({
            data: {
                email: 'aida.student@abai.edu.kz',
                name: 'Айда',
                surname: 'Казыбекова',
                middlename: 'Нурлановна',
                phone: '+7 700 000 0010',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[0].id, // 10А
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'arman.student@abai.edu.kz',
                name: 'Арман',
                surname: 'Жакипов',
                middlename: 'Бауыржанович',
                phone: '+7 700 000 0011',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[0].id, // 10А
                    },
                },
            },
            include: { student: true },
        }),
        // Студенты 10Б
        prisma.user.create({
            data: {
                email: 'dana.student@abai.edu.kz',
                name: 'Дана',
                surname: 'Сералиева',
                middlename: 'Асылбековна',
                phone: '+7 700 000 0012',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[1].id, // 10Б
                    },
                },
            },
            include: { student: true },
        }),
        // Студенты 11А
        prisma.user.create({
            data: {
                email: 'bekzat.student@abai.edu.kz',
                name: 'Бекзат',
                surname: 'Оразбаев',
                middlename: 'Алмасович',
                phone: '+7 700 000 0013',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[2].id, // 11А
                    },
                },
            },
            include: { student: true },
        }),
    ]);

    console.log('👨‍👩‍👧‍👦 Создаем родителей...');

    // Создаем родителей
    const parents = await Promise.all([
        prisma.user.create({
            data: {
                email: 'nazym.parent@abai.edu.kz',
                name: 'Назым',
                surname: 'Казыбекова',
                middlename: 'Серикжановна',
                phone: '+7 700 000 0020',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Мать',
                        students: {
                            connect: { id: studentUsers[0].student.id }, // Айда
                        },
                    },
                },
            },
            include: { parent: true },
        }),
        prisma.user.create({
            data: {
                email: 'bolat.parent@abai.edu.kz',
                name: 'Болат',
                surname: 'Жакипов',
                middlename: 'Маратович',
                phone: '+7 700 000 0021',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Отец',
                        students: {
                            connect: { id: studentUsers[1].student.id }, // Арман
                        },
                    },
                },
            },
            include: { parent: true },
        }),
    ]);

    console.log('🏫 Создаем аудитории...');

    // Создаем аудитории
    const classrooms = await Promise.all([
        prisma.classroom.create({
            data: {
                name: '101',
                building: 'Главный корпус',
                floor: 1,
                capacity: 30,
                type: 'LECTURE',
                equipment: ['Проектор', 'Интерактивная доска', 'Компьютер'],
                description: 'Аудитория для лекций с современным оборудованием',
            },
        }),
        prisma.classroom.create({
            data: {
                name: '205',
                building: 'Главный корпус',
                floor: 2,
                capacity: 25,
                type: 'PRACTICE',
                equipment: ['Проектор', 'Маркерная доска'],
                description: 'Аудитория для практических занятий',
            },
        }),
        prisma.classroom.create({
            data: {
                name: '305',
                building: 'Естественно-научный корпус',
                floor: 3,
                capacity: 20,
                type: 'LABORATORY',
                equipment: ['Лабораторное оборудование', 'Вытяжка', 'Микроскопы'],
                description: 'Лаборатория физики и химии',
            },
        }),
    ]);

    console.log('📚 Создаем учебные планы...');

    // Создаем учебные планы
    const studyPlans = await Promise.all([
        prisma.studyPlan.create({
            data: {
                name: 'Алгебра - 10 класс',
                description: 'Углубленное изучение алгебры для 10 класса с элементами анализа',
                teacherId: teachers[0].teacher.id, // Иванова
                normativeWorkload: 102, // часов в год
                group: {
                    connect: [{ id: groups[0].id }, { id: groups[1].id }], // 10А и 10Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Биология - 10 класс',
                description: 'Общая биология с основами экологии',
                teacherId: teachers[1].teacher.id, // Алиев
                normativeWorkload: 68,
                group: {
                    connect: [{ id: groups[1].id }], // 10Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Физика - 11 класс',
                description: 'Молекулярная физика и термодинамика',
                teacherId: teachers[2].teacher.id, // Тулегенов
                normativeWorkload: 85,
                group: {
                    connect: [{ id: groups[2].id }, { id: groups[3].id }], // 11А и 11Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Химия - 9 класс',
                description: 'Неорганическая химия',
                teacherId: teachers[3].teacher.id, // Назарбаева
                normativeWorkload: 68,
                group: {
                    connect: [{ id: groups[4].id }], // 9А
                },
            },
        }),
    ]);

    console.log('📅 Создаем расписание...');

    // Создаем расписание
    await Promise.all([
        // Алгебра 10А - Понедельник 8:30-9:15
        prisma.schedule.create({
            data: {
                studyPlanId: studyPlans[0].id,
                groupId: groups[0].id,
                teacherId: teachers[0].teacher.id,
                classroomId: classrooms[0].id,
                dayOfWeek: 1, // Понедельник
                startTime: '08:30',
                endTime: '09:15',
            },
        }),
        // Алгебра 10Б - Понедельник 9:25-10:10
        prisma.schedule.create({
            data: {
                studyPlanId: studyPlans[0].id,
                groupId: groups[1].id,
                teacherId: teachers[0].teacher.id,
                classroomId: classrooms[0].id,
                dayOfWeek: 1,
                startTime: '09:25',
                endTime: '10:10',
            },
        }),
        // Биология 10Б - Вторник 10:25-11:10
        prisma.schedule.create({
            data: {
                studyPlanId: studyPlans[1].id,
                groupId: groups[1].id,
                teacherId: teachers[1].teacher.id,
                classroomId: classrooms[2].id,
                dayOfWeek: 2, // Вторник
                startTime: '10:25',
                endTime: '11:10',
            },
        }),
        // Физика 11А - Среда 11:25-12:10
        prisma.schedule.create({
            data: {
                studyPlanId: studyPlans[2].id,
                groupId: groups[2].id,
                teacherId: teachers[2].teacher.id,
                classroomId: classrooms[2].id,
                dayOfWeek: 3, // Среда
                startTime: '11:25',
                endTime: '12:10',
            },
        }),
    ]);

    console.log('📖 Создаем уроки...');

    // Создаем уроки для алгебры
    const lessons = await Promise.all([
        prisma.lesson.create({
            data: {
                name: 'Квадратные уравнения',
                description: 'Решение квадратных уравнений различными методами',
                studyPlanId: studyPlans[0].id,
                date: new Date('2024-09-02T08:30:00Z'),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Формулы сокращенного умножения',
                description: 'Применение формул сокращенного умножения',
                studyPlanId: studyPlans[0].id,
                date: new Date('2024-09-09T08:30:00Z'),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Теорема Виета',
                description: 'Изучение теоремы Виета и ее применение',
                studyPlanId: studyPlans[0].id,
                date: new Date('2024-09-16T08:30:00Z'),
            },
        }),
        // Уроки биологии
        prisma.lesson.create({
            data: {
                name: 'Строение клетки',
                description: 'Основы цитологии, строение эукариотической клетки',
                studyPlanId: studyPlans[1].id,
                date: new Date('2024-09-03T10:25:00Z'),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Фотосинтез',
                description: 'Процесс фотосинтеза у растений',
                studyPlanId: studyPlans[1].id,
                date: new Date('2024-09-10T10:25:00Z'),
            },
        }),
        // Уроки физики
        prisma.lesson.create({
            data: {
                name: 'Молекулярно-кинетическая теория',
                description: 'Основные положения МКТ',
                studyPlanId: studyPlans[2].id,
                date: new Date('2024-09-04T11:25:00Z'),
            },
        }),
    ]);

    console.log('🎯 Создаем материалы уроков...');

    // Создаем материалы для некоторых уроков
    await Promise.all([
        prisma.materials.create({
            data: {
                lecture: 'Квадратные уравнения - это уравнения вида ax² + bx + c = 0, где a ≠ 0...',
                videoUrl: 'https://www.youtube.com/watch?v=example1',
                presentationUrl: 'https://docs.google.com/presentation/d/example1',
                lesson: {
                    connect: { id: lessons[0].id },
                },
            },
        }),
        prisma.materials.create({
            data: {
                lecture: 'Формулы сокращенного умножения помогают упростить вычисления...',
                videoUrl: 'https://www.youtube.com/watch?v=example2',
                lesson: {
                    connect: { id: lessons[1].id },
                },
            },
        }),
    ]);

    console.log('💰 Создаем платежи...');

    // Создаем платежи для студентов
    await Promise.all([
        prisma.payment.create({
            data: {
                studentId: studentUsers[0].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за сентябрь 2024',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2024-09-01'),
                status: 'paid',
                paymentDate: new Date('2024-08-28'),
                paidAmount: 45000,
            },
        }),
        prisma.payment.create({
            data: {
                studentId: studentUsers[1].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за сентябрь 2024',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2024-09-01'),
                status: 'unpaid',
            },
        }),
        prisma.payment.create({
            data: {
                studentId: studentUsers[0].student.id,
                serviceType: 'meals',
                serviceName: 'Питание за сентябрь 2024',
                amount: 15000,
                currency: 'KZT',
                dueDate: new Date('2024-09-01'),
                status: 'paid',
                paymentDate: new Date('2024-08-30'),
                paidAmount: 15000,
            },
        }),
    ]);

    console.log('🔔 Создаем уведомления...');

    // Создаем уведомления
    await Promise.all([
        prisma.notification.create({
            data: {
                userId: studentUsers[0].id,
                type: 'payment',
                message: 'Оплата за обучение успешно поступила',
                read: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: studentUsers[1].id,
                type: 'payment',
                message: 'Напоминание: оплата за обучение просрочена',
                read: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: teachers[0].id,
                type: 'lesson',
                message: 'Урок "Квадратные уравнения" начинается через 30 минут',
                read: true,
            },
        }),
    ]);

    console.log('✅ База данных успешно заполнена!');
    console.log('\n📊 Создано:');
    console.log(`👤 Пользователей: ${1 + teachers.length + studentUsers.length + parents.length}`);
    console.log(`👥 Групп: ${groups.length}`);
    console.log(`🏫 Аудиторий: ${classrooms.length}`);
    console.log(`📚 Учебных планов: ${studyPlans.length}`);
    console.log(`📖 Уроков: ${lessons.length}`);
    console.log('\n🔑 Тестовые аккаунты:');
    console.log('Администратор: admin@abai.edu.kz / password123');
    console.log('Преподаватель: ivanova@abai.edu.kz / password123');
    console.log('Студент: aida.student@abai.edu.kz / password123');
    console.log('Родитель: nazym.parent@abai.edu.kz / password123');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Ошибка при заполнении базы данных:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
