import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function createEmotionalFeedbackTemplate() {
  try {
    // Шаблон для студентов - ежемесячная самооценка
    const studentTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'student_emotional_assessment' },
      create: {
        name: 'student_emotional_assessment',
        role: 'STUDENT',
        title: 'Оценка эмоционального состояния',
        description: 'Ежемесячная самооценка психоэмоционального состояния студента',
        frequency: 'MONTHLY',
        priority: 5, // Обязательная форма
        isActive: true,
        questions: {
          sections: [
            {
              title: 'Настроение и самочувствие',
              questions: [
                {
                  id: 'mood_today',
                  type: 'RATING_1_10',
                  question: 'Как бы вы оценили свое общее настроение за последний месяц?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень плохое',
                    maxLabel: 'Отличное'
                  }
                },
                {
                  id: 'stress_level',
                  type: 'RATING_1_10',
                  question: 'Уровень стресса в учебном процессе:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Нет стресса',
                    maxLabel: 'Очень высокий стресс'
                  }
                },
                {
                  id: 'sleep_quality',
                  type: 'RATING_1_5',
                  question: 'Качество сна:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Очень плохое',
                    maxLabel: 'Отличное'
                  }
                }
              ]
            },
            {
              title: 'Учебная деятельность',
              questions: [
                {
                  id: 'concentration_level',
                  type: 'RATING_1_10',
                  question: 'Насколько легко вам концентрироваться на учебе?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень сложно',
                    maxLabel: 'Очень легко'
                  }
                },
                {
                  id: 'motivation_level',
                  type: 'RATING_1_10',
                  question: 'Уровень мотивации к обучению:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень низкий',
                    maxLabel: 'Очень высокий'
                  }
                },
                {
                  id: 'academic_satisfaction',
                  type: 'RATING_1_5',
                  question: 'Удовлетворенность учебным процессом:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Совсем не удовлетворен',
                    maxLabel: 'Полностью удовлетворен'
                  }
                }
              ]
            },
            {
              title: 'Социальные отношения',
              questions: [
                {
                  id: 'socialization_level',
                  type: 'RATING_1_10',
                  question: 'Как вы оцениваете свои отношения с одногруппниками?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень плохие',
                    maxLabel: 'Отличные'
                  }
                },
                {
                  id: 'teacher_interaction',
                  type: 'RATING_1_5',
                  question: 'Комфортность взаимодействия с преподавателями:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Очень некомфортно',
                    maxLabel: 'Очень комфортно'
                  }
                },
                {
                  id: 'support_feeling',
                  type: 'RATING_1_10',
                  question: 'Чувствуете ли вы поддержку от окружающих?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Совсем не чувствую',
                    maxLabel: 'Полностью чувствую'
                  }
                }
              ]
            },
            {
              title: 'Дополнительные вопросы',
              questions: [
                {
                  id: 'main_concerns',
                  type: 'MULTIPLE_CHOICE',
                  question: 'Что вас больше всего беспокоит в учебе? (можно выбрать несколько)',
                  required: false,
                  options: [
                    'Сложность материала',
                    'Нехватка времени',
                    'Отношения с преподавателями',
                    'Отношения с одногруппниками',
                    'Финансовые вопросы',
                    'Здоровье',
                    'Семейные проблемы',
                    'Будущее трудоустройство',
                    'Ничего не беспокоит'
                  ]
                },
                {
                  id: 'additional_comments',
                  type: 'TEXT',
                  question: 'Есть ли что-то еще, что вы хотели бы рассказать о своем состоянии?',
                  required: false,
                  placeholder: 'Ваши комментарии...'
                },
                {
                  id: 'help_needed',
                  type: 'YES_NO',
                  question: 'Хотели бы вы получить помощь психолога или консультанта?',
                  required: true
                }
              ]
            }
          ]
        }
      },
      update: {
        questions: {
          sections: [
            {
              title: 'Настроение и самочувствие',
              questions: [
                {
                  id: 'mood_today',
                  type: 'RATING_1_10',
                  question: 'Как бы вы оценили свое общее настроение за последний месяц?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень плохое',
                    maxLabel: 'Отличное'
                  }
                },
                {
                  id: 'stress_level',
                  type: 'RATING_1_10',
                  question: 'Уровень стресса в учебном процессе:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Нет стресса',
                    maxLabel: 'Очень высокий стресс'
                  }
                },
                {
                  id: 'sleep_quality',
                  type: 'RATING_1_5',
                  question: 'Качество сна:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Очень плохое',
                    maxLabel: 'Отличное'
                  }
                }
              ]
            },
            {
              title: 'Учебная деятельность',
              questions: [
                {
                  id: 'concentration_level',
                  type: 'RATING_1_10',
                  question: 'Насколько легко вам концентрироваться на учебе?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень сложно',
                    maxLabel: 'Очень легко'
                  }
                },
                {
                  id: 'motivation_level',
                  type: 'RATING_1_10',
                  question: 'Уровень мотивации к обучению:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень низкий',
                    maxLabel: 'Очень высокий'
                  }
                },
                {
                  id: 'academic_satisfaction',
                  type: 'RATING_1_5',
                  question: 'Удовлетворенность учебным процессом:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Совсем не удовлетворен',
                    maxLabel: 'Полностью удовлетворен'
                  }
                }
              ]
            },
            {
              title: 'Социальные отношения',
              questions: [
                {
                  id: 'socialization_level',
                  type: 'RATING_1_10',
                  question: 'Как вы оцениваете свои отношения с одногруппниками?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень плохие',
                    maxLabel: 'Отличные'
                  }
                },
                {
                  id: 'teacher_interaction',
                  type: 'RATING_1_5',
                  question: 'Комфортность взаимодействия с преподавателями:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Очень некомфортно',
                    maxLabel: 'Очень комфортно'
                  }
                },
                {
                  id: 'support_feeling',
                  type: 'RATING_1_10',
                  question: 'Чувствуете ли вы поддержку от окружающих?',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Совсем не чувствую',
                    maxLabel: 'Полностью чувствую'
                  }
                }
              ]
            },
            {
              title: 'Дополнительные вопросы',
              questions: [
                {
                  id: 'main_concerns',
                  type: 'MULTIPLE_CHOICE',
                  question: 'Что вас больше всего беспокоит в учебе? (можно выбрать несколько)',
                  required: false,
                  options: [
                    'Сложность материала',
                    'Нехватка времени',
                    'Отношения с преподавателями',
                    'Отношения с одногруппниками',
                    'Финансовые вопросы',
                    'Здоровье',
                    'Семейные проблемы',
                    'Будущее трудоустройство',
                    'Ничего не беспокоит'
                  ]
                },
                {
                  id: 'additional_comments',
                  type: 'TEXT',
                  question: 'Есть ли что-то еще, что вы хотели бы рассказать о своем состоянии?',
                  required: false,
                  placeholder: 'Ваши комментарии...'
                },
                {
                  id: 'help_needed',
                  type: 'YES_NO',
                  question: 'Хотели бы вы получить помощь психолога или консультанта?',
                  required: true
                }
              ]
            }
          ]
        }
      }
    });

    // Шаблон для учителей - наблюдения за студентами
    const teacherTemplate = await prisma.feedbackTemplate.upsert({
      where: { name: 'teacher_student_observation' },
      create: {
        name: 'teacher_student_observation',
        role: 'TEACHER',
        title: 'Наблюдения за эмоциональным состоянием студентов',
        description: 'Квартальная оценка преподавателями эмоционального состояния студентов',
        frequency: 'QUARTERLY',
        priority: 3, // Обязательная форма
        isActive: true,
        questions: {
          sections: [
            {
              title: 'Общие наблюдения',
              questions: [
                {
                  id: 'student_id',
                  type: 'SINGLE_CHOICE',
                  question: 'Выберите студента для оценки:',
                  required: true,
                  note: 'Список будет загружен динамически'
                },
                {
                  id: 'overall_mood',
                  type: 'RATING_1_5',
                  question: 'Общее настроение студента на занятиях:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Подавленное',
                    maxLabel: 'Отличное'
                  }
                },
                {
                  id: 'engagement_level',
                  type: 'RATING_1_10',
                  question: 'Уровень вовлеченности в учебный процесс:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Очень низкий',
                    maxLabel: 'Очень высокий'
                  }
                },
                {
                  id: 'attention_span',
                  type: 'RATING_1_5',
                  question: 'Способность концентрироваться на занятиях:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Очень слабая',
                    maxLabel: 'Отличная'
                  }
                }
              ]
            },
            {
              title: 'Социальное взаимодействие',
              questions: [
                {
                  id: 'peer_interaction',
                  type: 'RATING_1_5',
                  question: 'Взаимодействие с одногруппниками:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Избегает общения',
                    maxLabel: 'Активно общается'
                  }
                },
                {
                  id: 'teacher_interaction',
                  type: 'RATING_1_5',
                  question: 'Взаимодействие с преподавателем:',
                  required: true,
                  scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Избегает контакта',
                    maxLabel: 'Активно участвует'
                  }
                }
              ]
            },
            {
              title: 'Поведенческие наблюдения',
              questions: [
                {
                  id: 'behavioral_concerns',
                  type: 'MULTIPLE_CHOICE',
                  question: 'Замеченные поведенческие особенности (если есть):',
                  required: false,
                  options: [
                    'Частые опоздания',
                    'Пропуски занятий',
                    'Сонливость на парах',
                    'Агрессивность',
                    'Замкнутость',
                    'Тревожность',
                    'Эмоциональная нестабильность',
                    'Снижение успеваемости',
                    'Никаких особенностей'
                  ]
                },
                {
                  id: 'positive_changes',
                  type: 'MULTIPLE_CHOICE',
                  question: 'Положительные изменения:',
                  required: false,
                  options: [
                    'Повышение активности',
                    'Улучшение настроения',
                    'Большая социализация',
                    'Рост мотивации',
                    'Улучшение успеваемости',
                    'Никаких изменений'
                  ]
                },
                {
                  id: 'recommendations',
                  type: 'TEXT',
                  question: 'Рекомендации для работы со студентом:',
                  required: false,
                  placeholder: 'Ваши рекомендации...'
                },
                {
                  id: 'psychological_help',
                  type: 'YES_NO',
                  question: 'Считаете ли вы необходимой консультацию психолога для этого студента?',
                  required: true
                }
              ]
            }
          ]
        }
      },
      update: {
        isActive: true
      }
    });

    console.log('✅ Шаблоны для эмоционального анализа созданы:');
    console.log(`- Студенты: ${studentTemplate.name}`);
    console.log(`- Преподаватели: ${teacherTemplate.name}`);

    return { studentTemplate, teacherTemplate };

  } catch (error) {
    console.error('❌ Ошибка создания шаблонов:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем только если файл выполняется напрямую
if (require.main === module) {
  createEmotionalFeedbackTemplate()
    .then(() => {
      console.log('🎉 Миграция завершена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ошибка миграции:', error);
      process.exit(1);
    });
}

export { createEmotionalFeedbackTemplate };
