import { PrismaClient } from "generated/prisma";
import { config } from "dotenv";

// Загружаем переменные окружения из .env файла
config({
  path: "../../.env",
});

const prisma = new PrismaClient();

async function checkKpiAchievements() {
  try {
    console.log('🔍 Проверка данных KPI достижений...\n');

    // Проверяем общее количество достижений
    const achievementsCount = await prisma.teacherAchievement.count();
    console.log(`📊 Всего достижений в базе: ${achievementsCount}`);

    if (achievementsCount === 0) {
      console.log('❌ Нет данных о достижениях в базе');
      return;
    }

    // Получаем все достижения с информацией о преподавателях
    const achievements = await prisma.teacherAchievement.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log('\n📋 Достижения по преподавателям:');

    // Группируем по преподавателям
    const teacherAchievements: Record<number, { teacher: any, achievements: any[] }> = {};

    achievements.forEach(achievement => {
      const teacherId = achievement.teacherId;
      if (!teacherAchievements[teacherId]) {
        teacherAchievements[teacherId] = {
          teacher: achievement.teacher,
          achievements: []
        };
      }
      teacherAchievements[teacherId].achievements.push(achievement);
    });

    for (const [, data] of Object.entries(teacherAchievements)) {
      const { teacher, achievements } = data;
      console.log(`\n👤 ${teacher.user.name} ${teacher.user.surname} (${teacher.user.email})`);
      console.log(`   Всего достижений: ${achievements.length}`);

      achievements.forEach((achievement, index) => {
        console.log(`   ${index + 1}. ${achievement.type} - ${achievement.title}`);
        console.log(`      Дата: ${achievement.date.toLocaleDateString('ru')}`);
        console.log(`      Описание: ${achievement.description || 'Не указано'}`);
        console.log(`      Баллы: ${achievement.points}`);
        console.log(`      Подтверждено: ${achievement.isVerified ? 'Да' : 'Нет'}`);
      });
    }

    console.log('\n📈 Статистика по типам достижений:');
    const typeStats: Record<string, number> = {};
    achievements.forEach(achievement => {
      typeStats[achievement.type] = (typeStats[achievement.type] || 0) + 1;
    });

    for (const [type, count] of Object.entries(typeStats)) {
      console.log(`   ${type}: ${count}`);
    }

    // Проверяем период (последний год)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentAchievements = achievements.filter(a => a.date >= oneYearAgo);
    console.log(`\n📅 Достижений за последний год: ${recentAchievements.length}`);

  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKpiAchievements();
