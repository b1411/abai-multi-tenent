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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SystemService } from './system.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { CreateSystemUserDto, UpdateSystemUserDto, UserFilterDto } from "./dto/user.dto";
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) { }

  // System Settings
  @Get('settings')
  async getSystemSettings() {
    const settings = await this.systemService.getSystemSettings();
    return { data: settings };
  }

  @Put('settings')
  async updateSystemSettings(@Body() settings: UpdateSystemSettingsDto) {
    const updatedSettings = await this.systemService.updateSystemSettings(settings);
    return { data: updatedSettings };
  }

  @Get('backup')
  async downloadBackup(@Res() res: Response) {
    const backup = await this.systemService.downloadBackup();
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(backup);
  }

  // Users Management
  @Get('users')
  async getUsers(@Query() filter: UserFilterDto) {
    const users = await this.systemService.getUsers(filter);
    return { data: users };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.systemService.getUserById(id);
    return { data: user };
  }

  @Post('users')
  async createUser(@Body() data: CreateSystemUserDto) {
    const user = await this.systemService.createUser(data);
    return { data: user };
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: UpdateSystemUserDto) {
    const user = await this.systemService.updateUser(id, data);
    return { data: user };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const result = await this.systemService.deleteUser(id);
    return result;
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(@Param('id') id: string) {
    const result = await this.systemService.resetUserPassword(id);
    return { data: result };
  }

  // Roles & Permissions
  @Get('roles')
  getRoles() {
    const roles = this.systemService.getRoles();
    return { data: roles };
  }

  @Post('roles')
  createRole(@Body() data: CreateRoleDto) {
    const role = this.systemService.createRole(data);
    return { data: role };
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    const role = await this.systemService.updateRole(id, data);
    return { data: role };
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    const result = await this.systemService.deleteRole(id);
    return result;
  }

  @Get('permissions')
  async getAvailablePermissions() {
    const permissions = await this.systemService.getAvailablePermissions();
    return { data: permissions };
  }

  // Branding
  @Get('branding')
  async getBrandingSettings() {
    const settings = await this.systemService.getBrandingSettings();
    return { data: settings };
  }

  @Put('branding')
  async updateBrandingSettings(@Body() settings: any) {
    const updatedSettings = await this.systemService.updateBrandingSettings(settings);
    return { data: updatedSettings };
  }

  @Post('branding/logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    // В реальном приложении файл будет сохраняться в хранилище
    const url = `/uploads/logos/${Date.now()}-${file.originalname}`;
    return { data: { url } };
  }

  @Post('branding/favicon')
  @UseInterceptors(FileInterceptor('favicon'))
  uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    // В реальном приложении файл будет сохраняться в хранилище
    const url = `/uploads/favicons/${Date.now()}-${file.originalname}`;
    return { data: { url } };
  }

  // Integrations
  @Get('integrations')
  async getIntegrations() {
    const integrations = await this.systemService.getIntegrations();
    return { data: integrations };
  }

  @Post('integrations')
  async createIntegration(@Body() data: any) {
    const integration = await this.systemService.createIntegration(data);
    return { data: integration };
  }

  @Put('integrations/:id')
  async updateIntegration(@Param('id') id: string, @Body() data: any) {
    const integration = await this.systemService.updateIntegration(id, data);
    return { data: integration };
  }

  @Delete('integrations/:id')
  async deleteIntegration(@Param('id') id: string) {
    const result = await this.systemService.deleteIntegration(id);
    return result;
  }

  @Post('integrations/:id/connect')
  async connectIntegration(@Param('id') id: string) {
    const integration = await this.systemService.connectIntegration(id);
    return { data: integration };
  }

  @Post('integrations/:id/disconnect')
  async disconnectIntegration(@Param('id') id: string) {
    const integration = await this.systemService.disconnectIntegration(id);
    return { data: integration };
  }

  @Post('integrations/:id/sync')
  async syncIntegration(@Param('id') id: string) {
    const result = await this.systemService.syncIntegration(id);
    return result;
  }
}
