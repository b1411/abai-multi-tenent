import { Injectable, Logger, Inject } from '@nestjs/common';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { scheduleGenerationSchema, scheduleAnalysisSchema } from './schemas/schedule-generation.schema';
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
  ) {}

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'schedule_generation',
              schema: scheduleGenerationSchema,
              strict: true
            }
          },
          temperature: 0.3, // Низкая температура для более предсказуемых результатов
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
        throw new Error(`Failed to generate schedule: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);

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

  async analyzeScheduleConflicts(scheduleItems: any[]): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const systemPrompt = this.buildAnalysisSystemPrompt();
      const userPrompt = this.buildAnalysisUserPrompt(scheduleItems);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'schedule_analysis',
              schema: scheduleAnalysisSchema,
              strict: true
            }
          },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
        throw new Error(`Failed to analyze schedule: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 3000
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
        throw new Error(`Failed to process request: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      this.logger.log('Neuro Abai request processed successfully');
      return aiResponse;

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
}
