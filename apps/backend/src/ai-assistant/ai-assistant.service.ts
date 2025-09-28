import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import { AIScheduleResponseDto } from './dto/ai-schedule-response.dto';
import { scheduleGenerationSchema } from './schemas/schedule-generation.schema';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { FilesService } from '../files/files.service';
import { simpleScheduleSchema } from './schemas/simple-schedule.schema';
import { SimpleScheduleResponseDto } from './dto/simple-schedule-response.dto';

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
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly algorithmVersion = '2.0.0';

  constructor(private prisma: PrismaService, private filesService: FilesService) { }

  // ---- Public API ----
  async createEphemeralToken() {
    this.ensureKey();
    const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01', voice: 'alloy', input_audio_transcription: {
          model: 'gpt-4o-transcribe'
        }
      })
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

  async generateSimpleScheduleFromPrompt(prompt: string): Promise<SimpleScheduleResponseDto> {
    this.ensureKey();
    const instructions = `Ты — помощник по составлению недельного расписания колледжа.
Возвращай СТРОГО JSON по заданной json_schema без лишнего текста.
- Рабочая неделя: Пн(1) — Пт(5), слоты 1..8.
- Все занятия recurrence=weekly.
- Используй id, которые уже присутствуют во входном контексте (не придумывай новые).
- Если ячейку нельзя заполнить из-за ограничений — просто пропусти её (не возвращай).
`;
    const ai = await this.postOpenAIResponseWithSchema<SimpleScheduleResponseDto>({
      instructions,
      input: prompt,
      schemaName: 'simple_schedule',
      schema: simpleScheduleSchema,
      temperature: 0.2
    });

    // Нормализация/валидация результатов на всякий случай
    const lessons = Array.isArray(ai?.lessons) ? ai.lessons : [];
    const toNum = (v: any) => (typeof v === 'number' ? v : Number(v));
    const cleaned = lessons
      .map((l: any) => {
        const day = Math.min(5, Math.max(1, toNum(l.day)));
        const slot = Math.min(8, Math.max(1, toNum(l.slot)));
        const studyPlanId = toNum(l.studyPlanId);
        const groupId = toNum(l.groupId);
        const teacherId = toNum(l.teacherId);
        const classroomId = l.classroomId == null ? null : toNum(l.classroomId);
        return {
          day,
          slot,
          studyPlanId,
          groupId,
          teacherId,
          classroomId,
          recurrence: 'weekly' as const
        };
      })
      .filter(
        (x) =>
          Number.isFinite(x.day) &&
          Number.isFinite(x.slot) &&
          Number.isFinite(x.studyPlanId) &&
          Number.isFinite(x.groupId) &&
          Number.isFinite(x.teacherId)
      );

    return { lessons: cleaned };
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

  /**
   * Chat with OpenAI Responses API using code_interpreter.
   * If model generates files, we fetch them and persist via FilesService, returning their metadata.
   */
  async chatWithTools(message: string, scenario: string, files?: Express.Multer.File[]) {
    this.ensureKey();
    const systemPrompt =
      this.buildNeuroAbaiSystemPrompt() +
      '\n\nТебе доступны инструменты. Если требуется отредактировать или сгенерировать файл, используй code_interpreter: ' +
      'прочитай вложения, сделай изменения и запиши новый файл. В конце приложи получившийся файл к ответу. ' +
      'Дай короткое пояснение, что изменено. ' +
      'Не вставляй sandbox:/ ссылки — если создаешь файл, обязательно прикладывай его как output_file или container_file_citation. Не создавай и не прикладывай файлы, если пользователь этого явно не просил.';

    // Upload user files to OpenAI and provide them to code_interpreter via tool_resources
    const codeInterpreterFileIds: string[] = [];
    if (files?.length) {
      for (const f of files) {
        try {
          const fileLike = await toFile(f.buffer, f.originalname || 'upload.bin', {
            type: f.mimetype || 'application/octet-stream'
          });
          const created = await this.openai.files.create({ file: fileLike, purpose: 'assistants' });
          codeInterpreterFileIds.push(created.id);
          this.logger.log(`[OpenAI] Uploaded file to OpenAI: name=${f.originalname ?? 'upload.bin'} id=${created.id} mimetype=${f.mimetype ?? 'unknown'} size=${f.size ?? f.buffer?.length ?? 0}`);
        } catch (e: any) {
          this.logger.warn(`Failed to upload file to OpenAI: ${f?.originalname ?? 'unknown'} - ${e?.message ?? e}`);
        }
      }
    }

    const userPrompt = `${scenario || ''}\n\n${message || ''}`;
    const startedAt = Math.floor(Date.now() / 1000);
    // Signatures of user-uploaded inputs to exclude from per-message attachments
    const uploadedInputs = Array.isArray(files)
      ? files.map(f => ({
        name: String(f.originalname || '').toLowerCase().trim(),
        size: Number.isFinite((f as any).size) ? (f as any).size : (f.buffer?.length ?? 0),
        mimetype: String(f.mimetype || '').toLowerCase()
      }))
      : [];
    const uploadedInputNames = new Set(uploadedInputs.map(u => u.name).filter(Boolean));

    // Only allow file outputs if explicitly requested
    const allowFileOutputs = /(?:(?:сделай|создай|сгенерируй|сформируй|редактируй|исправь|сохрани|приложи|вложи|прикрепи|скачай|экспорт|export|download|create|generate)(?:\s+(?:файл|документ))?)|(?:docx|doc|xlsx|xls|pptx|ppt|pdf|zip|png|jpe?g|gif|csv|excel|word|таблиц[а-яё]*|презентац[а-яё]*|отч[её]т[а-яё]*)/i.test(`${scenario || ''} ${message || ''}`);
    const fileMentioned = /\b(файл|документ|таблиц[а-яё]*|презентац[а-яё]*|отч[её]т[а-яё]*|attachment|document|file|spreadsheet|presentation|report)\b/i.test(`${scenario || ''} ${message || ''}`);

    let data: any;
    try {
      const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model: 'gpt-4.1',
        tools: [
          { type: 'code_interpreter', container: { type: 'auto', file_ids: [] } }
        ],
        tool_choice: 'auto',
        instructions: systemPrompt,
        input: userPrompt,
      };
      if (codeInterpreterFileIds.length) {
        if (body.tools[0].type === "code_interpreter") {
          (body.tools[0].container as OpenAI.Responses.Tool.CodeInterpreter.CodeInterpreterToolAuto).file_ids = codeInterpreterFileIds;
        }
      }

      try {
        // Lightweight payload logging (avoids dumping large strings)
        const toolsSummary = JSON.stringify(body.tools ?? []);
        const toolResSummary = JSON.stringify((body as any).tool_resources ?? null);
        const instrLen = typeof systemPrompt === 'string' ? systemPrompt.length : 0;
        const inputLen = typeof userPrompt === 'string' ? userPrompt.length : 0;
        const fileIdsSummary = codeInterpreterFileIds.join(',');
        this.logger.log(`[OpenAI] responses.create payload: model=${body.model}; tools=${toolsSummary}; tool_resources=${toolResSummary}; instr_len=${instrLen}; input_len=${inputLen}; file_ids=[${fileIdsSummary}]`);
      } catch (logErr) {
        this.logger.warn(`[OpenAI] Failed to log payload: ${logErr instanceof Error ? logErr.message : String(logErr)}`);
      }
      data = await this.openai.responses.create(body);
    } catch (e: any) {
      throw new BadRequestException(`OpenAI error: ${e?.message || String(e)}`);
    }

    const messageText = this.extractResponsesText(data);

    // Extract file outputs from model (container citations and output files), persist via FilesService
    const resultFiles: any[] = [];
    const processedCitationIds = new Set<string>();
    try {
      const containerFilesCache = new Map<string, { id: string; filename?: string; createdAt?: number }[]>();
      // 1) Container file citations (cfile_*) coming from code_interpreter container
      const citations = this.extractContainerFileCitationsFromAny(data);
      for (const c of citations) {
        try {
          // Gate citations to this turn only, when createdAt is available
          try {
            const list = containerFilesCache.get(c.container_id) ?? await this.listContainerFiles(c.container_id);
            if (!containerFilesCache.has(c.container_id)) containerFilesCache.set(c.container_id, list);
            const meta = list.find((it: any) => it.id === c.file_id);
            if (meta && typeof meta.createdAt === 'number' && meta.createdAt < startedAt - 30) {
              this.logger.log(`[Files] Skipping citation older than current turn: container=${c.container_id} file=${c.file_id} createdAt=${meta.createdAt}`);
              continue;
            }
          } catch {
            // If listing fails or createdAt not available, proceed to download (best effort)
          }

          const downloaded: any = await this.downloadContainerFile(c.container_id, c.file_id, c.filename);

          // Skip if downloaded file matches a user upload by name and size
          const dnNameLc = String(downloaded?.originalname || '').toLowerCase().trim();
          if (dnNameLc && uploadedInputNames.has(dnNameLc)) {
            const up = uploadedInputs.find(u => u.name === dnNameLc);
            if (up && Math.abs((downloaded?.size || 0) - (up.size || 0)) <= 1) {
              this.logger.log(`[Files] Skipping downloaded container file matching user upload: ${downloaded.originalname} (${downloaded.size} bytes)`);
              continue;
            }
          }

          const uploaded = await this.filesService.uploadFile(downloaded, 'ai-generated', undefined);
          resultFiles.push(uploaded);
          processedCitationIds.add(`${c.container_id}:${c.file_id}`);
        } catch (e: any) {
          this.logger.warn(`Failed to fetch/persist container file ${c.file_id}: ${e?.message ?? e}`);
        }
      }

      // 2) Assistants output files (file-*) returned by Responses API
      const fileIds = Array.from(new Set(this.extractFileIdsFromAny(data)));
      for (const fid of fileIds) {
        try {
          const meta = await this.openai.files.retrieve(fid);
          const purpose = (meta as any)?.purpose;
          if (purpose && purpose !== 'assistants_output') {
            this.logger.warn(`Skipping OpenAI file ${fid} with purpose=${purpose}`);
            continue;
          }
          const contentResp = await this.openai.files.content(fid);
          const arrayBuf = await contentResp.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          const metaAny: any = meta as any;
          const mimeType = metaAny?.mime_type || 'application/octet-stream';
          const finalName = this.inferFileName(metaAny?.filename, fid, mimeType);

          // Skip if assistants_output coincides with user upload by name and size
          const finalNameLc = String(finalName || '').toLowerCase().trim();
          if (finalNameLc && uploadedInputNames.has(finalNameLc)) {
            const up = uploadedInputs.find(u => u.name === finalNameLc);
            if (up && Math.abs(buf.length - (up.size || 0)) <= 1) {
              this.logger.log(`[Files] Skipping assistants_output matching user upload: ${finalName} (${buf.length} bytes)`);
              continue;
            }
          }

          const fake: any = {
            fieldname: 'file',
            originalname: finalName,
            encoding: '7bit',
            mimetype: mimeType,
            size: buf.length,
            buffer: buf
          };
          const uploaded = await this.filesService.uploadFile(fake, 'ai-generated', undefined);
          resultFiles.push(uploaded);
        } catch (e: any) {
          this.logger.warn(`Failed to fetch/persist OpenAI file ${fid}: ${e?.message ?? e}`);
        }
      }
    } catch {
      // ignore parsing issues
    }

    // Restricted fallback: include only files created during this turn (by timestamp)
    if (resultFiles.length === 0) {
      try {
        const containerIds = this.extractContainerIdsFromAny(data);
        for (const cid of containerIds) {
          try {
            const list = await this.listContainerFiles(cid);
            const recent = list.filter((it: any) => {
              const ts = typeof it.createdAt === 'number' ? it.createdAt : undefined;
              return ts != null && ts >= startedAt - 30;
            });
            for (const it of recent) {
              try {
                // Skip if already processed via explicit citation
                if (processedCitationIds.has(`${cid}:${it.id}`)) {
                  this.logger.log(`[Files] Skipping fallback duplicate of citation: container=${cid} file=${it.id}`);
                  continue;
                }
                const downloaded: any = await this.downloadContainerFile(cid, it.id, it.filename);

                // Skip if fallback file matches a user upload by name and size
                const dnNameLc = String(downloaded?.originalname || '').toLowerCase().trim();
                if (dnNameLc && uploadedInputNames.has(dnNameLc)) {
                  const up = uploadedInputs.find(u => u.name === dnNameLc);
                  if (up && Math.abs((downloaded?.size || 0) - (up.size || 0)) <= 1) {
                    this.logger.log(`[Files] Skipping fallback file matching user upload: ${downloaded.originalname} (${downloaded.size} bytes)`);
                    continue;
                  }
                }

                const uploaded = await this.filesService.uploadFile(downloaded, 'ai-generated', undefined);
                resultFiles.push(uploaded);
              } catch (e: any) {
                this.logger.warn(`Recent fallback download failed for container ${cid} file ${it.id}: ${e?.message ?? e}`);
              }
            }
          } catch (e: any) {
            this.logger.warn(`Recent list failed for container ${cid}: ${e?.message ?? e}`);
          }
        }
      } catch (e: any) {
        this.logger.warn(`Restricted fallback failed: ${e?.message ?? e}`);
      }
    }

    const filesToReturn = (allowFileOutputs || (resultFiles.length > 0 && fileMentioned)) ? resultFiles : [];
    return { message: messageText, files: filesToReturn };
  }

  private extractContainerFileCitationsFromAny(obj: any): { container_id: string; file_id: string; filename?: string }[] {
    const out: { container_id: string; file_id: string; filename?: string }[] = [];
    const visit = (v: any) => {
      if (!v) return;
      if (Array.isArray(v)) { v.forEach(visit); return; }
      if (typeof v === 'object') {
        const anyV: any = v;
        if (anyV?.type === 'container_file_citation' && typeof anyV?.file_id === 'string' && typeof anyV?.container_id === 'string') {
          out.push({ container_id: anyV.container_id, file_id: anyV.file_id, filename: anyV.filename });
        }
        for (const val of Object.values(v)) visit(val);
      }
    };
    visit(obj);
    // dedupe by container_id:file_id
    const seen = new Set<string>();
    return out.filter((c) => { const k = `${c.container_id}:${c.file_id}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }

  private async downloadContainerFile(containerId: string, fileId: string, filename?: string) {
    const url = `https://api.openai.com/v1/containers/${containerId}/files/${fileId}/content`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.openaiApiKey}` } });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => `${res.statusText}`);
      throw new Error(`download container file failed: ${res.status} ${errTxt}`);
    }
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    // Try to derive filename from Content-Disposition header if present
    let cdName: string | undefined;
    const cd = res.headers.get('content-disposition') || '';
    const cdMatch = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    if (cdMatch && cdMatch[1]) {
      try {
        cdName = decodeURIComponent(cdMatch[1].replace(/"/g, '').trim());
      } catch {
        cdName = cdMatch[1].replace(/"/g, '').trim();
      }
    }
    const finalName = this.inferFileName(filename || cdName, fileId, contentType);
    const fake: any = {
      fieldname: 'file',
      originalname: finalName,
      encoding: '7bit',
      mimetype: contentType,
      size: buf.length,
      buffer: buf
    };
    return fake;
  }

  private extractContainerIdsFromAny(obj: any): string[] {
    const out: string[] = [];
    const isContainerId = (s: string) => /^cntr_[A-Za-z0-9_-]+$/.test(s);

    const visit = (v: any) => {
      if (!v) return;

      if (typeof v === 'string') {
        const matches = v.match(/cntr_[A-Za-z0-9_-]+/g);
        if (matches) {
          for (const m of matches) if (isContainerId(m)) out.push(m);
        }
        return;
      }

      if (Array.isArray(v)) { v.forEach(visit); return; }

      if (typeof v === 'object') {
        const anyV: any = v;

        // Явные вызовы инструмента содержат container_id
        if (anyV?.type === 'code_interpreter_call' && typeof anyV?.container_id === 'string' && isContainerId(anyV.container_id)) {
          out.push(anyV.container_id);
        }
        if (typeof anyV?.container_id === 'string' && isContainerId(anyV.container_id)) {
          out.push(anyV.container_id);
        }

        for (const val of Object.values(v)) visit(val);
      }
    };

    visit(obj);
    return Array.from(new Set(out));
  }

  private async listContainerFiles(containerId: string): Promise<{ id: string; filename?: string; createdAt?: number }[]> {
    const url = `https://api.openai.com/v1/containers/${containerId}/files`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' } });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => `${res.statusText}`);
      throw new Error(`list container files failed: ${res.status} ${errTxt}`);
    }
    let json: any;
    try { json = await res.json(); } catch { json = null; }
    const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.files) ? json.files : (Array.isArray(json) ? json : []));
    return arr
      .map((x: any) => {
        const c = x?.created_at ?? x?.createdAt ?? x?.created_at_s ?? x?.created_at_ms ?? x?.createdAtMs ?? x?.created ?? x?.createdAtISO ?? null;
        let createdAt: number | undefined;
        if (typeof c === 'number') {
          createdAt = c > 1e12 ? Math.floor(c / 1000) : c;
        } else if (typeof c === 'string') {
          const t = Date.parse(c);
          if (!Number.isNaN(t)) createdAt = Math.floor(t / 1000);
        }
        return { id: String(x?.id ?? ''), filename: x?.filename ?? x?.name ?? undefined, createdAt };
      })
      .filter((x: any) => x.id);
  }

  private extractFileIdsFromAny(obj: any): string[] {
    const out: string[] = [];
    const isValidFileId = (s: string) => /^file-[A-Za-z0-9_-]+$/.test(s);

    const visit = (v: any) => {
      if (!v) return;

      if (typeof v === 'string') {
        const matches = v.match(/file-[A-Za-z0-9_-]+/g);
        if (matches) {
          for (const m of matches) {
            if (isValidFileId(m)) out.push(m);
          }
        }
        return;
      }

      if (Array.isArray(v)) {
        v.forEach(visit);
        return;
      }

      if (typeof v === 'object') {
        const anyV: any = v;
        // Prefer explicit output_file objects
        if (anyV?.type === 'output_file' && typeof anyV.file_id === 'string' && isValidFileId(anyV.file_id)) {
          out.push(anyV.file_id);
        }

        for (const [k, val] of Object.entries(v)) {
          if (k === 'file_id' && typeof val === 'string' && isValidFileId(val)) out.push(val);
          visit(val);
        }
      }
    };

    visit(obj);
    return Array.from(new Set(out));
  }

  // ---- Helpers ----
  private extFromMime(mime?: string): string {
    const m = (mime || '').toLowerCase();
    const map: Record<string, string> = {
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/rtf': '.rtf',
      'application/json': '.json',
      'application/xml': '.xml',
      'text/csv': '.csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/msword': '.doc',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.ms-powerpoint': '.ppt',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'application/zip': '.zip'
    };
    if (m && map[m]) return map[m];
    if (m.startsWith('image/')) return `.${m.split('/')[1]}`;
    if (m.startsWith('text/')) return '.txt';
    return '.bin';
  }

  private inferFileName(name?: string, id?: string, contentType?: string): string {
    const guessed = (name || '').trim();
    const hasExt = /\.[A-Za-z0-9]+$/.test(guessed);
    const notBin = guessed && !/\.bin$/i.test(guessed);
    if (guessed && hasExt && notBin) return guessed;
    const ext = this.extFromMime(contentType);
    return `${(guessed && !hasExt && notBin ? guessed : (id || 'file'))}${ext}`;
  }

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
    let data: any;
    try {
      try {
        const instrLen = typeof instructions === 'string' ? instructions.length : 0;
        const inputLen = typeof input === 'string' ? input.length : 0;
        const schemaNameSafe = String(schemaName);
        this.logger.log(`[OpenAI] responses.create payload: model=${model}; text.format=json_schema(${schemaNameSafe}); instr_len=${instrLen}; input_len=${inputLen}; temperature=${temperature}`);
      } catch (logErr) {
        this.logger.warn(`[OpenAI] Failed to log payload: ${logErr instanceof Error ? logErr.message : String(logErr)}`);
      }
      data = await this.openai.responses.create({
        model,
        instructions,
        input,
        temperature,
        text: { format: { type: 'json_schema', name: schemaName, schema, strict: true } }
      });
    } catch (e: any) {
      throw new Error(`OpenAI error: ${e?.message || String(e)}`);
    }
    const text = this.extractResponsesText(data);
    const clean = this.sanitizeJsonText(text);
    return JSON.parse(clean) as T;
  }

  private async postOpenAIResponseText(p: { instructions: string; input: string; temperature?: number; model?: string; }): Promise<string> {
    const { instructions, input, temperature = 0.7, model = 'gpt-4o-2024-08-06' } = p;
    try {
      try {
        const instrLen = typeof instructions === 'string' ? instructions.length : 0;
        const inputLen = typeof input === 'string' ? input.length : 0;
        this.logger.log(`[OpenAI] responses.create payload: model=${model}; instr_len=${instrLen}; input_len=${inputLen}; temperature=${temperature}`);
      } catch (logErr) {
        this.logger.warn(`[OpenAI] Failed to log payload: ${logErr instanceof Error ? logErr.message : String(logErr)}`);
      }
      const data = await this.openai.responses.create({ model, instructions, input, temperature });
      return this.extractResponsesText(data);
    } catch (e: any) {
      throw new Error(`OpenAI error: ${e?.message || String(e)}`);
    }
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
        // Нормализация даты: всегда используем текущий год.
        // Поддерживаем: ISO ("YYYY-MM-DD") и частичные форматы "DD-MM" / "DD.MM" / "DD/MM".
        // Если формат не распознан — очищаем поле.
        if (l.date) {
          const isoMatch = String(l.date).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
          const currentYear = new Date().getFullYear();
          if (isoMatch) {
            // Заменяем год на текущий, сохраняем месяц и день
            const mm = isoMatch[2];
            const dd = isoMatch[3];
            l.date = `${currentYear}-${mm}-${dd}`;
          } else {
            const m = String(l.date).trim().match(new RegExp('(\\d{1,2})[./-](\\d{1,2})'));
            if (m) {
              let d = parseInt(m[1], 10);
              let mo = parseInt(m[2], 10);
              // эвристика: если вторая часть > 12 и первая <= 12 — возможно порядок месяц-день, поменяем
              if (mo > 12 && d <= 12) { const tmp = d; d = mo; mo = tmp; }
              if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
                const dd = String(d).padStart(2, '0');
                const mm = String(mo).padStart(2, '0');
                l.date = `${currentYear}-${mm}-${dd}`;
              } else {
                l.date = undefined;
              }
            } else {
              l.date = undefined;
            }
          }
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

    // Для dryRun или неподдерживаемых/неисполняемых инструментов возвращаем preview-объект.
    // Теперь генерируем короткое сообщение и для dryRun=false (кроме случаев реального исполнения createLesson),
    // чтобы фронт всегда получил человекочитаемый текст.
    const needsPreviewOnly = actionId !== 'createLesson' || !!dryRun;
    let previewMessage: string | null = null;

    if (needsPreviewOnly) {
      try {
        const mode = dryRun ? 'предпросмотр' : 'выполнение (MVP: без записи в БД)';
        const instr = `Ты — Neuro Abai ассистент. Режим: ${mode}.
Инструмент: ${tool.name} (id=${tool.id}).
Аргументы: ${JSON.stringify(args ?? {})}.
Верни короткое понятное сообщение на русском (1–3 предложения) — что будет сделано/результат действия.
Только текст, без JSON и Markdown.`;
        const msgText = await this.postOpenAIResponseText({ instructions: instr, input: '', temperature: 0.6 });
        let pm = msgText ? String(msgText).trim() : null;
        if (pm && pm.startsWith('```')) pm = this.sanitizeJsonText(pm);

        if (pm) {
          try {
            const maybeJson = pm.trim();
            if (/^[[{]/.test(maybeJson)) {
              const parsed = JSON.parse(maybeJson);
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
            // keep pm as-is
          }
        }

        if (pm) {
          pm = pm.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
          const MAX_PREVIEW_LENGTH = 300;
          if (pm.length > MAX_PREVIEW_LENGTH) pm = pm.slice(0, MAX_PREVIEW_LENGTH - 3).trim() + '...';
        }

        previewMessage = pm;
      } catch (e: any) {
        this.logger.warn('Preview message generation failed', e?.message ?? e);
        previewMessage = null;
      }

      if (!previewMessage || previewMessage.length === 0) {
        previewMessage = dryRun
          ? `Инструмент "${tool.name}": предпросмотр подготовлен.`
          : `Инструмент "${tool.name}": выполнено (MVP, без записи в БД).`;
      }

      const preview = {
        tool: { id: tool.id, name: tool.name, description: tool.description },
        argsPreview: args ?? null,
        dryRun: !!dryRun,
        message: previewMessage,
        note: actionId === 'createLesson' ? 'To actually create lesson set dryRun=false' : 'MVP: без записи в БД'
      };
      return { success: true, preview, chatReply: { message: previewMessage }, logId: log.id };
    }

    // сюда попадём только при реальном исполнении createLesson (dryRun=false), но на всякий случай вернём дефолт
    const preview = {
      tool: { id: tool.id, name: tool.name, description: tool.description },
      argsPreview: args ?? null,
      dryRun: !!dryRun,
      message: null,
      note: 'Executed'
    };
    return { success: true, preview, logId: log.id };
  }

  /**
   * Генерирует предложения сообщений (message suggestions) от LLM.
   * Ожидаемый формат ответа от LLM: JSON внутри ```json ... ``` или просто JSON.
   * Формат: { suggestions: [ { text: string, description?: string } ] }
   */
  async generateActionProposals(message: string, userId?: number, context?: any, files?: Express.Multer.File[]) {
    this.ensureKey();
    const logEntry = await this.prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        type: 'API_REQUEST',
        action: 'AI_GENERATE_ACTIONS_REQUEST',
        description: 'Requested generation of message suggestions',
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

    // Инструкция модели: сгенерировать ВАРИАНТЫ СООБЩЕНИЙ (message suggestions), не ответы.
    const systemInstr = `Ты — Neuro Abai ассистент для учителя. Сгенерируй до 5 ВАРИАНТОВ СООБЩЕНИЙ в JSON.
Только JSON (возможно в \`\`\`json). Формат:
{
  "suggestions": [
    { "text": "...", "description": "..." },
    { "text": "...", "description": "..." }
  ]
}
- Сообщения должны быть релевантными продолжениями разговора или дополнительными запросами, которые пользователь мог бы отправить.
- Тексты короткие (<=300 символов), на русском, без markdown.
- Никаких "альтернативных ответов" как текста — именно варианты сообщений.`;
    const modelInput = `${prompt}`;

    try {
      const aiText = await this.postOpenAIResponseText({ instructions: systemInstr, input: modelInput, temperature: 0.4 });
      const cleaned = this.sanitizeJsonText(aiText);

      // Нормализуем ответ: если модель вернула JSON с suggestions — формируем готовые предложения.
      let suggestions: any[] = [];
      try {
        const parsed = JSON.parse(cleaned);

        // Case: structured suggestions returned
        if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length) {
          suggestions = parsed.suggestions.map((s: any, idx: number) => {
            let text = String(s.text || s || '').trim();
            if (text.startsWith('```')) text = this.sanitizeJsonText(text);
            text = text.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 300) text = text.slice(0, 297).trim() + '...';
            return {
              text: text,
              description: s.description || `Вариант ${idx + 1}`
            };
          });
        }
        // Case: raw array of strings
        else if (Array.isArray(parsed) && parsed.length) {
          suggestions = parsed.map((s: any, idx: number) => {
            let text = String(s || '').trim();
            if (text.startsWith('```')) text = this.sanitizeJsonText(text);
            text = text.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 300) text = text.slice(0, 297).trim() + '...';
            return {
              text: text,
              description: `Вариант ${idx + 1}`
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
        suggestions = alternatives.map((text, idx) => {
          let msg = String(text || '').trim();
          if (msg.startsWith('```')) msg = this.sanitizeJsonText(msg);
          msg = msg.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
          if (msg.length > 300) msg = msg.slice(0, 297).trim() + '...';
          return {
            text: msg,
            description: `Вариант ${idx + 1}`
          };
        });
      }

      // Ограничим до 5 вариантов
      if (!suggestions || suggestions.length === 0) suggestions = [{ text: cleaned.replace(/\r?\n+/g, ' ').trim().slice(0, 300), description: 'Вариант 1' }];
      suggestions = suggestions.slice(0, 5);

      await this.prisma.activityLog.create({
        data: {
          userId: userId ?? null,
          type: 'API_REQUEST',
          action: 'AI_GENERATE_ACTIONS_SUCCESS',
          description: `Generated ${suggestions.length} message suggestions`,
          method: 'POST',
          url: '/ai-assistant/generate-actions',
          requestData: { message: message?.substring(0, 2000), context },
          responseData: { suggestionsCount: suggestions.length },
          success: true
        }
      });

      return { success: true, suggestions, raw: cleaned, logId: logEntry.id };
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
      throw new BadRequestException(`Failed to generate message suggestions from LLM: ${errMsg}`);
    }
  }
}
