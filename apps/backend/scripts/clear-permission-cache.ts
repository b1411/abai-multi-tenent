import { PrismaClient } from '../generated/prisma';
import { config } from 'dotenv';

config({
    path: '../../.env'
})

const prisma = new PrismaClient();

async function clearPermissionCache() {
    console.log('🗑️ Очистка кэша разрешений...');

    try {
        // Очищаем весь кэш разрешений
        const result = await prisma.userPermissionCache.deleteMany({});

        console.log(`✅ Удалено ${result.count} записей из кэша разрешений`);

        // Также можем очистить аудит логи если нужно
        const auditResult = await prisma.permissionAudit.deleteMany({
            where: {
                createdAt: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // старше 24 часов
                }
            }
        });

        console.log(`✅ Удалено ${auditResult.count} старых записей из аудита`);

        console.log('🎉 Кэш разрешений успешно очищен!');
        console.log('📝 Теперь все разрешения будут загружаться заново из базы данных');

    } catch (error) {
        console.error('❌ Ошибка при очистке кэша:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Запускаем очистку
clearPermissionCache();
