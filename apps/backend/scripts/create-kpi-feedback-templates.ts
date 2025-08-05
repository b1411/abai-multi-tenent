import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function createKpiFeedbackTemplates() {
  console.log('🏗️  Создание KPI шаблонов фидбеков...');

  try {
    // 1. Шаблон для удержания студентов (от студентов)
    const studentRetentionTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_retention_survey' },
      update: {},
      create: {
        name: 'student_retention_survey',
        role: 'STUDENT',
        title: 'Оценка учебного процесса',
        description: 'Помогите нам улучшить качество обучения, ответив на несколько вопросов',
        questions: [
          {
            id: 'continue_learning',
            question: 'Планируете ли вы продолжить обучение в следующем семестре?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 1.0
          },
          {
            id: 'recommend_academy',
            question: 'Порекомендуете ли вы нашу академию друзьям?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.8
          },
          {
            id: 'overall_satisfaction',
            question: 'Оцените ваше общее удовлетворение качеством обучения',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень неудовлетворен',
              '2 - Неудовлетворен',
              '3 - Нейтрально',
              '4 - Удовлетворен',
              '5 - Очень удовлетворен'
            ]
          },
          {
            id: 'learning_motivation',
            question: 'Как изменилась ваша мотивация к обучению?',
            type: 'RATING_1_5',
            required: false,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.6,
            options: [
              '1 - Значительно снизилась',
              '2 - Снизилась',
              '3 - Не изменилась',
              '4 - Повысилась',
              '5 - Значительно повысилась'
            ]
          }
        ],
        isActive: true,
        frequency: 'MONTHLY',
        priority: 5, // Обязательный
        hasKpiQuestions: true,
        kpiMetrics: ['STUDENT_RETENTION']
      }
    });

    console.log('✅ Создан шаблон для удержания студентов');

    // 2. Шаблон отзывов от родителей
    const parentFeedbackTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'parent_satisfaction_survey' },
      update: {},
      create: {
        name: 'parent_satisfaction_survey',
        role: 'PARENT',
        title: 'Отзыв родителей о качестве обучения',
        description: 'Оцените качество обучения вашего ребенка',
        questions: [
          {
            id: 'teacher_satisfaction',
            question: 'Насколько вы удовлетворены работой преподавателей?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень неудовлетворен',
              '2 - Неудовлетворен',
              '3 - Нейтрально',
              '4 - Удовлетворен',
              '5 - Очень удовлетворен'
            ]
          },
          {
            id: 'teaching_quality',
            question: 'Как вы оцениваете качество преподавания?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHING_QUALITY',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень низкое',
              '2 - Низкое',
              '3 - Среднее',
              '4 - Высокое',
              '5 - Очень высокое'
            ]
          },
          {
            id: 'child_progress',
            question: 'Заметили ли вы прогресс в обучении вашего ребенка?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHING_QUALITY',
            isKpiRelevant: true,
            kpiWeight: 0.8
          },
          {
            id: 'overall_experience',
            question: 'Оцените общее впечатление от академии',
            type: 'RATING_1_10',
            required: true,
            kpiMetric: 'OVERALL_EXPERIENCE',
            isKpiRelevant: true,
            kpiWeight: 1.0
          },
          {
            id: 'recommend_to_others',
            question: 'Порекомендуете ли вы нашу академию другим родителям?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.9
          },
          {
            id: 'additional_feedback',
            question: 'Дополнительные комментарии и предложения',
            type: 'TEXT',
            required: false,
            kpiMetric: 'OVERALL_EXPERIENCE',
            isKpiRelevant: false,
            kpiWeight: 0
          }
        ],
        isActive: true,
        frequency: 'QUARTERLY',
        priority: 3, // Обязательный
        hasKpiQuestions: true,
        kpiMetrics: ['TEACHER_SATISFACTION', 'TEACHING_QUALITY', 'OVERALL_EXPERIENCE']
      }
    });

    console.log('✅ Создан шаблон отзывов от родителей');

    // 3. Дополнительный шаблон для оценки преподавателей студентами
    const teacherEvaluationTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'teacher_evaluation_by_students' },
      update: {},
      create: {
        name: 'teacher_evaluation_by_students',
        role: 'STUDENT',
        title: 'Оценка преподавателей',
        description: 'Оцените работу ваших преподавателей',
        questions: [
          {
            id: 'lesson_clarity',
            question: 'Насколько понятно преподаватель объясняет материал?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHING_QUALITY',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень непонятно',
              '2 - Непонятно',
              '3 - Приемлемо',
              '4 - Понятно',
              '5 - Очень понятно'
            ]
          },
          {
            id: 'lesson_engagement',
            question: 'Насколько интересны уроки?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'LESSON_EFFECTIVENESS',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень скучно',
              '2 - Скучно',
              '3 - Нормально',
              '4 - Интересно',
              '5 - Очень интересно'
            ]
          },
          {
            id: 'teacher_availability',
            question: 'Доступен ли преподаватель для вопросов вне уроков?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.7
          },
          {
            id: 'recommend_teacher',
            question: 'Порекомендуете ли вы этого преподавателя другим студентам?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.9
          }
        ],
        isActive: true,
        frequency: 'MONTHLY',
        priority: 4, // Обязательный
        hasKpiQuestions: true,
        kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
      }
    });

    console.log('✅ Создан шаблон оценки преподавателей студентами');

    // 4. Эмоциональный шаблон для студентов
    const emotionalFeedbackTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_emotional_wellbeing' },
      update: {},
      create: {
        name: 'student_emotional_wellbeing',
        role: 'STUDENT',
        title: 'Эмоциональное состояние',
        description: 'Расскажите о своем самочувствии и настроении',
        questions: [
          {
            id: 'mood_today',
            question: 'Как вы оцениваете свое настроение сегодня?',
            type: 'EMOTIONAL_SCALE',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.6
          },
          {
            id: 'concentration_level',
            question: 'Как вы оцениваете свою концентрацию на уроках?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'LESSON_EFFECTIVENESS',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Очень трудно сосредоточиться',
              '2 - Трудно сосредоточиться',
              '3 - Нормально',
              '4 - Легко сосредоточиться',
              '5 - Очень легко сосредоточиться'
            ]
          },
          {
            id: 'motivation_level',
            question: 'Насколько вы мотивированы к учебе?',
            type: 'RATING_1_10',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 1.0
          },
          {
            id: 'stress_level',
            question: 'Чувствуете ли вы стресс от учебной нагрузки?',
            type: 'RATING_1_5',
            required: false,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.4,
            options: [
              '1 - Совсем нет стресса',
              '2 - Небольшой стресс',
              '3 - Умеренный стресс',
              '4 - Сильный стресс',
              '5 - Очень сильный стресс'
            ]
          }
        ],
        isActive: true,
        frequency: 'WEEKLY',
        priority: 2, // Низкий приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['STUDENT_RETENTION', 'LESSON_EFFECTIVENESS']
      }
    });

    console.log('✅ Создан эмоциональный шаблон для студентов');

    console.log('\n🎉 Все KPI шаблоны фидбеков успешно созданы!');
    console.log('\nСозданные шаблоны:');
    console.log('📋 student_retention_survey - Удержание студентов (STUDENT, MONTHLY, priority 5)');
    console.log('📋 parent_satisfaction_survey - Отзывы родителей (PARENT, QUARTERLY, priority 3)');
    console.log('📋 teacher_evaluation_by_students - Оценка преподавателей (STUDENT, MONTHLY, priority 4)');
    console.log('📋 student_emotional_wellbeing - Эмоциональное состояние (STUDENT, WEEKLY, priority 2)');

    // Проверяем, что шаблоны созданы
    const totalTemplates = await prisma.feedbackTemplate.count({
      where: {
        hasKpiQuestions: true
      }
    });

    console.log(`\n📊 Общее количество KPI шаблонов в базе: ${totalTemplates}`);

  } catch (error) {
    console.error('❌ Ошибка при создании KPI шаблонов:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
createKpiFeedbackTemplates()
  .then(() => {
    console.log('✅ Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
