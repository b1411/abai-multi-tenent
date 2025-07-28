import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { SystemService } from './system.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { CreateSystemUserDto, UpdateSystemUserDto, UserFilterDto } from "./dto/user.dto";
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('system')
@Controller('system')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) { }

  // System Settings
  @Get('settings')
  @RequirePermission('system', 'read')
  @ApiOperation({ summary: 'Получить системные настройки' })
  @ApiResponse({ status: 200, description: 'Системные настройки получены' })
  async getSystemSettings() {
    const settings = await this.systemService.getSystemSettings();
    return { data: settings };
  }

  @Put('settings')
  @RequirePermission('system', 'update')
  @ApiOperation({ summary: 'Обновить системные настройки' })
  @ApiResponse({ status: 200, description: 'Системные настройки обновлены' })
  async updateSystemSettings(@Body() settings: UpdateSystemSettingsDto) {
    const updatedSettings = await this.systemService.updateSystemSettings(settings);
    return { data: updatedSettings };
  }

  @Get('backup')
  @RequirePermission('system', 'read')
  @ApiOperation({ summary: 'Скачать резервную копию системы' })
  @ApiResponse({ status: 200, description: 'Резервная копия создана' })
  async downloadBackup(@Res() res: Response) {
    const backup = await this.systemService.downloadBackup();
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(backup);
  }

  // Users Management
  @Get('users')
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Получить список пользователей системы' })
  @ApiResponse({ status: 200, description: 'Список пользователей получен' })
  async getUsers(@Query() filter: UserFilterDto) {
    const users = await this.systemService.getUsers(filter);
    return { data: users };
  }

  @Get('users/:id')
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserById(@Param('id') id: string) {
    const user = await this.systemService.getUserById(id);
    return { data: user };
  }

  @Post('users')
  @RequirePermission('users', 'create')
  @ApiOperation({ summary: 'Создать нового пользователя системы' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  async createUser(@Body() data: CreateSystemUserDto) {
    const user = await this.systemService.createUser(data);
    return { data: user };
  }

  @Put('users/:id')
  @RequirePermission('users', 'update')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateUser(@Param('id') id: string, @Body() data: UpdateSystemUserDto) {
    const user = await this.systemService.updateUser(id, data);
    return { data: user };
  }

  @Delete('users/:id')
  @RequirePermission('users', 'delete')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.systemService.deleteUser(id);
    return result;
  }

  @Post('users/:id/reset-password')
  @RequirePermission('users', 'update')
  @ApiOperation({ summary: 'Сбросить пароль пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно сброшен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async resetUserPassword(@Param('id') id: string) {
    const result = await this.systemService.resetUserPassword(id);
    return { data: result };
  }

  // Roles & Permissions
  @Get('roles')
  @RequirePermission('roles', 'read')
  @ApiOperation({ summary: 'Получить список ролей' })
  @ApiResponse({ status: 200, description: 'Список ролей получен' })
  getRoles() {
    const roles = this.systemService.getRoles();
    return { data: roles };
  }

  @Post('roles')
  @RequirePermission('roles', 'create')
  @ApiOperation({ summary: 'Создать новую роль' })
  @ApiResponse({ status: 201, description: 'Роль успешно создана' })
  createRole(@Body() data: CreateRoleDto) {
    const role = this.systemService.createRole(data);
    return { data: role };
  }

  @Put('roles/:id')
  @RequirePermission('roles', 'update')
  @ApiOperation({ summary: 'Обновить роль' })
  @ApiResponse({ status: 200, description: 'Роль успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Роль не найдена' })
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    const role = await this.systemService.updateRole(id, data);
    return { data: role };
  }

  @Delete('roles/:id')
  @RequirePermission('roles', 'delete')
  @ApiOperation({ summary: 'Удалить роль' })
  @ApiResponse({ status: 200, description: 'Роль успешно удалена' })
  @ApiResponse({ status: 404, description: 'Роль не найдена' })
  async deleteRole(@Param('id') id: string) {
    const result = await this.systemService.deleteRole(id);
    return result;
  }

  @Get('permissions')
  @RequirePermission('permissions', 'read')
  @ApiOperation({ summary: 'Получить доступные разрешения' })
  @ApiResponse({ status: 200, description: 'Список разрешений получен' })
  async getAvailablePermissions() {
    const permissions = await this.systemService.getAvailablePermissions();
    return { data: permissions };
  }

  // Branding
  @Get('branding')
  @RequirePermission('branding', 'read')
  @ApiOperation({ summary: 'Получить настройки брендинга' })
  @ApiResponse({ status: 200, description: 'Настройки брендинга получены' })
  async getBrandingSettings() {
    const settings = await this.systemService.getBrandingSettings();
    return { data: settings };
  }

  @Put('branding')
  @RequirePermission('branding', 'update')
  @ApiOperation({ summary: 'Обновить настройки брендинга' })
  @ApiResponse({ status: 200, description: 'Настройки брендинга обновлены' })
  async updateBrandingSettings(@Body() settings: any) {
    const updatedSettings = await this.systemService.updateBrandingSettings(settings);
    return { data: updatedSettings };
  }

  @Post('branding/logo')
  @RequirePermission('branding', 'update')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Загрузить логотип' })
  @ApiResponse({ status: 201, description: 'Логотип успешно загружен' })
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    // В реальном приложении файл будет сохраняться в хранилище
    const url = `/uploads/logos/${Date.now()}-${file.originalname}`;
    return { data: { url } };
  }

  @Post('branding/favicon')
  @RequirePermission('branding', 'update')
  @UseInterceptors(FileInterceptor('favicon'))
  @ApiOperation({ summary: 'Загрузить фавикон' })
  @ApiResponse({ status: 201, description: 'Фавикон успешно загружен' })
  uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    // В реальном приложении файл будет сохраняться в хранилище
    const url = `/uploads/favicons/${Date.now()}-${file.originalname}`;
    return { data: { url } };
  }

  // Integrations
  @Get('integrations')
  @RequirePermission('integrations', 'read')
  @ApiOperation({ summary: 'Получить список интеграций' })
  @ApiResponse({ status: 200, description: 'Список интеграций получен' })
  async getIntegrations() {
    const integrations = await this.systemService.getIntegrations();
    return { data: integrations };
  }

  @Post('integrations')
  @RequirePermission('integrations', 'create')
  @ApiOperation({ summary: 'Создать новую интеграцию' })
  @ApiResponse({ status: 201, description: 'Интеграция успешно создана' })
  async createIntegration(@Body() data: any) {
    const integration = await this.systemService.createIntegration(data);
    return { data: integration };
  }

  @Put('integrations/:id')
  @RequirePermission('integrations', 'update')
  @ApiOperation({ summary: 'Обновить интеграцию' })
  @ApiResponse({ status: 200, description: 'Интеграция успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  async updateIntegration(@Param('id') id: string, @Body() data: any) {
    const integration = await this.systemService.updateIntegration(id, data);
    return { data: integration };
  }

  @Delete('integrations/:id')
  @RequirePermission('integrations', 'delete')
  @ApiOperation({ summary: 'Удалить интеграцию' })
  @ApiResponse({ status: 200, description: 'Интеграция успешно удалена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  async deleteIntegration(@Param('id') id: string) {
    const result = await this.systemService.deleteIntegration(id);
    return result;
  }

  @Post('integrations/:id/connect')
  @RequirePermission('integrations', 'update')
  @ApiOperation({ summary: 'Подключить интеграцию' })
  @ApiResponse({ status: 200, description: 'Интеграция успешно подключена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  async connectIntegration(@Param('id') id: string) {
    const integration = await this.systemService.connectIntegration(id);
    return { data: integration };
  }

  @Post('integrations/:id/disconnect')
  @RequirePermission('integrations', 'update')
  @ApiOperation({ summary: 'Отключить интеграцию' })
  @ApiResponse({ status: 200, description: 'Интеграция успешно отключена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  async disconnectIntegration(@Param('id') id: string) {
    const integration = await this.systemService.disconnectIntegration(id);
    return { data: integration };
  }

  @Post('integrations/:id/sync')
  @RequirePermission('integrations', 'update')
  @ApiOperation({ summary: 'Синхронизировать интеграцию' })
  @ApiResponse({ status: 200, description: 'Синхронизация успешно выполнена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  async syncIntegration(@Param('id') id: string) {
    const result = await this.systemService.syncIntegration(id);
    return result;
  }
}
