import apiClient from './apiClient';
import { UserRole, UserPermission } from '../contexts/AuthContext';

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
  assignedUsers: AssignedUser[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  scope: 'ALL' | 'OWN' | 'GROUP' | 'DEPARTMENT' | 'ASSIGNED';
  description?: string;
  isSystem: boolean;
  roleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedUser {
  id: number;
  name: string;
  email: string;
  assignedAt: string;
  expiresAt?: string;
  context?: any;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface CreatePermissionDto {
  module: string;
  action: string;
  resource?: string;
  scope: 'ALL' | 'OWN' | 'GROUP' | 'DEPARTMENT' | 'ASSIGNED';
  description?: string;
}

export interface AssignRoleDto {
  context?: any;
  expiresAt?: string;
}

class RbacService {
  private baseUrl = '/rbac';

  // === РОЛИ ===

  async getRoles(includeInactive = false): Promise<RoleListItem[]> {
    const url = includeInactive ? `${this.baseUrl}/roles?includeInactive=true` : `${this.baseUrl}/roles`;
    const response = await apiClient.get<{ data: RoleListItem[] }>(url);
    return response.data;
  }

  async getRoleById(id: string): Promise<RoleResponse> {
    const response = await apiClient.get<{ data: RoleResponse }>(`${this.baseUrl}/roles/${id}`);
    return response.data;
  }

  async createRole(data: CreateRoleDto): Promise<RoleResponse> {
    console.log('🚀 RbacService.createRole: Отправка данных', data);
    const response: any = await apiClient.post(`${this.baseUrl}/roles`, data);
    console.log('✅ RbacService.createRole: Ответ получен', response);
    // Проверяем, есть ли вложенность data
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    return responseData;
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<RoleResponse> {
    const response = await apiClient.put<{ data: RoleResponse }>(`${this.baseUrl}/roles/${id}`, data);
    return response.data;
  }

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/roles/${id}`);
  }

  async toggleRoleStatus(id: string): Promise<RoleResponse> {
    const response = await apiClient.put<{ data: RoleResponse }>(`${this.baseUrl}/roles/${id}/toggle-status`);
    return response.data;
  }

  async getUsersByRole(roleId: string): Promise<AssignedUser[]> {
    const response = await apiClient.get<{ data: AssignedUser[] }>(`${this.baseUrl}/roles/${roleId}/users`);
    return response.data;
  }

  async addPermissionToRole(roleId: string, permissionId: string, conditions?: any): Promise<void> {
    const body = conditions ? { conditions } : {};
    await apiClient.post(`${this.baseUrl}/roles/${roleId}/permissions/${permissionId}`, body);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/roles/${roleId}/permissions/${permissionId}`);
  }

  // === РАЗРЕШЕНИЯ ===

  async getPermissions(module?: string): Promise<Permission[]> {
    const url = module ? `${this.baseUrl}/permissions?module=${module}` : `${this.baseUrl}/permissions`;
    const response = await apiClient.get<{ data: Permission[] }>(url);
    return response.data;
  }

  async getPermissionsByModule(): Promise<Array<{
    module: string;
    permissions: Permission[];
    count: number;
  }>> {
    const response = await apiClient.get<{ data: Array<{ module: string; permissions: Permission[]; count: number; }> }>(`${this.baseUrl}/permissions/by-module`);
    return response.data;
  }

  async getPermissionById(id: string): Promise<Permission & { usedByRoles: RoleResponse[] }> {
    const response = await apiClient.get<{ data: Permission & { usedByRoles: RoleResponse[] } }>(`${this.baseUrl}/permissions/${id}`);
    return response.data;
  }

  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    const response = await apiClient.post<{ data: Permission }>(`${this.baseUrl}/permissions`, data);
    return response.data;
  }

  async updatePermission(id: string, data: Partial<CreatePermissionDto>): Promise<Permission> {
    const response = await apiClient.put<{ data: Permission }>(`${this.baseUrl}/permissions/${id}`, data);
    return response.data;
  }

  async deletePermission(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/permissions/${id}`);
  }

  async createStandardPermissions(module: string): Promise<Permission[]> {
    const response = await apiClient.post<{ data: Permission[] }>(`${this.baseUrl}/permissions/create-standard/${module}`);
    return response.data;
  }

  // === МЕТАДАННЫЕ ===

  async getAvailableModules(): Promise<Array<{ module: string; permissionCount: number }>> {
    const response = await apiClient.get<{ data: Array<{ module: string; permissionCount: number }> }>(`${this.baseUrl}/meta/modules`);
    return response.data;
  }

  async getAvailableActions(): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(`${this.baseUrl}/meta/actions`);
    return response.data;
  }

  async getAvailableScopes(): Promise<Array<{
    value: string;
    label: string;
    description: string;
  }>> {
    const response = await apiClient.get<{ data: Array<{ value: string; label: string; description: string; }> }>(`${this.baseUrl}/meta/scopes`);
    return response.data;
  }

  async getActionsForModule(module: string): Promise<Array<{
    action: string;
    scope: string;
    description?: string;
  }>> {
    const response = await apiClient.get<{ data: Array<{ action: string; scope: string; description?: string; }> }>(`${this.baseUrl}/meta/modules/${module}/actions`);
    return response.data;
  }

  // === НАЗНАЧЕНИЕ РОЛЕЙ ===

  async assignRoleToUser(userId: number, roleId: string, data?: AssignRoleDto): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/roles/${roleId}`, data);
  }

  async revokeRoleFromUser(userId: number, roleId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/users/${userId}/roles/${roleId}`);
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    try {
      // Сначала пытаемся получить через обычный эндпоинт
      const response = await apiClient.get<{ data: UserRole[] }>(`${this.baseUrl}/users/${userId}/roles`);
      return response.data;
    } catch (error) {
      console.log(`⚠️ RbacService: Не удалось получить роли через users/${userId}/roles, пробуем my-roles`);
      // Если не получилось - используем эндпоинт без ограничений для собственных ролей
      const response = await apiClient.get<{ data: UserRole[] }>(`${this.baseUrl}/my-roles`);
      return response.data;
    }
  }

  async clearUserPermissionCache(userId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/users/${userId}/permissions-cache`);
  }

  // === ПРОВЕРКА РАЗРЕШЕНИЙ ===

  async checkPermission(data: {
    module: string;
    action: string;
    resource?: string;
    resourceId?: string;
    ownerId?: number;
    groupId?: number;
    departmentId?: number;
  }): Promise<{
    hasPermission: boolean;
    userId: number;
    check: typeof data;
  }> {
    const response = await apiClient.post<{ data: { hasPermission: boolean; userId: number; check: typeof data; } }>(`${this.baseUrl}/check-permission`, data);
    return response.data;
  }

  async getMyPermissions(): Promise<UserRole[]> {
    const response = await apiClient.get<{ data: UserRole[] }>(`${this.baseUrl}/my-permissions`);
    return response.data;
  }

  // === УТИЛИТЫ ===

  /**
   * Извлекает все разрешения из ролей пользователя
   */
  extractPermissionsFromRoles(roles: UserRole[]): UserPermission[] {
    const permissions: UserPermission[] = [];
    
    for (const role of roles) {
      for (const permission of role.permissions) {
        // Избегаем дублирования разрешений
        const exists = permissions.find(p => 
          p.module === permission.module && 
          p.action === permission.action && 
          p.resource === permission.resource &&
          p.scope === permission.scope
        );
        
        if (!exists) {
          permissions.push(permission);
        }
      }
    }
    
    return permissions;
  }

  /**
   * Проверяет, имеет ли пользователь конкретное разрешение
   */
  hasPermission(
    permissions: UserPermission[], 
    module: string, 
    action: string, 
    options?: {
      resource?: string;
      scope?: string;
    }
  ): boolean {
    console.log(`🔍 RbacService.hasPermission: Проверка разрешения ${module}:${action}`, {
      permissions: permissions.map(p => `${p.module}:${p.action}:${p.scope}`),
      checkModule: module,
      checkAction: action,
      options
    });

    const result = permissions.some(permission => {
      const moduleMatch = permission.module === module || permission.module === '*';
      const actionMatch = permission.action === action || permission.action === '*';
      const resourceMatch = !options?.resource || 
        permission.resource === options.resource || 
        !permission.resource;
      const scopeMatch = !options?.scope || permission.scope === options.scope;
      
      const matches = moduleMatch && actionMatch && resourceMatch && scopeMatch;
      
      if (matches) {
        console.log(`✅ RbacService: Разрешение найдено: ${permission.module}:${permission.action}:${permission.scope}`);
      }
      
      return matches;
    });

    console.log(`📋 RbacService.hasPermission: Результат для ${module}:${action} = ${result}`);
    return result;
  }

  /**
   * Проверяет, имеет ли пользователь любое из указанных разрешений
   */
  hasAnyPermission(
    permissions: UserPermission[],
    requiredPermissions: Array<{
      module: string;
      action: string;
      resource?: string;
      scope?: string;
    }>
  ): boolean {
    return requiredPermissions.some(required => 
      this.hasPermission(permissions, required.module, required.action, {
        resource: required.resource,
        scope: required.scope
      })
    );
  }
}

export default new RbacService();
