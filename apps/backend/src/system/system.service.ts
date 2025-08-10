import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { CreateSystemUserDto, UpdateSystemUserDto, UserFilterDto } from './dto/user.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { UserRole } from 'generated/prisma';
import * as crypto from 'crypto';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) { }

  // System Settings - пока используем статичные настройки, можно будет расширить в будущем
  async getSystemSettings() {
    return {
      timezone: 'Asia/Almaty',
      dateFormat: 'DD/MM/YYYY',
      defaultLanguage: 'ru',
      maxUploadSize: 10,
      emailServer: 'smtp.gmail.com',
      emailPort: '587',
      emailEncryption: 'TLS',
      notificationsEnabled: true,
      pushNotifications: true,
      emailNotifications: true,
      sessionTimeout: 30,
      maintenance: false,
      debugMode: false,
      backupEnabled: true,
      backupFrequency: 'daily',
      academicHourDuration: await this.getAcademicHourDuration(), // Добавляем академический час
    };
  }

  async updateSystemSettings(settings: UpdateSystemSettingsDto) {
    // В реальном приложении это будет сохраняться в базу данных
    return {
      ...await this.getSystemSettings(),
      ...settings,
    };
  }

  async downloadBackup() {
    // Генерируем backup файл из реальных данных
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      users: await this.prisma.user.count(),
      students: await this.prisma.student.count(),
      teachers: await this.prisma.teacher.count(),
      lessons: await this.prisma.lesson.count(),
    };
    return Buffer.from(JSON.stringify(backupData, null, 2));
  }

  // Users Management - работа с реальными данными
  async getUsers(filter?: UserFilterDto) {
    const where: any = {
      deletedAt: null, // Не показываем удаленных пользователей
    };

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { surname: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.role) {
      where.role = filter.role;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            group: {
              select: {
                name: true,
              },
            },
          },
        },
        teacher: {
          select: {
            employmentType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Ограничиваем количество для производительности
    });

    return users.map(user => ({
      id: user.id.toString(),
      name: `${user.name} ${user.surname}`,
      email: user.email,
      role: user.role.toLowerCase(),
      department: user.student?.group?.name ||
        (user.teacher ? 'Преподавательский состав' : 'Администрация'),
      status: 'active', // В Prisma схеме нет поля status, используем active по умолчанию
      lastLogin: null, // В схеме нет поля lastLogin
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            group: {
              select: {
                name: true,
              },
            },
          },
        },
        teacher: {
          select: {
            employmentType: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      id: user.id.toString(),
      name: `${user.name} ${user.surname}`,
      email: user.email,
      role: user.role.toLowerCase(),
      department: user.student?.group?.name ||
        (user.teacher ? 'Преподавательский состав' : 'Администрация'),
      status: 'active',
      lastLogin: null,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async createUser(data: CreateSystemUserDto) {
    // Проверяем уникальность email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    // Хешируем пароль (в реальном приложении нужно установить bcrypt)
    const hashedPassword = data.password; // Временно без хеширования

    // Определяем роль из enum
    const role = data.role.toUpperCase() as UserRole;
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Неверная роль пользователя');
    }

    const [firstName, ...lastNameParts] = data.name.split(' ');

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: firstName,
        surname: lastNameParts.join(' ') || '',
        hashedPassword,
        role,
        phone: null,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: user.id.toString(),
      name: `${user.name} ${user.surname}`,
      email: user.email,
      role: user.role.toLowerCase(),
      department: data.department || 'Администрация',
      status: 'active',
      lastLogin: null,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUser(id: string, data: UpdateSystemUserDto) {
    const userId = parseInt(id);

    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем уникальность email если он изменяется
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new BadRequestException('Пользователь с таким email уже существует');
      }
    }

    const updateData: any = {};

    if (data.name) {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      updateData.name = firstName;
      updateData.surname = lastNameParts.join(' ') || '';
    }

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.role) {
      const role = data.role.toUpperCase() as UserRole;
      if (!Object.values(UserRole).includes(role)) {
        throw new BadRequestException('Неверная роль пользователя');
      }
      updateData.role = role;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updatedUser.id.toString(),
      name: `${updatedUser.name} ${updatedUser.surname}`,
      email: updatedUser.email,
      role: updatedUser.role.toLowerCase(),
      department: data.department || 'Администрация',
      status: 'active',
      lastLogin: null,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  async deleteUser(id: string) {
    const userId = parseInt(id);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Мягкое удаление
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Пользователь удален' };
  }

  async resetUserPassword(id: string) {
    const userId = parseInt(id);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Генерируем новый пароль
    const newPassword = crypto.randomBytes(8).toString('hex');
    // В реальном приложении нужно хешировать пароль
    const hashedPassword = newPassword; // Временно без хеширования

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });

    return { password: newPassword };
  }

  // Roles & Permissions - пока используем статичные данные
  getRoles() {
    return [
      {
        id: '1',
        name: 'Администратор',
        description: 'Полный доступ к системе',
        permissions: [
          { id: 'users_read', module: 'Пользователи', action: 'read' },
          { id: 'users_write', module: 'Пользователи', action: 'write' },
          { id: 'settings_read', module: 'Настройки', action: 'read' },
          { id: 'settings_write', module: 'Настройки', action: 'write' },
        ],
      },
      {
        id: '2',
        name: 'Учитель',
        description: 'Доступ к учебным материалам',
        permissions: [
          { id: 'lessons_read', module: 'Уроки', action: 'read' },
          { id: 'lessons_write', module: 'Уроки', action: 'write' },
          { id: 'students_read', module: 'Студенты', action: 'read' },
        ],
      },
      {
        id: '3',
        name: 'Студент',
        description: 'Доступ к учебным материалам',
        permissions: [
          { id: 'lessons_read', module: 'Уроки', action: 'read' },
          { id: 'homework_read', module: 'Домашние задания', action: 'read' },
          { id: 'homework_write', module: 'Домашние задания', action: 'write' },
        ],
      },
      {
        id: '4',
        name: 'Финансист',
        description: 'Доступ к финансовым данным',
        permissions: [
          { id: 'payments_read', module: 'Платежи', action: 'read' },
          { id: 'payments_write', module: 'Платежи', action: 'write' },
          { id: 'budget_read', module: 'Бюджет', action: 'read' },
        ],
      },
      {
        id: '5',
        name: 'HR',
        description: 'Управление персоналом',
        permissions: [
          { id: 'employees_read', module: 'Сотрудники', action: 'read' },
          { id: 'employees_write', module: 'Сотрудники', action: 'write' },
          { id: 'vacations_read', module: 'Отпуска', action: 'read' },
          { id: 'vacations_write', module: 'Отпуска', action: 'write' },
        ],
      },
    ];
  }

  createRole(data: CreateRoleDto) {
    const newRole = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      permissions: data.permissions.map(p => ({
        id: p,
        module: p.split('_')[0],
        action: p.split('_')[1],
      })),
    };
    return newRole;
  }

  async updateRole(id: string, data: UpdateRoleDto) {
    const roles = await this.getRoles();
    const role = roles.find(r => r.id === id);
    if (!role) {
      throw new NotFoundException('Роль не найдена');
    }

    return {
      ...role,
      ...data,
      permissions: data.permissions ? data.permissions.map(p => ({
        id: p,
        module: p.split('_')[0],
        action: p.split('_')[1],
      })) : role.permissions,
    };
  }

  async deleteRole(id: string) {
    const roles = await this.getRoles();
    const role = roles.find(r => r.id === id);
    if (!role) {
      throw new NotFoundException('Роль не найдена');
    }
    return { message: 'Роль удалена' };
  }

  async getAvailablePermissions() {
    return [
      {
        module: 'Пользователи',
        permissions: ['read', 'write', 'delete'],
      },
      {
        module: 'Настройки',
        permissions: ['read', 'write'],
      },
      {
        module: 'Уроки',
        permissions: ['read', 'write', 'delete'],
      },
      {
        module: 'Студенты',
        permissions: ['read', 'write', 'delete'],
      },
      {
        module: 'Платежи',
        permissions: ['read', 'write', 'delete'],
      },
      {
        module: 'Бюджет',
        permissions: ['read', 'write'],
      },
      {
        module: 'Сотрудники',
        permissions: ['read', 'write', 'delete'],
      },
      {
        module: 'Отпуска',
        permissions: ['read', 'write', 'approve'],
      },
    ];
  }

  // Branding
  async getBrandingSettings() {
    // Базовые настройки по умолчанию
    const base = {
      schoolName: 'Fizmat AI Ala',
      logo: null as string | null,
      favicon: null as string | null,
      primaryColor: '#1C7E66',
      secondaryColor: '#ffffff',
      accentColor: '#1C7E66',
      fontFamily: 'Inter',
    };

    try {
      // Ищем последний загруженный логотип и фавикон в таблице files
      const [lastLogo, lastFavicon] = await Promise.all([
        this.prisma.file.findFirst({
          where: { deletedAt: null, OR: [
            { name: { contains: 'logos/' } },
            { url: { contains: '/logos/' } },
          ] },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.file.findFirst({
          where: { deletedAt: null, OR: [
            { name: { contains: 'favicons/' } },
            { url: { contains: '/favicons/' } },
          ] },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        ...base,
        logo: lastLogo?.url ?? base.logo,
        favicon: lastFavicon?.url ?? base.favicon,
      };
    } catch (e) {
      // В случае ошибки возвращаем базовые значения
      return base;
    }
  }

  async updateBrandingSettings(settings: any) {
    // В реальном приложении это будет сохраняться в базу данных
    return {
      ...await this.getBrandingSettings(),
      ...settings,
    };
  }

  // Integrations
  async getIntegrations() {
    return [
      {
        id: '1',
        name: 'Google Calendar',
        description: 'Синхронизация с Google Календарем',
        icon: '📅',
        status: 'connected',
        lastSync: new Date().toISOString(),
        autoSync: true,
        errorNotifications: true,
      },
      {
        id: '2',
        name: 'Zoom',
        description: 'Интеграция с Zoom для онлайн-уроков',
        icon: '📹',
        status: 'disconnected',
        lastSync: null,
        autoSync: false,
        errorNotifications: true,
      },
      {
        id: '3',
        name: 'Telegram Bot',
        description: 'Уведомления через Telegram',
        icon: '💬',
        status: 'connected',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        autoSync: true,
        errorNotifications: true,
      },
    ];
  }

  async createIntegration(data: any) {
    const newIntegration = {
      id: Date.now().toString(),
      ...data,
      status: 'disconnected',
      lastSync: null,
    };
    return newIntegration;
  }

  async updateIntegration(id: string, data: any) {
    const integrations = await this.getIntegrations();
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }
    return { ...integration, ...data };
  }

  async deleteIntegration(id: string) {
    const integrations = await this.getIntegrations();
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }
    return { message: 'Интеграция удалена' };
  }

  async connectIntegration(id: string) {
    const integrations = await this.getIntegrations();
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }
    return { ...integration, status: 'connected', lastSync: new Date().toISOString() };
  }

  async disconnectIntegration(id: string) {
    const integrations = await this.getIntegrations();
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }
    return { ...integration, status: 'disconnected' };
  }

  async syncIntegration(id: string) {
    const integrations = await this.getIntegrations();
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }
    // Имитация синхронизации
    return { message: 'Синхронизация завершена' };
  }

  // Academic Hour Settings - Настройки академического часа
  async getAcademicHourDuration(): Promise<number> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key: 'academic_hour_duration' }
      });
      return setting ? parseInt(setting.value, 10) : 45; // По умолчанию 45 минут
    } catch (error) {
      console.warn('SystemSettings таблица не найдена, используем значение по умолчанию: 45 минут');
      return 45;
    }
  }

  async setAcademicHourDuration(minutes: number): Promise<{ minutes: number }> {
    if (minutes < 20 || minutes > 90) {
      throw new BadRequestException('Продолжительность академического часа должна быть от 20 до 90 минут');
    }

    try {
      await this.prisma.systemSettings.upsert({
        where: { key: 'academic_hour_duration' },
        update: { 
          value: minutes.toString(),
          updatedAt: new Date()
        },
        create: { 
          key: 'academic_hour_duration', 
          value: minutes.toString(),
          description: 'Продолжительность академического часа в минутах'
        }
      });
    } catch (error) {
      console.warn('SystemSettings таблица не найдена, настройка не сохранена');
    }

    return { minutes };
  }

  async getAllSystemSettings(): Promise<Array<{ key: string; value: string; description: string | null }>> {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        orderBy: { key: 'asc' }
      });
      
      return settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description
      }));
    } catch (error) {
      console.warn('SystemSettings таблица не найдена, возвращаем настройки по умолчанию');
      return [
        {
          key: 'academic_hour_duration',
          value: '45',
          description: 'Продолжительность академического часа в минутах'
        }
      ];
    }
  }

  async updateSystemSetting(key: string, value: string): Promise<{ key: string; value: string; description: string | null }> {
    try {
      const updated = await this.prisma.systemSettings.upsert({
        where: { key },
        update: { 
          value,
          updatedAt: new Date()
        },
        create: { 
          key, 
          value,
          description: null
        }
      });

      return {
        key: updated.key,
        value: updated.value,
        description: updated.description
      };
    } catch (error) {
      console.warn('SystemSettings таблица не найдена, настройка не сохранена');
      return { key, value, description: null };
    }
  }
}
