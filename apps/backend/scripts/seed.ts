import { PrismaClient } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Утилиты для генерации дат в Q3 2025

function getDateInQ3_2025(year: number, month: number, day: number): Date {
    // Убеждаемся что месяц в Q3 2025 (7-9)
    const q3Month = Math.max(7, Math.min(9, month));
    return new Date(2025, q3Month - 1, day);
}

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

    // Создаем финансиста
    const financist = await prisma.user.create({
        data: {
            email: 'financist@abai.edu.kz',
            name: 'Гульмира',
            surname: 'Касымова',
            middlename: 'Серикжановна',
            phone: '+7 700 000 0006',
            role: 'FINANCIST',
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

    // Создаем родителей для всех студентов
    const parents = await Promise.all([
        // Родители для Айды Казыбековой (студент 0)
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
                email: 'nurlan.parent@abai.edu.kz',
                name: 'Нурлан',
                surname: 'Казыбеков',
                middlename: 'Абайевич',
                phone: '+7 700 000 0025',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Отец',
                        students: {
                            connect: { id: studentUsers[0].student.id }, // Айда
                        },
                    },
                },
            },
            include: { parent: true },
        }),
        // Родители для Армана Жакипова (студент 1)
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
        prisma.user.create({
            data: {
                email: 'gulnara.parent@abai.edu.kz',
                name: 'Гульнара',
                surname: 'Жакипова',
                middlename: 'Ерлановна',
                phone: '+7 700 000 0026',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Мать',
                        students: {
                            connect: { id: studentUsers[1].student.id }, // Арман
                        },
                    },
                },
            },
            include: { parent: true },
        }),
        // Родители для Даны Сералиевой (студент 2)
        prisma.user.create({
            data: {
                email: 'asylbek.parent@abai.edu.kz',
                name: 'Асылбек',
                surname: 'Сералиев',
                middlename: 'Касымович',
                phone: '+7 700 000 0027',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Отец',
                        students: {
                            connect: { id: studentUsers[2].student.id }, // Дана
                        },
                    },
                },
            },
            include: { parent: true },
        }),
        prisma.user.create({
            data: {
                email: 'zhanar.parent@abai.edu.kz',
                name: 'Жанар',
                surname: 'Сералиева',
                middlename: 'Амангельдиновна',
                phone: '+7 700 000 0028',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Мать',
                        students: {
                            connect: { id: studentUsers[2].student.id }, // Дана
                        },
                    },
                },
            },
            include: { parent: true },
        }),
        // Родитель для Бекзата Оразбаева (студент 3) - одинокий родитель
        prisma.user.create({
            data: {
                email: 'almas.parent@abai.edu.kz',
                name: 'Алмас',
                surname: 'Оразбаев',
                middlename: 'Ильясович',
                phone: '+7 700 000 0029',
                role: 'PARENT',
                hashedPassword,
                parent: {
                    create: {
                        relation: 'Отец',
                        students: {
                            connect: { id: studentUsers[3].student.id }, // Бекзат
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

    // Создаем расширенный набор уроков для Q3 2025
    const lessons = await Promise.all([
        // Уроки алгебры (10 класс) - июль 2025
        prisma.lesson.create({
            data: {
                name: 'Квадратные уравнения',
                description: 'Решение квадратных уравнений различными методами',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 7, 5),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Формулы сокращенного умножения',
                description: 'Применение формул сокращенного умножения',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 7, 12),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Теорема Виета',
                description: 'Изучение теоремы Виета и ее применение',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 7, 19),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Контрольная работа по алгебре',
                description: 'Проверка знаний по пройденным темам',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 7, 26),
            },
        }),
        // Уроки алгебры - август 2025
        prisma.lesson.create({
            data: {
                name: 'Системы уравнений',
                description: 'Решение систем линейных и квадратных уравнений',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 8, 2),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Неравенства',
                description: 'Решение линейных и квадратных неравенств',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 8, 9),
            },
        }),
        // Уроки алгебры - сентябрь 2025
        prisma.lesson.create({
            data: {
                name: 'Функции и их графики',
                description: 'Изучение основных функций и построение графиков',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 9, 6),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Практикум по функциям',
                description: 'Решение задач на функции',
                studyPlanId: studyPlans[0].id,
                date: getDateInQ3_2025(2025, 9, 13),
            },
        }),

        // Уроки биологии (10 класс) - июль-сентябрь 2025
        prisma.lesson.create({
            data: {
                name: 'Строение клетки',
                description: 'Основы цитологии, строение эукариотической клетки',
                studyPlanId: studyPlans[1].id,
                date: getDateInQ3_2025(2025, 7, 8),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Фотосинтез',
                description: 'Процесс фотосинтеза у растений',
                studyPlanId: studyPlans[1].id,
                date: getDateInQ3_2025(2025, 7, 15),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Дыхание растений',
                description: 'Процессы дыхания у растений и животных',
                studyPlanId: studyPlans[1].id,
                date: getDateInQ3_2025(2025, 8, 5),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Генетика и наследственность',
                description: 'Основы генетики, законы Менделя',
                studyPlanId: studyPlans[1].id,
                date: getDateInQ3_2025(2025, 8, 12),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Лабораторная работа по генетике',
                description: 'Решение генетических задач',
                studyPlanId: studyPlans[1].id,
                date: getDateInQ3_2025(2025, 9, 2),
            },
        }),

        // Уроки физики (11 класс) - июль-сентябрь 2025
        prisma.lesson.create({
            data: {
                name: 'Молекулярно-кинетическая теория',
                description: 'Основные положения МКТ',
                studyPlanId: studyPlans[2].id,
                date: getDateInQ3_2025(2025, 7, 10),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Газовые законы',
                description: 'Изучение законов идеального газа',
                studyPlanId: studyPlans[2].id,
                date: getDateInQ3_2025(2025, 7, 17),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Термодинамика',
                description: 'Первый и второй законы термодинамики',
                studyPlanId: studyPlans[2].id,
                date: getDateInQ3_2025(2025, 8, 7),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Лабораторная работа по термодинамике',
                description: 'Экспериментальное изучение тепловых процессов',
                studyPlanId: studyPlans[2].id,
                date: getDateInQ3_2025(2025, 8, 14),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Электростатика',
                description: 'Электрическое поле и его характеристики',
                studyPlanId: studyPlans[2].id,
                date: getDateInQ3_2025(2025, 9, 4),
            },
        }),

        // Уроки химии (9 класс) - июль-сентябрь 2025
        prisma.lesson.create({
            data: {
                name: 'Периодическая система',
                description: 'Периодический закон и периодическая система элементов',
                studyPlanId: studyPlans[3].id,
                date: getDateInQ3_2025(2025, 7, 11),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Химические связи',
                description: 'Ковалентная, ионная и металлическая связь',
                studyPlanId: studyPlans[3].id,
                date: getDateInQ3_2025(2025, 7, 18),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Практическая работа по химическим реакциям',
                description: 'Проведение химических реакций в лаборатории',
                studyPlanId: studyPlans[3].id,
                date: getDateInQ3_2025(2025, 8, 8),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Кислоты и основания',
                description: 'Свойства кислот и оснований, реакции нейтрализации',
                studyPlanId: studyPlans[3].id,
                date: getDateInQ3_2025(2025, 8, 15),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Окислительно-восстановительные реакции',
                description: 'Изучение ОВР и составление уравнений',
                studyPlanId: studyPlans[3].id,
                date: getDateInQ3_2025(2025, 9, 5),
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
        // Платежи для Айды Казыбековой
        prisma.payment.create({
            data: {
                studentId: studentUsers[0].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за август 2025',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'paid',
                paymentDate: new Date('2025-07-28'),
                paidAmount: 45000,
            },
        }),
        prisma.payment.create({
            data: {
                studentId: studentUsers[0].student.id,
                serviceType: 'meals',
                serviceName: 'Питание за август 2025',
                amount: 15000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'paid',
                paymentDate: new Date('2025-07-30'),
                paidAmount: 15000,
            },
        }),
        // Платежи для Армана Жакипова
        prisma.payment.create({
            data: {
                studentId: studentUsers[1].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за август 2025',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'unpaid',
            },
        }),
        prisma.payment.create({
            data: {
                studentId: studentUsers[1].student.id,
                serviceType: 'transportation',
                serviceName: 'Транспорт за август 2025',
                amount: 8000,
                currency: 'KZT',
                dueDate: new Date('2025-08-15'),
                status: 'partial',
                paymentDate: new Date('2025-08-10'),
                paidAmount: 4000,
            },
        }),
        // Платежи для Даны Сералиевой
        prisma.payment.create({
            data: {
                studentId: studentUsers[2].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за август 2025',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'overdue',
            },
        }),
        prisma.payment.create({
            data: {
                studentId: studentUsers[2].student.id,
                serviceType: 'extra',
                serviceName: 'Дополнительные занятия по математике',
                amount: 25000,
                currency: 'KZT',
                dueDate: new Date('2025-08-20'),
                status: 'unpaid',
            },
        }),
        // Платежи для Бекзата Оразбаева
        prisma.payment.create({
            data: {
                studentId: studentUsers[3].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за август 2025',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'paid',
                paymentDate: new Date('2025-07-25'),
                paidAmount: 45000,
            },
        }),
    ]);

    console.log('💼 Создаем статьи бюджета...');

    // Создаем статьи бюджета
    await Promise.all([
        // Доходы
        prisma.budgetItem.create({
            data: {
                name: 'Оплата за обучение',
                type: 'INCOME',
                category: 'tuition',
                plannedAmount: 5000000,
                actualAmount: 4200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Основные доходы от платы за обучение студентов',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Гранты и субсидии',
                type: 'INCOME',
                category: 'grants',
                plannedAmount: 1200000,
                actualAmount: 1200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Государственные гранты и субсидии на образование',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Дополнительные услуги',
                type: 'INCOME',
                category: 'services',
                plannedAmount: 300000,
                actualAmount: 180000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Доходы от дополнительных образовательных услуг',
            },
        }),
        // Расходы
        prisma.budgetItem.create({
            data: {
                name: 'Заработная плата преподавателей',
                type: 'EXPENSE',
                category: 'salaries',
                plannedAmount: 3200000,
                actualAmount: 3150000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Основные расходы на заработную плату педагогического состава',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Коммунальные услуги',
                type: 'EXPENSE',
                category: 'utilities',
                plannedAmount: 800000,
                actualAmount: 850000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Расходы на электричество, отопление, водоснабжение',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Учебные материалы и оборудование',
                type: 'EXPENSE',
                category: 'materials',
                plannedAmount: 500000,
                actualAmount: 320000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Закупка учебников, канцелярии, лабораторного оборудования',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Ремонт и обслуживание',
                type: 'EXPENSE',
                category: 'infrastructure',
                plannedAmount: 400000,
                actualAmount: 200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Текущий ремонт помещений и обслуживание оборудования',
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

    console.log('🏖️ Создаем каникулы...');

    // Создаем периоды каникул для Q3 2025
    await Promise.all([
        prisma.vacation.create({
            data: {
                teacherId: teachers[0].teacher.id,
                type: 'vacation',
                startDate: getDateInQ3_2025(2025, 7, 1),
                endDate: getDateInQ3_2025(2025, 7, 14),
                days: 14,
                status: 'completed',
                comment: 'Летний отпуск',
            },
        }),
        prisma.vacation.create({
            data: {
                teacherId: teachers[1].teacher.id,
                type: 'vacation',
                startDate: getDateInQ3_2025(2025, 8, 15),
                endDate: getDateInQ3_2025(2025, 8, 28),
                days: 14,
                status: 'approved',
                comment: 'Отпуск в конце лета',
            },
        }),
    ]);

    console.log('📅 Создаем события календаря...');

    // Создаем события календаря для Q3 2025
    await Promise.all([
        prisma.calendarEvent.create({
            data: {
                title: 'День знаний - начало учебного года',
                description: 'Торжественная линейка и первые уроки',
                startDate: getDateInQ3_2025(2025, 9, 1),
                endDate: getDateInQ3_2025(2025, 9, 1),
                location: 'Школьный двор',
                isAllDay: true,
                createdById: admin.id,
            },
        }),
        prisma.calendarEvent.create({
            data: {
                title: 'Родительское собрание 10 классов',
                description: 'Обсуждение планов на новый учебный год',
                startDate: getDateInQ3_2025(2025, 9, 10),
                endDate: getDateInQ3_2025(2025, 9, 10),
                location: 'Актовый зал',
                isAllDay: false,
                createdById: admin.id,
            },
        }),
        prisma.calendarEvent.create({
            data: {
                title: 'Контрольная работа по алгебре',
                description: 'Итоговая контрольная работа за Q3',
                startDate: getDateInQ3_2025(2025, 9, 15),
                endDate: getDateInQ3_2025(2025, 9, 15),
                location: 'Аудитория 101',
                isAllDay: false,
                createdById: teachers[0].id,
            },
        }),
    ]);

    console.log('📝 Создаем результаты уроков...');

    // Создаем результаты уроков для студентов
    await Promise.all([
        // Результаты для урока алгебры
        prisma.lessonResult.create({
            data: {
                lessonId: lessons[0].id, // Квадратные уравнения
                studentId: studentUsers[0].student.id, // Айда
                lessonScore: 5,
                attendance: true,
                lessonScorecomment: 'Отлично справилась с решением задач',
            },
        }),
        prisma.lessonResult.create({
            data: {
                lessonId: lessons[0].id,
                studentId: studentUsers[1].student.id, // Арман
                lessonScore: 4,
                attendance: true,
                lessonScorecomment: 'Хорошо работал на уроке, но забыл домашнее задание',
            },
        }),
        // Результаты для урока биологии
        prisma.lessonResult.create({
            data: {
                lessonId: lessons[8].id, // Строение клетки
                studentId: studentUsers[2].student.id, // Дана
                lessonScore: 5,
                attendance: true,
                lessonScorecomment: 'Превосходное знание материала',
            },
        }),
        // Результаты для урока физики
        prisma.lessonResult.create({
            data: {
                lessonId: lessons[13].id, // МКТ
                studentId: studentUsers[3].student.id, // Бекзат
                lessonScore: 4,
                attendance: true,
                lessonScorecomment: 'Хорошее понимание теории',
            },
        }),
    ]);

    console.log('💬 Создаем чаты...');

    // Создаем чаты между родителями и преподавателями
    await Promise.all([
        // Чат между родителем Айды и преподавателем алгебры
        prisma.chatRoom.create({
            data: {
                name: 'Обсуждение успеваемости Айды',
                isGroup: false,
                createdBy: parents[0].id,
                participants: {
                    create: [
                        { userId: parents[0].id },
                        { userId: teachers[0].id },
                    ],
                },
                messages: {
                    create: [
                        {
                            senderId: parents[0].id,
                            content: 'Добрый день! Как дела у Айды по алгебре?',
                            createdAt: getDateInQ3_2025(2025, 8, 15),
                        },
                        {
                            senderId: teachers[0].id,
                            content: 'Здравствуйте! Айда показывает отличные результаты, очень старательная ученица.',
                            createdAt: getDateInQ3_2025(2025, 8, 15),
                        },
                    ],
                },
            },
        }),
    ]);

    console.log('📝 Создаем замечания и комментарии...');

    // Создаем замечания для студентов
    await Promise.all([
        prisma.studentRemark.create({
            data: {
                studentId: studentUsers[1].student.id,
                teacherId: teachers[0].id,
                type: 'ACADEMIC',
                title: 'Не выполнил домашнее задание',
                content: 'Не выполнил домашнее задание по алгебре',
                isPrivate: true,
                createdAt: getDateInQ3_2025(2025, 8, 10),
            },
        }),
        prisma.studentRemark.create({
            data: {
                studentId: studentUsers[1].student.id,
                teacherId: admin.id,
                type: 'BEHAVIOR',
                title: 'Нарушение дисциплины',
                content: 'Нарушение дисциплины на перемене',
                isPrivate: true,
                createdAt: getDateInQ3_2025(2025, 8, 14),
            },
        }),
    ]);

    // Создаем комментарии для студентов
    await Promise.all([
        prisma.studentComment.create({
            data: {
                studentId: studentUsers[0].student.id,
                teacherId: teachers[0].id,
                title: 'Отличная работа на уроке',
                content: 'Отлично решила задачи на уроке, видно что готовилась дома',
                type: 'ACADEMIC',
                isPrivate: true,
                createdAt: getDateInQ3_2025(2025, 8, 5),
            },
        }),
        prisma.studentComment.create({
            data: {
                studentId: studentUsers[2].student.id,
                teacherId: teachers[1].id,
                title: 'Великолепная лабораторная работа',
                content: 'Великолепная лабораторная работа по биологии!',
                type: 'ACADEMIC',
                isPrivate: true,
                createdAt: getDateInQ3_2025(2025, 8, 18),
            },
        }),
    ]);

    console.log('📚 Создаем дополнительные материалы...');

    // Создаем больше материалов для уроков
    await Promise.all([
        prisma.materials.create({
            data: {
                lecture: 'Строение клетки включает в себя мембрану, цитоплазму и органеллы...',
                videoUrl: 'https://www.youtube.com/watch?v=biology1',
                presentationUrl: 'https://docs.google.com/presentation/d/biology1',
                lesson: {
                    connect: { id: lessons[8].id }, // Строение клетки
                },
            },
        }),
        prisma.materials.create({
            data: {
                lecture: 'Молекулярно-кинетическая теория объясняет свойства газов...',
                videoUrl: 'https://www.youtube.com/watch?v=physics1',
                lesson: {
                    connect: { id: lessons[13].id }, // МКТ
                },
            },
        }),
    ]);

    console.log('✅ База данных успешно заполнена!');
    console.log('\n📊 Создано:');
    console.log(`👤 Пользователей: ${2 + teachers.length + studentUsers.length + parents.length}`); // admin + financist + teachers + students + parents
    console.log(`👥 Групп: ${groups.length}`);
    console.log(`🏫 Аудиторий: ${classrooms.length}`);
    console.log(`📚 Учебных планов: ${studyPlans.length}`);
    console.log(`📖 Уроков: ${lessons.length}`);
    console.log('\n🔑 Тестовые аккаунты:');
    console.log(`👨‍💼 Администратор: ${admin.email} / password123`);
    console.log(`💰 Финансист: ${financist.email} / password123`);
    console.log('👨‍🏫 Преподаватель: ivanova@abai.edu.kz / password123');
    console.log('🎓 Студент: aida.student@abai.edu.kz / password123');
    console.log('👨‍👩‍👧‍👦 Родители:');
    console.log('  👩 Назым Казыбекова: nazym.parent@abai.edu.kz / password123 (мать Айды)');
    console.log('  👨 Нурлан Казыбеков: nurlan.parent@abai.edu.kz / password123 (отец Айды)');
    console.log('  👨 Болат Жакипов: bolat.parent@abai.edu.kz / password123 (отец Армана)');
    console.log('  👩 Гульнара Жакипова: gulnara.parent@abai.edu.kz / password123 (мать Армана)');
    console.log('  👨 Асылбек Сералиев: asylbek.parent@abai.edu.kz / password123 (отец Даны)');
    console.log('  👩 Жанар Сералиева: zhanar.parent@abai.edu.kz / password123 (мать Даны)');
    console.log('  👨 Алмас Оразбаев: almas.parent@abai.edu.kz / password123 (отец Бекзата)');
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
