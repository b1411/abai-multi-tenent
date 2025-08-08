/**
 * Скрипт для создания полного набора KPI шаблонов фидбеков
 * с интеграцией системы отзывов родителей и удержания студентов
 */

import { PrismaClient } from '../generated/prisma';
import { UserRole, FeedbackFrequency } from '../generated/prisma';

const prisma = new PrismaClient();

async function createCompleteKpiTemplates() {
  console.log('🚀 Начинаем создание полного набора KPI шаблонов...');

  try {
    // 1. Шаблон удержания студентов (расширенный)
    console.log('📊 Создаем расширенный шаблон удержания студентов...');
    const studentRetentionTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_retention_comprehensive' },
      update: {},
      create: {
        name: 'student_retention_comprehensive',
        role: UserRole.STUDENT,
        title: 'Удовлетворенность обучением и планы',
        description: 'Расскажите о своих планах продолжения обучения и общей удовлетворенности',
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
            kpiWeight: 0.9
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
            question: 'Как изменилась ваша мотивация к обучению за последний месяц?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.7,
            options: [
              '1 - Значительно снизилась',
              '2 - Снизилась',
              '3 - Не изменилась',
              '4 - Повысилась',
              '5 - Значительно повысилась'
            ]
          },
          {
            id: 'reasons_to_leave',
            question: 'Если вы не планируете продолжать обучение, укажите основную причину',
            type: 'SINGLE_CHOICE',
            required: false,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.5,
            options: [
              'Финансовые трудности',
              'Неудовлетворенность качеством преподавания',
              'Слишком высокая нагрузка',
              'Личные обстоятельства',
              'Поступление в другое учебное заведение',
              'Другое'
            ]
          },
          {
            id: 'study_problems',
            question: 'С какими проблемами в обучении вы сталкиваетесь?',
            type: 'MULTIPLE_CHOICE',
            required: false,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.4,
            options: [
              'Сложность материала',
              'Недостаток времени',
              'Проблемы с концентрацией',
              'Неясность объяснений преподавателя',
              'Отсутствие мотивации',
              'Технические проблемы',
              'Проблем нет'
            ],
            positiveOptions: [6] // "Проблем нет"
          }
        ],
        isActive: true,
        frequency: FeedbackFrequency.MONTHLY,
        priority: 7, // Высокий приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['STUDENT_RETENTION']
      }
    });

    // 2. Расширенный шаблон отзывов родителей
    console.log('👨‍👩‍👧‍👦 Создаем расширенный шаблон отзывов родителей...');
    const parentComprehensiveTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'parent_comprehensive_feedback' },
      update: {},
      create: {
        name: 'parent_comprehensive_feedback',
        role: UserRole.PARENT,
        title: 'Комплексная оценка обучения ребенка',
        description: 'Оцените все аспекты обучения вашего ребенка для улучшения качества образования',
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
            id: 'communication_satisfaction',
            question: 'Насколько вы удовлетворены общением с преподавателями?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Очень неудовлетворен',
              '2 - Неудовлетворен',
              '3 - Нейтрально',
              '4 - Удовлетворен',
              '5 - Очень удовлетворен'
            ]
          },
          {
            id: 'child_motivation',
            question: 'Как изменилась мотивация вашего ребенка к учебе?',
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
          },
          {
            id: 'continue_next_semester',
            question: 'Планируете ли продолжить обучение в следующем семестре?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 1.0
          }
        ],
        isActive: true,
        frequency: FeedbackFrequency.QUARTERLY,
        priority: 6, // Высокий приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['TEACHER_SATISFACTION', 'TEACHING_QUALITY', 'OVERALL_EXPERIENCE', 'STUDENT_RETENTION']
      }
    });

    // 3. Ежемесячный мини-опрос для родителей (быстрая обратная связь)
    console.log('📱 Создаем ежемесячный экспресс-опрос родителей...');
    const parentMonthlyTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'parent_monthly_mini_survey' },
      update: {},
      create: {
        name: 'parent_monthly_mini_survey',
        role: UserRole.PARENT,
        title: 'Краткий ежемесячный опрос',
        description: 'Быстрая обратная связь о текущем состоянии обучения (займет 2 минуты)',
        questions: [
          {
            id: 'month_satisfaction',
            question: 'Как вы оцениваете прошедший месяц обучения?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень плохо',
              '2 - Плохо',
              '3 - Нормально',
              '4 - Хорошо',
              '5 - Отлично'
            ]
          },
          {
            id: 'child_mood',
            question: 'Как ваш ребенок относится к учебе в этом месяце?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Очень негативно',
              '2 - Негативно',
              '3 - Нейтрально',
              '4 - Позитивно',
              '5 - Очень позитивно'
            ]
          },
          {
            id: 'concerns',
            question: 'Есть ли у вас какие-либо опасения?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.6
          },
          {
            id: 'concerns_detail',
            question: 'Если есть опасения, кратко опишите их',
            type: 'TEXT',
            required: false,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: false,
            kpiWeight: 0.0
          }
        ],
        isActive: true,
        frequency: FeedbackFrequency.MONTHLY,
        priority: 4, // Средний приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['TEACHER_SATISFACTION', 'STUDENT_RETENTION']
      }
    });

    // 4. Улучшенный шаблон эмоционального состояния студентов
    console.log('😊 Создаем улучшенный шаблон эмоционального мониторинга...');
    const emotionalEnhancedTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_emotional_enhanced' },
      update: {},
      create: {
        name: 'student_emotional_enhanced',
        role: UserRole.STUDENT,
        title: 'Мониторинг эмоционального состояния',
        description: 'Помогите нам понять ваше эмоциональное состояние для улучшения учебного процесса',
        questions: [
          {
            id: 'mood_today',
            question: 'Как вы оцениваете свое настроение на этой неделе?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Очень плохое',
              '2 - Плохое',
              '3 - Нормальное',
              '4 - Хорошее',
              '5 - Отличное'
            ]
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
            question: 'Насколько вы мотивированы к учебе сейчас?',
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
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.6,
            options: [
              '1 - Совсем нет стресса',
              '2 - Небольшой стресс',
              '3 - Умеренный стресс',
              '4 - Сильный стресс',
              '5 - Очень сильный стресс'
            ]
          },
          {
            id: 'social_comfort',
            question: 'Насколько комфортно вы чувствуете себя в группе?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.7,
            options: [
              '1 - Очень некомфортно',
              '2 - Некомфортно',
              '3 - Нейтрально',
              '4 - Комфортно',
              '5 - Очень комфортно'
            ]
          },
          {
            id: 'teacher_support',
            question: 'Чувствуете ли вы поддержку от преподавателей?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.8
          }
        ],
        isActive: true,
        frequency: FeedbackFrequency.WEEKLY,
        priority: 3, // Средний приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['STUDENT_RETENTION', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
      }
    });

    // 5. Семестровый итоговый опрос студентов
    console.log('🎓 Создаем семестровый итоговый опрос...');
    const semesterSummaryTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_semester_summary' },
      update: {},
      create: {
        name: 'student_semester_summary',
        role: UserRole.STUDENT,
        title: 'Итоги семестра',
        description: 'Подведите итоги прошедшего семестра и поделитесь планами на будущее',
        questions: [
          {
            id: 'semester_satisfaction',
            question: 'Насколько вы удовлетворены прошедшим семестром?',
            type: 'RATING_1_10',
            required: true,
            kpiMetric: 'OVERALL_EXPERIENCE',
            isKpiRelevant: true,
            kpiWeight: 1.0
          },
          {
            id: 'goals_achieved',
            question: 'Удалось ли вам достичь поставленных целей в этом семестре?',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Совсем не удалось',
              '2 - Частично удалось',
              '3 - В основном удалось',
              '4 - Полностью удалось',
              '5 - Превысил ожидания'
            ]
          },
          {
            id: 'continue_next_semester',
            question: 'Планируете ли вы продолжить обучение в следующем семестре?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 1.0
          },
          {
            id: 'recommend_academy',
            question: 'Порекомендуете ли вы академию своим друзьям?',
            type: 'YES_NO',
            required: true,
            kpiMetric: 'STUDENT_RETENTION',
            isKpiRelevant: true,
            kpiWeight: 0.9
          },
          {
            id: 'overall_teacher_rating',
            question: 'Оцените общую работу преподавателей в семестре',
            type: 'RATING_1_5',
            required: true,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень плохо',
              '2 - Плохо',
              '3 - Удовлетворительно',
              '4 - Хорошо',
              '5 - Отлично'
            ]
          },
          {
            id: 'improvements_needed',
            question: 'Что больше всего нужно улучшить в академии?',
            type: 'MULTIPLE_CHOICE',
            required: false,
            kpiMetric: 'OVERALL_EXPERIENCE',
            isKpiRelevant: true,
            kpiWeight: 0.5,
            options: [
              'Качество преподавания',
              'Учебные материалы',
              'Расписание занятий',
              'Техническое оснащение',
              'Коммуникация с преподавателями',
              'Организация учебного процесса',
              'Все устраивает'
            ],
            positiveOptions: [6] // "Все устраивает"
          }
        ],
        isActive: true,
        frequency: FeedbackFrequency.SEMESTER,
        priority: 8, // Очень высокий приоритет
        hasKpiQuestions: true,
        kpiMetrics: ['STUDENT_RETENTION', 'TEACHER_SATISFACTION', 'OVERALL_EXPERIENCE']
      }
    });

    // 6. Создаем персональные шаблоны оценки преподавателей для студентов
    console.log('👨‍🎓 Создаем персональные шаблоны оценки преподавателей...');
    
    // Получаем всех активных студентов
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        group: {
          include: {
            studyPlans: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`🎓 Найдено ${students.length} студентов для создания персональных форм`);

    let personalTemplatesCreated = 0;

    for (const student of students) {
      // Получаем уникальных преподавателей студента
      const teachersSet = new Set();
      const teachers = student.group?.studyPlans
        .map(plan => plan.teacher)
        .filter(teacher => {
          if (!teacher || teachersSet.has(teacher.id)) return false;
          teachersSet.add(teacher.id);
          return true;
        }) || [];

      if (teachers.length === 0) {
        continue;
      }

      // Создаем персональный шаблон для студента
      const templateName = `teacher_evaluation_student_${student.id}`;

      // Создаем вопросы для каждого преподавателя
      const questions = [];

      teachers.forEach((teacher) => {
        const teacherFullName = `${teacher.user.name} ${teacher.user.surname}`.trim();
        
        // Вопрос о качестве объяснения материала
        questions.push({
          id: `teacher_${teacher.id}_clarity`,
          question: `Насколько понятно ${teacherFullName} объясняет материал?`,
          type: 'RATING_1_5',
          required: true,
          teacherId: teacher.id,
          teacherName: teacherFullName,
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
        });

        // Вопрос о интересности уроков
        questions.push({
          id: `teacher_${teacher.id}_engagement`,
          question: `Насколько интересны уроки ${teacherFullName}?`,
          type: 'RATING_1_5',
          required: true,
          teacherId: teacher.id,
          teacherName: teacherFullName,
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
        });

        // Вопрос о доступности преподавателя
        questions.push({
          id: `teacher_${teacher.id}_availability`,
          question: `Доступен ли ${teacherFullName} для вопросов вне уроков?`,
          type: 'YES_NO',
          required: true,
          teacherId: teacher.id,
          teacherName: teacherFullName,
          kpiMetric: 'TEACHER_SATISFACTION',
          isKpiRelevant: true,
          kpiWeight: 0.7
        });

        // Вопрос о рекомендации преподавателя
        questions.push({
          id: `teacher_${teacher.id}_recommend`,
          question: `Порекомендуете ли вы ${teacherFullName} другим студентам?`,
          type: 'YES_NO',
          required: true,
          teacherId: teacher.id,
          teacherName: teacherFullName,
          kpiMetric: 'TEACHER_SATISFACTION',
          isKpiRelevant: true,
          kpiWeight: 0.9
        });
      });

      // Создаем или обновляем персональный шаблон
      await prisma.feedbackTemplate.upsert({
        where: { name: templateName },
        update: {
          questions: questions,
          title: `Оценка преподавателей (${student.user.name} ${student.user.surname})`,
          description: `Персональная форма оценки ${teachers.length} преподавателей`,
          kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
        },
        create: {
          name: templateName,
          role: UserRole.STUDENT,
          title: `Оценка преподавателей (${student.user.name} ${student.user.surname})`,
          description: `Персональная форма оценки ${teachers.length} преподавателей`,
          questions: questions,
          isActive: true,
          frequency: FeedbackFrequency.MONTHLY,
          priority: 6, // Высокий приоритет для персональных форм
          hasKpiQuestions: true,
          kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
        }
      });

      personalTemplatesCreated++;
    }

    console.log(`✅ Создано ${personalTemplatesCreated} персональных шаблонов оценки преподавателей`);

    // 7. Создаем КТП шаблоны (если их нет)
    console.log('📚 Проверяем и создаем КТП для учебных планов...');
    const studyPlansWithoutCurriculum = await prisma.studyPlan.findMany({
      where: {
        curriculumPlan: null,
        deletedAt: null
      }
    });

    for (const studyPlan of studyPlansWithoutCurriculum) {
      await prisma.curriculumPlan.create({
        data: {
          studyPlanId: studyPlan.id,
          totalLessons: 36, // Примерно 36 уроков в семестр
          plannedLessons: Array.from({ length: 18 }, (_, i) => ({
            week: i + 1,
            topic: `Тема недели ${i + 1}`,
            hours: 2
          })),
          completionRate: 0
        }
      });
    }

    console.log(`📚 Создано КТП для ${studyPlansWithoutCurriculum.length} учебных планов`);

    console.log('\n🎉 Создание всех KPI шаблонов завершено!');
    console.log(`\n📊 Созданные шаблоны:
    ✓ Расширенный опрос удержания студентов (приоритет 7)
    ✓ Комплексная оценка родителей (приоритет 6)
    ✓ Ежемесячный экспресс-опрос родителей (приоритет 4)
    ✓ Улучшенный эмоциональный мониторинг (приоритет 3)
    ✓ Семестровый итоговый опрос (приоритет 8)
    ✓ ${personalTemplatesCreated} персональных форм оценки преподавателей (приоритет 6)
    ✓ КТП для ${studyPlansWithoutCurriculum.length} учебных планов`);

    return {
      message: 'Все KPI шаблоны успешно созданы',
      templatesCreated: {
        studentRetentionTemplate: studentRetentionTemplate.id,
        parentComprehensiveTemplate: parentComprehensiveTemplate.id,
        parentMonthlyTemplate: parentMonthlyTemplate.id,
        emotionalEnhancedTemplate: emotionalEnhancedTemplate.id,
        semesterSummaryTemplate: semesterSummaryTemplate.id,
        personalTemplatesCount: personalTemplatesCreated,
        curriculumPlansCreated: studyPlansWithoutCurriculum.length
      }
    };

  } catch (error) {
    console.error('❌ Ошибка при создании KPI шаблонов:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🏁 Запуск скрипта создания полного набора KPI шаблонов...');
    const result = await createCompleteKpiTemplates();
    console.log('🎊 Скрипт успешно завершен!', result);
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { createCompleteKpiTemplates };
