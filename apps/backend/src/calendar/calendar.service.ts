import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: number, createEventDto: CreateEventDto) {
    const {
      title,
      description,
      startDate,
      endDate,
      isAllDay = false,
      location,
      participantIds = [],
      color = '#3B82F6',
      isRecurring = false,
      recurrenceRule,
      timezone = 'Asia/Almaty',
    } = createEventDto;

    // Проверяем, что все участники существуют
    if (participantIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: participantIds } },
      });

      if (users.length !== participantIds.length) {
        throw new NotFoundException('Один или несколько участников не найдены');
      }
    }

    // Создаем событие
    const event = await this.prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isAllDay,
        location,
        color,
        isRecurring,
        recurrenceRule,
        timezone,
        createdById: userId,
        participants: {
          create: [
            // Добавляем создателя как участника
            { userId, status: 'ACCEPTED' },
            // Добавляем остальных участников
            ...participantIds
              .filter(id => id !== userId)
              .map(participantId => ({
                userId: participantId,
                status: 'PENDING' as const,
              })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    return event;
  }

  async getUserEvents(userId: number, filterDto: EventFilterDto = {}) {
    const { startDate, endDate, search, timezone = 'Asia/Almaty' } = filterDto;

    const where: any = {
      participants: {
        some: {
          userId,
        },
      },
      deletedAt: null,
    };

    // Фильтр по датам
    if (startDate || endDate) {
      where.OR = [
        // События, которые начинаются в указанном периоде
        {
          startDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        },
        // События, которые заканчиваются в указанном периоде
        {
          endDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        },
        // События, которые охватывают весь указанный период
        {
          AND: [
            ...(startDate ? [{ startDate: { lte: new Date(startDate) } }] : []),
            ...(endDate ? [{ endDate: { gte: new Date(endDate) } }] : []),
          ],
        },
      ];
    }

    // Поиск по названию
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
        reminders: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return events;
  }

  async getEventById(eventId: number, userId: number) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
        reminders: {
          where: {
            userId,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    // Проверяем, что пользователь является участником события
    const isParticipant = event.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('У вас нет доступа к этому событию');
    }

    return event;
  }

  async updateEvent(eventId: number, userId: number, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    // Проверяем права на редактирование (только создатель может редактировать)
    if (event.createdById !== userId) {
      throw new ForbiddenException('Только создатель может редактировать событие');
    }

    const {
      participantIds,
      startDate,
      endDate,
      ...updateData
    } = updateEventDto;

    // Обновляем основные данные события
    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...updateData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    // Если переданы новые участники, обновляем их
    if (participantIds !== undefined) {
      // Удаляем старых участников (кроме создателя)
      await this.prisma.eventParticipant.deleteMany({
        where: {
          eventId,
          userId: { not: userId },
        },
      });

      // Добавляем новых участников
      const newParticipants = participantIds
        .filter(id => id !== userId)
        .map(participantId => ({
          eventId,
          userId: participantId,
          status: 'PENDING' as const,
        }));

      if (newParticipants.length > 0) {
        await this.prisma.eventParticipant.createMany({
          data: newParticipants,
        });
      }
    }

    return updatedEvent;
  }

  async deleteEvent(eventId: number, userId: number) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    // Проверяем права на удаление (только создатель может удалить)
    if (event.createdById !== userId) {
      throw new ForbiddenException('Только создатель может удалить событие');
    }

    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async updateParticipantStatus(
    eventId: number,
    userId: number,
    status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
    comment?: string,
  ) {
    const participation = await this.prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!participation) {
      throw new NotFoundException('Вы не являетесь участником этого события');
    }

    const updatedParticipation = await this.prisma.eventParticipant.update({
      where: { id: participation.id },
      data: {
        status,
        comment,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    return updatedParticipation;
  }

  async createReminder(
    eventId: number,
    userId: number,
    minutes: number,
    method: string = 'email',
  ) {
    // Проверяем, что пользователь является участником события
    const participation = await this.prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!participation) {
      throw new ForbiddenException('Вы не являетесь участником этого события');
    }

    // Проверяем, нет ли уже такого напоминания
    const existingReminder = await this.prisma.eventReminder.findFirst({
      where: {
        eventId,
        userId,
        minutes,
      },
    });

    if (existingReminder) {
      return existingReminder;
    }

    const reminder = await this.prisma.eventReminder.create({
      data: {
        eventId,
        userId,
        minutes,
        method,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
    });

    return reminder;
  }

  async deleteReminder(reminderId: number, userId: number) {
    const reminder = await this.prisma.eventReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new NotFoundException('Напоминание не найдено');
    }

    if (reminder.userId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои напоминания');
    }

    await this.prisma.eventReminder.delete({
      where: { id: reminderId },
    });

    return { success: true };
  }

  async getTodaysEvents(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        deletedAt: null,
        OR: [
          {
            startDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            endDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            AND: [
              { startDate: { lte: startOfDay } },
              { endDate: { gte: endOfDay } },
            ],
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return events;
  }
}
