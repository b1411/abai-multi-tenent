import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProctoringSessionDto, ProctoringResultDto } from './dto/create-proctoring.dto';

@Injectable()
export class ProctoringService {
    constructor(private prisma: PrismaService) { }

  async createSession(userId: number, dto: CreateProctoringSessionDto) {
    // Проверяем существование домашнего задания
    const homework = await this.prisma.homework.findUnique({
      where: { id: dto.homeworkId },
      include: { lesson: true }
    });

    if (!homework) {
      throw new NotFoundException('Домашнее задание не найдено');
    }

    // Находим студента по userId
    const student = await this.prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    // Создаем сессию прокторинга
    const session = await this.prisma.proctoringSession.create({
      data: {
        homeworkId: dto.homeworkId,
        studentId: student.id,
        lessonId: dto.lessonId || homework.lesson?.id,
        topic: dto.topic || homework.lesson?.name || 'Прокторинг',
        startedAt: new Date(),
        status: 'ACTIVE'
      }
    });

    return session;
  }    async endSession(sessionId: number, results?: ProctoringResultDto) {
        const session = await this.prisma.proctoringSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            throw new NotFoundException('Сессия прокторинга не найдена');
        }

        // Обновляем сессию
        const updatedSession = await this.prisma.proctoringSession.update({
            where: { id: sessionId },
            data: {
                endedAt: new Date(),
                status: 'COMPLETED',
                score: results?.score,
                comment: results?.comment,
                analysisResults: results?.analysisResults
            }
        });

        return updatedSession;
    }

    async getSession(sessionId: number) {
        const session = await this.prisma.proctoringSession.findUnique({
            where: { id: sessionId },
            include: {
                homework: {
                    include: {
                        lesson: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true
                            }
                        }
                    }
                }
            }
        });

        if (!session) {
            throw new NotFoundException('Сессия прокторинга не найдена');
        }

        return session;
    }

    async getHomeworkProctoringSessions(homeworkId: number) {
        return await this.prisma.proctoringSession.findMany({
            where: { homeworkId },
            include: {
                student: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true
                            }
                        }
                    }
                }
            },
            orderBy: { startedAt: 'desc' }
        });
    }

    async getStudentProctoringSessions(studentId: number) {
        return await this.prisma.proctoringSession.findMany({
            where: { studentId },
            include: {
                homework: {
                    include: {
                        lesson: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' }
        });
    }

    async getAllSessions(filters: {
        status?: string;
        studentId?: number;
        homeworkId?: number;
        page?: number;
        limit?: number;
    }) {
        const { status, studentId, homeworkId, page = 1, limit = 10 } = filters;

        const where: any = {};
        if (status) where.status = status;
        if (studentId) where.studentId = studentId;
        if (homeworkId) where.homeworkId = homeworkId;

        const sessions = await this.prisma.proctoringSession.findMany({
            where,
            select: {
                id: true,
                studentId: true,
                homeworkId: true,
                status: true,
                score: true,
                comment: true,
                analysisResults: true,
                createdAt: true,
                startedAt: true,
                endedAt: true,
                transcript: true,
                homework: {
                    include: {
                        lesson: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        const total = await this.prisma.proctoringSession.count({ where });

        return {
            sessions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async addMessageToTranscript(sessionId: number, message: {
        type: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        isAudio?: boolean;
    }) {
        console.log('Adding message to transcript:', sessionId, message);

        const session = await this.prisma.proctoringSession.findUnique({
            where: { id: sessionId },
            select: { transcript: true }
        });

        if (!session) {
            throw new NotFoundException('Сессия прокторинга не найдена');
        }

        const currentTranscript = (session.transcript as any[]) || [];
        const updatedTranscript = [...currentTranscript, message];

        console.log('Current transcript length:', currentTranscript.length, 'New length:', updatedTranscript.length);

        await this.prisma.proctoringSession.update({
            where: { id: sessionId },
            data: { transcript: updatedTranscript }
        });

        console.log('Message added to transcript successfully');
    }

    async addViolation(sessionId: number, violation: {
        type: string;
        description: string;
        screenshot: string;
        timestamp: Date;
    }) {
        const session = await this.prisma.proctoringSession.findUnique({
            where: { id: sessionId },
            select: { analysisResults: true }
        });

        if (!session) {
            throw new NotFoundException('Сессия прокторинга не найдена');
        }

        const currentResults = (session.analysisResults as any[]) || [];
        const updatedResults = [...currentResults, violation];

        await this.prisma.proctoringSession.update({
            where: { id: sessionId },
            data: { analysisResults: updatedResults }
        });
    }
}
