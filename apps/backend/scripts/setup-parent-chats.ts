import { PrismaClient } from '../generated/prisma';
import { ChatService } from '../src/chat/chat.service';
import { ParentsService } from '../src/parents/parents.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function setupParentChats() {
  const prisma = new PrismaClient();
  const prismaService = new PrismaService();
  const chatService = new ChatService(prismaService);
  const parentsService = new ParentsService(prismaService, chatService);

  try {
    console.log('🚀 Начинаем настройку чатов для родителей...');

    // Получаем всех родителей
    const parents = await prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 Найдено ${parents.length} родителей`);

    let successCount = 0;
    let errorCount = 0;

    for (const parent of parents) {
      try {
        console.log(`\n👤 Настраиваем чаты для ${parent.user.name} ${parent.user.surname}`);
        
        const createdChats = await parentsService.createDefaultChatsForParent(parent.userId);
        
        console.log(`✅ Создано ${createdChats.length} чатов:`);
        createdChats.forEach(chat => {
          if (chat.type === 'teacher') {
            console.log(`   - Учитель: ${chat.teacher.name} ${chat.teacher.surname} (студент: ${chat.student.name} ${chat.student.surname})`);
          } else if (chat.type === 'admin') {
            console.log(`   - Администрация: ${chat.admin.name} ${chat.admin.surname} (${chat.admin.role})`);
          }
        });
        
        successCount++;
      } catch (error) {
        console.error(`❌ Ошибка при настройке чатов для ${parent.user.name} ${parent.user.surname}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Результаты:`);
    console.log(`✅ Успешно обработано: ${successCount} родителей`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`🎉 Настройка чатов завершена!`);

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
if (require.main === module) {
  setupParentChats()
    .catch((error) => {
      console.error('💥 Необработанная ошибка:', error);
      process.exit(1);
    });
}

export { setupParentChats };
