import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { AttendanceSession, AttendanceSessionParticipant, UserRole } from 'generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceSessionDto, AttendanceSessionParticipantDto } from './dto/create-attendance-session.dto';
import { AttendanceSessionResponseDto } from './dto/attendance-session-response.dto';
import { AttendanceCheckInDto } from './dto/check-in.dto';
import { AttendanceCheckInResponseDto } from './dto/attendance-check-in-response.dto';

const DEFAULT_TTL_MINUTES = 5;
const CHECK_IN_PATH = '/attendance/check-in';
const START_BUFFER_MINUTES = 15;
const END_BUFFER_MINUTES = 60;

@Injectable()
export class AttendanceSessionsService {
  private readonly ttlMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const ttl = Number(
      this.configService.get<string>('ATTENDANCE_SESSION_TTL_MINUTES') ??
      process.env.ATTENDANCE_SESSION_TTL_MINUTES ??
      DEFAULT_TTL_MINUTES,
    );
    this.ttlMinutes = Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_MINUTES;
  }

  async createSession(dto: CreateAttendanceSessionDto, currentUser: { id: number; role: UserRole }): Promise<AttendanceSessionResponseDto> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: dto.scheduleItemId },
    });

    if (!schedule || schedule.deletedAt) {
      throw new NotFoundException('Schedule item not found or has been removed');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: currentUser.id } });
      if (!teacher || teacher.deletedAt) {
        throw new ForbiddenException('Teacher profile not found');
      }
      if (teacher.id !== schedule.teacherId) {
        throw new ForbiddenException("You cannot create a QR session for another teacher's lesson");
      }
    }

    const occursAt = new Date(dto.occursAt);
    if (Number.isNaN(occursAt.getTime())) {
      throw new BadRequestException('Invalid lesson date');
    }

    const expiresAt = new Date(occursAt.getTime() + this.ttlMinutes * 60 * 1000);
    const participant = this.mapParticipant(dto.participantType);
    const token = randomBytes(24).toString('hex');

    await this.invalidateActiveSessions(dto.scheduleItemId);

    const session = await this.prisma.attendanceSession.create({
      data: {
        scheduleId: dto.scheduleItemId,
        occursAt,
        expiresAt,
        participantType: participant,
        token,
        createdByUserId: currentUser.id,
        metadata: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          type: schedule.type,
        },
      },
    });

    return this.mapToResponse(session);
  }

  async checkIn(dto: AttendanceCheckInDto, currentUser: { id: number; role: UserRole }): Promise<AttendanceCheckInResponseDto> {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { token: dto.token },
      include: {
        schedule: {
          include: {
            teacher: { include: { user: true } },
            group: true,
            classroom: true,
            studyPlan: true,
          },
        },
      },
    });

    if (!session || session.invalidatedAt) {
      throw new NotFoundException('QR session not found or already invalidated');
    }

    const now = new Date();
    if (session.expiresAt.getTime() < now.getTime()) {
      throw new BadRequestException('QR session has expired');
    }

    const { start: scheduledStart, end: scheduledEnd } = this.getScheduleTimeWindow(session.schedule, session.occursAt);
    const earliestAllowed = new Date(scheduledStart.getTime() - START_BUFFER_MINUTES * 60 * 1000);
    const latestAllowed = new Date(Math.max(scheduledEnd.getTime() + END_BUFFER_MINUTES * 60 * 1000, session.expiresAt.getTime()));

    if (now < earliestAllowed) {
      throw new BadRequestException('Check-in is not yet available for this lesson');
    }

    if (now > latestAllowed) {
      throw new BadRequestException('Check-in window for this lesson has closed');
    }

    const participant = this.mapParticipant(dto.participantType);
    if (participant !== session.participantType) {
      throw new ForbiddenException('QR session is not intended for this participant type');
    }

    if (participant === AttendanceSessionParticipant.TEACHER) {
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TEACHER) {
        throw new ForbiddenException('Only teachers can confirm this attendance');
      }

      if (currentUser.role === UserRole.TEACHER) {
        const teacher = await this.prisma.teacher.findUnique({ where: { userId: currentUser.id } });
        if (!teacher || teacher.deletedAt) {
          throw new ForbiddenException('Teacher profile not found');
        }
        if (teacher.id !== session.schedule?.teacherId) {
          throw new ForbiddenException('This QR belongs to another teacher');
        }
      }
    } else {
      if (currentUser.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can use this QR');
      }

      const student = await this.prisma.student.findUnique({ where: { userId: currentUser.id } });
      if (!student || student.deletedAt) {
        throw new ForbiddenException('Student profile not found');
      }

      if (session.schedule?.groupId && student.groupId !== session.schedule.groupId) {
        throw new ForbiddenException('QR does not belong to your group');
      }

      if (session.schedule?.lessonId) {
        await this.prisma.lessonResult.upsert({
          where: { studentId_lessonId: { studentId: student.id, lessonId: session.schedule.lessonId } },
          create: {
            studentId: student.id,
            lessonId: session.schedule.lessonId,
            attendance: true,
            absentReason: null,
            absentComment: null,
          },
          update: {
            attendance: true,
            absentReason: null,
            absentComment: null,
            updatedAt: now,
          },
        });
      }
    }

    const updated = await this.prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        consumedAt: session.consumedAt ?? now,
      },
      include: {
        schedule: {
          include: {
            teacher: { include: { user: true } },
            group: true,
            classroom: true,
            studyPlan: true,
          },
        },
      },
    });

    const schedule = updated.schedule;
    const occursAt = updated.occursAt;
    const lessonDate = schedule?.date ?? occursAt;
    const teacherUser = schedule?.teacher?.user;
    const teacherNameParts = [teacherUser?.surname, teacherUser?.name, teacherUser?.middlename].filter((part): part is string => Boolean(part && part.trim()));
    const teacherName = teacherNameParts.length > 0
      ? teacherNameParts.join(' ')
      : teacherUser?.email ?? 'Преподаватель';

    return {
      lesson: {
        id: updated.scheduleId,
        date: new Date(lessonDate).toISOString(),
        startTime: schedule?.startTime ?? occursAt.toISOString().slice(11, 16),
        endTime: schedule?.endTime ?? '',
        subject: schedule?.studyPlan?.name ?? 'Занятие',
        groupName: schedule?.group?.name ?? undefined,
        classroomName: schedule?.classroom?.name ?? undefined,
        teacherName,
      },
      session: {
        id: updated.id,
        occursAt: occursAt.toISOString(),
        expiresAt: updated.expiresAt.toISOString(),
        consumedAt: updated.consumedAt ? updated.consumedAt.toISOString() : null,
      },
    };
  }

  private combineDateAndTime(dateInput: Date, time?: string | null): Date {
    if (!time) {
      return new Date(dateInput);
    }

    const [hours, minutes] = time.split(':').map((part) => Number(part));
    const combined = new Date(dateInput);
    combined.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return combined;
  }

  private getScheduleTimeWindow(schedule: any, fallback: Date): { start: Date; end: Date } {
    const lessonDate = schedule?.date ? new Date(schedule.date) : new Date(fallback);
    const start = this.combineDateAndTime(lessonDate, schedule?.startTime);
    const end = this.combineDateAndTime(lessonDate, schedule?.endTime);

    if (!schedule?.endTime) {
      end.setTime(start.getTime() + 45 * 60 * 1000); // default 45 minutes
    }

    return { start, end };
  }

  private async invalidateActiveSessions(scheduleId: string): Promise<void> {
    await this.prisma.attendanceSession.updateMany({
      where: {
        scheduleId,
        invalidatedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        invalidatedAt: new Date(),
      },
    });
  }

  private mapParticipant(participant?: AttendanceSessionParticipantDto): AttendanceSessionParticipant {
    if (!participant) {
      return AttendanceSessionParticipant.TEACHER;
    }

    return participant === 'student'
      ? AttendanceSessionParticipant.STUDENT
      : AttendanceSessionParticipant.TEACHER;
  }

  private mapToResponse(session: AttendanceSession): AttendanceSessionResponseDto {
    const baseUrl = (this.configService.get<string>('FRONTEND_URL') ?? process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const checkInUrl = `${baseUrl}${CHECK_IN_PATH}?token=${session.token}`;

    return {
      id: session.id,
      scheduleItemId: session.scheduleId,
      occursAt: session.occursAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      token: session.token,
      checkInUrl,
      qrValue: checkInUrl,
      participantType: session.participantType === AttendanceSessionParticipant.STUDENT ? 'student' : 'teacher',
      createdAt: session.createdAt.toISOString(),
    };
  }
}
