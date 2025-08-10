import { Injectable, Logger, Inject } from '@nestjs/common';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { GenerateLessonsDto } from './dto/generate-lessons.dto';
import { AILessonsResponseDto } from './dto/ai-lessons-response.dto';
import { scheduleGenerationSchema, scheduleAnalysisSchema } from './schemas/schedule-generation.schema';
import { lessonGenerationSchema } from './schemas/lesson-generation.schema';
import { PrismaService } from '../prisma/prisma.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly algorithmVersion = '1.2.0';

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) { }

  async createEphemeralToken() {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-10-01',
          voice: 'alloy',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
        throw new Error(`Failed to create ephemeral token: ${response.status}`);
      }

      const data = await response.json();

      return {
        client_secret: data.client_secret,
      };
    } catch (error) {
      this.logger.error('Error creating ephemeral token:', error);
      throw error;
    }
  }

  async generateScheduleWithAI(params: GenerateScheduleDto): Promise<AIScheduleResponseDto> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      this.logger.log(`Generating schedule for groups: ${params.groupIds.join(', ')}`);

      // Загружаем необходимые данные из базы
      const contextData = await this.loadScheduleContext(params);

      // Создаем промпт для ChatGPT
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(params, contextData);

      const aiResponse = await this.postOpenAIResponseWithSchema<AIScheduleResponseDto>({
        instructions: systemPrompt,
        input: userPrompt,
        schemaName: 'schedule_generation',
        schema: scheduleGenerationSchema,
        temperature: 0.3,
      });

      // Добавляем метаданные
      aiResponse.generatedAt = new Date().toISOString();
      aiResponse.aiModel = 'gpt-4o-2024-08-06';
      aiResponse.algorithmVersion = this.algorithmVersion;

      this.logger.log(`Schedule generated successfully with ${aiResponse.generatedSchedule.length} lessons`);

      return aiResponse;
    } catch (error) {
      this.logger.error('Error generating schedule with AI:', error);
      throw error;
    }
  }

  async generateLessonsWithAI(params: GenerateLessonsDto): Promise<AILessonsResponseDto> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      this.logger.log(`Creating schedule from existing lessons for groups: ${params.groupIds.join(', ')}`);

      // Загружаем существующие уроки из базы данных
      const contextData = await this.loadLessonsContext(params);
      const { existingLessons, classrooms } = contextData;

      if (!existingLessons || existingLessons.length === 0) {
        throw new Error('Не найдено уроков в базе данных для создания расписания');
      }

      // Создаем промпт для AI - теперь он работает с существующими уроками
      const systemPrompt = this.buildScheduleFromLessonsSystemPrompt();
      const userPrompt = this.buildScheduleFromLessonsUserPrompt(params, existingLessons, classrooms);

      const aiResponse = await this.postOpenAIResponseWithSchema<AILessonsResponseDto>({
        instructions: systemPrompt,
        input: userPrompt,
        schemaName: 'lesson_generation',
        schema: lessonGenerationSchema,
        temperature: 0.3,
      });

      // Добавляем метаданные
      aiResponse.generatedAt = new Date().toISOString();
      aiResponse.aiModel = 'gpt-4o-2024-08-06';
      aiResponse.algorithmVersion = this.algorithmVersion;

      this.logger.log(`Schedule created from ${existingLessons.length} existing lessons, generated ${aiResponse.generatedLessons.length} schedule entries`);

      return aiResponse;
    } catch (error) {
      this.logger.error('Error generating schedule from lessons:', error);
      throw error;
    }
  }

  async analyzeScheduleConflicts(scheduleItems: any[]): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const systemPrompt = this.buildAnalysisSystemPrompt();
      const userPrompt = this.buildAnalysisUserPrompt(scheduleItems);

      const aiResponse = await this.postOpenAIResponseWithSchema<any>({
        instructions: systemPrompt,
        input: userPrompt,
        schemaName: 'schedule_analysis',
        schema: scheduleAnalysisSchema,
        temperature: 0.2,
      });
      return aiResponse;
    } catch (error) {
      this.logger.error('Error analyzing schedule conflicts:', error);
      throw error;
    }
  }

  private async loadScheduleContext(params: GenerateScheduleDto) {
    // Загружаем группы
    const groups = await this.prisma.group.findMany({
      where: { id: { in: params.groupIds } },
      include: {
        students: true,
        _count: { select: { students: true } }
      }
    });

    // Загружаем преподавателей
    const teachers = params.teacherIds ?
      await this.prisma.user.findMany({
        where: {
          id: { in: params.teacherIds },
          role: 'TEACHER'
        }
      }) :
      await this.prisma.user.findMany({
        where: { role: 'TEACHER' }
      });

    // Загружаем аудитории
    const classrooms = await this.prisma.classroom.findMany({
      where: { deletedAt: null }
    });

    // Загружаем предметы/учебные планы
    const studyPlans = params.subjectIds ?
      await this.prisma.studyPlan.findMany({
        where: {
          id: { in: params.subjectIds },
          deletedAt: null
        }
      }) :
      await this.prisma.studyPlan.findMany({
        where: { deletedAt: null }
      });

    // Загружаем существующее расписание для анализа конфликтов
    const existingSchedule = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        // Фильтруем по диапазону дат через dayOfWeek или другие поля
        // так как в схеме Schedule нет поля date
      },
      include: {
        group: true,
        teacher: true,
        classroom: true,
        studyPlan: true
      }
    });

    return {
      groups,
      teachers,
      classrooms,
      studyPlans,
      existingSchedule
    };
  }

  private buildSystemPrompt(): string {
    return `Ты эксперт по составлению расписаний для образовательных учреждений. Твоя задача - создавать оптимальные расписания занятий с учетом специфики аудиторий.

ПРИНЦИПЫ СОСТАВЛЕНИЯ РАСПИСАНИЯ:

1. ПРИОРИТЕТЫ:
   - Избегать окон в расписании студентов
   - Равномерно распределять нагрузку преподавателей  
   - Оптимально использовать аудитории с учетом их типа
   - Соблюдать академические нормы

2. ОГРАНИЧЕНИЯ:
   - Один преподаватель не может вести два занятия одновременно
   - Одна аудитория не может быть занята двумя группами одновременно
   - Группа не может иметь два занятия одновременно
   - Учитывать вместимость аудиторий и размер групп
   - ОБЯЗАТЕЛЬНО учитывать соответствие типа аудитории типу занятия

3. ТИПЫ АУДИТОРИЙ И ИХ ИСПОЛЬЗОВАНИЕ:
   - LECTURE_HALL (лекционный зал): для лекций, больших групп, теоретических занятий
   - LABORATORY (лаборатория): для практических работ, экспериментов, лабораторных занятий
   - COMPUTER_LAB (компьютерный класс): для IT-дисциплин, программирования, работы с ПО
   - SEMINAR_ROOM (семинарская): для семинаров, дискуссий, небольших групп
   - CONFERENCE_ROOM (конференц-зал): для презентаций, защит, торжественных мероприятий
   - WORKSHOP (мастерская): для технических дисциплин, ручного труда
   - GYMNASIUM (спортзал): для физкультуры, спортивных занятий
   - AUDITORIUM (аудитория): универсальная аудитория для различных типов занятий

4. ПРАВИЛА ПОДБОРА АУДИТОРИЙ:
   - Лекции по теоретическим предметам → LECTURE_HALL или AUDITORIUM
   - Практические работы по естественным наукам → LABORATORY
   - Занятия по информатике/программированию → COMPUTER_LAB
   - Семинары и дискуссии → SEMINAR_ROOM или AUDITORIUM (если группа большая)
   - Физкультура → GYMNASIUM
   - Технические дисциплины с практикой → WORKSHOP
   - Если специализированная аудитория недоступна, выбирать AUDITORIUM

5. РЕКОМЕНДАЦИИ:
   - Лекции лучше проводить в первой половине дня
   - Практические занятия - во второй половине
   - Минимум 10 минут между занятиями для переходов
   - Обеденный перерыв 12:00-13:00
   - Приоритет специализированным аудиториям для соответствующих предметов

6. КАЧЕСТВО:
   - Анализируй каждое решение на предмет конфликтов
   - Предлагай альтернативы для проблемных слотов
   - Объясняй логику размещения занятий И выбора аудиторий
   - Отмечай случаи неоптимального использования аудиторий

ВСЕГДА отвечай в строгом соответствии с JSON Schema. Будь точным и конкретным в рекомендациях, особенно в части выбора аудиторий.`;
  }

  private buildUserPrompt(params: GenerateScheduleDto, contextData: any): string {
    const { groups, teachers, classrooms, studyPlans, existingSchedule } = contextData;

    return `Сгенерируй расписание со следующими параметрами:

ПЕРИОД: ${params.startDate} - ${params.endDate}
ТИП ГЕНЕРАЦИИ: ${params.generationType}

РАБОЧИЕ ЧАСЫ: ${params.constraints.workingHours.start} - ${params.constraints.workingHours.end}
МАКСИМУМ ЗАНЯТИЙ ПОДРЯД: ${params.constraints.maxConsecutiveHours}
ОБЕДЕННЫЕ ПЕРЕРЫВЫ: ${params.constraints.preferredBreaks?.join(', ') || 'Не указаны'}

ГРУППЫ (${groups.length}):
${groups.map(g => `- ${g.name} (${g._count.students} студентов)`).join('\n')}

ПРЕПОДАВАТЕЛИ (${teachers.length}):
${teachers.map(t => `- ${t.name} ${t.surname} (ID: ${t.id})`).join('\n')}

АУДИТОРИИ (${classrooms.length}):
${classrooms.map(c => `- ${c.name} (вместимость: ${c.capacity}, тип: ${c.type})`).join('\n')}

ПРЕДМЕТЫ (${studyPlans.length}):
${studyPlans.map(sp => `- ${sp.name} (${sp.hoursPerWeek || 'не указано'} ч/нед)`).join('\n')}

СУЩЕСТВУЮЩИЕ ЗАНЯТИЯ: ${existingSchedule.length}

${params.additionalInstructions ? `ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ: ${params.additionalInstructions}` : ''}

Создай оптимальное расписание, учитывая все ограничения и существующие занятия. Обнаружь потенциальные конфликты и предложи решения.

ВАЖНО: Для каждого занятия обязательно укажи:
- date: конкретную дату в формате YYYY-MM-DD
- roomType: тип аудитории из доступных вариантов
- roomCapacity: вместимость выбранной аудитории
- groupSize: количество студентов в группе

Убедись, что все поля присутствуют в ответе для каждого сгенерированного занятия.`;
  }

  private buildAnalysisSystemPrompt(): string {
    return `Ты эксперт-аналитик расписаний образовательных учреждений. Анализируй существующие расписания на предмет эффективности, конфликтов и возможностей для улучшения.

КРИТЕРИИ АНАЛИЗА:
1. Конфликты ресурсов (преподаватели, аудитории, группы)
2. Эффективность использования времени и пространства
3. Качество распределения нагрузки
4. Удовлетворенность участников процесса
5. Соответствие академическим стандартам

ОЦЕНКИ (0-100):
- Общий балл: комплексная оценка расписания
- Эффективность: использование ресурсов
- Удовлетворенность преподавателей: удобство для преподавателей
- Удовлетворенность студентов: удобство для студентов
- Использование ресурсов: загрузка аудиторий и оборудования

Предоставляй конкретные, действенные рекомендации с количественными оценками.`;
  }

  private buildAnalysisUserPrompt(scheduleItems: any[]): string {
    return `Проанализируй следующее расписание:

ОБЩАЯ ИНФОРМАЦИЯ:
- Количество занятий: ${scheduleItems.length}
- Уникальные преподаватели: ${new Set(scheduleItems.map(s => s.teacherId)).size}
- Уникальные аудитории: ${new Set(scheduleItems.map(s => s.roomId)).size}
- Уникальные группы: ${new Set(scheduleItems.map(s => s.groupId)).size}

РАСПИСАНИЕ:
${scheduleItems.map((item, index) =>
      `${index + 1}. ${item.day} ${item.startTime}-${item.endTime}: ${item.subject} (${item.groupId}) - ${item.teacherName} в ${item.roomId}`
    ).join('\n')}

Проведи детальный анализ и выдай рекомендации по улучшению.`;
  }

  async processNeuroAbaiRequest(message: string, scenario: string, files?: Express.Multer.File[]): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      this.logger.log(`Processing Neuro Abai request: scenario="${scenario}"`);

      // Создаем системный промпт для Neuro Abai
      const systemPrompt = this.buildNeuroAbaiSystemPrompt();

      // Создаем пользовательский промпт
      let userPrompt = `${scenario}\n\n${message}`;

      // Если есть файлы, извлекаем из них текст
      if (files && files.length > 0) {
        this.logger.log(`Processing ${files.length} files`);

        const fileContents: string[] = [];

        for (const file of files) {
          try {
            const extractedText = await this.extractTextFromFile(file);
            if (extractedText) {
              fileContents.push(`\n\n=== СОДЕРЖИМОЕ ФАЙЛА: ${file.originalname} ===\n${extractedText}\n=== КОНЕЦ ФАЙЛА ===\n`);
            } else {
              fileContents.push(`\n\n=== ФАЙЛ: ${file.originalname} ===\n[Не удалось извлечь текст из файла типа ${file.mimetype}]\n=== КОНЕЦ ФАЙЛА ===\n`);
            }
          } catch (error) {
            this.logger.error(`Error processing file ${file.originalname}:`, error);
            fileContents.push(`\n\n=== ФАЙЛ: ${file.originalname} ===\n[Ошибка при обработке файла: ${error.message}]\n=== КОНЕЦ ФАЙЛА ===\n`);
          }
        }

        if (fileContents.length > 0) {
          userPrompt += `\n\nПРИКРЕПЛЕННЫЕ ФАЙЛЫ:${fileContents.join('')}`;
        }
      }

      const aiResponseText = await this.postOpenAIResponseText({
        instructions: systemPrompt,
        input: userPrompt,
        temperature: 0.7,
        model: 'gpt-4o-2024-08-06',
      });

      if (!aiResponseText) {
        throw new Error('No response from AI');
      }

      this.logger.log('Neuro Abai request processed successfully');
      return aiResponseText;

    } catch (error) {
      this.logger.error('Error processing Neuro Abai request:', error);
      throw error;
    }
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string | null> {
    try {
      const mimeType = file.mimetype.toLowerCase();
      const buffer = file.buffer;

      this.logger.log(`Extracting text from file: ${file.originalname} (${mimeType})`);

      switch (true) {
        // PDF файлы
        case mimeType.includes('pdf'): {
          const pdfData = await pdfParse(buffer);
          return pdfData.text;
        }

        // Word документы (.docx)
        case mimeType.includes('openxmlformats-officedocument.wordprocessingml'):
        case mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document'): {
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value;
        }

        // Текстовые файлы
        case mimeType.includes('text/'):
        case mimeType.includes('application/rtf'):
          return buffer.toString('utf-8');

        // CSV файлы
        case mimeType.includes('csv'):
        case mimeType.includes('text/csv'):
          return buffer.toString('utf-8');

        // JSON файлы
        case mimeType.includes('json'):
          return buffer.toString('utf-8');

        // XML файлы
        case mimeType.includes('xml'):
          return buffer.toString('utf-8');

        default:
          this.logger.warn(`Unsupported file type: ${mimeType}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Error extracting text from file ${file.originalname}:`, error);
      throw error;
    }
  }

  private async loadLessonsContext(params: GenerateLessonsDto) {
    // Загружаем группы
    const groups = await this.prisma.group.findMany({
      where: { id: { in: params.groupIds } },
      include: {
        students: true,
        _count: { select: { students: true } }
      }
    });

    // Загружаем преподавателей
    const teachers = params.teacherIds ?
      await this.prisma.user.findMany({
        where: {
          id: { in: params.teacherIds },
          role: 'TEACHER'
        },
        include: {
          teacher: true
        }
      }) :
      await this.prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: {
          teacher: true
        }
      });

    // Загружаем аудитории
    const classrooms = await this.prisma.classroom.findMany({
      where: { deletedAt: null }
    });

    // Загружаем предметы/учебные планы
    const studyPlans = params.subjectIds ?
      await this.prisma.studyPlan.findMany({
        where: {
          id: { in: params.subjectIds },
          deletedAt: null
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      }) :
      await this.prisma.studyPlan.findMany({
        where: { deletedAt: null },
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      });

    // Загружаем существующие уроки в указанном периоде
    const whereClause: any = {
      deletedAt: null,
      date: {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate)
      }
    };

    // Если указаны группы или предметы, добавляем фильтр через studyPlan
    if (params.groupIds && params.groupIds.length > 0) {
      whereClause.studyPlan = {
        group: {
          some: {
            id: { in: params.groupIds }
          }
        }
      };
    }

    if (params.subjectIds && params.subjectIds.length > 0) {
      whereClause.studyPlan = {
        ...whereClause.studyPlan,
        id: { in: params.subjectIds }
      };
    }

    if (params.teacherIds && params.teacherIds.length > 0) {
      whereClause.studyPlan = {
        ...whereClause.studyPlan,
        teacherId: { in: params.teacherIds }
      };
    }

    const existingLessons = await this.prisma.lesson.findMany({
      where: whereClause,
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            group: true
          }
        }
      }
    });

    // Загружаем календарные события (каникулы, праздники)
    const excludeDates = params.excludeDates || [];
    const calendarEvents = await this.prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: new Date(params.startDate),
          lte: new Date(params.endDate)
        },
        title: {
          contains: 'каникулы',
          mode: 'insensitive'
        }
      }
    });

    return {
      groups,
      teachers,
      classrooms,
      studyPlans,
      existingLessons,
      calendarEvents,
      excludeDates
    };
  }

  private buildLessonsSystemPrompt(): string {
    return `Ты эксперт по составлению календарно-тематического планирования для образовательных учреждений. Твоя задача - создавать последовательные уроки с конкретными датами, учитывая педагогическую логику и академический календарь.

ПРИНЦИПЫ ПЛАНИРОВАНИЯ УРОКОВ:

1. КАЛЕНДАРНОЕ ПЛАНИРОВАНИЕ:
   - Генерируй уроки с конкретными датами (не дни недели)
   - Учитывай каникулы, праздники и выходные дни
   - Соблюдай академическую последовательность тем
   - Планируй равномерную нагрузку по неделям

2. ПЕДАГОГИЧЕСКИЕ ПРИНЦИПЫ:
   - Логическая последовательность изучения материала
   - От простого к сложному в рамках каждой темы
   - Повторение и закрепление предыдущих тем
   - Межпредметные связи где это уместно

3. СТРУКТУРА УРОКОВ:
   - Каждый урок имеет четкую цель и тему
   - Прогрессивное увеличение сложности
   - Практические и теоретические занятия в балансе
   - Контрольные и проверочные работы по расписанию

4. МАТЕРИАЛЫ И ДОМАШНИЕ ЗАДАНИЯ:
   - Создавай базовые материалы для каждого урока
   - Планируй домашние задания с реалистичными сроками
   - Учитывай время на выполнение (не перегружай студентов)
   - Связывай домашние задания с текущей темой

5. РЕСУРСЫ И АУДИТОРИИ:
   - Подбирай аудитории в соответствии с типом урока
   - Учитывай специальное оборудование для практических работ
   - Планируй использование лабораторий и компьютерных классов
   - Избегай конфликтов расписания

6. АНАЛИЗ И ОПТИМИЗАЦИЯ:
   - Проверяй равномерность распределения нагрузки
   - Выявляй потенциальные конфликты ресурсов
   - Предлагай альтернативы при проблемах
   - Давай рекомендации по улучшению планирования

ВАЖНО: Создавай РЕАЛЬНЫЙ учебный план с конкретными датами, темами уроков и логической прогрессией изучения материала.`;
  }

  private buildLessonsUserPrompt(params: GenerateLessonsDto, contextData: any): string {
    const { groups, teachers, classrooms, studyPlans, existingLessons, excludeDates } = contextData;

    // Вычисляем рабочие дни в периоде
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const workingDaysCount = this.calculateWorkingDays(
      startDate,
      endDate,
      Array.isArray(excludeDates) ? excludeDates.map((d: any) => String(d)) : []
    );

    return `Сгенерируй календарно-тематическое планирование уроков со следующими параметрами:

УЧЕБНЫЙ ПЕРИОД:
- Начало: ${params.startDate}
- Окончание: ${params.endDate}
- Учебный год: ${params.academicYear}
- Семестр: ${params.semester}
- Рабочих дней в периоде: ${workingDaysCount}

ВРЕМЕННЫЕ ПАРАМЕТРЫ:
- Длительность урока: ${params.lessonDuration || 45} минут
- Рабочие часы: ${params.constraints?.workingHours?.start || '08:00'} - ${params.constraints?.workingHours?.end || '18:00'}
- Максимум уроков подряд: ${params.constraints?.maxConsecutiveHours || 6}

ГРУППЫ (${groups.length}):
${groups.map(g => `- ${g.name} (${g._count.students} студентов, курс ${g.courseNumber})`).join('\n')}

ПРЕПОДАВАТЕЛИ (${teachers.length}):
${teachers.map(t => `- ${t.name} ${t.surname} (ID: ${t.id})`).join('\n')}

ПРЕДМЕТЫ И НАГРУЗКА:
${studyPlans.map(sp => {
      const weeklyHours = params.weeklyHoursPerSubject?.[sp.id] || 2;
      const totalHours = Math.ceil(weeklyHours * (workingDaysCount / 5));
      return `- ${sp.name} (${weeklyHours} ч/нед, ~${totalHours} уроков за период) - ${sp.teacher.user.name} ${sp.teacher.user.surname}`;
    }).join('\n')}

АУДИТОРИИ (${classrooms.length}):
${classrooms.map(c => `- ${c.name} (${c.capacity} мест, тип: ${c.type})`).join('\n')}

ИСКЛЮЧЕННЫЕ ДАТЫ (каникулы/праздники):
${excludeDates.length > 0 ? excludeDates.join(', ') : 'Не указаны'}

СУЩЕСТВУЮЩИЕ УРОКИ: ${existingLessons.length}

ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Создавать только календарно-тематическое планирование уроков

${params.additionalInstructions ? `ОСОБЫЕ ИНСТРУКЦИИ: ${params.additionalInstructions}` : ''}

ЗАДАЧА:
Создай последовательное календарно-тематическое планирование с:
1. Конкретными датами для каждого урока
2. Логической прогрессией тем по каждому предмету
3. Правильным распределением нагрузки
4. Учетом каникул и праздников
5. Оптимальным использованием аудиторий

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ для каждого урока:
- name: Название урока (строка)
- date: Дата урока в формате YYYY-MM-DD
- startTime: Время начала в формате HH:MM (например: "09:00")
- endTime: Время окончания в формате HH:MM (например: "10:30")
- studyPlanId: ID учебного плана (число из списка выше)
- studyPlanName: Название предмета (строка)
- groupId: ID группы (число из списка выше)
- groupName: Название группы (строка)
- teacherId: ID преподавателя (число из списка выше)
- teacherName: Имя преподавателя (строка)
- classroomId: ID аудитории (число из списка выше)
- classroomName: Название аудитории (строка)
- description: Описание урока/темы (строка)
- lessonNumber: Порядковый номер урока (число, начиная с 1)
- topicNumber: Номер темы в курсе (число, начиная с 1)
- difficulty: Уровень сложности ("beginner", "intermediate" или "advanced")

ВАЖНО: ВСЕ поля обязательны и должны быть заполнены для каждого урока!`;
  }

  private calculateWorkingDays(startDate: Date, endDate: Date, excludeDates: string[]): number {
    let workingDays = 0;
    const current = new Date(startDate);
    const excludeSet = new Set(excludeDates);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];

      // Понедельник-пятница (1-5) и не в списке исключений
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !excludeSet.has(dateString)) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  private buildScheduleFromLessonsSystemPrompt(): string {
    return `Ты эксперт по составлению расписаний из существующих уроков. Твоя задача - взять существующие уроки из базы данных и создать для них оптимальное расписание с временем и аудиториями.

ПРИНЦИПЫ:
1. НЕ СОЗДАВАЙ новые уроки - используй ТОЛЬКО существующие из БД
2. Каждому уроку назначь оптимальное время и аудиторию
3. Избегай конфликтов преподавателей, групп и аудиторий
4. Учитывай тип аудитории и предмет
5. Соблюдай рабочие часы и перерывы

ЗАДАЧА: Создать расписание, назначив каждому существующему уроку:
- Конкретную дату (из даты урока в БД)
- Время начала и окончания
- Подходящую аудиторию

ВАЖНО: Используй данные урока из БД (ID, название, дату, предмет, группу, преподавателя) и добавь только время и аудиторию!`;
  }

  private buildScheduleFromLessonsUserPrompt(params: GenerateLessonsDto, existingLessons: any[], classrooms: any[]): string {
    return `Создай расписание для следующих СУЩЕСТВУЮЩИХ уроков из базы данных:

ПЕРИОД: ${params.startDate} - ${params.endDate}
РАБОЧИЕ ЧАСЫ: ${params.constraints?.workingHours?.start || '08:00'} - ${params.constraints?.workingHours?.end || '18:00'}

СУЩЕСТВУЮЩИЕ УРОКИ ИЗ БД:
${existingLessons.map(lesson => `
- ID: ${lesson.id}
- Название: ${lesson.name}
- Дата: ${lesson.date.toISOString().split('T')[0]}
- Предмет: ${lesson.studyPlan.name} (ID: ${lesson.studyPlan.id})
- Группа: ${lesson.studyPlan.group.name} (ID: ${lesson.studyPlan.group.id})
- Преподаватель: ${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname} (ID: ${lesson.studyPlan.teacher.id})
`).join('')}

ДОСТУПНЫЕ АУДИТОРИИ:
${classrooms.map(room => `
- ID: ${room.id}, Название: ${room.name}, Тип: ${room.type}, Вместимость: ${room.capacity}
`).join('')}

ЗАДАЧА: Для каждого урока из списка выше создай запись в generatedLessons с:
- name: название урока (из БД)
- date: дата урока (из БД)
- startTime: время начала (назначь оптимальное)
- endTime: время окончания (назначь оптимальное)
- studyPlanId: ID учебного плана (из БД)
- studyPlanName: название предмета (из БД)
- groupId: ID группы (из БД)
- groupName: название группы (из БД)
- teacherId: ID преподавателя (из БД)
- teacherName: имя преподавателя (из БД)
- classroomId: ID аудитории (подбери подходящую)
- classroomName: название аудитории (подбери подходящую)
- description: описание урока (из БД)
- lessonNumber: порядковый номер
- topicNumber: номер темы
- difficulty: уровень сложности

НЕ ПРИДУМЫВАЙ новые уроки! Используй ТОЛЬКО те, что указаны в списке выше.`;
  }

  private buildNeuroAbaiSystemPrompt(): string {
    return `Ты - Neuro Abai, интеллектуальный помощник для учителей образовательной платформы Fizmat AI. 

ТВОЯ РОЛЬ:
Ты специализируешься на помощи учителям в образовательном процессе, особенно в области физики и математики.

ТВОИ ОСНОВНЫЕ ФУНКЦИИ:
1. Анализ КТП (Календарно-тематическое планирование)
2. Улучшение и переписывание целей уроков
3. Оптимизация учебных заданий и упражнений
4. Создание СОР/СОЧ (Суммативное оценивание за раздел/четверть)
5. Проверка ошибок в документах и материалах
6. Анализ загруженных файлов и документов

ПРИНЦИПЫ РАБОТЫ:
- Отвечай на русском языке
- Будь конструктивным и полезным
- Предлагай конкретные улучшения
- Учитывай современные педагогические подходы
- Адаптируй ответы под образовательные стандарты Казахстана
- Будь краток, но информативен

СТИЛЬ ОБЩЕНИЯ:
- Профессиональный, но дружелюбный
- Поддерживающий и мотивирующий
- Конкретный и практичный
- Ориентированный на результат

Помогай учителям улучшать качество образовательного процесса!`;
  }

  async getCompletion(systemPrompt: string, userPrompt: string): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

  return this.postOpenAIResponseJsonObject(systemPrompt, userPrompt, 0.3);
  }

  generateStudyPlanPrompt(studyPlans: any[], classrooms: any[], existingSchedules: any[], startDate: string, endDate: string, constraints: any) {
    const systemPrompt = `Ты — эксперт по составлению расписаний для учебных заведений. Твоя задача — создать оптимальное расписание на основе учебных планов, распределив часы по указанному периоду.

ПРИНЦИПЫ:
1.  **Равномерное распределение**: Распределяй часы по учебным планам равномерно в течение недели и всего периода.
2.  **Избегание конфликтов**: Не допускай одновременного нахождения одного преподавателя, группы или аудитории в разных местах.
3.  **Оптимизация аудиторий**: Используй аудитории в соответствии с их типом и вместимостью.
4.  **Соблюдение ограничений**: Учитывай рабочие часы, перерывы и лимиты на количество уроков в день.

ФОРМАТ ОТВЕТА:
Всегда отвечай в формате JSON.
{
  "schedules": [
    {
      "studyPlanId": number,
      "groupId": number,
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "classroomId": number,
      "reasoning": "Краткое объяснение выбора времени и аудитории."
    }
  ],
  "conflicts": ["Список потенциальных конфликтов, которые не удалось разрешить."],
  "recommendations": ["Рекомендации по улучшению расписания."]
}`;

    const userPrompt = `Сгенерируй расписание на основе следующих данных:

ПЕРИОД: с ${startDate} по ${endDate}

ОГРАНИЧЕНИЯ:
- Рабочие часы: с ${constraints?.workingHours?.start || '08:00'} до ${constraints?.workingHours?.end || '18:00'}
- Максимум уроков в день: ${constraints?.lessonsPerDayLimit || 5}
- Максимум уроков подряд: ${constraints?.maxConsecutiveHours || 3}

УЧЕБНЫЕ ПЛАНЫ:
${studyPlans.map(sp => `- ID: ${sp.id}, Название: ${sp.name}, Часы: ${sp.normativeWorkload || 68} в год, Преподаватель: ${sp.teacher.user.name} ${sp.teacher.user.surname} (ID: ${sp.teacherId}), Группа: ${sp.group.map(g => `${g.name} (ID: ${g.id})`).join(', ')}`).join('\n')}

ДОСТУПНЫЕ АУДИТОРИИ:
${classrooms.map(c => `- ID: ${c.id}, Название: ${c.name}, Тип: ${c.type}, Вместимость: ${c.capacity}`).join('\n')}

СУЩЕСТВУЮЩИЕ РАСПИСАНИЯ (для избежания конфликтов):
${existingSchedules.map(s => `- Дата: ${s.date?.toISOString().split('T')[0]}, Время: ${s.startTime}-${s.endTime}, Преподаватель ID: ${s.teacherId}, Аудитория ID: ${s.classroomId}, Группа ID: ${s.groupId}`).join('\n')}

ЗАДАЧА:
Распредели годовые часы по учебным планам на указанный период, создав конкретные занятия в расписании.`;

    return { system: systemPrompt, user: userPrompt };
  }

  // --- OpenAI Responses API helpers ---
  private async postOpenAIResponseWithSchema<T>(params: {
    instructions: string;
    input: string;
    schemaName: string;
    schema: any;
    temperature?: number;
    model?: string;
  }): Promise<T> {
    const {
      instructions,
      input,
      schemaName,
      schema,
      temperature = 0.3,
      model = 'gpt-4o-2024-08-06',
    } = params;

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: schemaName,
            schema,
            strict: true,
          },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`OpenAI Responses API error: ${res.status} - ${error}`);
      throw new Error(`Failed OpenAI responses request: ${res.status}`);
    }

    const data = await res.json();
    const text = this.extractResponsesText(data);
    try {
      const clean = this.sanitizeJsonText(text);
      return JSON.parse(clean) as T;
    } catch (e) {
      this.logger.error('Failed to parse JSON from OpenAI Responses output', e);
      this.logger.debug('Raw output:', text);
      throw e;
    }
  }

  private async postOpenAIResponseJsonObject(instructions: string, input: string, temperature = 0.3, model = 'gpt-4o-2024-08-06') {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`OpenAI Responses API error: ${res.status} - ${error}`);
      throw new Error(`Failed OpenAI responses request: ${res.status}`);
    }

  const data = await res.json();
  const text = this.extractResponsesText(data);
  const clean = this.sanitizeJsonText(text);
  return JSON.parse(clean);
  }

  private extractResponsesText(data: any): string {
    // Try several shapes as the Responses API evolves
    // 1) SDK-like field
    if (typeof data?.output_text === 'string') return data.output_text;
    // 2) HTTP shape: output[0].content[0].text
    const text2 = data?.output?.[0]?.content?.find((c: any) => c?.type?.includes('text'))?.text;
    if (typeof text2 === 'string') return text2;
    // 3) message-like shape: content[0].text
    const text3 = data?.content?.[0]?.text;
    if (typeof text3 === 'string') return text3;
    // 4) Fallback to choices for backward compatibility
    const text4 = data?.choices?.[0]?.message?.content;
    if (typeof text4 === 'string') return text4;
    // 5) Last resort: stringify
    this.logger.warn('Unknown OpenAI Responses payload shape, falling back to JSON string');
    return JSON.stringify(data);
  }

  private sanitizeJsonText(text: string): string {
    let t = text.trim();
    if (t.startsWith('```')) {
      // remove leading ```json or ```
      t = t.replace(/^```[a-zA-Z]*\n?/, '');
      // remove trailing ```
      t = t.replace(/```\s*$/, '');
    }
    // Occasionally models wrap JSON in stray backticks or whitespace
    t = t.trim();
    return t;
  }

  private async postOpenAIResponseText(params: {
    instructions: string;
    input: string;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    const { instructions, input, temperature = 0.7, model = 'gpt-4o-2024-08-06' } = params;
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature,
        // no response_format -> plain text completion
      }),
    });
    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`OpenAI Responses API error: ${res.status} - ${error}`);
      throw new Error(`Failed OpenAI responses request: ${res.status}`);
    }
    const data = await res.json();
    return this.extractResponsesText(data);
  }
}
