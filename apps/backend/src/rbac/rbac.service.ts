import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionScope } from 'generated/prisma';

export interface PermissionCheck {
  module: string;
  action: string;
  resource?: string;
  scope?: PermissionScope;
  resourceId?: string;
  ownerId?: number;
  groupId?: number;
  departmentId?: number;
}

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) { }

  /**
   * Проверяет, имеет ли пользователь разрешение на выполнение действия
   */
  async hasPermission(
    userId: number,
    check: PermissionCheck
  ): Promise<boolean> {
    console.log(`🔒 RbacService.hasPermission called for user ${userId}:`, check);
    
    try {
      // Сначала проверяем кэш разрешений
      console.log(`🔍 RbacService: Checking cache for user ${userId}`);
      const cached = await this.getPermissionsFromCache(userId);
      
      if (cached && !this.isCacheExpired(cached)) {
        console.log(`✅ RbacService: Using cached permissions for user ${userId}`);
        const result = this.checkPermissionInCache(cached.permissions, check, userId);
        console.log(`📋 RbacService: Cache check result:`, result);
        return result;
      }

      console.log(`🔄 RbacService: Cache miss or expired, loading permissions for user ${userId}`);
      
      // Если кэш пустой или устарел, загружаем разрешения
      const permissions = await this.loadUserPermissions(userId);

      // Обновляем кэш
      console.log(`💾 RbacService: Updating cache for user ${userId}`);
      await this.updatePermissionCache(userId, permissions);

      // Проверяем разрешение
      console.log(`🔍 RbacService: Checking permission in loaded data`);
      const hasAccess = this.checkPermissionInData(permissions, check, userId);

      console.log(`📋 RbacService: Final permission check result:`, {
        userId,
        check,
        hasAccess,
        permissionsCount: permissions.length
      });

      // Логируем попытку доступа
      await this.logPermissionAttempt(userId, check, hasAccess);

      return hasAccess;
    } catch (error) {
      console.error(`❌ RbacService: Error checking permission for user ${userId}:`, error);
      console.error(`❌ RbacService: Error stack:`, error.stack);
      return false;
    }
  }

  /**
   * Загружает все разрешения пользователя из базы данных
   */
  private async loadUserPermissions(userId: number) {
    // Загружаем пользователя с его ролью
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      console.error('User not found:', userId);
      return [];
    }

    console.log('Loading permissions for user:', userId, 'with role:', user.role);

    // Сначала проверяем ролевые назначения (UserRoleAssignment)
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = [];

    // Добавляем разрешения из ролевых назначений
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        permissions.push({
          module: rolePermission.permission.module,
          action: rolePermission.permission.action,
          resource: rolePermission.permission.resource,
          scope: rolePermission.permission.scope,
          conditions: rolePermission.conditions,
          context: userRole.context
        });
      }
    }

    // Если нет ролевых назначений, пытаемся найти роль по имени в базе данных
    if (permissions.length === 0 && user.role) {
      console.log('No role assignments found, trying to find role by name:', user.role);
      
      const roleData = await this.prisma.role.findUnique({
        where: { name: user.role },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (roleData) {
        console.log('Found role data:', roleData.name, 'with', roleData.rolePermissions.length, 'permissions');
        
        for (const rolePermission of roleData.rolePermissions) {
          permissions.push({
            module: rolePermission.permission.module,
            action: rolePermission.permission.action,
            resource: rolePermission.permission.resource,
            scope: rolePermission.permission.scope,
            conditions: rolePermission.conditions,
            context: null
          });
        }
      } else {
        console.error('Role not found in database:', user.role);
      }
    }

    console.log('Total permissions loaded:', permissions.length);
    return permissions;
  }

  /**
   * Проверяет разрешение в загруженных данных
   */
  private checkPermissionInData(
    permissions: any[],
    check: PermissionCheck,
    userId: number
  ): boolean {
    console.log(`🔍 RbacService: Checking permission in data:`, {
      checkModule: check.module,
      checkAction: check.action,
      permissionsCount: permissions.length
    });

    for (const permission of permissions) {
      console.log(`🔍 RbacService: Comparing permission:`, {
        permissionModule: permission.module,
        permissionAction: permission.action,
        checkModule: check.module,
        checkAction: check.action,
        moduleMatch: permission.module === check.module || permission.module === '*',
        actionMatch: permission.action === check.action || permission.action === '*'
      });

      // Проверяем совпадение модуля (включая wildcard *)
      const moduleMatch = permission.module === check.module || permission.module === '*';
      
      // Проверяем совпадение действия (включая wildcard *)
      const actionMatch = permission.action === check.action || permission.action === '*';
      
      // Проверяем ресурс
      const resourceMatch = !check.resource || permission.resource === check.resource || !permission.resource;

      if (moduleMatch && actionMatch && resourceMatch) {
        console.log(`✅ RbacService: Permission matches, checking scope:`, {
          scope: permission.scope,
          userId,
          context: permission.context
        });
        
        // Проверяем область видимости
        if (this.checkScope(permission.scope, check, userId, permission.context)) {
          console.log(`✅ RbacService: Scope check passed, access granted`);
          return true;
        } else {
          console.log(`❌ RbacService: Scope check failed`);
        }
      }
    }
    
    console.log(`❌ RbacService: No matching permissions found`);
    return false;
  }

  /**
   * Проверяет область видимости разрешения
   */
  private checkScope(
    scope: PermissionScope,
    check: PermissionCheck,
    userId: number,
    context?: any
  ): boolean {
    switch (scope) {
      case PermissionScope.ALL:
        return true;

      case PermissionScope.OWN:
        return check.ownerId === userId;

      case PermissionScope.GROUP:
        if (context?.groupId) {
          return check.groupId === context.groupId;
        }
        return check.groupId !== undefined;

      case PermissionScope.DEPARTMENT:
        if (context?.departmentId) {
          return check.departmentId === context.departmentId;
        }
        return check.departmentId !== undefined;

      case PermissionScope.ASSIGNED:
        // Проверяем, назначен ли ресурс пользователю
        // Для синхронной проверки возвращаем true временно
        return true;

      default:
        return false;
    }
  }

  /**
   * Проверяет, назначен ли ресурс пользователю
   */
  private checkAssignment(
    userId: number,
    resourceId: string,
    module: string
  ): Promise<boolean> {
    // Здесь можно добавить специфичную логику для разных модулей
    // Например, для уроков проверить, является ли пользователь учителем этого урока
    return Promise.resolve(false); // Временная заглушка
  }

  /**
   * Получает разрешения из кэша
   */
  private async getPermissionsFromCache(userId: number) {
    return await this.prisma.userPermissionCache.findUnique({
      where: { userId }
    });
  }

  /**
   * Проверяет, не истек ли кэш
   */
  private isCacheExpired(cache: any): boolean {
    return cache.expiresAt < new Date();
  }

  /**
   * Проверяет разрешение в кэшированных данных
   */
  private checkPermissionInCache(
    cachedPermissions: any,
    check: PermissionCheck,
    userId: number
  ): boolean {
    try {
      console.log(`🔍 RbacService: Cached permissions type:`, typeof cachedPermissions);
      console.log(`🔍 RbacService: Cached permissions value:`, cachedPermissions);
      
      // Если это уже объект (Prisma Json тип), используем напрямую
      let permissions;
      if (typeof cachedPermissions === 'string') {
        permissions = JSON.parse(cachedPermissions);
      } else {
        permissions = cachedPermissions;
      }
      
      console.log(`📊 RbacService: Processed permissions:`, {
        isArray: Array.isArray(permissions),
        length: Array.isArray(permissions) ? permissions.length : 'N/A',
        type: typeof permissions,
        sample: Array.isArray(permissions) ? permissions.slice(0, 2) : permissions
      });
      
      if (!Array.isArray(permissions)) {
        console.log(`❌ RbacService: Cached permissions is not an array, invalidating cache`);
        return false;
      }
      
      const result = this.checkPermissionInData(permissions, check, userId);
      
      console.log(`📋 RbacService: Cache permission check result:`, {
        hasPermission: result,
        permissionsCount: permissions.length,
        check
      });
      
      return result;
    } catch (error) {
      console.error(`❌ RbacService: Error processing cached permissions:`, error);
      return false;
    }
  }

  /**
   * Обновляет кэш разрешений
   */
  private async updatePermissionCache(userId: number, permissions: any[]) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Кэш на 1 час

    // Очищаем null значения перед сохранением
    const cleanPermissions = permissions.map(p => ({
      module: p.module,
      action: p.action,
      resource: p.resource || undefined, // заменяем null на undefined
      scope: p.scope,
      conditions: p.conditions || undefined,
      context: p.context || undefined
    }));

    console.log(`💾 RbacService: Saving to cache:`, {
      userId,
      permissionsCount: cleanPermissions.length,
      sample: cleanPermissions.slice(0, 2)
    });

    await this.prisma.userPermissionCache.upsert({
      where: { userId },
      update: {
        permissions: cleanPermissions, // Сохраняем как Json объект, не строку
        lastUpdated: new Date(),
        expiresAt
      },
      create: {
        userId,
        permissions: cleanPermissions, // Сохраняем как Json объект, не строку
        lastUpdated: new Date(),
        expiresAt
      }
    });
  }

  /**
   * Логирует попытку доступа к ресурсу
   */
  private async logPermissionAttempt(
    userId: number,
    check: PermissionCheck,
    allowed: boolean
  ) {
    try {
      await this.prisma.permissionAudit.create({
        data: {
          userId,
          action: check.action,
          resource: check.module,
          resourceId: check.resourceId,
          allowed,
          reason: allowed ? 'Permission granted' : 'Permission denied',
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging permission attempt:', error);
    }
  }

  /**
   * Назначает роль пользователю
   */
  async assignRole(
    userId: number,
    roleId: string,
    assignedBy: number,
    context?: any,
    expiresAt?: Date
  ) {
    // Проверяем, есть ли уже ЛЮБОЕ назначение (активное или неактивное)
    const existingAssignment = await this.prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        roleId
        // Убираем фильтр по isActive - ищем любую запись
      }
    });

    if (existingAssignment) {
      // Если запись существует (активная или неактивная), обновляем её
      await this.prisma.userRoleAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          assignedBy,
          context: context ? JSON.stringify(context) : null,
          expiresAt,
          assignedAt: new Date(),
          isActive: true // Обязательно активируем роль
        }
      });
    } else {
      // Если записи нет совсем, создаем новую
      await this.prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          assignedBy,
          context: context ? JSON.stringify(context) : null,
          expiresAt
        }
      });
    }

    // Очищаем кэш разрешений
    await this.clearPermissionCache(userId);
  }

  /**
   * Отзывает роль у пользователя
   */
  async revokeRole(userId: number, roleId: string) {
    await this.prisma.userRoleAssignment.updateMany({
      where: { userId, roleId },
      data: { isActive: false }
    });

    // Очищаем кэш разрешений
    await this.clearPermissionCache(userId);
  }

  /**
   * Очищает кэш разрешений пользователя
   */
  async clearPermissionCache(userId: number) {
    await this.prisma.userPermissionCache.deleteMany({
      where: { userId }
    });
  }

  /**
   * Получает роли пользователя
   */
  async getUserRoles(userId: number) {
    console.log(`👥 RbacService.getUserRoles: Загрузка ролей для пользователя ${userId}`);
    
    const userRoleAssignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        assigner: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 RbacService.getUserRoles: Найдено ${userRoleAssignments.length} ролей`);

    // Преобразуем в формат, ожидаемый фронтендом
    const roles = userRoleAssignments.map(assignment => ({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: assignment.expiresAt,
      isActive: assignment.isActive,
      context: assignment.context,
      name: assignment.role.name,
      description: assignment.role.description,
      role: assignment.role,
      assigner: assignment.assigner,
      permissions: assignment.role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
        scope: rp.permission.scope,
        description: rp.permission.description,
        isSystem: rp.permission.isSystem
      }))
    }));

    console.log(`🔐 RbacService.getUserRoles: Разрешения в ролях:`, 
      roles.map(r => ({ role: r.name, permissionsCount: r.permissions.length }))
    );

    return roles;
  }

  /**
   * Middleware для проверки разрешений
   */
  async requirePermission(
    userId: number,
    module: string,
    action: string,
    options?: {
      resource?: string;
      scope?: PermissionScope;
      resourceId?: string;
      ownerId?: number;
      groupId?: number;
      departmentId?: number;
    }
  ) {
    const hasAccess = await this.hasPermission(userId, {
      module,
      action,
      ...options
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: insufficient permissions for ${action} on ${module}`
      );
    }
  }
}
