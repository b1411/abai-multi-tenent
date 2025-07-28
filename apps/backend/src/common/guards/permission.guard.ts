import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { RbacService } from '../../rbac/rbac.service';

// Создаем новый декоратор для разрешений
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

// Декоратор для проверки конкретного разрешения с параметрами
export const RequirePermission = (module: string, action: string, options?: {
  resource?: string;
  scope?: string;
}) => {
  return SetMetadata(PERMISSIONS_KEY, [{ module, action, ...options }]);
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params, query, body, url, method } = request;
    
    const requiredPermissions = this.reflector.getAllAndOverride<any[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(`🛡️ PermissionGuard: ${method} ${url}`);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      console.log(`✅ PermissionGuard: No permissions required for ${method} ${url}`);
      return true;
    }

    console.log(`🔍 PermissionGuard: Required permissions:`, requiredPermissions);
    
    if (!user) {
      console.log(`❌ PermissionGuard: No user found in request for ${method} ${url}`);
      return false;
    }

    console.log(`👤 PermissionGuard: User:`, {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Проверяем каждое требуемое разрешение
    for (const permission of requiredPermissions) {
      let hasPermission = false;
      let checkParams;

      if (typeof permission === 'string') {
        // Простая строка разрешения (старый формат)
        checkParams = {
          module: permission.split(':')[0] || permission,
          action: permission.split(':')[1] || 'read'
        };
        console.log(`🔍 PermissionGuard: Checking string permission:`, checkParams);
        
        hasPermission = await this.rbacService.hasPermission(user.id, checkParams);
      } else {
        // Объект с детальными параметрами
        checkParams = {
          module: permission.module,
          action: permission.action,
          resource: permission.resource,
          resourceId: params?.id || params?.resourceId,
          ownerId: this.extractOwnerId(user, params, body),
          groupId: this.extractGroupId(user, params, body),
          departmentId: this.extractDepartmentId(user, params, body)
        };
        
        console.log(`🔍 PermissionGuard: Checking object permission:`, checkParams);
        hasPermission = await this.rbacService.hasPermission(user.id, checkParams);
      }

      console.log(`📋 PermissionGuard: Permission check result:`, {
        permission: checkParams,
        hasPermission,
        userId: user.id
      });

      if (hasPermission) {
        console.log(`✅ PermissionGuard: ACCESS GRANTED for ${method} ${url}`);
        return true; // Если хотя бы одно разрешение есть - разрешаем доступ
      }
    }

    console.log(`❌ PermissionGuard: ACCESS DENIED for ${method} ${url}`);
    console.log(`❌ PermissionGuard: User ${user.email} (${user.role}) lacks required permissions`);
    return false;
  }

  private extractOwnerId(user: any, params: any, body: any): number | undefined {
    // Логика извлечения ID владельца ресурса
    if (params?.userId) return parseInt(params.userId);
    if (body?.userId) return body.userId;
    if (params?.createdBy) return parseInt(params.createdBy);
    return user.id; // По умолчанию текущий пользователь
  }

  private extractGroupId(user: any, params: any, body: any): number | undefined {
    // Логика извлечения ID группы
    if (params?.groupId) return parseInt(params.groupId);
    if (body?.groupId) return body.groupId;
    if (user.student?.groupId) return user.student.groupId;
    return undefined;
  }

  private extractDepartmentId(user: any, params: any, body: any): number | undefined {
    // Логика извлечения ID отдела
    if (params?.departmentId) return parseInt(params.departmentId);
    if (body?.departmentId) return body.departmentId;
    // Можно добавить логику определения отдела по роли пользователя
    return undefined;
  }
}
