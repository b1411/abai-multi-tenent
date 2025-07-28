import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RoleService, CreateRoleDto, UpdateRoleDto } from './role.service';
import { PermissionService, CreatePermissionDto, UpdatePermissionDto } from './permission.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { UserRole } from 'generated/prisma';

@Controller('rbac')
@UseGuards(AuthGuard, PermissionGuard)
export class RbacController {
  constructor(
    private rbacService: RbacService,
    private roleService: RoleService,
    private permissionService: PermissionService
  ) {}

  // === РОЛИ ===

  /**
   * Получить все роли
   */
  @Get('roles')
  @RequirePermission('rbac', 'read')
  async getRoles(@Query('includeInactive') includeInactive?: string) {
    const roles = await this.roleService.getAllRoles(includeInactive === 'true');
    return { data: roles };
  }

  /**
   * Получить роль по ID
   */
  @Get('roles/:id')
  @RequirePermission('rbac', 'read')
  async getRoleById(@Param('id') id: string) {
    const role = await this.roleService.getRoleById(id);
    return { data: role };
  }

  /**
   * Создать новую роль
   */
  @Post('roles')
  @RequirePermission('rbac', 'create')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.roleService.createRole(createRoleDto);
    return { data: role };
  }

  /**
   * Обновить роль
   */
  @Put('roles/:id')
  @RequirePermission('rbac', 'update')
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.roleService.updateRole(id, updateRoleDto);
    return { data: role };
  }

  /**
   * Удалить роль
   */
  @Delete('roles/:id')
  @RequirePermission('rbac', 'delete')
  async deleteRole(@Param('id') id: string) {
    await this.roleService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

  /**
   * Переключить статус роли (активна/неактивна)
   */
  @Put('roles/:id/toggle-status')
  @RequirePermission('rbac', 'update')
  async toggleRoleStatus(@Param('id') id: string) {
    const role = await this.roleService.toggleRoleStatus(id);
    return { data: role };
  }

  /**
   * Получить пользователей с определенной ролью
   */
  @Get('roles/:id/users')
  @RequirePermission('rbac', 'read')
  async getUsersByRole(@Param('id') id: string) {
    const users = await this.roleService.getUsersByRole(id);
    return { data: users };
  }

  /**
   * Добавить разрешение к роли
   */
  @Post('roles/:roleId/permissions/:permissionId')
  @RequirePermission('permissions', 'update')
  async addPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Body() body?: { conditions?: any }
  ) {
    const rolePermission = await this.roleService.addPermissionToRole(
      roleId, 
      permissionId, 
      body?.conditions
    );
    return { data: rolePermission };
  }

  /**
   * Удалить разрешение у роли
   */
  @Delete('roles/:roleId/permissions/:permissionId')
  @RequirePermission('permissions', 'update')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string
  ) {
    const result = await this.roleService.removePermissionFromRole(roleId, permissionId);
    return result;
  }

  // === РАЗРЕШЕНИЯ ===

  /**
   * Получить все разрешения
   */
  @Get('permissions')
  @RequirePermission('permissions', 'read')
  async getPermissions(@Query('module') module?: string) {
    const permissions = await this.permissionService.getAllPermissions(module);
    return { data: permissions };
  }

  /**
   * Получить разрешения сгруппированные по модулям
   */
  @Get('permissions/by-module')
  @RequirePermission('permissions', 'read')
  async getPermissionsByModule() {
    const groupedPermissions = await this.permissionService.getPermissionsByModule();
    return { data: groupedPermissions };
  }

  /**
   * Получить разрешение по ID
   */
  @Get('permissions/:id')
  @RequirePermission('permissions', 'read')
  async getPermissionById(@Param('id') id: string) {
    const permission = await this.permissionService.getPermissionById(id);
    return { data: permission };
  }

  /**
   * Создать новое разрешение
   */
  @Post('permissions')
  @RequirePermission('permissions', 'create')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionService.createPermission(createPermissionDto);
    return { data: permission };
  }

  /**
   * Обновить разрешение
   */
  @Put('permissions/:id')
  @RequirePermission('permissions', 'update')
  async updatePermission(
    @Param('id') id: string, 
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    const permission = await this.permissionService.updatePermission(id, updatePermissionDto);
    return { data: permission };
  }

  /**
   * Удалить разрешение
   */
  @Delete('permissions/:id')
  @RequirePermission('permissions', 'delete')
  async deletePermission(@Param('id') id: string) {
    await this.permissionService.deletePermission(id);
    return { message: 'Permission deleted successfully' };
  }

  /**
   * Создать стандартные разрешения для модуля
   */
  @Post('permissions/create-standard/:module')
  @RequirePermission('permissions', 'create')
  async createStandardPermissions(@Param('module') module: string) {
    const permissions = await this.permissionService.createStandardPermissions(module);
    return { data: permissions };
  }

  /**
   * Получить доступные модули
   */
  @Get('meta/modules')
  @RequirePermission('permissions', 'read')
  async getAvailableModules() {
    const modules = await this.permissionService.getAvailableModules();
    return { data: modules };
  }

  /**
   * Получить доступные действия
   */
  @Get('meta/actions')
  @RequirePermission('permissions', 'read')
  async getAvailableActions() {
    const actions = await this.permissionService.getAvailableActions();
    return { data: actions };
  }

  /**
   * Получить доступные области видимости
   */
  @Get('meta/scopes')
  @RequirePermission('permissions', 'read')
  getAvailableScopes() {
    const scopes = this.permissionService.getAvailableScopes();
    return { data: scopes };
  }

  /**
   * Получить действия для модуля
   */
  @Get('meta/modules/:module/actions')
  @RequirePermission('permissions', 'read')
  async getActionsForModule(@Param('module') module: string) {
    const actions = await this.permissionService.getActionsForModule(module);
    return { data: actions };
  }

  // === НАЗНАЧЕНИЕ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ ===

  /**
   * Назначить роль пользователю
   */
  @Post('users/:userId/roles/:roleId')
  @RequirePermission('users', 'update')
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
    @Body() body?: { 
      context?: any; 
      expiresAt?: string; 
    }
  ) {
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : undefined;
    
    await this.rbacService.assignRole(
      parseInt(userId),
      roleId,
      req.user.id,
      body?.context,
      expiresAt
    );

    return { message: 'Role assigned successfully' };
  }

  /**
   * Отозвать роль у пользователя
   */
  @Delete('users/:userId/roles/:roleId')
  @RequirePermission('users', 'update')
  async revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ) {
    await this.rbacService.revokeRole(parseInt(userId), roleId);
    return { message: 'Role revoked successfully' };
  }

  /**
   * Получить роли пользователя
   */
  @Get('users/:userId/roles')
  @RequirePermission('users', 'read')
  async getUserRoles(@Param('userId') userId: string, @Request() req: any) {
    const targetUserId = parseInt(userId);
    
    // Позволяем пользователям получать свои собственные роли без дополнительных проверок
    if (req.user.id === targetUserId) {
      const roles = await this.rbacService.getUserRoles(targetUserId);
      return { data: roles };
    }
    
    // Для чужих пользователей - обычная проверка разрешений
    const roles = await this.rbacService.getUserRoles(targetUserId);
    return { data: roles };
  }

  /**
   * Получить собственные роли (без проверки разрешений)
   */
  @Get('my-roles')
  async getMyRoles(@Request() req: any) {
    const roles = await this.rbacService.getUserRoles(req.user.id);
    return { data: roles };
  }

  /**
   * Очистить кэш разрешений пользователя
   */
  @Delete('users/:userId/permissions-cache')
  @RequirePermission('users', 'update')
  async clearUserPermissionCache(@Param('userId') userId: string) {
    await this.rbacService.clearPermissionCache(parseInt(userId));
    return { message: 'Permission cache cleared successfully' };
  }

  // === ПРОВЕРКА РАЗРЕШЕНИЙ ===

  /**
   * Проверить разрешение пользователя
   */
  @Post('check-permission')
  @RequirePermission('permissions', 'read', { scope: 'OWN' })
  async checkPermission(
    @Request() req: any,
    @Body() body: {
      module: string;
      action: string;
      resource?: string;
      resourceId?: string;
      ownerId?: number;
      groupId?: number;
      departmentId?: number;
    }
  ) {
    const hasPermission = await this.rbacService.hasPermission(req.user.id, body);
    return { 
      data: { 
        hasPermission,
        userId: req.user.id,
        check: body
      } 
    };
  }

  /**
   * Получить разрешения текущего пользователя
   */
  @Get('my-permissions')
  @RequirePermission('permissions', 'read', { scope: 'OWN' })
  async getMyPermissions(@Request() req: any) {
    const roles = await this.rbacService.getUserRoles(req.user.id);
    return { data: roles };
  }
}
