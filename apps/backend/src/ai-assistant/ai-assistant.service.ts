import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { scheduleGenerationSchema } from './schemas/schedule-generation.schema';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';

export interface KtpImportedStructure {
  courseName: string;
  description?: string;
  sections?: {
    title?: string;
    description?: string;
    lessons?: {
      title?: string;
      description?: string;
      duration?: number;
      week?: number;
      date?: string;
      objectives?: string[];
      methods?: string[];
      homework?: string | null;
      materials?: string[];
    }[];
  }[];
}

/**
 * Чистая минимальная версия AiAssistantService:
 *  - optimizeScheduleDraft (новый AI flow)
 *  - processNeuroAbaiRequest (чат + анализ файлов)
 *  - createEphemeralToken (Realtime API)
 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema?: any;
  requiredRoles?: string[]; // empty or undefined = available to all authenticated users
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly algorithmVersion = '2.0.0';

  constructor(private prisma: PrismaService) { }

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
    return this.postOpenAIResponseText({ instructions: systemPrompt, input: userPrompt, temperature: 0.7 });
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
      body: JSON.stringify({ model, instructions, input, temperature, text: { format: { type: 'json_schema', name: schemaName, schema, strict: true } } })
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();
    const text = this.extractResponsesText(data);
    const clean = this.sanitizeJsonText(text);
    return JSON.parse(clean) as T;
  }

  private async postOpenAIResponseText(p: { instructions: string; input: string; temperature?: number; model?: string; }): Promise<string> {
    const { instructions, input, temperature = 0.7, model = 'gpt-4o-2024-08-06' } = p;
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, instructions, input, temperature })
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err}`); }
    const data = await res.json();
    return this.extractResponsesText(data);
  }

  private extractResponsesText(data: any): string {
    if (typeof data?.output_text === 'string') return data.output_text;
    const t2 = data?.output?.[0]?.content?.find((c: any) => c?.type?.includes('text'))?.text; if (typeof t2 === 'string') return t2;
    const t3 = data?.content?.[0]?.text; if (typeof t3 === 'string') return t3;
    const t4 = data?.choices?.[0]?.message?.content; if (typeof t4 === 'string') return t4;
    return JSON.stringify(data);
  }

  /**
   * Парсинг КТП с жёстким json_schema (structured output) чтобы исключить "рассказочный" ответ.
   */
  async parseKtpRawText(raw: string): Promise<KtpImportedStructure> {
    this.ensureKey();

    // JSON Schema для строгого ответа
    const ktpImportJsonSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['courseName', 'description', 'sections'],
      properties: {
        courseName: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'description', 'lessons'],
            properties: {
              title: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['title', 'description', 'duration', 'week', 'date', 'objectives', 'methods', 'homework', 'materials'],
                  properties: {
                    title: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    duration: { type: 'number' },
                    week: { type: 'number' },
                    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                    objectives: { type: 'array', items: { type: 'string' } },
                    methods: { type: 'array', items: { type: 'string' } },
                    homework: { type: 'string' },
                    materials: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      }
    };

    const systemPrompt = 'Ты извлекаешь структуру КТП. Возвращай СТРОГО JSON соответствующий заданной json_schema. Никакого текста вне JSON.';
    const userPrompt = `ТЕКСТ КТП (усечён до 45k симв):\n${raw.substring(0, 45000)}`;

    // Строгое структурированное получение
    const structured = await this.postOpenAIResponseWithSchema<KtpImportedStructure>({
      instructions: systemPrompt,
      input: userPrompt,
      schemaName: 'ktp_import',
      schema: ktpImportJsonSchema,
      temperature: 0
    });

    // Нормализация и защитные правки
    if (!structured.courseName) structured.courseName = 'Imported Plan';
    if (!Array.isArray(structured.sections)) structured.sections = [];

    structured.sections.forEach((s) => {
      if (!Array.isArray(s.lessons)) s.lessons = [];
      s.lessons.forEach((l, idx) => {
        if (!l.duration || l.duration <= 0) l.duration = 2;
        if (!l.week || l.week <= 0) l.week = Math.floor(idx / 2) + 1;
        // Валидация даты (если модель напутала формат — убираем)
        if (l.date && !/^\d{4}-\d{2}-\d{2}$/.test(l.date)) {
          l.date = undefined;
        }
      });
    });

    return structured;
  }

  async generateKtpSuggestion(curriculumPlanId: number, authorId: number, message?: string, files?: Express.Multer.File[]) {
    const plan = await this.prisma.curriculumPlan.findUnique({ where: { id: curriculumPlanId } });
    if (!plan) throw new NotFoundException('CurriculumPlan not found');
    const context = `CurriculumPlan: ${JSON.stringify({ totalLessons: plan.totalLessons, plannedLessons: plan.plannedLessons }).substring(0, 20000)}`;
    const aiMessage = message ? `${message}\n\n${context}` : context;

    let suggestionText: string;
    try {
      suggestionText = await this.processNeuroAbaiRequest(aiMessage, 'generate_ktp_suggestion', files);
    } catch (e) {
      this.logger.error('AI generation failed', e);
      throw new BadRequestException('Failed to generate suggestion from AI');
    }

    const created = await this.prisma.aiSuggestion.create({
      data: {
        curriculumPlanId,
        authorId,
        suggestion: suggestionText,
        metadata: { promptScenario: 'generate_ktp_suggestion' }
      }
    });
    await this.prisma.aiSuggestionAudit.create({
      data: { suggestionId: created.id, action: 'CREATED', performedBy: authorId, data: { suggestion: created } }
    });
    return created;
  }

  async getSuggestionWithAudit(id: number) {
    const s = await this.prisma.aiSuggestion.findUnique({ where: { id }, include: { auditLogs: true, author: true, appliedByUser: true, curriculumPlan: true } });
    if (!s) throw new NotFoundException('Suggestion not found');
    return s;
  }

  async applySuggestion(id: number, performedBy: number) {
    const suggestion = await this.prisma.aiSuggestion.findUnique({ where: { id }, include: { curriculumPlan: true } });
    if (!suggestion) throw new NotFoundException('Suggestion not found');

    // Проверка исполнителя и прав: только ADMIN или автор предложения могут применять
    const performer = await this.prisma.user.findUnique({ where: { id: performedBy } });
    if (!performer) throw new NotFoundException('User not found');

    // suggestion must be pending
    if (suggestion.status !== 'PENDING') throw new BadRequestException('Suggestion is not pending');

    const performerRole = performer.role;
    if (performerRole !== 'ADMIN' && suggestion.authorId !== performedBy) {
      throw new ForbiddenException('Not allowed to apply this suggestion');
    }
    let newPlannedLessons = suggestion.diff ?? undefined;
    // guard access to Prisma Json metadata
    try {
      const meta: any = suggestion.metadata;
      if (!newPlannedLessons && meta) {
        const parsedKtp = meta.parsedKtp ?? meta;
        if (parsedKtp?.plannedLessons) newPlannedLessons = parsedKtp.plannedLessons;
        else if (Array.isArray(parsedKtp)) newPlannedLessons = parsedKtp;
      }
    } catch (e) {
      this.logger.warn('Failed to read suggestion.metadata parsedKtp', e);
    }

    if (!newPlannedLessons) {
      try {
        const parsed = JSON.parse(suggestion.suggestion);
        if (parsed?.plannedLessons) newPlannedLessons = parsed.plannedLessons;
        else if (Array.isArray(parsed)) newPlannedLessons = parsed;
      } catch {
        this.logger.warn('Failed to parse suggestion.suggestion as JSON');
      }
    }
    if (!newPlannedLessons) throw new BadRequestException('No diff or parsed plannedLessons to apply');
    const before = suggestion.curriculumPlan.plannedLessons;
    await this.prisma.curriculumPlan.update({ where: { id: suggestion.curriculumPlanId }, data: { plannedLessons: newPlannedLessons } });
    await this.prisma.aiSuggestion.update({ where: { id }, data: { status: 'APPLIED', appliedBy: performedBy, appliedAt: new Date() } });
    await this.prisma.aiSuggestionAudit.create({ data: { suggestionId: id, action: 'APPLIED', performedBy, data: { before, after: newPlannedLessons } } });
    return { success: true };
  }


  private sanitizeJsonText(text: string) { let t = text.trim(); if (t.startsWith('```')) t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, ''); return t.trim(); }

  // --- Agent tools registry (MVP) ---
  private toolsRegistry: ToolDefinition[] = [
    {
      id: 'summarizeKTP',
      name: 'Summarize KTP',
      description: 'Краткое резюме и ключевые цели КТП',
      requiredRoles: ['TEACHER', 'ADMIN']
    },
    {
      id: 'suggestLessonCreation',
      name: 'Suggest Lesson',
      description: 'Сгенерировать структуру урока на основе КТП/текущего состояния',
      requiredRoles: ['TEACHER', 'ADMIN']
    },
    {
      id: 'createLesson',
      name: 'Create Lesson',
      description: 'Создать запись урока в БД (name, studyPlanId, date, description)',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          studyPlanId: { type: 'number' },
          date: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name', 'studyPlanId']
      },
      requiredRoles: ['TEACHER', 'ADMIN']
    },
    {
      id: 'scheduleLesson',
      name: 'Schedule Lesson',
      description: 'Добавить урок в расписание (черновик)',
      inputSchema: {
        type: 'object',
        properties: {
          lessonId: { type: 'number' },
          groupId: { type: 'number' },
          date: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' }
        },
        required: ['lessonId', 'groupId', 'date', 'startTime', 'endTime']
      },
      requiredRoles: ['TEACHER', 'ADMIN']
    }
  ];

  private validateArgsAgainstSchema(schema: any, args: any) {
    if (!schema || typeof schema !== 'object') return { valid: true, errors: [] };

    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(schema);
      const valid = validate(args);
      if (valid) return { valid: true, errors: [] };
      const errors = (validate.errors || []).map((e: any) => {
        const path = e.instancePath || e.schemaPath || '';
        const msg = e.message || 'validation error';
        return `${path} ${msg}`.trim();
      });
      return { valid: false, errors };
    } catch {
      // fallback to basic checks if Ajv fails for some reason
      const errors: string[] = [];

      // required fields
      if (Array.isArray(schema.required)) {
        for (const reqKey of schema.required) {
          if (args == null || !(reqKey in args)) {
            errors.push(`Missing required property: ${reqKey}`);
          }
        }
      }

      // simple type checks for declared properties
      if (schema.properties && typeof schema.properties === 'object' && args && typeof args === 'object') {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const expectedType = (propSchema as any).type;
          if (expectedType && key in args) {
            const val = args[key];
            if (expectedType === 'array') {
              if (!Array.isArray(val)) errors.push(`Property ${key} should be array`);
            } else if (expectedType === 'number') {
              if (typeof val !== 'number') errors.push(`Property ${key} should be number`);
            } else if (expectedType === 'string') {
              if (typeof val !== 'string') errors.push(`Property ${key} should be string`);
            } else if (expectedType === 'object') {
              if (typeof val !== 'object' || Array.isArray(val) || val === null) errors.push(`Property ${key} should be object`);
            }
          }
        }
      }

      return { valid: errors.length === 0, errors };
    }
  }

  /**
   * Возвращает список доступных инструментов (фильтрация по ролям делается на фронте/LLM).
   */
  async getAvailableTools(userId: number): Promise<ToolDefinition[]> {
    // Получаем информацию о пользователе при необходимости (используем роль в ответе для удобства фронта)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.role ?? null;
    // В MVP просто возвращаем полный реестр; фронт может фильтровать по роли.
    return this.toolsRegistry.map(t => ({ ...t, requiredRoles: t.requiredRoles ?? [], userRole: role }));
  }

  /**
   * Обработчик действий агента (MVP).
   * - валидирует наличие инструмента
   * - проверяет роль исполнителя
   * - поддерживает dryRun (preview) и исполнение
   * - логирует действие в activityLog
   */
  async handleAgentAction(actionId: string, performedBy: number, args?: any, dryRun = true) {
    const tool = this.toolsRegistry.find(t => t.id === actionId);
    if (!tool) throw new NotFoundException('Tool not found');

    const performer = await this.prisma.user.findUnique({ where: { id: performedBy } });
    if (!performer) throw new NotFoundException('User not found');

    // RBAC: если у инструмента указаны роли — проверяем
    if (tool.requiredRoles && tool.requiredRoles.length > 0) {
      const allowed = tool.requiredRoles.includes(performer.role);
      if (!allowed) throw new ForbiddenException('Not allowed to execute this tool');
    }

    // Validate args against tool.inputSchema (MVP - базовая проверка required/types)
    if (tool.inputSchema) {
      const validation = this.validateArgsAgainstSchema(tool.inputSchema, args);
      if (!validation.valid) {
        await this.prisma.activityLog.create({
          data: {
            userId: performedBy,
            type: 'API_REQUEST',
            action: `AI_AGENT_ACTION_VALIDATION_FAILED:${actionId}`,
            description: `Validation failed: ${validation.errors.join('; ')}`,
            method: 'POST',
            url: '/ai-assistant/agent-action',
            requestData: { args, dryRun, toolId: actionId },
            responseData: { errors: validation.errors },
            success: false
          }
        });
        throw new BadRequestException(`Validation failed: ${validation.errors.join('; ')}`);
      }
    }
    const log = await this.prisma.activityLog.create({
      data: {
        userId: performedBy,
        type: 'API_REQUEST',
        action: `AI_AGENT_ACTION:${actionId}`,
        description: `Agent action ${actionId} requested (dryRun=${dryRun})`,
        method: 'POST',
        url: '/ai-assistant/agent-action',
        requestData: { args, dryRun, toolId: actionId },
        success: true
      }
    });

    // MVP: реализуем реальное выполнение только для createLesson (прочие — возвращают preview)
    if (actionId === 'createLesson' && !dryRun) {
      try {
        const payload = args ?? {};
        if (!payload.name || !payload.studyPlanId) throw new BadRequestException('Missing name or studyPlanId');

        // create Lesson minimal
        const lesson = await this.prisma.lesson.create({
          data: {
            name: payload.name,
            description: payload.description ?? null,
            studyPlanId: payload.studyPlanId,
            date: payload.date ? new Date(payload.date) : new Date()
          }
        });

        // логируем результат
        await this.prisma.activityLog.create({
          data: {
            userId: performedBy,
            type: 'CREATE',
            action: `AI_AGENT_ACTION_APPLIED:${actionId}`,
            description: `Lesson created by agent: ${lesson.id}`,
            method: 'POST',
            url: `/lessons/${lesson.id}`,
            requestData: { args },
            responseData: { lessonId: lesson.id },
            success: true
          }
        });

        return { success: true, result: lesson };
      } catch (e: any) {
        await this.prisma.activityLog.create({
          data: {
            userId: performedBy,
            type: 'API_REQUEST',
            action: `AI_AGENT_ACTION_FAILED:${actionId}`,
            description: `Agent action failed: ${e.message}`,
            method: 'POST',
            url: '/ai-assistant/agent-action',
            requestData: { args, dryRun, toolId: actionId },
            responseData: { error: e.message },
            success: false
          }
        });
        throw e;
      }
    }

    // Для dryRun или неподдерживаемых инструментов возвращаем preview-объект.
    // Также генерируем короткое текстовое сообщение (preview.message) через LLM,
    // которое фронтенд сможет вставить в чат при необходимости.
    let previewMessage: string | null = null;
    if (dryRun) {
      try {
        // Инструкция: кратко сформулировать, что сделает инструмент или какой ответ стоит показать учителю.
        const instr = `Ты — Neuro Abai ассистент. У тебя есть инструмент: ${tool.name} (id=${tool.id}).
На вход поступили аргументы: ${JSON.stringify(args ?? {})}.
Сгенерируй короткое понятное сообщение на русском (1-3 предложения), которое можно показать в чате пользователю как результат предпросмотра работы инструмента.
Не добавляй никакого поясняющего JSON, верни только текст.`;
        // Используем postOpenAIResponseText для генерации текста
        const msgText = await this.postOpenAIResponseText({ instructions: instr, input: '', temperature: 0.6 });
        let pm = msgText ? String(msgText).trim() : null;
        if (pm && pm.startsWith('```')) pm = this.sanitizeJsonText(pm);

        // Если модель вернула JSON внутри текста — попробуем извлечь первый удобочитаемый фрагмент
        if (pm) {
          try {
            const maybeJson = pm.trim();
            if (/^[[{]/.test(maybeJson)) {
              const parsed = JSON.parse(maybeJson);
              // common shapes: { actions: [...] } или { alternatives: [...] } или массив alternatives
              if (parsed && Array.isArray(parsed.actions) && parsed.actions[0]) {
                const a = parsed.actions[0];
                pm = (a.description || a.message || a.label || JSON.stringify(a)).toString();
              } else if (parsed && Array.isArray(parsed.alternatives) && parsed.alternatives[0]) {
                pm = String(parsed.alternatives[0]);
              } else if (Array.isArray(parsed) && parsed[0]) {
                pm = String(parsed[0]);
              } else {
                pm = String(JSON.stringify(parsed));
              }
            }
          } catch {
            // ignore parse errors — оставляем оригинальный текст
          }
        }

        // Нормализуем — убираем переводы строк, лишние пробелы
        if (pm) {
          pm = pm.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
          // Ограничим длину сообщения, чтобы не ломало ширину окна чата (примерно 300 символов)
          const MAX_PREVIEW_LENGTH = 300;
          if (pm.length > MAX_PREVIEW_LENGTH) pm = pm.slice(0, MAX_PREVIEW_LENGTH - 3).trim() + '...';
        }

        previewMessage = pm;
      } catch (e: any) {
        this.logger.warn('Preview message generation failed', e?.message ?? e);
        previewMessage = null;
      }

      // Fallback: если LLM не вернул текст — формируем нейтральный понятный preview без "сырых" данных
      if (!previewMessage || previewMessage.length === 0) {
        previewMessage = `Инструмент "${tool.name}": предпросмотр подготовлен.`;
      }
    }

    const preview = {
      tool: { id: tool.id, name: tool.name, description: tool.description },
      argsPreview: null,
      dryRun: !!dryRun,
      message: previewMessage,
      note: actionId === 'createLesson' ? 'To actually create lesson set dryRun=false' : 'Preview only in MVP'
    };
    return { success: true, preview, logId: log.id };
  }

  /**
   * Генерирует предложения действий (action proposals) от LLM.
   * Ожидаемый формат ответа от LLM: JSON внутри ```json ... ``` или просто JSON.
   * Формат: { actions: [ { actionId, label, description?, argsPreview?: {...}, rationale?: string } ] }
   */
  async generateActionProposals(message: string, userId?: number, context?: any, files?: Express.Multer.File[]) {
    this.ensureKey();
    const logEntry = await this.prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        type: 'API_REQUEST',
        action: 'AI_GENERATE_ACTIONS_REQUEST',
        description: 'Requested generation of agent action proposals (alternatives)',
        method: 'POST',
        url: '/ai-assistant/generate-actions',
        requestData: { message: message?.substring(0, 2000), context },
        success: true
      }
    });

    // Собираем вход для модели (включаем файлы, если есть)
    let prompt = this.buildNeuroAbaiSystemPrompt() + '\n\n';
    prompt += message ?? '';
    if (context) prompt += `\n\nCONTEXT:\n${JSON.stringify(context).substring(0, 20000)}`;

    // Если сценарий явно указывает на анализ КТП — добавляем специализированную инструкцию,
    // чтобы LLM генерировал actions строго в формате, ожидаемом системой.
    if (context?.scenario === 'analyze_ktp') {
      prompt += `

Инструкция для анализа КТП:
- Проанализируй загруженный КТП/конспект и сгенерируй до 5 предложений/действий (actions) в JSON виде.
- Каждый action должен иметь поля: actionId, type, label, description (опц.), argsPreview (опц.), message, rationale.
- type допускает: "chatReply", "suggestLesson", "createLesson", "fullLesson", "askForConsent".
- message: 1-3 предложения, по умолчанию на русском, вежливо и конструктивно, длина <= 300 символов.
- Для "createLesson" argsPreview указывайте { name, studyPlanId, date, description }.
- Для "fullLesson" argsPreview указывайте { lessonTitle, durationMinutes:45, objectives:[], materials:[], stepsSummary:[] }.
- Если нужен запрос согласия пользователя — используйте type "askForConsent".
- Возвращай ТОЛЬКО JSON (возможно внутри \`\`\`json ... \`\`\`). Никакого лишнего текста вне JSON.
`;
    }

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
      prompt += `\n\nFILES:${parts.join('')}`;
    }

    // Инструкция модели: вернуть несколько кратких альтернативных ответов.
    const altInstr = `${prompt}

Пожалуйста, сгенерируй три варианта краткого ответа пользователю (на русском, 1-3 предложения каждый).
Верни результат В ПРЕФЕРЕНЦИАЛЬНОМ JSON виде:
{
  "alternatives": ["вариант 1...", "вариант 2...", "вариант 3..."]
}
Если модель не может вернуть JSON, можно вернуть обычный текст с вариантами, пронумерованными как "1) ...", "2) ...", "3) ...".`;

    try {
      const aiText = await this.postOpenAIResponseText({ instructions: '', input: altInstr, temperature: 0.6 });
      const cleaned = this.sanitizeJsonText(aiText);

      // Нормализуем ответ: если модель вернула JSON с actions / alternatives — формируем готовые карточки (plain message).
      let actions: any[] = [];
      try {
        const parsed = JSON.parse(cleaned);

        // Case: structured actions returned
        if (parsed && Array.isArray(parsed.actions) && parsed.actions.length) {
          actions = parsed.actions.map((a: any, idx: number) => {
            const rawMsg = (a.message || a.description || a.label || '');
            let msg = String(rawMsg || '').trim();
            if (msg.startsWith('```')) msg = this.sanitizeJsonText(msg);
            msg = msg.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
            if (msg.length > 300) msg = msg.slice(0, 297).trim() + '...';
            return {
              actionId: a.actionId ?? null,
              type: (a.type) ?? 'chatReply',
              label: a.label ?? `Вариант ${idx + 1}`,
              description: a.description ?? '',
              argsPreview: null,
              message: msg || `Вариант ${idx + 1}`,
              rationale: a.rationale ?? 'Автосгенерированный вариант ответа от Neuro Abai'
            };
          });
        }
        // Case: alternatives array
        else if (parsed && Array.isArray(parsed.alternatives) && parsed.alternatives.length) {
          actions = parsed.alternatives.map((s: any, idx: number) => {
            let msg = String(s || '').trim();
            if (msg.startsWith('```')) msg = this.sanitizeJsonText(msg);
            msg = msg.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
            if (msg.length > 300) msg = msg.slice(0, 297).trim() + '...';
            return {
              actionId: null,
              type: 'chatReply',
              label: `Вариант ${idx + 1}`,
              description: '',
              argsPreview: null,
              message: msg,
              rationale: 'Автосгенерированный вариант ответа от Neuro Abai'
            };
          });
        }
        // Case: raw array of strings
        else if (Array.isArray(parsed) && parsed.length) {
          actions = parsed.map((s: any, idx: number) => {
            let msg = String(s || '').trim();
            if (msg.startsWith('```')) msg = this.sanitizeJsonText(msg);
            msg = msg.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
            if (msg.length > 300) msg = msg.slice(0, 297).trim() + '...';
            return {
              actionId: null,
              type: 'chatReply',
              label: `Вариант ${idx + 1}`,
              description: '',
              argsPreview: null,
              message: msg,
              rationale: 'Автосгенерированный вариант ответа от Neuro Abai'
            };
          });
        }
      } catch {
        // не JSON — попытаемся извлечь пронумерованные варианты из текста
        const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const joined = lines.join('\n');
        // regex для нахождения частей вида "1) text" или "1. text" или "1: text" или "Option 1: text"
        const matches = Array.from(joined.matchAll(/(?:^|\n)\s*(?:\d+[).:]|(?:Option|Вариант)\s*\d+:?)\s*(.+?)(?=(?:\n\s*(?:\d+[).:]|(?:Option|Вариант)\s*\d+:?))|$)/gis)).map(m => m[1].trim());
        let alternatives: string[] = [];
        if (matches.length) alternatives = matches.map(m => m.replace(/^["'`]|["'`]$/g, '').trim());
        else {
          // fallback: разбить по двойному переносу или по '---' либо по '***'
          const parts = cleaned.split(/\n{2,}|-{3,}|\*{3,}/).map(p => p.trim()).filter(Boolean);
          if (parts.length > 1) alternatives = parts.slice(0, 5);
          else alternatives = [cleaned];
        }

        alternatives = alternatives.slice(0, 5);
        actions = alternatives.map((text, idx) => {
          let msg = String(text || '').trim();
          if (msg.startsWith('```')) msg = this.sanitizeJsonText(msg);
          msg = msg.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
          if (msg.length > 300) msg = msg.slice(0, 297).trim() + '...';
          return {
            actionId: null,
            type: 'chatReply' as const,
            label: `Вариант ${idx + 1}`,
            description: '',
            argsPreview: null,
            message: msg,
            rationale: 'Автосгенерированный вариант ответа от Neuro Abai'
          };
        });
      }

      // Ограничим до 5 вариантов
      if (!actions || actions.length === 0) actions = [{ actionId: null, type: 'chatReply', label: 'Вариант 1', description: '', argsPreview: null, message: cleaned.replace(/\r?\n+/g, ' ').trim().slice(0, 300), rationale: 'Автосгенерированный вариант ответа от Neuro Abai' }];
      actions = actions.slice(0, 5);

      await this.prisma.activityLog.create({
        data: {
          userId: userId ?? null,
          type: 'API_REQUEST',
          action: 'AI_GENERATE_ACTIONS_SUCCESS',
          description: `Generated ${actions.length} chatReply alternatives`,
          method: 'POST',
          url: '/ai-assistant/generate-actions',
          requestData: { message: message?.substring(0, 2000), context },
          responseData: { actionsCount: actions.length },
          success: true
        }
      });

      return { success: true, actions, raw: cleaned, logId: logEntry.id };
    } catch (e: any) {
      const errMsg = e?.message ?? String(e);
      const errStack = e?.stack ? String(e.stack).substring(0, 2000) : undefined;
      await this.prisma.activityLog.create({
        data: {
          userId: userId ?? null,
          type: 'API_REQUEST',
          action: 'AI_GENERATE_ACTIONS_FAILED',
          description: `Generation failed: ${errMsg}`,
          method: 'POST',
          url: '/ai-assistant/generate-actions',
          requestData: { message: message?.substring(0, 2000), context },
          responseData: { error: errMsg, stack: errStack },
          success: false
        }
      });
      this.logger.error('generateActionProposals failed', { message: errMsg, stack: errStack });
      // Throw with detail to help debugging clients (kept concise)
      throw new BadRequestException(`Failed to generate action proposals from LLM: ${errMsg}`);
    }
  }
}
