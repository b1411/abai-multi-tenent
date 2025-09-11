import { Injectable, NotFoundException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

type CreateTutorInput = {
  subject: string;
  name?: string | null;
  avatarUrl?: string | null;
  extraInstructions?: string | null;
  isPublic?: boolean;
  createdBy: number;
};

type UpdateTutorInput = {
  subject?: string;
  name?: string | null;
  avatarUrl?: string | null;
  extraInstructions?: string | null;
  isPublic?: boolean;
};

@Injectable()
export class AiTutorsService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  constructor(private prisma: PrismaService) {}

  // Visible to all authenticated users: public tutors + user's private
  async list(userId?: number) {
    const rows = await this.prisma.aiTutor.findMany({
      where: {
        deletedAt: null,
        OR: [{ isPublic: true }, { createdBy: userId ?? -1 }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        subject: true,
        name: true,
        avatarUrl: true,
        isPublic: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Deduplicate by subject: prefer user's own, then named, then most recently updated
    const map = new Map<string, any>();
    for (const t of rows) {
      const key = (t.subject || '').toLowerCase().trim();
      const prev = map.get(key);
      if (!prev) {
        map.set(key, t);
        continue;
      }
      const a = prev;
      const b = t;

      const aOwned = a.createdBy === userId;
      const bOwned = b.createdBy === userId;
      if (aOwned !== bOwned) {
        map.set(key, aOwned ? a : b);
        continue;
      }

      const aNamed = !!(a.name && a.name.trim());
      const bNamed = !!(b.name && b.name.trim());
      if (aNamed !== bNamed) {
        map.set(key, aNamed ? a : b);
        continue;
      }

      const aRecent = new Date(a.updatedAt).getTime();
      const bRecent = new Date(b.updatedAt).getTime();
      map.set(key, aRecent >= bRecent ? a : b);
    }

    const result = Array.from(map.values());
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }

  async getOne(id: number) {
    const t = await this.prisma.aiTutor.findFirst({
      where: { id, deletedAt: null },
      include: {
        files: { include: { file: true } },
      },
    });
    if (!t) throw new NotFoundException('Tutor not found');
    return t;
  }

  async create(data: CreateTutorInput) {
    const subject = (data.subject || '').trim();

    // Prefer user's own tutor by subject; otherwise reuse any existing by subject
    const existingOwned = await this.prisma.aiTutor.findFirst({
      where: {
        deletedAt: null,
        createdBy: data.createdBy,
        subject: { equals: subject, mode: 'insensitive' },
      },
      select: { id: true },
    });

    const existingAny = existingOwned
      ? null
      : await this.prisma.aiTutor.findFirst({
          where: {
            deletedAt: null,
            subject: { equals: subject, mode: 'insensitive' },
          },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });

    const targetId = existingOwned?.id ?? existingAny?.id ?? null;

    if (targetId) {
      return this.prisma.aiTutor.update({
        where: { id: targetId },
        data: {
          subject,
          name: data.name ?? undefined,
          avatarUrl: data.avatarUrl ?? undefined,
          extraInstructions: data.extraInstructions ?? undefined,
          isPublic: data.isPublic ?? undefined,
        },
        select: {
          id: true,
          subject: true,
          name: true,
          avatarUrl: true,
          isPublic: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.aiTutor.create({
      data: {
        subject,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
        extraInstructions: data.extraInstructions ?? null,
        isPublic: data.isPublic ?? true,
        createdBy: data.createdBy,
      },
      select: {
        id: true,
        subject: true,
        name: true,
        avatarUrl: true,
        isPublic: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: number, data: UpdateTutorInput) {
    await this.ensureExists(id);
    return this.prisma.aiTutor.update({
      where: { id },
      data: {
        subject: data.subject,
        name: data.name,
        avatarUrl: data.avatarUrl,
        extraInstructions: data.extraInstructions,
        isPublic: data.isPublic,
      },
      select: {
        id: true,
        subject: true,
        name: true,
        avatarUrl: true,
        isPublic: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.aiTutor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // Link files and rebuild knowledgeText from ALL linked files
  async ingestFiles(tutorId: number, fileIds: number[]) {
    const tutor = await this.ensureExists(tutorId);

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return { success: true, linked: 0, knowledgeSize: tutor.knowledgeText?.length ?? 0 };
    }

    // Ensure files exist
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileIds } },
    });

    // Link files (skip existing)
    await this.prisma.aiTutorFile.createMany({
      data: files.map((f) => ({ aiTutorId: tutorId, fileId: f.id })),
      skipDuplicates: true,
    });

    // Fetch all linked files and rebuild knowledge
    const linked = await this.prisma.aiTutorFile.findMany({
      where: { aiTutorId: tutorId },
      include: { file: true },
    });

    const parts: string[] = [];
    for (const lf of linked) {
      const f = lf.file;
      try {
        const buf = await this.fetchBuffer(f.url);
        const text = await this.extractText(buf, f.mime || f.type || '');
        const header = `=== ${f.name || `file-${f.id}`} (${f.mime || f.type || 'unknown'}) ===`;
        parts.push(`${header}\n${(text || '').trim()}\n`);
      } catch (e: any) {
        parts.push(`=== ${f.name || `file-${f.id}`} ===\n[INGEST ERROR: ${e?.message || String(e)}]\n`);
      }
    }

    // Build the combined knowledge text (sanitize then truncate)
    const MAX_CHARS = 180_000;
    let combined = parts.join('\n');
    // Sanitize: remove control chars except TAB(0x09) LF(0x0A) CR(0x0D)
    combined = combined
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/\u0000/g, '');
    // Collapse >2 blank lines
    combined = combined.replace(/\n{3,}/g, '\n\n');
    if (combined.length > MAX_CHARS) combined = combined.slice(0, MAX_CHARS);

    await this.prisma.aiTutor.update({
      where: { id: tutorId },
      data: { knowledgeText: combined },
    });

    // OpenAI Vector Store integration (non-fatal on error)
    let vsId: string | undefined;
    let uploaded = 0;
    try {
      if (files.length > 0) {
        vsId = await this.ensureVectorStore(tutorId);
        for (const f of files) {
          try {
            const buf = await this.fetchBuffer(f.url);
            const fileName = f.name || `file-${f.id}`;
            const mime = (f as any).mime || (f as any).type || 'application/octet-stream';
            const uploadedFile = await this.openai.files.create({
              file: await toFile(buf, fileName, { type: mime }),
              purpose: 'assistants',
            });
            const vsFile = await this.openai.vectorStores.files.create(vsId, {
              file_id: (uploadedFile as any).id,
            });
            // Poll ingestion status
            let attempts = 0;
            while (attempts < 30) {
              const cur = await this.openai.vectorStores.files.retrieve(vsId, (vsFile as any).id);
              const status = (cur as any)?.status;
              if (status === 'completed' || status === 'failed') break;
              await new Promise((r) => setTimeout(r, 1000));
              attempts++;
            }
            uploaded++;
          } catch {
            // continue on per-file error
          }
        }
      }
    } catch {
      // ignore vector store errors
    }

    return { success: true, linked: files.length, knowledgeSize: combined.length, vectorStoreId: vsId, uploadedToVectorStore: uploaded };
  }

  // Build system prompt for realtime session.update or text chat
  async buildPrompt(tutorId: number): Promise<string> {
    const tutor = await this.prisma.aiTutor.findFirst({
      where: { id: tutorId, deletedAt: null },
      select: {
        subject: true,
        extraInstructions: true,
        knowledgeText: true,
        name: true,
      },
    });
    if (!tutor) throw new NotFoundException('Tutor not found');

    const intro = `Ты — AI-тьютор${tutor.name ? ` "${tutor.name}"` : ''} по предмету "${tutor.subject}".`;
    const style = 'Отвечай кратко, по делу, профессионально и дружелюбно. Если ученик допускает ошибки, корректно поправляй и объясняй коротко с примерами.';
    const extra = (tutor.extraInstructions || '').trim();
    const knowledge = (tutor.knowledgeText || '').trim();

    // Limit knowledge chunk to reduce context bloat
    const MAX_KNOWLEDGE = 60_000;
    const knowledgeChunk = knowledge ? knowledge.slice(0, MAX_KNOWLEDGE) : '';

    const prompt = [
      intro,
      style,
      extra ? `Доп. инструкции: ${extra}` : '',
      knowledgeChunk ? `База знаний (фрагмент):\n${knowledgeChunk}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return prompt;
  }

  // --- helpers ---

  private async ensureVectorStore(tutorId: number): Promise<string> {
    const t = (await this.prisma.aiTutor.findUnique({
      where: { id: tutorId },
    })) as any;
    if (t?.vectorStoreId) return t.vectorStoreId as string;
    const vs = await this.openai.vectorStores.create({ name: `ai_tutor_${tutorId}` });
    const vsId = (vs as any).id as string;
    await (this.prisma.aiTutor as any).update({ where: { id: tutorId }, data: { vectorStoreId: vsId } });
    return vsId;
  }

  private async ensureExists(id: number) {
    const t = await this.prisma.aiTutor.findFirst({ where: { id, deletedAt: null } });
    if (!t) throw new NotFoundException('Tutor not found');
    return t;
  }

  private async fetchBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  private async extractText(buf: Buffer, mime: string): Promise<string | null> {
    const m = (mime || '').toLowerCase();
    try {
      if (m.includes('pdf')) {
        const data = await pdfParse(buf);
        return data.text || '';
      }
      if (
        m.includes('openxmlformats-officedocument.wordprocessingml') ||
        m.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        m.includes('application/docx')
      ) {
        const docx = await mammoth.extractRawText({ buffer: buf });
        return docx.value || '';
      }
      if (m.includes('text/') || m.includes('application/json') || m.includes('application/xml') || m.includes('csv') || m.includes('rtf')) {
        return buf.toString('utf-8');
      }
      // Fallback: treat as text if the head has mostly printable ASCII chars
      const head = buf.slice(0, 1024).toString('utf-8');
      let printable = 0;
      for (let i = 0; i < head.length; i++) {
        const code = head.charCodeAt(i);
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) printable++;
      }
      if (printable / Math.max(1, head.length) > 0.8) return buf.toString('utf-8');
      return null;
    } catch {
      return null;
    }
  }
}
