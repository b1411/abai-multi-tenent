import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ParentsService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  async create(createParentDto: CreateParentDto) {
    // Проверяем существование пользователя
    const user = await this.prisma.user.findFirst({
      where: { 
        id: createParentDto.userId, 
        role: 'PARENT',
        deletedAt: null 
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createParentDto.userId} not found or is not a parent`);
    }

    // Проверяем, не является ли пользователь уже родителем
    const existingParent = await this.prisma.parent.findFirst({
      where: { 
        userId: createParentDto.userId,
        deletedAt: null 
      },
    });

    if (existingParent) {
      throw new ConflictException('User is already a parent');
    }

    const parent = await this.prisma.parent.create({
      data: createParentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Автоматически создаем чаты для нового родителя
    try {
      await this.createDefaultChatsForParent(createParentDto.userId);
    } catch (error) {
      console.error('Error creating default chats for new parent:', error);
      // Не прерываем процесс создания родителя, если возникли проблемы с чатами
    }

    return parent;
  }

  async findAll() {
    return this.prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async findOne(id: number) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async update(id: number, updateParentDto: UpdateParentDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.parent.update({
      where: { id },
      data: updateParentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для родителей

  async findByUser(userId: number) {
    return this.prisma.parent.findFirst({
      where: { 
        userId,
        deletedAt: null 
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async getParentStatistics() {
    const totalParents = await this.prisma.parent.count({
      where: { deletedAt: null },
    });

    const recentParents = await this.prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalParents,
      recentParents,
    };
  }

  async searchParents(query: string) {
    return this.prisma.parent.findMany({
      where: {
        deletedAt: null,
        OR: [
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { surname: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
      take: 20,
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async getParentChildren(parentId: number) {
    const parent = await this.findOne(parentId); // Проверяем существование родителя

    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        Parents: {
          some: {
            id: parentId,
            deletedAt: null,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            courseNumber: true,
          },
        },
        lessonsResults: {
          select: {
            id: true,
            lessonScore: true,
            homeworkScore: true,
            attendance: true,
            createdAt: true,
            Lesson: {
              select: {
                id: true,
                name: true,
                date: true,
                studyPlan: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Последние 10 результатов для быстрой загрузки
        },
      },
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async getCurrentParentChildren(userId: number) {
    // Сначала находим родителя по ID пользователя
    const parent = await this.findByUser(userId);
    
    if (!parent) {
      throw new NotFoundException(`Parent with user ID ${userId} not found`);
    }

    // Возвращаем детей найденного родителя
    return this.getParentChildren(parent.id);
  }

  // Методы для автоматического создания чатов

  async createDefaultChatsForParent(parentUserId: number) {
    try {
      // Находим родителя
      const parent = await this.findByUser(parentUserId);
      if (!parent) {
        throw new NotFoundException('Parent not found');
      }

      // Получаем детей родителя
      const children = await this.getParentChildren(parent.id);
      
      const createdChats = [];

      // Создаем чаты с учителями детей
      for (const child of children) {
        // Получаем учителей, которые ведут занятия у ребенка
        const teachers = await this.getChildTeachers(child.id);
        
        for (const teacher of teachers) {
          try {
            const chat = await this.chatService.createChat(parentUserId, {
              participantIds: [teacher.userId],
              name: `${teacher.user.name} ${teacher.user.surname} - ${child.user.name} ${child.user.surname}`,
              isGroup: false,
            });
            createdChats.push({
              chatId: chat.id,
              type: 'teacher',
              teacher: teacher.user,
              student: child.user,
            });
          } catch (error) {
            // Если чат уже существует, игнорируем ошибку
            console.log(`Chat with teacher ${teacher.user.name} already exists for parent ${parentUserId}`);
          }
        }
      }

      // Создаем чаты с администрацией
      const adminUsers = await this.getAdministrationUsers();
      
      for (const admin of adminUsers) {
        try {
          const chat = await this.chatService.createChat(parentUserId, {
            participantIds: [admin.id],
            name: `${admin.name} ${admin.surname} (${this.getRoleDisplayName(admin.role)})`,
            isGroup: false,
          });
          createdChats.push({
            chatId: chat.id,
            type: 'admin',
            admin: admin,
          });
        } catch (error) {
          // Если чат уже существует, игнорируем ошибку
          console.log(`Chat with admin ${admin.name} already exists for parent ${parentUserId}`);
        }
      }

      return createdChats;
    } catch (error) {
      console.error('Error creating default chats for parent:', error);
      throw error;
    }
  }

  private async getChildTeachers(studentId: number) {
    // Получаем учителей через планы обучения группы студента
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        group: {
          include: {
            studyPlans: {
              include: {
                teacher: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student?.group) {
      return [];
    }

    // Убираем дубликаты учителей
    const teachersMap = new Map();
    student.group.studyPlans.forEach(plan => {
      if (plan.teacher && !teachersMap.has(plan.teacher.userId)) {
        teachersMap.set(plan.teacher.userId, plan.teacher);
      }
    });

    return Array.from(teachersMap.values());
  }

  private async getAdministrationUsers() {
    // Получаем пользователей с административными ролями
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'FINANCIST', 'HR'] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
  }

  private getRoleDisplayName(role: string): string {
    const roleNames = {
      'ADMIN': 'Администратор',
      'FINANCIST': 'Финансист',
      'HR': 'HR-менеджер',
    };
    return roleNames[role] || role;
  }

  async setupParentChats(parentUserId: number) {
    // Метод для настройки чатов родителя (можно вызвать при создании родителя или по запросу)
    return this.createDefaultChatsForParent(parentUserId);
  }

  async refreshParentChats(parentUserId: number) {
    // Метод для обновления чатов родителя (например, при изменении состава учителей)
    return this.createDefaultChatsForParent(parentUserId);
  }
}
