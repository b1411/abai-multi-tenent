import { PrismaClient, PermissionScope } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// RBAC константы и функции
const MODULES = [
    'students', 'teachers', 'lessons', 'homework', 'schedule', 'groups', 'materials', 'quiz',
    'payments', 'reports', 'notifications', 'calendar', 'chat', 'tasks', 'users', 'system',
    'rbac', 'budget', 'classrooms', 'files', 'ai-assistant', 'feedback', 'lesson-results',
    'inventory', 'performance', 'kpi', 'loyalty', 'supply', 'salaries', 'vacations',
    'workload', 'edo', 'activity-monitoring', 'branding', 'integrations', 'security',
    'journal', 'study-plans', 'dashboard', 'parents'
];

const STANDARD_ACTIONS = [
    { action: 'create', scopes: [PermissionScope.ALL] },
    { action: 'read', scopes: [PermissionScope.ALL, PermissionScope.OWN, PermissionScope.GROUP] },
    { action: 'update', scopes: [PermissionScope.ALL, PermissionScope.OWN] },
    { action: 'delete', scopes: [PermissionScope.ALL, PermissionScope.OWN] }
];

const BASE_ROLES = {
    SUPER_ADMIN: {
        name: 'Супер Администратор',
        description: 'Полный доступ ко всем функциям системы',
        permissions: ['*:*:ALL'],
        isSystem: true
    },
    ADMIN: {
        name: 'Администратор',
        description: 'Административный доступ к системе',
        permissions: ['*:*:ALL'], // Даем админу полный доступ
        isSystem: true
    },
    TEACHER: {
        name: 'Учитель',
        description: 'Преподаватель с доступом к учебным материалам',
        permissions: [
            'lessons:*:OWN', 'lessons:read:GROUP', 'homework:*:OWN', 'materials:*:OWN',
            'quiz:*:OWN', 'students:read:GROUP', 'schedule:read:ALL', 'schedule:update:OWN',
            'reports:read:GROUP', 'chat:*:GROUP', 'calendar:*:OWN', 'tasks:*:OWN',
            'study-plans:read:ALL'
        ],
        isSystem: true
    },
    STUDENT: {
        name: 'Студент',
        description: 'Доступ к учебным материалам и личным данным',
        permissions: [
            'lessons:read:GROUP', 'homework:read:OWN', 'homework:create:OWN', 'homework:update:OWN',
            'materials:read:GROUP', 'quiz:read:GROUP', 'schedule:read:GROUP', 'chat:read:GROUP',
            'chat:create:GROUP', 'calendar:read:OWN', 'tasks:read:OWN', 'payments:read:OWN',
            'study-plans:read:GROUP'
        ],
        isSystem: true
    },
    PARENT: {
        name: 'Родитель',
        description: 'Доступ к информации о своих детях',
        permissions: [
            'students:read:ASSIGNED', 'lessons:read:ASSIGNED', 'homework:read:ASSIGNED',
            'schedule:read:ASSIGNED', 'payments:read:ASSIGNED', 'reports:read:ASSIGNED',
            'chat:read:ASSIGNED', 'study-plans:read:ASSIGNED'
        ],
        isSystem: true
    },
    HR: {
        name: 'HR Менеджер',
        description: 'Управление персоналом',
        permissions: [
            'users:*:ALL', 'teachers:*:ALL', 'reports:read:ALL', 'tasks:*:ALL',
            'calendar:read:ALL', 'rbac:read:ALL', 'rbac:users:*:ALL'
        ],
        isSystem: true
    },
    FINANCIST: {
        name: 'Финансист',
        description: 'Управление финансами',
        permissions: [
            'payments:*:ALL', 'reports:*:ALL', 'students:read:ALL', 'users:read:ALL',
            'budget:*:ALL'
        ],
        isSystem: true
    }
};

async function createRBACPermissions() {
    console.log('🔐 Создание RBAC разрешений...');

    for (const module of MODULES) {
        for (const { action, scopes } of STANDARD_ACTIONS) {
            for (const scope of scopes) {
                try {
                    await prisma.permission.upsert({
                        where: {
                            id: `${module}-${action}-${scope}`.replace(/[^a-zA-Z0-9-]/g, '-')
                        },
                        update: {},
                        create: {
                            id: `${module}-${action}-${scope}`.replace(/[^a-zA-Z0-9-]/g, '-'),
                            module,
                            action,
                            scope,
                            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module} with ${scope.toLowerCase()} scope`,
                            isSystem: true
                        }
                    });
                } catch (error) {
                    console.error(`Ошибка создания разрешения ${module}:${action}:${scope}:`, error);
                }
            }
        }
    }

    // Создаем специальные разрешения
    const specialPermissions = [
        {
            id: 'all-all-all',
            module: '*',
            action: '*',
            scope: PermissionScope.ALL,
            description: 'Full system access',
            isSystem: true
        }
    ];

    for (const permission of specialPermissions) {
        await prisma.permission.upsert({
            where: { id: permission.id },
            update: {},
            create: permission
        });
    }

    console.log('✅ RBAC разрешения созданы');
}

async function createRBACRoles() {
    console.log('👥 Создание RBAC ролей...');

    for (const [roleKey, roleData] of Object.entries(BASE_ROLES)) {
        console.log(`📋 Создание роли: ${roleData.name}`);

        const role = await prisma.role.upsert({
            where: { name: roleData.name },
            update: {
                description: roleData.description,
                isSystem: roleData.isSystem
            },
            create: {
                name: roleData.name,
                description: roleData.description,
                isSystem: roleData.isSystem
            }
        });

        // Очищаем старые разрешения роли
        await prisma.rolePermission.deleteMany({
            where: { roleId: role.id }
        });

        // Добавляем разрешения к роли
        for (const permissionPattern of roleData.permissions) {
            const [module, action, scope] = permissionPattern.split(':');

            if (module === '*' && action === '*') {
                // Специальное разрешение на всё
                const allPermission = await prisma.permission.findFirst({
                    where: { module: '*', action: '*' }
                });

                if (allPermission) {
                    await prisma.rolePermission.create({
                        data: {
                            roleId: role.id,
                            permissionId: allPermission.id
                        }
                    });
                }
            } else {
                // Обычные разрешения
                const whereClause: any = {};

                if (module !== '*') whereClause.module = module;
                if (action !== '*') whereClause.action = action;
                if (scope && scope !== '*' && Object.values(PermissionScope).includes(scope as PermissionScope)) {
                    whereClause.scope = scope as PermissionScope;
                }

                const permissions = await prisma.permission.findMany({
                    where: whereClause
                });

                for (const permission of permissions) {
                    try {
                        await prisma.rolePermission.create({
                            data: {
                                roleId: role.id,
                                permissionId: permission.id
                            }
                        });
                    } catch (error) {
                        // Игнорируем дубликаты
                    }
                }
            }
        }
    }

    console.log('✅ RBAC роли созданы');
}

async function assignRBACRoles() {
    console.log('🎯 Назначение RBAC ролей пользователям...');

    const users = await prisma.user.findMany({
        where: { deletedAt: null }
    });

    for (const user of users) {
        const roleName = BASE_ROLES[user.role as keyof typeof BASE_ROLES]?.name;

        if (roleName) {
            const role = await prisma.role.findUnique({
                where: { name: roleName }
            });

            if (role) {
                const existingAssignment = await prisma.userRoleAssignment.findFirst({
                    where: {
                        userId: user.id,
                        roleId: role.id,
                        isActive: true
                    }
                });

                if (!existingAssignment) {
                    await prisma.userRoleAssignment.create({
                        data: {
                            userId: user.id,
                            roleId: role.id,
                            assignedBy: 1,
                            assignedAt: new Date(),
                            isActive: true
                        }
                    });

                    console.log(`👤 Пользователю ${user.email} назначена роль ${roleName}`);
                }
            }
        }
    }

    console.log('✅ RBAC роли назначены');
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
        // Платежи для Айды Казыбековой
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
        // Платежи для Армана Жакипова
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
                studentId: studentUsers[1].student.id,
                serviceType: 'transportation',
                serviceName: 'Транспорт за сентябрь 2024',
                amount: 8000,
                currency: 'KZT',
                dueDate: new Date('2024-09-15'),
                status: 'partial',
                paymentDate: new Date('2024-09-10'),
                paidAmount: 4000,
            },
        }),
        // Платежи для Даны Сералиевой
        prisma.payment.create({
            data: {
                studentId: studentUsers[2].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за сентябрь 2024',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2024-09-01'),
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
                dueDate: new Date('2024-09-20'),
                status: 'unpaid',
            },
        }),
        // Платежи для Бекзата Оразбаева
        prisma.payment.create({
            data: {
                studentId: studentUsers[3].student.id,
                serviceType: 'tuition',
                serviceName: 'Обучение за сентябрь 2024',
                amount: 45000,
                currency: 'KZT',
                dueDate: new Date('2024-09-01'),
                status: 'paid',
                paymentDate: new Date('2024-08-25'),
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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
                period: '2024 Q4',
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

    console.log('🔐 Инициализируем RBAC систему...');
    
    // Создаем RBAC разрешения и роли
    try {
        await createRBACPermissions();
        await createRBACRoles();
        await assignRBACRoles();
        console.log('✅ RBAC система успешно инициализирована!');
    } catch (error) {
        console.error('❌ Ошибка при инициализации RBAC:', error);
        console.log('ℹ️ Возможно, RBAC уже был инициализирован ранее');
    }
    
    console.log('✅ База данных успешно заполнена!');
    console.log('\n📊 Создано:');
    console.log(`👤 Пользователей: ${1 + 1 + teachers.length + studentUsers.length + parents.length}`);
    console.log(`👥 Групп: ${groups.length}`);
    console.log(`🏫 Аудиторий: ${classrooms.length}`);
    console.log(`📚 Учебных планов: ${studyPlans.length}`);
    console.log(`📖 Уроков: ${lessons.length}`);
    console.log(`🔐 RBAC ролей: ADMIN, TEACHER, STUDENT, PARENT, FINANCIST, HR`);
    console.log(`🔐 RBAC разрешений: ~170 разрешений на все модули`);
    
    console.log('\n🔑 Тестовые аккаунты:');
    console.log('👨‍💼 Администратор: admin@abai.edu.kz / password123 (полные права)');
    console.log('💰 Финансист: financist@abai.edu.kz / password123 (права финансиста)');
    console.log('👨‍🏫 Преподаватель: ivanova@abai.edu.kz / password123 (права учителя)');
    console.log('🎓 Студент: aida.student@abai.edu.kz / password123 (права студента)');
    console.log('👨‍👩‍👧‍👦 Родители:');
    console.log('  👩 Назым Казыбекова: nazym.parent@abai.edu.kz / password123 (мать Айды)');
    console.log('  👨 Нурлан Казыбеков: nurlan.parent@abai.edu.kz / password123 (отец Айды)');
    console.log('  👨 Болат Жакипов: bolat.parent@abai.edu.kz / password123 (отец Армана)');
    console.log('  👩 Гульнара Жакипова: gulnara.parent@abai.edu.kz / password123 (мать Армана)');
    console.log('  👨 Асылбек Сералиев: asylbek.parent@abai.edu.kz / password123 (отец Даны)');
    console.log('  👩 Жанар Сералиева: zhanar.parent@abai.edu.kz / password123 (мать Даны)');
    console.log('  👨 Алмас Оразбаев: almas.parent@abai.edu.kz / password123 (отец Бекзата)');
    
    console.log('\n🚀 Теперь можно запускать приложение:');
    console.log('  Backend: npm run start:dev');
    console.log('  Frontend: npm run dev');
    console.log('\n💡 Все эндпоинты теперь защищены RBAC!');
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
