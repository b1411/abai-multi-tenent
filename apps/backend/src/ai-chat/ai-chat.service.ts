import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiTutorsService } from '../ai-tutors/ai-tutors.service';
import OpenAI from 'openai';

type SendMessageInput = {
  content: string;
  attachments?: any;
};

@Injectable()
export class AiChatService {
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private prisma: PrismaService, private tutors: AiTutorsService) { }

  // --- Threads ---

  listThreads(ownerId: number, tutorId?: number) {
    return this.prisma.aiChatThread.findMany({
      where: {
        ownerId,
        deletedAt: null,
        ...(tutorId ? { tutorId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        tutorId: true,
        createdAt: true,
        updatedAt: true,
        tutor: {
          select: {
            id: true,
            subject: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async upsertThread(ownerId: number, tutorId: number, title?: string | null) {
    // ensure tutor exists and is visible to the user (public or created by user)
    const tutor = await this.prisma.aiTutor.findFirst({
      where: {
        id: tutorId,
        deletedAt: null,
        OR: [{ isPublic: true }, { createdBy: ownerId }],
      },
      select: { id: true },
    });
    if (!tutor) throw new NotFoundException('Tutor not found or not accessible');

    const thread = await this.prisma.aiChatThread.upsert({
      where: { tutorId_ownerId: { tutorId, ownerId } },
      update: { title: title ?? undefined, updatedAt: new Date() },
      create: { tutorId, ownerId, title: title ?? null },
      select: {
        id: true,
        title: true,
        tutorId: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return thread;
  }

  async getThread(ownerId: number, threadId: number) {
    const t = await this.prisma.aiChatThread.findFirst({
      where: { id: threadId, ownerId, deletedAt: null },
      include: {
        tutor: { select: { id: true, subject: true, name: true, avatarUrl: true } },
      },
    });
    if (!t) throw new NotFoundException('Thread not found');
    return t;
  }

  // --- Messages ---

  async listMessages(ownerId: number, threadId: number, limit = 100, beforeId?: number) {
    // ownership check
    const thr = await this.prisma.aiChatThread.findFirst({ where: { id: threadId, ownerId, deletedAt: null } });
    if (!thr) throw new ForbiddenException('Access denied');

    // determine cursor (messages strictly earlier than cursor)
    let cursorDate: Date;
    if (beforeId) {
      const ref = await this.prisma.aiChatMessage.findFirst({
        where: { id: beforeId, threadId },
        select: { createdAt: true },
      });
      cursorDate = ref?.createdAt ?? new Date();
    } else {
      cursorDate = new Date();
    }

    const lim = Math.max(1, Math.min(500, limit));

    // fetch previous chunk ordered desc, then reverse to asc for UI
    const msgsDesc = await this.prisma.aiChatMessage.findMany({
      where: { threadId, createdAt: { lt: cursorDate } },
      orderBy: { createdAt: 'desc' },
      take: lim,
      select: { id: true, role: true, content: true, attachments: true, createdAt: true },
    });

    return msgsDesc.reverse();
  }

  async sendMessage(ownerId: number, threadId: number, input: SendMessageInput) {
    this.ensureKey();

    // ownership check + fetch tutorId
    const thr = await this.prisma.aiChatThread.findFirst({
      where: { id: threadId, ownerId, deletedAt: null },
      select: { id: true, tutorId: true },
    });
    if (!thr) throw new ForbiddenException('Access denied');

    // persist user message
    await this.prisma.aiChatMessage.create({
      data: {
        threadId,
        role: 'user',
        content: input.content,
        attachments: input.attachments ?? null,
      },
    });

    // build system prompt from tutor
    const systemPrompt = await this.tutors.buildPrompt(thr.tutorId);

    // load full history (ascending)
    const history = await this.prisma.aiChatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    // windowing: keep last ~60k chars of conversation to respect token limits
    const MAX_CHARS = 60000;
    const trimmedHistory = this.tailByChars(history, MAX_CHARS);

    // Responses API: simple instructions + single input string
    const inputText = trimmedHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    // call OpenAI Responses API (with optional file_search via vector store)
    const tutor = await this.prisma.aiTutor.findUnique({
      where: { id: thr.tutorId },
      select: { vectorStoreId: true },
    });

    const payload: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
      model: 'gpt-4.1',
      instructions: systemPrompt,
      input: inputText,
      temperature: 0.7,
    };

    if (tutor?.vectorStoreId) {
      payload.tools = [
        {
          type: 'file_search',
          vector_store_ids: [tutor.vectorStoreId],
        },
      ];
    }

    let data: any;
    try {
      data = await this.openai.responses.create(payload);
    } catch (e: any) {
      throw new Error(`OpenAI error: ${e?.message || String(e)}`);
    }
    const reply = this.extractResponsesText(data) ?? '';

    // persist assistant reply
    const saved = await this.prisma.aiChatMessage.create({
      data: {
        threadId,
        role: 'assistant',
        content: reply,
      },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    // touch thread
    await this.prisma.aiChatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

    return { message: saved };
  }

  // --- helpers ---

  private ensureKey() {
    if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY is not configured');
  }

  private extractResponsesText(data: any): string {
    if (typeof data?.output_text === 'string') return data.output_text;
    const t2 = data?.output?.[0]?.content?.find((c: any) => c?.type?.includes('text'))?.text;
    if (typeof t2 === 'string') return t2;
    const t3 = data?.content?.[0]?.text;
    if (typeof t3 === 'string') return t3;
    const t4 = data?.choices?.[0]?.message?.content;
    if (typeof t4 === 'string') return t4;
    return JSON.stringify(data);
  }

  private tailByChars(items: { role: string; content: string }[], maxChars: number) {
    let total = 0;
    const out: { role: string; content: string }[] = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const c = items[i].content ?? '';
      const len = c.length;
      if (total + len > maxChars) break;
      out.push(items[i]);
      total += len;
    }
    return out.reverse();
  }
}
