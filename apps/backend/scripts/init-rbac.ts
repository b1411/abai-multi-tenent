import { PrismaClient } from '../generated/prisma';
import { PermissionScope } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Определяем стандартные модули системы
const MODULES = [
    'students',
    'teachers',
    'lessons',
    'homework',
    'schedule',
    'groups',
    'materials',
    'quiz',
    'payments',
    'reports',
    'notifications',
    'calendar',
    'chat',
    'tasks',
    'users',
    'system',
    'rbac',
    'budget',
    'classrooms',
    'files',
    'ai-assistant',
    'feedback',
    'lesson-results',
    'inventory',
    'performance',
    'kpi',
    'loyalty',
    'supply',
    'salaries',
    'vacations',
    'workload',
    'edo',
    'activity-monitoring',
    'branding',
    'integrations',
    'security',
    'journal',
    'study-plans',
    'dashboard'
];

// Стандартные действия для каждого модуля
const STANDARD_ACTIONS = [
    { action: 'create', scopes: [PermissionScope.ALL] },
    { action: 'read', scopes: [PermissionScope.ALL, PermissionScope.OWN, PermissionScope.GROUP] },
    { action: 'update', scopes: [PermissionScope.ALL, PermissionScope.OWN] },
    { action: 'delete', scopes: [PermissionScope.ALL, PermissionScope.OWN] }
];

// Определение базовых ролей
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
        permissions: [
            'users:*:ALL',
            'groups:*:ALL',
            'system:*:ALL',
            'reports:*:ALL',
            'rbac:read:ALL'
        ],
        isSystem: true
    },
    TEACHER: {
        name: 'Учитель',
        description: 'Преподаватель с доступом к учебным материалам',
        permissions: [
            'lessons:*:OWN',
            'lessons:read:GROUP',
            'homework:*:OWN',
            'materials:*:OWN',
            'quiz:*:OWN',
            'students:read:GROUP',
            'schedule:read:ALL',
            'schedule:update:OWN',
            'reports:read:GROUP',
            'chat:*:GROUP',
            'calendar:*:OWN',
            'tasks:*:OWN'
        ],
        isSystem: true
    },
    STUDENT: {
        name: 'Студент',
        description: 'Доступ к учебным материалам и личным данным',
        permissions: [
            'lessons:read:GROUP',
            'homework:read:OWN',
            'homework:create:OWN',
            'homework:update:OWN',
            'materials:read:GROUP',
            'quiz:read:GROUP',
            'schedule:read:GROUP',
            'chat:read:GROUP',
            'chat:create:GROUP',
            'calendar:read:OWN',
            'tasks:read:OWN',
            'payments:read:OWN'
        ],
        isSystem: true
    },
    PARENT: {
        name: 'Родитель',
        description: 'Доступ к информации о своих детях',
        permissions: [
            'students:read:ASSIGNED',
            'lessons:read:ASSIGNED',
            'homework:read:ASSIGNED',
            'schedule:read:ASSIGNED',
            'payments:read:ASSIGNED',
            'reports:read:ASSIGNED',
            'chat:read:ASSIGNED'
        ],
        isSystem: true
    },
    HR: {
        name: 'HR Менеджер',
        description: 'Управление персоналом',
        permissions: [
            'users:*:ALL',
            'teachers:*:ALL',
            'reports:read:ALL',
            'tasks:*:ALL',
            'calendar:read:ALL',
            'rbac:read:ALL',
            'rbac:users:*:ALL'
        ],
        isSystem: true
    },
    FINANCIST: {
        name: 'Финансист',
        description: 'Управление финансами',
        permissions: [
            'payments:*:ALL',
            'reports:*:ALL',
            'students:read:ALL',
            'users:read:ALL'
        ],
        isSystem: true
    }
};

async function createPermissions() {
    console.log('🔐 Создание базовых разрешений...');

    for (const module of MODULES) {
        console.log(`📝 Создание разрешений для модуля: ${module}`);

        for (const { action, scopes } of STANDARD_ACTIONS) {
            for (const scope of scopes) {
                try {
                    await prisma.permission.upsert({
                        where: {
                            // Создаем уникальный ключ на основе module, action, scope
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
        },
        {
            id: 'rbac-users-assign',
            module: 'rbac',
            action: 'assign',
            scope: PermissionScope.ALL,
            description: 'Assign roles to users',
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

    console.log('✅ Разрешения созданы');
}

async function createRoles() {
    console.log('👥 Создание базовых ролей...');

    for (const [roleKey, roleData] of Object.entries(BASE_ROLES)) {
        console.log(`📋 Создание роли: ${roleData.name}`);

        // Создаем роль
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

                if (module !== '*') {
                    whereClause.module = module;
                }

                if (action !== '*') {
                    whereClause.action = action;
                }

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

    console.log('✅ Роли созданы');
}

async function assignDefaultRoles() {
    console.log('🎯 Назначение ролей существующим пользователям...');

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
                // Проверяем, нет ли уже такого назначения
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
                            assignedBy: 1, // Система
                            assignedAt: new Date(),
                            isActive: true
                        }
                    });

                    console.log(`👤 Пользователю ${user.email} назначена роль ${roleName}`);
                }
            }
        }
    }

    console.log('✅ Роли назначены');
}

async function createDefaultAdmin() {
    console.log('👑 Создание администратора по умолчанию...');

    const adminEmail = 'admin@abai.edu.kz';

    // Ищем существующего админа
    let admin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    // Если админа нет, создаем
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);

        admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Системный',
                surname: 'Администратор',
                hashedPassword,
                role: 'ADMIN'
            }
        });

        console.log(`👤 Создан администратор: ${adminEmail} / admin123`);
    }

    // Назначаем роль супер-админа
    const superAdminRole = await prisma.role.findUnique({
        where: { name: 'Супер Администратор' }
    });

    if (superAdminRole) {
        const existingAssignment = await prisma.userRoleAssignment.findFirst({
            where: {
                userId: admin.id,
                roleId: superAdminRole.id,
                isActive: true
            }
        });

        if (!existingAssignment) {
            await prisma.userRoleAssignment.create({
                data: {
                    userId: admin.id,
                    roleId: superAdminRole.id,
                    assignedBy: admin.id,
                    assignedAt: new Date(),
                    isActive: true
                }
            });

            console.log('👑 Администратору назначена роль супер-админа');
        }
    }
}

async function main() {
    try {
        console.log('🚀 Инициализация RBAC системы...\n');

        await createPermissions();
        console.log('');

        await createRoles();
        console.log('');

        await createDefaultAdmin();
        console.log('');

        await assignDefaultRoles();
        console.log('');

        // Статистика
        const permissionCount = await prisma.permission.count();
        const roleCount = await prisma.role.count();
        const assignmentCount = await prisma.userRoleAssignment.count();

        console.log('📊 Статистика RBAC системы:');
        console.log(`   💫 Разрешений: ${permissionCount}`);
        console.log(`   👥 Ролей: ${roleCount}`);
        console.log(`   🎯 Назначений: ${assignmentCount}`);
        console.log('');
        console.log('🎉 RBAC система успешно инициализирована!');
        console.log('');
        console.log('📝 Для входа в систему используйте:');
        console.log('   Email: admin@abai.edu.kz');
        console.log('   Пароль: admin123');

    } catch (error) {
        console.error('❌ Ошибка инициализации RBAC:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
