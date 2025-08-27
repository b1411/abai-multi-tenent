import { Injectable, Logger } from '@nestjs/common';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { scheduleGenerationSchema } from './schemas/schedule-generation.schema';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

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
      body: JSON.stringify({ model, instructions, input, temperature, response_format: { type: 'json_schema', json_schema: { name: schemaName, schema, strict: true } } })
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
      required: ['courseName', 'sections'],
      properties: {
        courseName: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'lessons'],
            properties: {
              title: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['title'],
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

  private sanitizeJsonText(text: string) { let t = text.trim(); if (t.startsWith('```')) t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, ''); return t.trim(); }
}
