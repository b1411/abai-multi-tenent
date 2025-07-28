import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionScope } from 'generated/prisma';

export interface CreatePermissionDto {
  module: string;
  action: string;
  resource?: string;
  scope: PermissionScope;
  description?: string;
}

export interface UpdatePermissionDto {
  module?: string;
  action?: string;
  resource?: string;
  scope?: PermissionScope;
  description?: string;
}

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создает новое разрешение
   */
  async createPermission(data: CreatePermissionDto) {
    // Проверяем уникальность комбинации module + action + resource
    const existing = await this.prisma.permission.findFirst({
      where: {
        module: data.module,
        action: data.action,
        resource: data.resource || null
      }
    });

    if (existing) {
      throw new BadRequestException('Permission with this combination already exists');
    }

    return await this.prisma.permission.create({
      data: {
        module: data.module,
        action: data.action,
        resource: data.resource,
        scope: data.scope,
        description: data.description,
        isSystem: false
      }
    });
  }

  /**
   * Обновляет разрешение
   */
  async updatePermission(id: string, data: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission.isSystem) {
      throw new BadRequestException('Cannot modify system permission');
    }

    // Проверяем уникальность при изменении ключевых полей
    if (data.module || data.action || data.resource !== undefined) {
      const existing = await this.prisma.permission.findFirst({
        where: {
          id: { not: id },
          module: data.module || permission.module,
          action: data.action || permission.action,
          resource: data.resource !== undefined ? data.resource : permission.resource
        }
      });

      if (existing) {
        throw new BadRequestException('Permission with this combination already exists');
      }
    }

    return await this.prisma.permission.update({
      where: { id },
      data: {
        module: data.module,
        action: data.action,
        resource: data.resource,
        scope: data.scope,
        description: data.description,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Удаляет разрешение
   */
  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission.isSystem) {
      throw new BadRequestException('Cannot delete system permission');
    }

    // Проверяем, не используется ли разрешение в ролях
    const rolesUsingPermission = await this.prisma.rolePermission.count({
      where: { permissionId: id }
    });

    if (rolesUsingPermission > 0) {
      throw new BadRequestException(
        `Cannot delete permission: it is used by ${rolesUsingPermission} role(s)`
      );
    }

    return await this.prisma.permission.delete({
      where: { id }
    });
  }

  /**
   * Получает разрешение по ID
   */
  async getPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      id: permission.id,
      module: permission.module,
      action: permission.action,
      resource: permission.resource,
      scope: permission.scope,
      description: permission.description,
      isSystem: permission.isSystem,
      usedByRoles: permission.rolePermissions.map(rp => ({
        id: rp.role.id,
        name: rp.role.name,
        description: rp.role.description,
        conditions: rp.conditions
      })),
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt
    };
  }

  /**
   * Получает все разрешения
   */
  async getAllPermissions(module?: string) {
    const where = module ? { module } : {};

    const permissions = await this.prisma.permission.findMany({
      where,
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
        { resource: 'asc' }
      ]
    });

    return permissions.map(permission => ({
      id: permission.id,
      module: permission.module,
      action: permission.action,
      resource: permission.resource,
      scope: permission.scope,
      description: permission.description,
      isSystem: permission.isSystem,
      roleCount: permission._count.rolePermissions,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt
    }));
  }

  /**
   * Получает разрешения сгруппированные по модулям
   */
  async getPermissionsByModule() {
    const permissions = await this.getAllPermissions();
    
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return Object.entries(groupedPermissions).map(([module, permissions]) => ({
      module,
      permissions,
      count: permissions.length
    }));
  }

  /**
   * Получает доступные действия для модуля
   */
  async getActionsForModule(module: string) {
    const permissions = await this.prisma.permission.findMany({
      where: { module },
      select: {
        action: true,
        scope: true,
        description: true
      },
      distinct: ['action']
    });

    return permissions.map(p => ({
      action: p.action,
      scope: p.scope,
      description: p.description
    }));
  }

  /**
   * Создает стандартные разрешения для модуля
   */
  async createStandardPermissions(module: string, description?: string) {
    const standardActions = [
      { action: 'create', scope: PermissionScope.ALL, description: `Create ${module}` },
      { action: 'read', scope: PermissionScope.ALL, description: `Read all ${module}` },
      { action: 'read', scope: PermissionScope.OWN, description: `Read own ${module}` },
      { action: 'read', scope: PermissionScope.GROUP, description: `Read group ${module}` },
      { action: 'update', scope: PermissionScope.ALL, description: `Update all ${module}` },
      { action: 'update', scope: PermissionScope.OWN, description: `Update own ${module}` },
      { action: 'delete', scope: PermissionScope.ALL, description: `Delete all ${module}` },
      { action: 'delete', scope: PermissionScope.OWN, description: `Delete own ${module}` }
    ];

    const createdPermissions = [];

    for (const permission of standardActions) {
      try {
        const created = await this.createPermission({
          module,
          action: permission.action,
          scope: permission.scope,
          description: permission.description
        });
        createdPermissions.push(created);
      } catch (error) {
        // Пропускаем дублирующиеся разрешения
        if (!(error instanceof BadRequestException)) {
          throw error;
        }
      }
    }

    return createdPermissions;
  }

  /**
   * Получает все доступные модули
   */
  async getAvailableModules() {
    const modules = await this.prisma.permission.findMany({
      select: {
        module: true
      },
      distinct: ['module'],
      orderBy: { module: 'asc' }
    });

    const moduleCounts = await this.prisma.permission.groupBy({
      by: ['module'],
      _count: {
        id: true
      }
    });

    return modules.map(m => ({
      module: m.module,
      permissionCount: moduleCounts.find(c => c.module === m.module)?._count.id || 0
    }));
  }

  /**
   * Получает все доступные действия
   */
  async getAvailableActions() {
    const actions = await this.prisma.permission.findMany({
      select: {
        action: true
      },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    });

    return actions.map(a => a.action);
  }

  /**
   * Получает все доступные области видимости
   */
  getAvailableScopes() {
    return Object.values(PermissionScope).map(scope => ({
      value: scope,
      label: this.getScopeLabel(scope),
      description: this.getScopeDescription(scope)
    }));
  }

  /**
   * Получает человекочитаемое название области видимости
   */
  private getScopeLabel(scope: PermissionScope): string {
    const labels = {
      [PermissionScope.ALL]: 'Все записи',
      [PermissionScope.OWN]: 'Только свои',
      [PermissionScope.GROUP]: 'Группа',
      [PermissionScope.DEPARTMENT]: 'Отдел',
      [PermissionScope.ASSIGNED]: 'Назначенные'
    };
    return labels[scope] || scope;
  }

  /**
   * Получает описание области видимости
   */
  private getScopeDescription(scope: PermissionScope): string {
    const descriptions = {
      [PermissionScope.ALL]: 'Доступ ко всем записям без ограничений',
      [PermissionScope.OWN]: 'Доступ только к записям, созданным пользователем',
      [PermissionScope.GROUP]: 'Доступ к записям в рамках группы пользователя',
      [PermissionScope.DEPARTMENT]: 'Доступ к записям в рамках отдела пользователя',
      [PermissionScope.ASSIGNED]: 'Доступ к записям, назначенным пользователю'
    };
    return descriptions[scope] || 'Описание недоступно';
  }

  /**
   * Проверяет, может ли пользователь выполнить действие с разрешением
   */
  async canManagePermission(userId: number, permissionId: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      return false;
    }

    // Системные разрешения может изменять только суперадмин
    if (permission.isSystem) {
      // Здесь можно добавить проверку роли суперадмина
      return false;
    }

    return true;
  }
}
