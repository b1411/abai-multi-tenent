import { Injectable, Logger } from '@nestjs/common';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { scheduleGenerationSchema } from './schemas/schedule-generation.schema';
import { simpleScheduleSchema } from './schemas/simple-schedule.schema';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

/**
 * Чистая минимальная версия AiAssistantService:
 *  - optimizeScheduleDraft (новый AI flow)
 *  - processNeuroAbaiRequest (чат + анализ файлов)
 *  - createEphemeralToken (Realtime API)
 */
@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly algorithmVersion = '2.0.0';

  // ---- Public API ----
  async createEphemeralToken() {
    this.ensureKey();
    const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-realtime-preview-2024-10-01', voice: 'alloy' })
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to create ephemeral token: ${res.status} ${error}`);
    }
    return { client_secret: (await res.json()).client_secret };
  }

  async optimizeScheduleDraft(
    draft: any[],
    context: { startDate: string; endDate: string; workingHours: { start: string; end: string }; maxConsecutiveHours: number; }
  ): Promise<AIScheduleResponseDto> {
    this.ensureKey();
    const systemPrompt = `Ты оптимизатор расписаний. Дан черновик — массив занятий (day,date,startTime,endTime,subject,groupId,teacherId).\nЗАДАЧИ: 1) заполнить roomId, roomType, roomCapacity, groupSize 2) удалить/исправить конфликты teacher/group/room/time 3) заполнить поля conflicts, suggestions, reasoning, confidence, statistics 4) менять время только в пределах ${context.workingHours.start}-${context.workingHours.end}. Макс подряд: ${context.maxConsecutiveHours}. Ответ строго JSON по schema schedule_generation.`;
    const userPrompt = `PERIOD: ${context.startDate} - ${context.endDate}\nDRAFT_JSON:\n${JSON.stringify(draft)}`;
    const ai = await this.postOpenAIResponseWithSchema<AIScheduleResponseDto>({
      instructions: systemPrompt,
      input: userPrompt,
      schemaName: 'schedule_generation',
      schema: scheduleGenerationSchema,
      temperature: 0.25
    });
    ai.generatedAt = new Date().toISOString();
    ai.aiModel = 'gpt-4o-2024-08-06';
    ai.algorithmVersion = this.algorithmVersion;
    return ai;
  }

  async processNeuroAbaiRequest(message: string, scenario: string, files?: Express.Multer.File[]): Promise<string> {
    this.ensureKey();

    if (scenario === 'schedule_generation_v1') {
      // --- Новый пошаговый режим генерации расписания по группам ---
      // Ожидается, что message содержит все данные (teachers, groups, studyPlans, classrooms, constraints, ...)
      // 1. Парсим message, выделяем группы, предметы и прочее
      let parsed: any;
      try {
        parsed = typeof message === 'string' ? JSON.parse(message) : message;
      } catch {
        // если не JSON, fallback к старому prompt
        return this.processNeuroAbaiRequestOld(message, scenario, files);
      }
      const { teachers, groups, studyPlans, classrooms, constraints, ...rest } = parsed;
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return this.processNeuroAbaiRequestOld(message, scenario, files);
      }
      const allLessons: any[] = [];
      const allMissed: any[] = [];
      // Для учёта занятых слотов: { [day_slot]: { teacherIds: Set, classroomIds: Set } }
      const busyMap: Record<string, { teacherIds: Set<number>, classroomIds: Set<number> }> = {};
      for (const group of groups) {
        // Собираем prompt только для этой группы
        const groupPrompt = {
          ...rest,
          teachers,
          groups: [group],
          studyPlans: studyPlans.filter((sp: any) => sp.groupId === group.id),
          classrooms,
          constraints,
          busySlots: Object.entries(busyMap).map(([key, val]) => ({ key, teacherIds: Array.from(val.teacherIds), classroomIds: Array.from(val.classroomIds) }))
        };
        const groupPromptStr = JSON.stringify(groupPrompt);
        const system = `Ты генератор учебного расписания для одной группы. Правила:
1. Возвращай строго JSON по схеме simple_schedule (response_format json_schema). Никакого Markdown.
2. Дни: 1..5 (Пн..Пт). Слоты: 1..8. Пропуски допустимы.
3. Все уроки recurrence=weekly.
4. Используй только перечисленные ID studyPlanId/groupId/teacherId/classroomId. Не придумывай новые.
5. Не дублируй (day,slot) для одинакового studyPlanId. Если несколько учителей — каждой записи один teacherId.
6. Если недостаточно данных — просто меньше lessons.
7. Учитывай занятые слоты (busySlots): не ставь учителей и аудитории, которые уже заняты в указанные day/slot.
8. Если не удаётся поставить предмет (например, из-за конфликтов), обязательно добавь объект в массив missedLessons: { groupId, studyPlanId, reason }.`;
        const aiJson = await this.postOpenAIResponseText({
          instructions: system,
          input: groupPromptStr,
          model: 'gpt-5',
          schemaName: 'simple_schedule',
          schema: simpleScheduleSchema
        });
        let aiObj: any;
        try { aiObj = typeof aiJson === 'string' ? JSON.parse(aiJson) : aiJson; } catch { aiObj = {}; }
        const lessons = Array.isArray(aiObj.lessons) ? aiObj.lessons : [];
        const missed = Array.isArray(aiObj.missedLessons) ? aiObj.missedLessons : [];
        allLessons.push(...lessons);
        allMissed.push(...missed);
        // Обновляем busyMap
        for (const l of lessons) {
          const key = `${l.day}_${l.slot}`;
          if (!busyMap[key]) busyMap[key] = { teacherIds: new Set(), classroomIds: new Set() };
          if (l.teacherId) busyMap[key].teacherIds.add(l.teacherId);
          if (l.classroomId) busyMap[key].classroomIds.add(l.classroomId);
        }
      }
      // Возвращаем общий результат
      return JSON.stringify({ lessons: allLessons, missedLessons: allMissed });
    }
    // ...старый режим...
    return this.processNeuroAbaiRequestOld(message, scenario, files);
  }

  // Старый режим генерации (одним промптом)
  async processNeuroAbaiRequestOld(message: string, scenario: string, files?: Express.Multer.File[]): Promise<string> {
    this.ensureKey();

    if (scenario === 'schedule_generation_v1') {
      const system = `Ты генератор учебного расписания.
Правила:
1. Возвращай строго JSON по схеме simple_schedule (response_format json_schema). Никакого Markdown.
2. Дни: 1..5 (Пн..Пт). Слоты: 1..8. Пропуски допустимы.
3. Все уроки recurrence=weekly.
4. Используй только перечисленные ID studyPlanId/groupId/teacherId/classroomId. Не придумывай новые.
5. Не дублируй (day,slot) для одинакового studyPlanId. Если несколько групп/учителей в промпте — каждой записи один groupId и один teacherId.
6. Если недостаточно данных — просто меньше lessons.
7. Сгенерируй расписание на всю неделю (Пн–Пт) для всех перечисленных групп и всех выбранных предметов. Для каждой группы и каждого предмета построй занятия на всю неделю, равномерно распределяя их по дням и слотам. Не пропускай группы/предметы, если есть возможность их поставить. Заполни максимально возможное количество слотов, чтобы каждая группа получила все свои предметы.
8. Если не удаётся поставить предмет (например, из-за конфликтов или нехватки слотов), обязательно добавь объект в массив missedLessons: { groupId, studyPlanId, reason }. Не пропускай ни одну группу и ни один предмет без явной причины.`;
      // Логируем отправляемый payload для отладки
      console.log('[AI PAYLOAD] SYSTEM PROMPT:', system);
      console.log('[AI PAYLOAD] USER PROMPT:', message);
      const aiJson = await this.postOpenAIResponseText({
        instructions: system,
        input: message,
        model: 'gpt-5',
        schemaName: 'simple_schedule',
        schema: simpleScheduleSchema
      });
      return aiJson;
    }
    const systemPrompt = this.buildNeuroAbaiSystemPrompt();
    let userPrompt = `${scenario}\n\n${message}`;
    if (files?.length) {
      const parts: string[] = [];
      for (const file of files) {
        try {
          const text = await this.extractTextFromFile(file);
          parts.push(`\n\n=== ${file.originalname} ===\n${text || '[не извлечен текст]'}\n=== END ===`);
        } catch (e: any) {
          parts.push(`\n\n=== ${file.originalname} ===\n[Ошибка: ${e.message}]\n=== END ===`);
        }
      }
      userPrompt += `\n\nFILES:${parts.join('')}`;
    }
    return this.postOpenAIResponseText({ instructions: systemPrompt, input: userPrompt });
  }

  // ---- Helpers ----
  private ensureKey() { if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY is not configured'); }

  private buildNeuroAbaiSystemPrompt(): string {
    return `Ты - Neuro Abai, педагогический AI ассистент. Анализируй учебные материалы, улучшай формулировки целей, предлагай конкретные улучшения. Отвечай кратко, профессионально.`;
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string | null> {
    const mime = file.mimetype.toLowerCase();
    const buf = file.buffer;
    if (mime.includes('pdf')) { const pdfData = await pdfParse(buf); return pdfData.text; }
    if (mime.includes('openxmlformats-officedocument.wordprocessingml') || mime.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      const docx = await mammoth.extractRawText({ buffer: buf }); return docx.value;
    }
    if (mime.includes('text/') || mime.includes('application/rtf') || mime.includes('csv') || mime.includes('json') || mime.includes('xml')) return buf.toString('utf-8');
    this.logger.warn(`Unsupported file type: ${mime}`);
    return null;
  }

  private async postOpenAIResponseWithSchema<T>(p: { instructions: string; input: string; schemaName: string; schema: any; temperature?: number; model?: string; }): Promise<T> {
    const { instructions, input, schemaName, schema, temperature = 0.3, model = 'gpt-4o-2024-08-06' } = p;
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature,
        text: {
          format: {
            name: schemaName,
            type: 'json_schema',
            schema,
            strict: true
          }
        }
      })
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();
    const text = this.extractResponsesText(data);
    const clean = this.sanitizeJsonText(text);
    return JSON.parse(clean) as T;
  }

  private async postOpenAIResponseText(p: { instructions: string; input: string; model?: string; schemaName?: string; schema?: any; }): Promise<string> {
    const { instructions, input, model = 'gpt-4o-2024-08-06', schemaName, schema } = p;
    const body: any = { model, instructions, input };
    if (schemaName && schema) {
      body.text = {
        format: {
          name: schemaName,
          type: 'json_schema',
          schema,
          strict: true
        }
      };
    }
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();
    return this.extractResponsesText(data);
  }

  private extractResponsesText(data: any): string {
    if (typeof data?.output_text === 'string') return data.output_text;
    const t2 = data?.output?.[1]?.content?.find((c: any) => c?.type?.includes('text'))?.text; if (typeof t2 === 'string') return t2;
    const t3 = data?.content?.[1]?.text; if (typeof t3 === 'string') return t3;
    const t4 = data?.choices?.[1]?.message?.content; if (typeof t4 === 'string') return t4;
    return JSON.stringify(data);
  }

  private sanitizeJsonText(text: string) { let t = text.trim(); if (t.startsWith('```')) t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, ''); return t.trim(); }
}
