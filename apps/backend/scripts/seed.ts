import { PrismaClient } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Утилиты для генерации дат в августе 2025

function getDateInAugust2025(day: number): Date {
    // Все даты в августе 2025
    return new Date(2025, 7, day); // месяц 7 = август (0-индексация)
}

async function main() {
    console.log('🌱 Деректер қорын толтыруды бастаймыз...');

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

    console.log('📝 Пайдаланушыларды құрамыз...');

    // Хешируем пароль для всех пользователей
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Создаем администратора
    const admin = await prisma.user.create({
        data: {
            email: 'admin@abai.edu.kz',
            name: 'Әкімші',
            surname: 'Басқарушы',
            middlename: 'Жүйебекұлы',
            phone: '+7 700 000 0001',
            role: 'ADMIN',
            hashedPassword,
        },
    });

    // Создаем финансиста
    const financist = await prisma.user.create({
        data: {
            email: 'financist@abai.edu.kz',
            name: 'Гүлмира',
            surname: 'Қасымова',
            middlename: 'Серікжанқызы',
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
                name: 'Айгерім',
                surname: 'Айтанова',
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
                surname: 'Әлиев',
                middlename: 'Серікұлы',
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
                name: 'Мұрат',
                surname: 'Төлекенов',
                middlename: 'Асылханұлы',
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
                name: 'Айгүл',
                surname: 'Назарбаева',
                middlename: 'Ермекқызы',
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

    console.log('👥 Топтарды құрамыз...');

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

    console.log('🎓 Студенттерді құрамыз...');

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
        prisma.user.create({
            data: {
                email: 'temirlan.student@abai.edu.kz',
                name: 'Темирлан',
                surname: 'Байбеков',
                middlename: 'Асылович',
                phone: '+7 700 000 0030',
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
                email: 'aida2.student@abai.edu.kz',
                name: 'Айдана',
                surname: 'Нурланова',
                middlename: 'Ерланқызы',
                phone: '+7 700 000 0031',
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
        prisma.user.create({
            data: {
                email: 'amina.student@abai.edu.kz',
                name: 'Амина',
                surname: 'Жақсылыкова',
                middlename: 'Бахытжанқызы',
                phone: '+7 700 000 0032',
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
        prisma.user.create({
            data: {
                email: 'askar.student@abai.edu.kz',
                name: 'Асқар',
                surname: 'Мұратов',
                middlename: 'Серікұлы',
                phone: '+7 700 000 0033',
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
        prisma.user.create({
            data: {
                email: 'zarina.student@abai.edu.kz',
                name: 'Зарина',
                surname: 'Қасымова',
                middlename: 'Ерболқызы',
                phone: '+7 700 000 0034',
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
        // Студенты 11Б
        prisma.user.create({
            data: {
                email: 'dias.student@abai.edu.kz',
                name: 'Диас',
                surname: 'Әбділдаев',
                middlename: 'Нұрланұлы',
                phone: '+7 700 000 0035',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[3].id, // 11Б
                    },
                },
            },
            include: { student: true },
        }),
        // Студенты 9А
        prisma.user.create({
            data: {
                email: 'aruzhan.student@abai.edu.kz',
                name: 'Аружан',
                surname: 'Тілеубекова',
                middlename: 'Мақсатқызы',
                phone: '+7 700 000 0036',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[4].id, // 9А
                    },
                },
            },
            include: { student: true },
        }),
        prisma.user.create({
            data: {
                email: 'alibek.student@abai.edu.kz',
                name: 'Әлібек',
                surname: 'Досымов',
                middlename: 'Болатұлы',
                phone: '+7 700 000 0037',
                role: 'STUDENT',
                hashedPassword,
                student: {
                    create: {
                        groupId: groups[4].id, // 9А
                    },
                },
            },
            include: { student: true },
        }),
    ]);

    console.log('👨‍👩‍👧‍👦 Ата-аналарды құрамыз...');

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

    console.log('🏫 Сыныптарды (аудиторияларды) құрамыз...');

    // Создаем аудитории
    const classrooms = await Promise.all([
        prisma.classroom.create({
            data: {
                name: '101',
                building: 'Негізгі корпус',
                floor: 1,
                capacity: 30,
                type: 'LECTURE',
                equipment: ['Проектор', 'Интерактивті тақта', 'Компьютер'],
                description: 'Заманауи жабдықталған дәріс аудиториясы',
            },
        }),
        prisma.classroom.create({
            data: {
                name: '205',
                building: 'Негізгі корпус',
                floor: 2,
                capacity: 25,
                type: 'PRACTICE',
                equipment: ['Проектор', 'Маркерлік тақта'],
                description: 'Тәжірибелік сабақтарға арналған аудитория',
            },
        }),
        prisma.classroom.create({
            data: {
                name: '305',
                building: 'Жаратылыстану корпусы',
                floor: 3,
                capacity: 20,
                type: 'LABORATORY',
                equipment: ['Зертханалық жабдық', 'Сору шкафы', 'Микроскоптар'],
                description: 'Физика және химия зертханасы',
            },
        }),
    ]);

    console.log('📚 Оқу жоспарларын құрамыз...');

    // Создаем учебные планы
    const studyPlans = await Promise.all([
        prisma.studyPlan.create({
            data: {
                name: 'Алгебра - 10 сынып',
                description: '10 сыныпқа арналған алгебраны тереңдетіп оқыту (талдау элементтерімен)',
                teacherId: teachers[0].teacher.id, // Иванова
                normativeWorkload: 102, // часов в год
                group: {
                    connect: [{ id: groups[0].id }, { id: groups[1].id }], // 10А и 10Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Биология - 10 сынып',
                description: 'Жалпы биология және экология негіздері',
                teacherId: teachers[1].teacher.id, // Алиев
                normativeWorkload: 68,
                group: {
                    connect: [{ id: groups[1].id }], // 10Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Физика - 11 сынып',
                description: 'Молекулалық физика және термодинамика',
                teacherId: teachers[2].teacher.id, // Тулегенов
                normativeWorkload: 85,
                group: {
                    connect: [{ id: groups[2].id }, { id: groups[3].id }], // 11А и 11Б
                },
            },
        }),
        prisma.studyPlan.create({
            data: {
                name: 'Химия - 9 сынып',
                description: 'Бейорганикалық химия негіздері',
                teacherId: teachers[3].teacher.id, // Назарбаева
                normativeWorkload: 68,
                group: {
                    connect: [{ id: groups[4].id }], // 9А
                },
            },
        }),
    ]);

    console.log('📅 Сабақ кестесін құрамыз...');

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

    console.log('📖 Сабақтарды құрамыз...');

    // Создаем расширенный набор уроков для августа 2025
    const lessons = await Promise.all([
        // Уроки алгебры (10 класс) - август 2025
        prisma.lesson.create({
            data: {
                name: 'Квадрат теңдеулер',
                description: 'Квадрат теңдеулерді әртүрлі тәсілдермен шешу',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(5),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Қысқаша көбейту формулалары',
                description: 'Қысқаша көбейту формулаларын қолдану',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(8),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Виет теоремасы',
                description: 'Виет теоремасын оқып-үйрену және қолдану',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(12),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Алгебра бойынша бақылау жұмысы',
                description: 'Өтілген тақырыптар бойынша білімді тексеру',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(15),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Теңдеулер жүйелері',
                description: 'Сызықтық және квадрат теңдеулер жүйесін шешу',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(19),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Теңсіздіктер',
                description: 'Сызықтық және квадрат теңсіздіктерді шешу',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(22),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Функциялар және олардың графиктері',
                description: 'Негізгі функцияларды оқу және графиктерін салу',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(26),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Функциялар бойынша практикум',
                description: 'Функциялар бойынша есептер шешу',
                studyPlanId: studyPlans[0].id,
                date: getDateInAugust2025(29),
            },
        }),

        // Уроки биологии (10 класс) - август 2025
        prisma.lesson.create({
            data: {
                name: 'Жасуша құрылысы',
                description: 'Цитология негіздері, эукариоттық жасуша құрылысы',
                studyPlanId: studyPlans[1].id,
                date: getDateInAugust2025(6),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Фотосинтез',
                description: 'Өсімдіктердегі фотосинтез үрдісі',
                studyPlanId: studyPlans[1].id,
                date: getDateInAugust2025(9),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Өсімдіктердің тыныс алуы',
                description: 'Өсімдіктер мен жануарлардың тыныс алу процестері',
                studyPlanId: studyPlans[1].id,
                date: getDateInAugust2025(13),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Генетика және тұқымқуалаушылық',
                description: 'Генетика негіздері, Мендель заңдары',
                studyPlanId: studyPlans[1].id,
                date: getDateInAugust2025(16),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Генетика бойынша зертханалық жұмыс',
                description: 'Генетикалық есептер шығару',
                studyPlanId: studyPlans[1].id,
                date: getDateInAugust2025(20),
            },
        }),

        // Уроки физики (11 класс) - август 2025
        prisma.lesson.create({
            data: {
                name: 'Молекулалық-кинетикалық теория',
                description: 'МКТ негізгі қағидалары',
                studyPlanId: studyPlans[2].id,
                date: getDateInAugust2025(7),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Газ заңдары',
                description: 'Идеал газ заңдарын оқу',
                studyPlanId: studyPlans[2].id,
                date: getDateInAugust2025(10),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Термодинамика',
                description: 'Термодинамиканың бірінші және екінші заңдары',
                studyPlanId: studyPlans[2].id,
                date: getDateInAugust2025(14),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Термодинамика бойынша зертханалық жұмыс',
                description: 'Жылулық процестерді тәжірибелік зерттеу',
                studyPlanId: studyPlans[2].id,
                date: getDateInAugust2025(17),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Электростатика',
                description: 'Электр өрісі және оның сипаттамалары',
                studyPlanId: studyPlans[2].id,
                date: getDateInAugust2025(21),
            },
        }),

        // Уроки химии (9 класс) - август 2025
        prisma.lesson.create({
            data: {
                name: 'Периодтық жүйе',
                description: 'Периодтық заң және элементтердің периодтық жүйесі',
                studyPlanId: studyPlans[3].id,
                date: getDateInAugust2025(11),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Химиялық байланыстар',
                description: 'Коваленттік, иондық және металлдық байланыс',
                studyPlanId: studyPlans[3].id,
                date: getDateInAugust2025(18),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Химиялық реакциялар бойынша практикалық жұмыс',
                description: 'Зертханада химиялық реакциялар жүргізу',
                studyPlanId: studyPlans[3].id,
                date: getDateInAugust2025(23),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Қышқылдар және негіздер',
                description: 'Қышқылдар мен негіздердің қасиеттері, бейтараптану реакциялары',
                studyPlanId: studyPlans[3].id,
                date: getDateInAugust2025(27),
            },
        }),
        prisma.lesson.create({
            data: {
                name: 'Тотығу-тотықсыздану реакциялары',
                description: 'ТТР-ды оқу және теңдеулер құрастыру',
                studyPlanId: studyPlans[3].id,
                date: getDateInAugust2025(30),
            },
        }),
    ]);

    console.log('🎯 Сабақ материалдарын құрамыз...');

    // Создаем материалы для некоторых уроков
    await Promise.all([
        prisma.materials.create({
            data: {
                lecture: 'Квадрат теңдеулер ax² + bx + c = 0 түрінде болады, мұнда a ≠ 0...',
                videoUrl: 'https://www.youtube.com/watch?v=example1',
                presentationUrl: 'https://docs.google.com/presentation/d/example1',
                lesson: {
                    connect: { id: lessons[0].id },
                },
            },
        }),
        prisma.materials.create({
            data: {
                lecture: 'Қысқаша көбейту формулалары есептеулерді жеңілдетуге көмектеседі...',
                videoUrl: 'https://www.youtube.com/watch?v=example2',
                lesson: {
                    connect: { id: lessons[1].id },
                },
            },
        }),
    ]);

    console.log('💰 Төлемдерді құрамыз...');

    // Создаем платежи для студентов
    await Promise.all([
        // Платежи для Айды Казыбековой
        prisma.payment.create({
            data: {
                studentId: studentUsers[0].student.id,
                serviceType: 'tuition',
                serviceName: '2025 жылғы тамыз айы оқу ақысы',
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
                serviceName: '2025 жылғы тамыз айы асханалық тамақтану',
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
                serviceName: '2025 жылғы тамыз айы оқу ақысы',
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
                serviceName: '2025 жылғы тамыз айы көлік қызметі',
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
                serviceName: '2025 жылғы тамыз айы оқу ақысы',
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
                serviceName: 'Математикадан қосымша сабақтар',
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
                serviceName: '2025 жылғы тамыз айы оқу ақысы',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2025-08-01'),
                status: 'paid',
                paymentDate: new Date('2025-07-25'),
                paidAmount: 45000,
            },
        }),
    ]);

    console.log('💼 Бюджет баптарын құрамыз...');

    // Создаем статьи бюджета
    await Promise.all([
        // Доходы
        prisma.budgetItem.create({
            data: {
                name: 'Оқу ақысы',
                type: 'INCOME',
                category: 'tuition',
                plannedAmount: 5000000,
                actualAmount: 4200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Студенттердің оқу ақысынан негізгі табыстар',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Гранттар мен субсидиялар',
                type: 'INCOME',
                category: 'grants',
                plannedAmount: 1200000,
                actualAmount: 1200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Білім беруге арналған мемлекеттік гранттар мен субсидиялар',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Қосымша қызметтер',
                type: 'INCOME',
                category: 'services',
                plannedAmount: 300000,
                actualAmount: 180000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Қосымша білім беру қызметтерінен табыс',
            },
        }),
        // Расходы
        prisma.budgetItem.create({
            data: {
                name: 'Оқытушылар еңбекақысы',
                type: 'EXPENSE',
                category: 'salaries',
                plannedAmount: 3200000,
                actualAmount: 3150000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Педагогикалық құрамның еңбекақысына негізгі шығындар',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Коммуналдық қызметтер',
                type: 'EXPENSE',
                category: 'utilities',
                plannedAmount: 800000,
                actualAmount: 850000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Электр, жылыту, су жабдығына шығындар',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Оқу материалдары және жабдық',
                type: 'EXPENSE',
                category: 'materials',
                plannedAmount: 500000,
                actualAmount: 320000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Оқулықтар, кеңсе тауарлары, зертханалық жабдық сатып алу',
            },
        }),
        prisma.budgetItem.create({
            data: {
                name: 'Жөндеу және қызмет көрсету',
                type: 'EXPENSE',
                category: 'infrastructure',
                plannedAmount: 400000,
                actualAmount: 200000,
                currency: 'KZT',
                period: '2025 Q3',
                responsible: 'Касымова Г.С.',
                status: 'ACTIVE',
                description: 'Ғимараттарды ағымдағы жөндеу және жабдыққа қызмет көрсету',
            },
        }),
    ]);

    console.log('🔔 Хабарламаларды құрамыз...');

    // Создаем уведомления
    await Promise.all([
        prisma.notification.create({
            data: {
                userId: studentUsers[0].id,
                type: 'payment',
                message: 'Оқу ақысы сәтті төленді',
                read: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: studentUsers[1].id,
                type: 'payment',
                message: 'Ескерту: оқу ақысын төлеу мерзімі өтті',
                read: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: teachers[0].id,
                type: 'lesson',
                message: '"Квадрат теңдеулер" сабағы 30 минуттан кейін басталады',
                read: true,
            },
        }),
    ]);

    console.log('🏖️ Демалыс кезеңдерін құрамыз...');

    // Создаем периоды каникул для августа 2025
    await Promise.all([
        prisma.vacation.create({
            data: {
                teacherId: teachers[0].teacher.id,
                type: 'vacation',
                startDate: getDateInAugust2025(1),
                endDate: getDateInAugust2025(14),
                days: 14,
                status: 'completed',
                comment: 'Жазғы демалыс',
            },
        }),
        prisma.vacation.create({
            data: {
                teacherId: teachers[1].teacher.id,
                type: 'vacation',
                startDate: getDateInAugust2025(15),
                endDate: getDateInAugust2025(28),
                days: 14,
                status: 'approved',
                comment: 'Жаз соңындағы демалыс',
            },
        }),
    ]);

    console.log('📅 Күнтізбе оқиғаларын құрамыз...');

    // Создаем события календаря для августа 2025
    await Promise.all([
        prisma.calendarEvent.create({
            data: {
                title: 'Білім күні - жаңа оқу жылының басталуы',
                description: 'Салтанатты сап түзеу және алғашқы сабақтар',
                startDate: getDateInAugust2025(1),
                endDate: getDateInAugust2025(1),
                location: 'Школьный двор',
                isAllDay: true,
                createdById: admin.id,
            },
        }),
        prisma.calendarEvent.create({
            data: {
                title: '10 сыныптар ата-аналар жиналысы',
                description: 'Жаңа оқу жылына жоспарларды талқылау',
                startDate: getDateInAugust2025(10),
                endDate: getDateInAugust2025(10),
                location: 'Актовый зал',
                isAllDay: false,
                createdById: admin.id,
            },
        }),
        prisma.calendarEvent.create({
            data: {
                title: 'Алгебра бойынша бақылау жұмысы',
                description: 'Алгебрадан қорытынды бақылау жұмысы',
                startDate: getDateInAugust2025(15),
                endDate: getDateInAugust2025(15),
                location: 'Аудитория 101',
                isAllDay: false,
                createdById: teachers[0].id,
            },
        }),
    ]);

    console.log('📝 Сабақ нәтижелерін құрамыз...');

    // Создаем результаты уроков для всех студентов по всем урокам
    const lessonResults = [];

    // Результаты для уроков алгебры (для студентов 10А и 10Б)
    const algebraStudents = studentUsers.slice(0, 7); // Первые 7 студентов из 10А и 10Б
    const algebraLessons = lessons.slice(0, 8); // Первые 8 уроков алгебры

    for (const lesson of algebraLessons) {
        for (let i = 0; i < algebraStudents.length; i++) {
            const student = algebraStudents[i];
            // Айда (0) - отличница, Арман (1) - хорошист с проблемами, остальные - средние студенты
            let score, comment, attendance = true;
            
            if (i === 0) { // Айда - отличница
                score = Math.random() > 0.1 ? 5 : 4;
                comment = score === 5 ? 'Есептерді өте жақсы орындады' : 'Жақсы жұмыс, аздаған кемшіліктер бар';
            } else if (i === 1) { // Арман - проблемный студент
                score = Math.random() > 0.3 ? (Math.random() > 0.5 ? 4 : 3) : 2;
                attendance = Math.random() > 0.2;
                comment = !attendance ? 'Сабаққа қатысқан жоқ' : 
                         score <= 2 ? 'Үй тапсырмасын орындамады' : 'Қанағаттанарлық';
            } else { // Остальные студенты
                score = Math.random() > 0.1 ? (Math.random() > 0.4 ? 4 : 3) : (Math.random() > 0.5 ? 5 : 2);
                attendance = Math.random() > 0.05;
                comment = !attendance ? 'Қатыспады' : 
                         score === 5 ? 'Өте жақсы жұмыс' :
                         score === 4 ? 'Материалды жақсы түсінеді' :
                         score === 3 ? 'Қанағаттанарлық' : 'Білімін жетілдіру керек';
            }

            lessonResults.push(
                prisma.lessonResult.create({
                    data: {
                        lessonId: lesson.id,
                        studentId: student.student.id,
                        lessonScore: attendance ? score : null,
                        attendance: attendance,
                        lessonScorecomment: comment,
                    },
                })
            );
        }
    }

    // Результаты для уроков биологии (для студентов 10Б)
    const biologyStudents = studentUsers.slice(4, 7); // Студенты 10Б
    const biologyLessons = lessons.slice(8, 13); // Уроки биологии

    for (const lesson of biologyLessons) {
        for (let i = 0; i < biologyStudents.length; i++) {
            const student = biologyStudents[i];
            // Дана (0 в этом массиве) - отличница по биологии
            let score, comment, attendance = true;
            
            if (i === 0) { // Дана - отличница по биологии
                score = Math.random() > 0.05 ? 5 : 4;
                comment = score === 5 ? 'Материалды тамаша меңгерген' : 'Өте жақсы';
            } else {
                score = Math.random() > 0.1 ? (Math.random() > 0.3 ? 4 : 3) : (Math.random() > 0.7 ? 5 : 2);
                attendance = Math.random() > 0.1;
                comment = !attendance ? 'Қатыспады' : 
                         score === 5 ? 'Өте жақсы жұмыс' :
                         score === 4 ? 'Биологияны жақсы түсінеді' :
                         score === 3 ? 'Орташа деңгей' : 'Көбірек назар қажет';
            }

            lessonResults.push(
                prisma.lessonResult.create({
                    data: {
                        lessonId: lesson.id,
                        studentId: student.student.id,
                        lessonScore: attendance ? score : null,
                        attendance: attendance,
                        lessonScorecomment: comment,
                    },
                })
            );
        }
    }

    // Результаты для уроков физики (для студентов 11А и 11Б)
    const physicsStudents = studentUsers.slice(7, 10); // Студенты 11А и 11Б
    const physicsLessons = lessons.slice(13, 18); // Уроки физики

    for (const lesson of physicsLessons) {
        for (let i = 0; i < physicsStudents.length; i++) {
            const student = physicsStudents[i];
            // Бекзат (0) - хорошист, Зарина (1) - отличница, Диас (2) - средний
            let score, comment, attendance = true;
            
            if (i === 0) { // Бекзат - хорошист
                score = Math.random() > 0.2 ? 4 : (Math.random() > 0.5 ? 5 : 3);
                comment = score === 5 ? 'Теорияны өте жақсы түсінеді' :
                         score === 4 ? 'Теорияны жақсы түсінеді' : 'Көбірек практика керек';
            } else if (i === 1) { // Зарина - отличница
                score = Math.random() > 0.1 ? 5 : 4;
                comment = score === 5 ? 'Физиканы керемет біледі' : 'Өте жақсы';
            } else { // Диас - средний
                score = Math.random() > 0.2 ? 3 : (Math.random() > 0.6 ? 4 : 2);
                attendance = Math.random() > 0.15;
                comment = !attendance ? 'Қатыспады' : 
                         score === 4 ? 'Жақсы' :
                         score === 3 ? 'Қанағаттанарлық' : 'Білімі әлсіз';
            }

            lessonResults.push(
                prisma.lessonResult.create({
                    data: {
                        lessonId: lesson.id,
                        studentId: student.student.id,
                        lessonScore: attendance ? score : null,
                        attendance: attendance,
                        lessonScorecomment: comment,
                    },
                })
            );
        }
    }

    // Результаты для уроков химии (для студентов 9А)
    const chemistryStudents = studentUsers.slice(10, 12); // Студенты 9А
    const chemistryLessons = lessons.slice(18, 23); // Уроки химии

    for (const lesson of chemistryLessons) {
        for (let i = 0; i < chemistryStudents.length; i++) {
            const student = chemistryStudents[i];
            // Аружан (0) - хорошистка, Әлібек (1) - средний с проблемами
            let score, comment, attendance = true;
            
            if (i === 0) { // Аружан - хорошистка
                score = Math.random() > 0.2 ? (Math.random() > 0.4 ? 4 : 5) : 3;
                comment = score === 5 ? 'Химияны өте жақсы меңгерген' :
                         score === 4 ? 'Жақсы білім' : 'Қалыпты';
            } else { // Әлібек - проблемный
                score = Math.random() > 0.4 ? 3 : (Math.random() > 0.6 ? 2 : 4);
                attendance = Math.random() > 0.25;
                comment = !attendance ? 'Қатыспады' : 
                         score === 4 ? 'Күтпеген жақсы нәтиже' :
                         score === 3 ? 'Қанағаттанарлық' : 'Нашар дайындалған';
            }

            lessonResults.push(
                prisma.lessonResult.create({
                    data: {
                        lessonId: lesson.id,
                        studentId: student.student.id,
                        lessonScore: attendance ? score : null,
                        attendance: attendance,
                        lessonScorecomment: comment,
                    },
                })
            );
        }
    }

    await Promise.all(lessonResults);

    console.log('💬 Чаттарды құрамыз...');

    // Создаем чаты между родителями и преподавателями
    await Promise.all([
        // Чат между родителем Айды и преподавателем алгебры
        prisma.chatRoom.create({
            data: {
                name: 'Айданың үлгерімін талқылау',
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
                            content: 'Сәлеметсіз бе! Айданың алгебра пәні қалай?',
                            createdAt: getDateInAugust2025(15),
                        },
                        {
                            senderId: teachers[0].id,
                            content: 'Сәлем! Айда өте жақсы нәтиже көрсетіп жүр, өте тырысқақ оқушы.',
                            createdAt: getDateInAugust2025(15),
                        },
                    ],
                },
            },
        }),
    ]);

    console.log('📝 Ескертпелер мен пікірлерді құрамыз...');

    // Создаем замечания для студентов
    await Promise.all([
        prisma.studentRemark.create({
            data: {
                studentId: studentUsers[1].student.id,
                teacherId: teachers[0].id,
                type: 'ACADEMIC',
                title: 'Үй тапсырмасын орындамады',
                content: 'Алгебра бойынша үй тапсырмасын орындамаған',
                isPrivate: true,
                createdAt: getDateInAugust2025(10),
            },
        }),
        prisma.studentRemark.create({
            data: {
                studentId: studentUsers[1].student.id,
                teacherId: admin.id,
                type: 'BEHAVIOR',
                title: 'Тәртіп бұзушылық',
                content: 'Үзіліс кезінде тәртіп сақтамаған',
                isPrivate: true,
                createdAt: getDateInAugust2025(14),
            },
        }),
    ]);

    // Создаем комментарии для студентов
    await Promise.all([
        prisma.studentComment.create({
            data: {
                studentId: studentUsers[0].student.id,
                teacherId: teachers[0].id,
                title: 'Сабақта өте жақсы жұмыс',
                content: 'Сабақтағы есептерді тамаша шығарды, үйде дайындалғаны көрініп тұр',
                type: 'ACADEMIC',
                isPrivate: true,
                createdAt: getDateInAugust2025(5),
            },
        }),
        prisma.studentComment.create({
            data: {
                studentId: studentUsers[2].student.id,
                teacherId: teachers[1].id,
                title: 'Тамаша зертханалық жұмыс',
                content: 'Биология бойынша зертханалық жұмысты тамаша орындады!',
                type: 'ACADEMIC',
                isPrivate: true,
                createdAt: getDateInAugust2025(18),
            },
        }),
    ]);

    console.log('📚 Қосымша материалдарды құрамыз...');

    // Создаем больше материалов для уроков
    await Promise.all([
        prisma.materials.create({
            data: {
                lecture: 'Жасуша құрылысына мембрана, цитоплазма және органоидтар кіреді...',
                videoUrl: 'https://www.youtube.com/watch?v=biology1',
                presentationUrl: 'https://docs.google.com/presentation/d/biology1',
                lesson: {
                    connect: { id: lessons[8].id }, // Строение клетки
                },
            },
        }),
        prisma.materials.create({
            data: {
                lecture: 'Молекулалық-кинетикалық теория газдардың қасиеттерін түсіндіреді...',
                videoUrl: 'https://www.youtube.com/watch?v=physics1',
                lesson: {
                    connect: { id: lessons[13].id }, // МКТ
                },
            },
        }),
    ]);

    console.log('📝 KPI үшін пікір (feedback) шаблондарын құрамыз...');

    // Создаем шаблоны фидбеков с KPI вопросами
    const feedbackTemplates = await Promise.all([
        // Шаблон для оценки преподавателей студентами (основной для KPI удержания)
        prisma.feedbackTemplate.create({
            data: {
                name: 'teacher_evaluation_students',
                role: 'STUDENT',
                title: 'Студенттердің оқытушыны бағалауы',
                description: 'Ай сайынғы оқыту сапасы мен студенттердің қанағаттану деңгейін бағалау',
                questions: [
                    {
                        id: 'teaching_quality',
                        question: 'Оқыту сапасын қалай бағалайсыз?',
                        type: 'RATING_1_5',
                        category: 'teaching',
                        required: true,
                        kpiMetric: 'TEACHING_QUALITY',
                        isKpiRelevant: true,
                        kpiWeight: 2
                    },
                    {
                        id: 'lesson_effectiveness',
                        question: 'Осы оқытушының сабақтары қаншалықты тиімді?',
                        type: 'RATING_1_5',
                        category: 'effectiveness',
                        required: true,
                        kpiMetric: 'LESSON_EFFECTIVENESS',
                        isKpiRelevant: true,
                        kpiWeight: 2
                    },
                    {
                        id: 'student_retention',
                        question: 'Осы оқытушыдан әрі қарай оқуды жалғастырмақсыз ба?',
                        type: 'YES_NO',
                        category: 'retention',
                        required: true,
                        kpiMetric: 'STUDENT_RETENTION',
                        isKpiRelevant: true,
                        kpiWeight: 3
                    },
                    {
                        id: 'recommendation',
                        question: 'Бұл оқытушыны басқа студенттерге ұсынар ма едіңіз?',
                        type: 'YES_NO',
                        category: 'recommendation',
                        required: true,
                        kpiMetric: 'RECOMMENDATION',
                        isKpiRelevant: true,
                        kpiWeight: 2
                    },
                    {
                        id: 'overall_satisfaction',
                        question: 'Осы оқытушыдан алған жалпы әсеріңіз (қанағат деңгейі)',
                        type: 'RATING_1_10',
                        category: 'satisfaction',
                        required: true,
                        kpiMetric: 'OVERALL_EXPERIENCE',
                        isKpiRelevant: true,
                        kpiWeight: 1
                    },
                    {
                        id: 'improvement_suggestions',
                        question: 'Оқытуда нені жақсартуға болады?',
                        type: 'TEXT',
                        category: 'feedback',
                        required: false,
                        isKpiRelevant: false
                    }
                ],
                isActive: true,
                frequency: 'MONTHLY',
                priority: 1,
                hasKpiQuestions: true,
                kpiMetrics: ['STUDENT_RETENTION', 'TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'RECOMMENDATION', 'OVERALL_EXPERIENCE']
            },
        }),
        // Дополнительный шаблон для общей оценки студентами
        prisma.feedbackTemplate.create({
            data: {
                name: 'student_general_satisfaction',
                role: 'STUDENT',
                title: 'Оқумен жалпы қанағаттану',
                description: 'Студенттердің жалпы қанағаттану деңгейін тоқсан сайын бағалау',
                questions: [
                    {
                        id: 'school_satisfaction',
                        question: 'Біздің білім орнындағы оқуға қаншалықты қанағаттанасыз?',
                        type: 'RATING_1_10',
                        category: 'general',
                        required: true,
                        kpiMetric: 'OVERALL_EXPERIENCE',
                        isKpiRelevant: true,
                        kpiWeight: 1
                    },
                    {
                        id: 'motivation_level',
                        question: 'Оқуға деген мотивация деңгейіңіз қалай өзгерді?',
                        type: 'RATING_1_5',
                        category: 'motivation',
                        required: true
                    }
                ],
                isActive: true,
                frequency: 'QUARTERLY',
                priority: 2,
                hasKpiQuestions: true,
                kpiMetrics: ['OVERALL_EXPERIENCE']
            },
        })
    ]);

    console.log('💬 Студенттердің оқытушылар жайлы пікір жауаптарын құрамыз...');

    // Функция для создания реалистичных оценок
    const createFeedbackAnswer = (teacherRating: number) => {
        // teacherRating: 1-худший, 5-лучший преподаватель
        const baseScore = teacherRating;
        const variation = 0.5; // небольшая вариация в ответах
        
        return {
            teaching_quality: Math.min(5, Math.max(1, Math.round(baseScore + (Math.random() - 0.5) * variation))),
            lesson_effectiveness: Math.min(5, Math.max(1, Math.round(baseScore + (Math.random() - 0.5) * variation))),
            student_retention: baseScore >= 3, // если оценка 3 и выше, то планирует продолжить
            recommendation: baseScore >= 4, // если оценка 4 и выше, то порекомендует
            overall_satisfaction: Math.min(10, Math.max(1, Math.round((baseScore * 2) + (Math.random() - 0.5) * variation))),
            improvement_suggestions: baseScore < 3 ? 'Көбірек тәжірибелік тапсырмалар қажет' : 'Барлығы тамаша!'
        };
    };

    // Создаем фидбек ответы от каждого студента о каждом преподавателе
    const feedbackResponses = [];
    
    // Рейтинги преподавателей (1-5, где 5 - лучший)
    const teacherRatings = [
        { teacher: teachers[0], rating: 5 }, // Иванова - отличный преподаватель
        { teacher: teachers[1], rating: 4 }, // Алиев - хороший преподаватель  
        { teacher: teachers[2], rating: 3 }, // Тулегенов - средний преподаватель
        { teacher: teachers[3], rating: 2 }, // Назарбаева - слабый преподаватель
    ];

    // Создаем фидбеки от каждого студента о каждом преподавателе за последние 3 месяца
    for (const { teacher, rating } of teacherRatings) {
        for (const studentUser of studentUsers) {
            // Создаем фидбеки за разные периоды
            const periods = ['2025-07', '2025-08', '2025-09'];
            
            for (const period of periods) {
                const answers = createFeedbackAnswer(rating);
                
                feedbackResponses.push(
                    prisma.feedbackResponse.create({
                        data: {
                            userId: studentUser.id,
                            templateId: feedbackTemplates[0].id,
                            answers: answers,
                            isCompleted: true,
                            period: period,
                            aboutTeacherId: teacher.teacher.id, // Ключевое поле - о каком преподавателе фидбек
                            submittedAt: new Date(`${period}-15T10:00:00Z`),
                        },
                    })
                );
            }
        }
    }

    await Promise.all(feedbackResponses);

    console.log('📊 Пайдаланушылар үшін пікір мәртебелерін құрамыз...');

    // Создаем статус фидбеков для студентов
    const feedbackStatuses = studentUsers.map(student => 
        prisma.userFeedbackStatus.create({
            data: {
                userId: student.id,
                hasCompletedMandatory: true,
                lastCompletedAt: new Date('2025-09-15'),
                currentPeriod: '2025-09',
                nextDueDate: new Date('2025-10-15'),
            },
        })
    );

    await Promise.all(feedbackStatuses);

    console.log('🏆 KPI үшін оқытушылар жетістіктерін құрамыз...');

    // Создаем достижения для преподавателей
    await Promise.all([
        // Достижения для Ивановой (лучший преподаватель)
        prisma.teacherAchievement.create({
            data: {
                teacherId: teachers[0].teacher.id,
                type: 'QUALIFICATION',
                title: 'Заманауи оқыту әдістері бойынша біліктілікті арттыру',
                description: 'Біліктілікті арттыру курстарынан өтті',
                date: getDateInAugust2025(15),
                points: 50,
                isVerified: true,
                verifiedAt: getDateInAugust2025(20),
            },
        }),
        prisma.teacherAchievement.create({
            data: {
                teacherId: teachers[0].teacher.id,
                type: 'TEAM_EVENT',
                title: 'Математикалық олимпиаданы ұйымдастыру',
                description: 'Мектепішілік математика олимпиадасын ұйымдастырды және өткізді',
                date: getDateInAugust2025(10),
                points: 30,
                isVerified: true,
                verifiedAt: getDateInAugust2025(15),
            },
        }),
        // Достижения для Алиева
        prisma.teacherAchievement.create({
            data: {
                teacherId: teachers[1].teacher.id,
                type: 'PROJECT_HELP',
                title: 'Ғылыми жобаға көмек',
                description: 'Биология бойынша ғылыми жобаны дайындауда студенттерге көмектесті',
                date: getDateInAugust2025(20),
                points: 25,
                isVerified: true,
                verifiedAt: getDateInAugust2025(25),
            },
        }),
    ]);

    console.log('🥇 KPI үшін олимпиада нәтижелерін құрамыз...');

    // Создаем результаты олимпиад (влияют на KPI преподавателей)
    await Promise.all([
        prisma.olympiadResult.create({
            data: {
                studentId: studentUsers[0].student.id, // Айда
                teacherId: teachers[0].teacher.id, // Иванова
                olympiadName: 'Қалалық математика олимпиадасы',
                subject: 'Математика',
                level: 'Қалалық',
                place: 1,
                date: getDateInAugust2025(1),
            },
        }),
        prisma.olympiadResult.create({
            data: {
                studentId: studentUsers[1].student.id, // Арман
                teacherId: teachers[0].teacher.id, // Иванова
                olympiadName: 'Мектепішілік алгебра олимпиадасы',
                subject: 'Алгебра',
                level: 'Мектепішілік',
                place: 2,
                date: getDateInAugust2025(15),
            },
        }),
        prisma.olympiadResult.create({
            data: {
                studentId: studentUsers[2].student.id, // Дана
                teacherId: teachers[1].teacher.id, // Алиев
                olympiadName: 'Өңірлік биология олимпиадасы',
                subject: 'Биология',
                level: 'Өңірлік',
                place: 3,
                date: getDateInAugust2025(10),
            },
        }),
    ]);

    console.log('🎓 KPI үшін студенттердің түсу жазбаларын құрамыз...');

    // Создаем записи о поступлениях (влияют на KPI преподавателей)
    await Promise.all([
        prisma.studentAdmission.create({
            data: {
                studentId: studentUsers[3].student.id, // Бекзат (11 класс)
                teacherId: teachers[2].teacher.id, // Тулегенов (физика)
                schoolType: 'RFMSH',
                schoolName: 'Республикалық физика-математика мектебі',
                admissionYear: 2025,
            },
        }),
    ]);

    console.log('📋 КТП (күнтізбелік-тақырыптық жоспар) құрамыз...');

    // Создаем КТП для каждого учебного плана
    await Promise.all([
        // КТП для алгебры 10 класс (Иванова)
        prisma.curriculumPlan.create({
            data: {
                studyPlanId: studyPlans[0].id, // Алгебра 10 класс
                totalLessons: 25,
                plannedLessons: [
                    {
                        id: 'section_1',
                        title: 'Квадрат теңдеулер және теңсіздіктер',
                        description: 'Квадрат теңдеулерді шешу әдістерін оқу',
                        order: 1,
                        topics: [
                            {
                                id: 'topic_1_1',
                                title: 'Квадрат теңдеулер',
                                description: 'Квадрат теңдеулерді әртүрлі тәсілдермен шешу',
                                hours: 4,
                                order: 1,
                                completed: true,
                                completedAt: '2025-07-05T00:00:00Z'
                            },
                            {
                                id: 'topic_1_2',
                                title: 'Қысқаша көбейту формулалары',
                                description: 'Есептерді шешуде қысқаша көбейту формулаларын қолдану',
                                hours: 3,
                                order: 2,
                                completed: true,
                                completedAt: '2025-07-12T00:00:00Z'
                            },
                            {
                                id: 'topic_1_3',
                                title: 'Виет теоремасы',
                                description: 'Виет теоремасын оқу және қолдану',
                                hours: 2,
                                order: 3,
                                completed: true,
                                completedAt: '2025-07-19T00:00:00Z'
                            },
                            {
                                id: 'topic_1_4',
                                title: 'Бақылау жұмысы №1',
                                description: 'Квадрат теңдеулер бойынша білімді тексеру',
                                hours: 1,
                                order: 4,
                                completed: true,
                                completedAt: '2025-07-26T00:00:00Z'
                            }
                        ]
                    },
                    {
                        id: 'section_2',
                        title: 'Теңдеулер жүйелері',
                        description: 'Теңдеулер жүйесін шешу әдістері',
                        order: 2,
                        topics: [
                            {
                                id: 'topic_2_1',
                                title: 'Сызықтық теңдеулер жүйелері',
                                description: 'Сызықтық теңдеулер жүйесін шешу',
                                hours: 3,
                                order: 1,
                                completed: true,
                                completedAt: '2025-08-02T00:00:00Z'
                            },
                            {
                                id: 'topic_2_2',
                                title: 'Квадрат теңдеулері бар жүйелер',
                                description: 'Аралас теңдеулер жүйесін шешу',
                                hours: 4,
                                order: 2,
                                completed: true,
                                completedAt: '2025-08-09T00:00:00Z'
                            }
                        ]
                    },
                    {
                        id: 'section_3',
                        title: 'Функциялар және графиктер',
                        description: 'Әртүрлі функциялар және олардың графиктерін оқу',
                        order: 3,
                        topics: [
                            {
                                id: 'topic_3_1',
                                title: 'Сызықтық функция',
                                description: 'Сызықтық функция қасиеттері және графигін салу',
                                hours: 2,
                                order: 1,
                                completed: true,
                                completedAt: '2025-09-06T00:00:00Z'
                            },
                            {
                                id: 'topic_3_2',
                                title: 'Квадрат функциясы',
                                description: 'Квадрат функциясын және параболаны оқу',
                                hours: 3,
                                order: 2,
                                completed: true,
                                completedAt: '2025-09-13T00:00:00Z'
                            },
                            {
                                id: 'topic_3_3',
                                title: 'Функциялар практикумы',
                                description: 'Функциялар бойынша есептер шешу',
                                hours: 2,
                                order: 3,
                                completed: false // Еще не выполнено
                            }
                        ]
                    }
                ]
            },
        }),
        
        // КТП для биологии 10 класс (Алиев)
        prisma.curriculumPlan.create({
            data: {
                studyPlanId: studyPlans[1].id, // Биология 10 класс
                totalLessons: 14,
                plannedLessons: [
                    {
                        id: 'section_bio_1',
                        title: 'Цитология негіздері',
                        description: 'Жасуша құрылысы мен функцияларын оқу',
                        order: 1,
                        topics: [
                            {
                                id: 'topic_bio_1_1',
                                title: 'Жасуша құрылысы',
                                description: 'Жасуша органоидтары және олардың функциялары',
                                hours: 3,
                                order: 1,
                                completed: true,
                                completedAt: '2025-07-08T00:00:00Z'
                            },
                            {
                                id: 'topic_bio_1_2',
                                title: 'Фотосинтез',
                                description: 'Өсімдіктердегі фотосинтез процесі',
                                hours: 2,
                                order: 2,
                                completed: true,
                                completedAt: '2025-07-15T00:00:00Z'
                            },
                            {
                                id: 'topic_bio_1_3',
                                title: 'Өсімдіктердің тыныс алуы',
                                description: 'Жасушалық тыныс алу процестері',
                                hours: 2,
                                order: 3,
                                completed: true,
                                completedAt: '2025-08-05T00:00:00Z'
                            }
                        ]
                    },
                    {
                        id: 'section_bio_2',
                        title: 'Генетика',
                        description: 'Тұқымқуалаушылық пен өзгергіштік негіздері',
                        order: 2,
                        topics: [
                            {
                                id: 'topic_bio_2_1',
                                title: 'Мендель заңдары',
                                description: 'Тұқымқуалаушылықтың негізгі заңдары',
                                hours: 4,
                                order: 1,
                                completed: true,
                                completedAt: '2025-08-12T00:00:00Z'
                            },
                            {
                                id: 'topic_bio_2_2',
                                title: 'Генетикалық есептер шығару',
                                description: 'Генетика заңдарын практикалық қолдану',
                                hours: 3,
                                order: 2,
                                completed: true,
                                completedAt: '2025-09-02T00:00:00Z'
                            }
                        ]
                    }
                ]
            },
        }),
        
        // КТП для физики 11 класс (Тулегенов) - частично выполнен
        prisma.curriculumPlan.create({
            data: {
                studyPlanId: studyPlans[2].id, // Физика 11 класс
                totalLessons: 10,
                plannedLessons: [
                    {
                        id: 'section_phys_1',
                        title: 'Молекулалық-кинетикалық теория',
                        description: 'МКТ негіздері және газ заңдары',
                        order: 1,
                        topics: [
                            {
                                id: 'topic_phys_1_1',
                                title: 'МКТ негізгі қағидалары',
                                description: 'Газдардың молекулалық-кинетикалық теориясы',
                                hours: 3,
                                order: 1,
                                completed: true,
                                completedAt: '2025-07-10T00:00:00Z'
                            },
                            {
                                id: 'topic_phys_1_2',
                                title: 'Газ заңдары',
                                description: 'Идеал газ заңдарын оқу',
                                hours: 4,
                                order: 2,
                                completed: true,
                                completedAt: '2025-07-17T00:00:00Z'
                            },
                            {
                                id: 'topic_phys_1_3',
                                title: 'Термодинамика',
                                description: 'Термодинамиканың бірінші және екінші заңдары',
                                hours: 3,
                                order: 3,
                                completed: false // Не выполнено
                            }
                        ]
                    },
                    {
                        id: 'section_phys_2',
                        title: 'Электростатика',
                        description: 'Электр өрісі және оның қасиеттері',
                        order: 2,
                        topics: [
                            {
                                id: 'topic_phys_2_1',
                                title: 'Электрическое поле',
                                description: 'Характеристики электрического поля',
                                hours: 4,
                                order: 1,
                                completed: false // Не выполнено
                            }
                        ]
                    }
                ]
            },
        }),
        
        // КТП для химии 9 класс (Назарбаева) - плохо выполняется
        prisma.curriculumPlan.create({
            data: {
                studyPlanId: studyPlans[3].id, // Химия 9 класс
                totalLessons: 9,
                plannedLessons: [
                    {
                        id: 'section_chem_1',
                        title: 'Элементтердің периодтық жүйесі',
                        description: 'Периодтық заңды оқу',
                        order: 1,
                        topics: [
                            {
                                id: 'topic_chem_1_1',
                                title: 'Периодтық заң',
                                description: 'Менделеевтің периодтық заңы',
                                hours: 2,
                                order: 1,
                                completed: true,
                                completedAt: '2025-07-11T00:00:00Z'
                            },
                            {
                                id: 'topic_chem_1_2',
                                title: 'Химиялық байланыстар',
                                description: 'Химиялық байланыс түрлері',
                                hours: 3,
                                order: 2,
                                completed: false // Не выполнено
                            }
                        ]
                    },
                    {
                        id: 'section_chem_2',
                        title: 'Химиялық реакциялар',
                        description: 'Химиялық реакция түрлері',
                        order: 2,
                        topics: [
                            {
                                id: 'topic_chem_2_1',
                                title: 'Қышқылдар және негіздер',
                                description: 'Қышқылдар мен негіздердің қасиеттері',
                                hours: 4,
                                order: 1,
                                completed: false // Не выполнено
                            },
                            {
                                id: 'topic_chem_2_2',
                                title: 'ТТР',
                                description: 'Тотығу-тотықсыздану реакциялары',
                                hours: 3,
                                order: 2,
                                completed: false // Не выполнено
                            }
                        ]
                    }
                ]
            },
        })
    ]);

    console.log('✅ Деректер қоры сәтті толтырылды!');
    console.log('\n📊 Құрастырылғаны:');
    console.log(`👤 Пайдаланушылар: ${2 + teachers.length + studentUsers.length + parents.length}`); // admin + financist + teachers + students + parents
    console.log(`👥 Топтар: ${groups.length}`);
    console.log(`🏫 Аудиториялар: ${classrooms.length}`);
    console.log(`📚 Оқу жоспарлары: ${studyPlans.length}`);
    console.log(`📖 Сабақтар: ${lessons.length}`);
    console.log('\n🔑 Тесттік аккаунттар:');
    console.log(`👨‍💼 Әкімші: ${admin.email} / password123`);
    console.log(`💰 Қаржы маманы: ${financist.email} / password123`);
    console.log('👨‍🏫 Оқытушы: ivanova@abai.edu.kz / password123');
    console.log('🎓 Студент: aida.student@abai.edu.kz / password123');
    console.log('👨‍👩‍👧‍👦 Ата-аналар:');
    console.log('  👩 Назым Қазыбекова: nazym.parent@abai.edu.kz / password123 (Айданың анасы)');
    console.log('  👨 Нұрлан Қазыбеков: nurlan.parent@abai.edu.kz / password123 (Айданың әкесі)');
    console.log('  👨 Болат Жақыпов: bolat.parent@abai.edu.kz / password123 (Арманның әкесі)');
    console.log('  👩 Гүлнара Жақыпова: gulnara.parent@abai.edu.kz / password123 (Арманның анасы)');
    console.log('  👨 Асылбек Сералиев: asylbek.parent@abai.edu.kz / password123 (Дананың әкесі)');
    console.log('  👩 Жанар Сералиева: zhanar.parent@abai.edu.kz / password123 (Дананың анасы)');
    console.log('  👨 Алмас Оразбаев: almas.parent@abai.edu.kz / password123 (Бекзаттың әкесі)');
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
