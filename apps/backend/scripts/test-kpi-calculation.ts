import { PrismaClient } from '../generated/prisma';
import { KpiService } from '../src/kpi/kpi.service';
import { FeedbackAggregationService } from '../src/kpi/feedback-aggregation.service';

const prisma = new PrismaClient();

async function testKpiCalculation() {
  console.log('🧪 Запуск тестирования калькуляции KPI...\n');

  const feedbackAggregationService = new FeedbackAggregationService(prisma);
  const kpiService = new KpiService(prisma, feedbackAggregationService);

  try {
    // 1. Получить список преподавателей
    console.log('📋 Получение списка преподавателей...');
    const teachers = await prisma.teacher.findMany({
      take: 5, // Тестируем на первых 5 преподавателях
      include: {
        user: true
      }
    });

    console.log(`Найдено ${teachers.length} преподавателей для тестирования\n`);

    for (const teacher of teachers) {
      console.log(`\n🎓 Тестирование KPI для преподавателя: ${teacher.user.name} (ID: ${teacher.id})`);
      console.log('=' .repeat(80));

      // 2. Создать тестовые фидбеки
      await createTestFeedbacks(teacher.id);

      // 3. Рассчитать KPI через разные методы
      await testDifferentKpiMethods(teacher.id, kpiService, feedbackAggregationService);

      // 4. Проверить влияние фидбеков на KPI
      await testFeedbackImpact(teacher.id, kpiService);

      console.log('\n' + '='.repeat(80));
    }

    // 5. Тестирование общей статистики
    await testOverallStatistics(feedbackAggregationService);

    console.log('\n✅ Тестирование калькуляции KPI завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestFeedbacks(teacherId: number) {
  console.log('📝 Создание тестовых фидбеков...');

  // Получить студентов этого преподавателя
  const students = await prisma.student.findMany({
    where: {
      group: {
        lessons: {
          some: {
            teacherId: teacherId
          }
        }
      }
    },
    take: 3, // Берем 3 студентов для теста
    include: { user: true }
  });

  const template = await prisma.feedbackTemplate.findFirst({
    where: {
      name: 'student_retention_comprehensive',
      isActive: true
    }
  });

  if (!template) {
    console.log('⚠️ Шаблон не найден, пропускаем создание фидбеков');
    return;
  }

  // Создать фидбеки от студентов
  for (const student of students) {
    const testAnswers = {
      satisfaction_overall: Math.floor(Math.random() * 5) + 1, // 1-5
      continue_studying: Math.random() > 0.2, // 80% хотят продолжить
      recommend_school: Math.floor(Math.random() * 5) + 1, // 1-5
      teacher_effectiveness: {
        [teacherId]: Math.floor(Math.random() * 5) + 1 // Оценка преподавателя
      },
      mood_today: Math.floor(Math.random() * 100), // 0-100
      concentration_level: Math.floor(Math.random() * 100),
      motivation_level: Math.floor(Math.random() * 100),
      socialization_level: Math.floor(Math.random() * 100)
    };

    await prisma.feedbackResponse.create({
      data: {
        userId: student.user.id,
        templateId: template.id,
        answers: testAnswers,
        isCompleted: true,
        submittedAt: new Date(),
        period: '2025-01',
        aboutTeacherId: teacherId
      }
    });

    console.log(`  ✓ Создан фидбек от студента ${student.user.name}`);
  }

  // Создать фидбеки от родителей
  const parentTemplate = await prisma.feedbackTemplate.findFirst({
    where: {
      name: 'parent_comprehensive_evaluation',
      isActive: true
    }
  });

  if (parentTemplate) {
    for (const student of students.slice(0, 2)) { // 2 родителя
      // Найти родителя
      const parent = await prisma.parent.findFirst({
        where: { studentId: student.id },
        include: { user: true }
      });

      if (parent) {
        const parentAnswers = {
          academic_progress: Math.floor(Math.random() * 5) + 1,
          teacher_interaction: Math.floor(Math.random() * 5) + 1,
          education_quality: Math.floor(Math.random() * 5) + 1,
          administration_communication: Math.floor(Math.random() * 5) + 1,
          overall_satisfaction: Math.floor(Math.random() * 5) + 1,
          nps_score: Math.floor(Math.random() * 11), // 0-10
          teacher_rating: {
            [teacherId]: Math.floor(Math.random() * 5) + 1
          }
        };

        await prisma.feedbackResponse.create({
          data: {
            userId: parent.user.id,
            templateId: parentTemplate.id,
            answers: parentAnswers,
            isCompleted: true,
            submittedAt: new Date(),
            period: '2025-01',
            aboutTeacherId: teacherId
          }
        });

        console.log(`  ✓ Создан фидбек от родителя студента ${student.user.name}`);
      }
    }
  }
}

async function testDifferentKpiMethods(teacherId: number, kpiService: KpiService, feedbackService: FeedbackAggregationService) {
  console.log('\n🔍 Тестирование различных методов расчета KPI...');

  // 1. Детали преподавателя
  try {
    const teacherDetails = await kpiService.getTeacherKpiDetails(teacherId);
    console.log(`📊 Детали KPI преподавателя:`);
    console.log(`   Общий балл: ${teacherDetails.overallScore}`);
    console.log(`   Качество преподавания: ${teacherDetails.metrics.teachingQuality.value}`);
    console.log(`   Выполнение нагрузки: ${teacherDetails.metrics.workloadCompliance.value}`);
    console.log(`   Заполнение журнала: ${teacherDetails.metrics.classAttendance.value}`);
  } catch (error) {
    console.log(`❌ Ошибка получения деталей KPI: ${error.message}`);
  }

  // 2. KPI с учетом фидбеков
  try {
    const kpiFromFeedbacks = await feedbackService.calculateTeacherKPIFromFeedback(teacherId, '2025-01');
    console.log(`📈 KPI на основе фидбеков:`);
    console.log(`   Удовлетворенность студентов: ${kpiFromFeedbacks.studentSatisfaction}`);
    console.log(`   Удержание студентов: ${kpiFromFeedbacks.studentRetention}`);
    console.log(`   Отзывы родителей: ${kpiFromFeedbacks.parentFeedback}`);
    console.log(`   Общее количество фидбеков: ${kpiFromFeedbacks.feedbackCount}`);
    console.log(`   Средняя оценка: ${kpiFromFeedbacks.averageRating}`);
  } catch (error) {
    console.log(`❌ Ошибка KPI с фидбеками: ${error.message}`);
  }

  // 3. Агрегированные данные фидбеков
  try {
    const retentionData = await feedbackService.aggregateStudentRetentionKpi(teacherId);
    const parentData = await feedbackService.aggregateParentFeedbackKpi(teacherId);
    const evaluationData = await feedbackService.aggregateTeacherEvaluationFromStudents(teacherId);
    
    console.log(`📋 Агрегированные данные фидбеков:`);
    console.log(`   Удержание студентов: ${retentionData.score} (${retentionData.responseCount} ответов, уверенность: ${retentionData.confidence})`);
    console.log(`   Отзывы родителей: ${parentData.score} (${parentData.responseCount} ответов, уверенность: ${parentData.confidence})`);
    console.log(`   Оценки студентов: ${evaluationData.score} (${evaluationData.responseCount} ответов, уверенность: ${evaluationData.confidence})`);
  } catch (error) {
    console.log(`❌ Ошибка агрегации: ${error.message}`);
  }
}

async function testFeedbackImpact(teacherId: number, kpiService: KpiService) {
  console.log('\n💡 Тестирование влияния фидбеков на KPI...');

  try {
    // KPI до добавления дополнительного фидбека
    const kpiBefore = await kpiService.getTeacherKpiDetails(teacherId);
    console.log(`📉 KPI до: ${kpiBefore.overallScore}`);

    // Добавить очень позитивный фидбек
    const student = await prisma.student.findFirst({
      include: { user: true }
    });

    const template = await prisma.feedbackTemplate.findFirst({
      where: { name: 'student_retention_comprehensive' }
    });

    if (student && template) {
      await prisma.feedbackResponse.create({
        data: {
          userId: student.user.id,
          templateId: template.id,
          answers: {
            satisfaction_overall: 5, // Максимальная оценка
            continue_studying: true,
            recommend_school: 5,
            teacher_effectiveness: { [teacherId]: 5 },
            mood_today: 95,
            concentration_level: 90,
            motivation_level: 95,
            socialization_level: 85
          },
          isCompleted: true,
          submittedAt: new Date(),
          period: '2025-01',
          aboutTeacherId: teacherId
        }
      });

      // KPI после добавления позитивного фидбека
      const kpiAfter = await kpiService.getTeacherKpiDetails(teacherId);
      console.log(`📈 KPI после позитивного фидбека: ${kpiAfter.overallScore}`);
      console.log(`📊 Изменение: ${(kpiAfter.overallScore - kpiBefore.overallScore)}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка тестирования влияния: ${error.message}`);
  }
}

async function testOverallStatistics(feedbackService: FeedbackAggregationService) {
  console.log('\n📈 Тестирование общей статистики...');

  try {
    // Общая статистика агрегации фидбеков
    const aggregationStats = await feedbackService.getFeedbackAggregationStats();
    console.log(`📊 Статистика фидбек-агрегации:`);
    console.log(`   Общее количество фидбеков: ${aggregationStats.totalFeedbacks}`);
    console.log(`   KPI-релевантных фидбеков: ${aggregationStats.kpiRelevantFeedbacks}`);
    console.log(`   Преподавателей с фидбеками: ${aggregationStats.teachersWithFeedbacks}`);
    console.log(`   Средний процент ответов: ${aggregationStats.averageResponseRate}%`);
    
    console.log(`   Покрытие метрик:`);
    Object.entries(aggregationStats.metricsCoverage).forEach(([metric, count]) => {
      console.log(`     ${metric}: ${count} фидбеков`);
    });

  } catch (error) {
    console.log(`❌ Ошибка общей статистики: ${error.message}`);
  }
}

function testKpiWeights() {
  console.log('\n⚖️ Тестирование весовых коэффициентов KPI...');

  const testScores = {
    studentSatisfaction: 85,
    parentSatisfaction: 78,
    retentionIndex: 92,
    emotionalWellbeing: 76,
    teachingQuality: 88
  };

  const weights = {
    studentSatisfaction: 0.30,
    parentSatisfaction: 0.25,
    retentionIndex: 0.20,
    emotionalWellbeing: 0.15,
    teachingQuality: 0.10
  };

  const totalKpi = 
    (testScores.studentSatisfaction * weights.studentSatisfaction) +
    (testScores.parentSatisfaction * weights.parentSatisfaction) +
    (testScores.retentionIndex * weights.retentionIndex) +
    (testScores.emotionalWellbeing * weights.emotionalWellbeing) +
    (testScores.teachingQuality * weights.teachingQuality);

  console.log('📊 Тестовые показатели:');
  console.log(`   Удовлетворенность студентов: ${testScores.studentSatisfaction} (вес: ${weights.studentSatisfaction})`);
  console.log(`   Удовлетворенность родителей: ${testScores.parentSatisfaction} (вес: ${weights.parentSatisfaction})`);
  console.log(`   Индекс удержания: ${testScores.retentionIndex} (вес: ${weights.retentionIndex})`);
  console.log(`   Эмоциональное благополучие: ${testScores.emotionalWellbeing} (вес: ${weights.emotionalWellbeing})`);
  console.log(`   Качество преподавания: ${testScores.teachingQuality} (вес: ${weights.teachingQuality})`);
  console.log(`\n🎯 Итоговый KPI: ${totalKpi.toFixed(2)}`);
}

async function cleanupTestData() {
  console.log('\n🧹 Очистка тестовых данных...');
  
  try {
    // Удалить тестовые фидбеки (созданные сегодня)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deletedResponses = await prisma.feedbackResponse.deleteMany({
      where: {
        submittedAt: {
          gte: today
        },
        period: '2025-01'
      }
    });

    console.log(`🗑️ Удалено ${deletedResponses.count} тестовых фидбеков`);
  } catch (error) {
    console.log(`❌ Ошибка очистки: ${error.message}`);
  }
}

// Главная функция
async function main() {
  console.log('🚀 Запуск комплексного теста системы KPI\n');
  
  try {
    await testKpiCalculation();
    testKpiWeights();
    
    // Спросить у пользователя о очистке данных
    console.log('\n❓ Очистить тестовые данные? (запустите cleanupTestData() отдельно при необходимости)');
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    console.log('\n🏁 Тест завершен');
  }
}

// Экспорт функций для отдельного использования
export {
  testKpiCalculation,
  testKpiWeights,
  cleanupTestData,
  main
};

// Запуск если файл выполняется напрямую
if (require.main === module) {
  main().catch(console.error);
}
