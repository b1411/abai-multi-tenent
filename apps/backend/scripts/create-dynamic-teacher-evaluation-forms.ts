#!/usr/bin/env tsx
/**
 * Скрипт для создания персональных форм оценки преподавателей для всех студентов
 * Запуск: npx tsx scripts/create-dynamic-teacher-evaluation-forms.ts
 */

import { PrismaClient, UserRole, FeedbackFrequency } from '../generated/prisma';

const prisma = new PrismaClient();

async function createDynamicTeacherEvaluationForms() {
  try {
    console.log('🎯 Начинаем создание персональных форм оценки преподавателей...');

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

    console.log(`👥 Найдено ${students.length} студентов`);

    let createdForms = 0;
    let updatedForms = 0;
    let errors = 0;

    for (const student of students) {
      try {
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
          console.log(`⚠️  У студента ${student.user.name} ${student.user.surname} нет преподавателей`);
          continue;
        }

        console.log(`📝 Создаем форму для студента ${student.user.name} ${student.user.surname} с ${teachers.length} преподавателями`);

        // Создаем персональный шаблон для студента
        const templateName = `teacher_evaluation_student_${student.id}`;

        // Создаем вопросы для каждого преподавателя
        const questions = [];

        teachers.forEach((teacher) => {
          // Формируем полное имя преподавателя один раз для консистентности
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

          // Вопрос об общей удовлетворенности преподавателем
          questions.push({
            id: `teacher_${teacher.id}_satisfaction`,
            question: `Оцените вашу общую удовлетворенность работой ${teacherFullName}`,
            type: 'RATING_1_10',
            required: true,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 1.2
          });

          // Дополнительный вопрос о помощи в обучении
          questions.push({
            id: `teacher_${teacher.id}_helpful`,
            question: `Помогает ли ${teacherFullName} вам в процессе обучения?`,
            type: 'RATING_1_5',
            required: false,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'TEACHING_QUALITY',
            isKpiRelevant: true,
            kpiWeight: 0.8,
            options: [
              '1 - Совсем не помогает',
              '2 - Мало помогает',
              '3 - Иногда помогает',
              '4 - Часто помогает',
              '5 - Всегда помогает'
            ]
          });
        });

        // Создаем или обновляем персональный шаблон
        const existingTemplate = await prisma.feedbackTemplate.findUnique({
          where: { name: templateName }
        });

        if (existingTemplate) {
          await prisma.feedbackTemplate.update({
            where: { name: templateName },
            data: {
              questions: questions,
              title: `Оценка преподавателей (для студента ${student.user.name} ${student.user.surname})`,
              description: `Персональная форма оценки ${teachers.length} преподавателей студентом`,
            }
          });
          updatedForms++;
          console.log(`✅ Обновлена форма для студента ${student.user.name} ${student.user.surname}`);
        } else {
          await prisma.feedbackTemplate.create({
            data: {
              name: templateName,
              role: UserRole.STUDENT,
              title: `Оценка преподавателей (для студента ${student.user.name} ${student.user.surname})`,
              description: `Персональная форма оценки ${teachers.length} преподавателей студентом`,
              questions: questions,
              isActive: true,
              frequency: FeedbackFrequency.MONTHLY,
              priority: 6, // Высокий приоритет для персональных форм
              hasKpiQuestions: true,
              kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
            }
          });
          createdForms++;
          console.log(`✅ Создана форма для студента ${student.user.name} ${student.user.surname}`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Ошибка при создании формы для студента ${student.user.name} ${student.user.surname}:`, error);
      }
    }

    console.log('\n🎉 Создание персональных форм завершено!');
    console.log(`📊 Статистика:`);
    console.log(`   - Создано новых форм: ${createdForms}`);
    console.log(`   - Обновлено существующих форм: ${updatedForms}`);
    console.log(`   - Ошибок: ${errors}`);
    console.log(`   - Всего обработано студентов: ${students.length}`);

    // Создаем также базовые KPI шаблоны если их нет
    await createBaseKpiTemplates();

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBaseKpiTemplates() {
  console.log('\n🏗️  Создаем базовые KPI шаблоны...');

  const baseTemplates = [
    {
      name: 'student_retention_survey',
      role: UserRole.STUDENT,
      title: 'Оценка учебного процесса',
      description: 'Помогите нам улучшить качество обучения',
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
        }
      ],
      frequency: FeedbackFrequency.MONTHLY,
      priority: 5,
      hasKpiQuestions: true,
      kpiMetrics: ['STUDENT_RETENTION']
    },
    {
      name: 'parent_satisfaction_survey',
      role: UserRole.PARENT,
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
          id: 'recommend_to_others',
          question: 'Порекомендуете ли вы нашу академию другим родителям?',
          type: 'YES_NO',
          required: true,
          kpiMetric: 'TEACHER_SATISFACTION',
          isKpiRelevant: true,
          kpiWeight: 0.9
        }
      ],
      frequency: FeedbackFrequency.QUARTERLY,
      priority: 3,
      hasKpiQuestions: true,
      kpiMetrics: ['TEACHER_SATISFACTION', 'TEACHING_QUALITY', 'OVERALL_EXPERIENCE']
    }
  ];

  let baseCreated = 0;
  let baseUpdated = 0;

  for (const template of baseTemplates) {
    try {
      const existing = await prisma.feedbackTemplate.findUnique({
        where: { name: template.name }
      });

      if (existing) {
        await prisma.feedbackTemplate.update({
          where: { name: template.name },
          data: template
        });
        baseUpdated++;
        console.log(`✅ Обновлен базовый шаблон: ${template.title}`);
      } else {
        await prisma.feedbackTemplate.create({
          data: {
            ...template,
            isActive: true
          }
        });
        baseCreated++;
        console.log(`✅ Создан базовый шаблон: ${template.title}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при создании базового шаблона ${template.name}:`, error);
    }
  }

  console.log(`📊 Базовые шаблоны: создано ${baseCreated}, обновлено ${baseUpdated}`);
}

// Запускаем скрипт
if (require.main === module) {
  createDynamicTeacherEvaluationForms()
    .then(() => {
      console.log('✅ Скрипт выполнен успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}

export { createDynamicTeacherEvaluationForms };
