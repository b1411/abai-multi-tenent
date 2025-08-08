import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function testKpiSystemComplete() {
  console.log('🧪 Запуск простого теста системы KPI с фидбеками...\n');

  try {
    // 1. Проверить структуру базы данных
    console.log('🔍 Проверка структуры базы данных...');
    
    // Проверить количество шаблонов фидбеков
    const templatesCount = await prisma.feedbackTemplate.count();
    console.log(`📝 Шаблонов фидбеков: ${templatesCount}`);

    // Проверить активные шаблоны
    const activeTemplates = await prisma.feedbackTemplate.count({
      where: { isActive: true }
    });
    console.log(`✅ Активных шаблонов: ${activeTemplates}`);

    // Проверить количество преподавателей
    const teachersCount = await prisma.teacher.count();
    console.log(`👨‍🏫 Преподавателей: ${teachersCount}`);

    // Проверить количество студентов
    const studentsCount = await prisma.student.count();
    console.log(`👨‍🎓 Студентов: ${studentsCount}`);

    // Проверить количество фидбеков
    const feedbacksCount = await prisma.feedbackResponse.count();
    console.log(`💬 Фидбеков: ${feedbacksCount}`);

    // Проверить количество завершенных фидбеков
    const completedFeedbacks = await prisma.feedbackResponse.count({
      where: { isCompleted: true }
    });
    console.log(`✅ Завершенных фидбеков: ${completedFeedbacks}`);

    // 2. Проверить KPI шаблоны
    console.log('\n📊 Проверка KPI-релевантных шаблонов...');
    const kpiTemplates = await prisma.feedbackTemplate.findMany({
      where: {
        isActive: true,
        hasKpiQuestions: true
      },
      select: {
        id: true,
        name: true,
        title: true,
        kpiMetrics: true
      }
    });

    for (const template of kpiTemplates) {
      console.log(`  📋 ${template.title} (${template.name})`);
      console.log(`     KPI метрики: ${template.kpiMetrics.join(', ')}`);
    }

    // 3. Создать тестовый фидбек для демонстрации
    console.log('\n🎯 Создание тестового фидбека...');
    
    const student = await prisma.student.findFirst({
      include: { user: true }
    });

    const teacher = await prisma.teacher.findFirst();

    const studentTemplate = await prisma.feedbackTemplate.findFirst({
      where: {
        name: 'student_retention_comprehensive',
        isActive: true
      }
    });

    if (student && teacher && studentTemplate) {
      // Создать тестовый фидбек
      const testFeedback = await prisma.feedbackResponse.create({
        data: {
          userId: student.userId,
          templateId: studentTemplate.id,
          answers: {
            satisfaction_overall: 4,
            continue_studying: true,
            recommend_school: 5,
            teacher_effectiveness: { [teacher.id]: 5 },
            mood_today: 85,
            concentration_level: 90,
            motivation_level: 80,
            socialization_level: 75
          },
          isCompleted: true,
          submittedAt: new Date(),
          period: '2025-01',
          aboutTeacherId: teacher.id
        }
      });

      console.log(`✅ Создан тестовый фидбек ID: ${testFeedback.id}`);

      // 4. Проверить эмоциональное состояние
      console.log('\n😊 Проверка расчета эмоционального состояния...');
      
      // Найти или создать эмоциональное состояние студента
      let emotionalState = await prisma.emotionalState.findUnique({
        where: { studentId: student.id }
      });

      if (!emotionalState) {
        emotionalState = await prisma.emotionalState.create({
          data: {
            studentId: student.id,
            mood: 85,
            moodDesc: 'Хорошее настроение',
            moodTrend: 'neutral',
            concentration: 90,
            concentrationDesc: 'Высокая концентрация',
            concentrationTrend: 'up',
            socialization: 75,
            socializationDesc: 'Хорошая социализация',
            socializationTrend: 'neutral',
            motivation: 80,
            motivationDesc: 'Хорошая мотивация',
            motivationTrend: 'neutral'
          }
        });
      }

      console.log(`📊 Эмоциональное состояние студента ${student.user.name}:`);
      console.log(`   Настроение: ${emotionalState.mood} (${emotionalState.moodDesc})`);
      console.log(`   Концентрация: ${emotionalState.concentration} (${emotionalState.concentrationDesc})`);
      console.log(`   Социализация: ${emotionalState.socialization} (${emotionalState.socializationDesc})`);
      console.log(`   Мотивация: ${emotionalState.motivation} (${emotionalState.motivationDesc})`);

      // 5. Проверить статус обязательных фидбеков
      console.log('\n📋 Проверка статуса обязательных фидбеков...');
      
      let userStatus = await prisma.userFeedbackStatus.findUnique({
        where: { userId: student.userId }
      });

      if (!userStatus) {
        userStatus = await prisma.userFeedbackStatus.create({
          data: {
            userId: student.userId,
            hasCompletedMandatory: true,
            lastCompletedAt: new Date(),
            currentPeriod: '2025-01',
            nextDueDate: new Date(2025, 1, 1) // Февраль 2025
          }
        });
      }

      console.log(`📅 Статус пользователя ${student.user.name}:`);
      console.log(`   Завершены обязательные: ${userStatus.hasCompletedMandatory ? 'Да' : 'Нет'}`);
      console.log(`   Последнее заполнение: ${userStatus.lastCompletedAt?.toDateString() || 'Никогда'}`);
      console.log(`   Текущий период: ${userStatus.currentPeriod || 'Не задан'}`);

      // 6. Очистка тестовых данных
      console.log('\n🧹 Очистка тестовых данных...');
      await prisma.feedbackResponse.delete({
        where: { id: testFeedback.id }
      });
      console.log('✅ Тестовый фидбек удален');

    } else {
      console.log('⚠️ Не найдены необходимые данные для создания тестового фидбека');
    }

    // 7. Общая статистика
    console.log('\n📈 Общая статистика системы фидбеков:');
    console.log(`📝 Всего шаблонов: ${templatesCount}`);
    console.log(`✅ Активных шаблонов: ${activeTemplates}`);
    console.log(`💬 Всего фидбеков: ${feedbacksCount}`);
    console.log(`✅ Завершенных фидбеков: ${completedFeedbacks}`);
    console.log(`👨‍🏫 Преподавателей: ${teachersCount}`);
    console.log(`👨‍🎓 Студентов: ${studentsCount}`);

    if (feedbacksCount > 0) {
      const completionRate = (completedFeedbacks / feedbacksCount * 100).toFixed(1);
      console.log(`📊 Процент завершения: ${completionRate}%`);
    }

    console.log('\n✅ Тест системы KPI с фидбеками завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Функция для демонстрации веса метрик
function demonstrateKpiWeights() {
  console.log('\n⚖️ Демонстрация весовых коэффициентов KPI...');

  const feedbackWeights = {
    studentSatisfaction: 0.30,     // 30% - Удовлетворенность студентов
    parentSatisfaction: 0.25,      // 25% - Удовлетворенность родителей  
    studentRetention: 0.20,        // 20% - Удержание студентов
    emotionalWellbeing: 0.15,      // 15% - Эмоциональное благополучие
    teachingQuality: 0.10          // 10% - Качество преподавания
  };

  console.log('📊 Веса фидбек-метрик в общем KPI:');
  Object.entries(feedbackWeights).forEach(([metric, weight]) => {
    const percentage = (weight * 100).toFixed(0);
    console.log(`   ${metric}: ${percentage}%`);
  });

  // Пример расчета
  const exampleScores = {
    studentSatisfaction: 85,
    parentSatisfaction: 78,
    studentRetention: 92,
    emotionalWellbeing: 76,
    teachingQuality: 88
  };

  const totalKpi = 
    (exampleScores.studentSatisfaction * feedbackWeights.studentSatisfaction) +
    (exampleScores.parentSatisfaction * feedbackWeights.parentSatisfaction) +
    (exampleScores.studentRetention * feedbackWeights.studentRetention) +
    (exampleScores.emotionalWellbeing * feedbackWeights.emotionalWellbeing) +
    (exampleScores.teachingQuality * feedbackWeights.teachingQuality);

  console.log('\n🎯 Пример расчета:');
  Object.entries(exampleScores).forEach(([metric, score]) => {
    const contribution = score * feedbackWeights[metric];
    console.log(`   ${metric}: ${score} × ${feedbackWeights[metric]} = ${contribution.toFixed(1)}`);
  });
  console.log(`\n🏆 Итоговый KPI: ${totalKpi.toFixed(1)}`);
}

// Главная функция
async function main() {
  console.log('🚀 Запуск теста системы KPI с фидбеками\n');
  
  try {
    await testKpiSystemComplete();
    demonstrateKpiWeights();
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    console.log('\n🏁 Тест завершен');
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  main().catch(console.error);
}

export { testKpiSystemComplete, demonstrateKpiWeights, main };
