import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    // Проверяем уникальность email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Создаем пользователя без пароля в ответе
     
    const { password, ...userData } = createUserDto;

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        student: {
          include: {
            group: true,
          },
        },
        teacher: {
          include: {
            studyPlans: {
              where: { deletedAt: null },
              take: 5,
            },
          },
        },
        parent: {
          include: {
            students: {
              where: { deletedAt: null },
              include: {
                user: true,
                group: true,
              },
            },
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { surname: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        student: {
          include: {
            group: {
              include: {
                studyPlans: {
                  where: { deletedAt: null },
                  include: {
                    teacher: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
            Parents: {
              include: {
                user: true,
              },
            },
            lessonsResults: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                Lesson: true,
              },
            },
          },
        },
        teacher: {
          include: {
            studyPlans: {
              where: { deletedAt: null },
              include: {
                group: true,
                lessons: {
                  where: { deletedAt: null },
                  take: 5,
                  orderBy: { date: 'desc' },
                },
              },
            },
            schedules: {
              where: { deletedAt: null },
              include: {
                studyPlan: true,
                group: true,
                classroom: true,
              },
            },
          },
        },
        parent: {
          include: {
            students: {
              where: { deletedAt: null },
              include: {
                user: true,
                group: true,
                lessonsResults: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                  include: {
                    Lesson: true,
                  },
                },
              },
            },
          },
        },
        Notification: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        hashedPassword: true, // Нужен для аутентификации
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Проверяем существование

    let updateData: any = { ...updateUserDto };

    // Если обновляется пароль, хешируем его
    if (updateUserDto.password) {
      const { password, ...rest } = updateUserDto;
      updateData = {
        ...rest,
        hashedPassword: await bcrypt.hash(password, 12),
      };
    }

    // Если обновляется email, проверяем уникальность
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        deletedAt: true,
      },
    });
  }

  // Специальные методы для пользователей
  async findByRole(role: string, userId?: number) {
    if (role === 'TEACHER' && userId) {
      // Получаем группу студента
      const student = await this.prisma.student.findUnique({
        where: { userId },
        select: { groupId: true }
      });
      if (!student) return [];
      // Находим всех учителей, у которых есть учебные планы для этой группы
      return this.prisma.user.findMany({
        where: {
          role: 'TEACHER',
          deletedAt: null,
          teacher: {
            studyPlans: {
              some: {
                group: {
                  some: {
                    id: student.groupId
                  }
                }
              }
            }
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          phone: true,
          middlename: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: [
          { surname: 'asc' },
          { name: 'asc' },
        ],
      });
    }
    // Обычная фильтрация по роли
    return this.prisma.user.findMany({
      where: {
        role: role as any,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { surname: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        middlename: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      take: 20,
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getUserStatistics() {
    const totalUsers = await this.prisma.user.count({
      where: { deletedAt: null },
    });

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: true,
    });

    const recentUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalUsers,
      usersByRole,
      recentUsers,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Проверяем старый пароль
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.hashedPassword);
    if (!isOldPasswordValid) {
      throw new ConflictException('Old password is incorrect');
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: hashedNewPassword },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        updatedAt: true,
      },
    });
  }
}
