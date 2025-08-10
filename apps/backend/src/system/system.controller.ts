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
import { FilesService } from '../files/files.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { CreateSystemUserDto, UpdateSystemUserDto, UserFilterDto } from "./dto/user.dto";
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly filesService: FilesService,
  ) { }

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
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const saved = await this.filesService.uploadFile(file, 'logos');

    let faviconUrl: string | undefined;
    try {
      // Пытаемся сгенерировать favicon из загруженного логотипа (64x64 PNG)
      // Используем eval('require') чтобы избежать ошибок резолва типов при отсутствии sharp
      let sharp: any = null;
      try {
        const req = eval('require') as (m: string) => any;
        sharp = req('sharp');
      } catch {
        // sharp не установлен — используем фолбек ниже
      }

      if (sharp && file?.buffer) {
        const resized = await sharp(file.buffer)
          .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();

        const faviconFile = {
          originalname: 'favicon.png',
          mimetype: 'image/png',
          size: resized.length,
          buffer: resized,
        } as unknown as Express.Multer.File;

        const favSaved = await this.filesService.uploadFile(faviconFile, 'favicons');
        faviconUrl = favSaved.url;
      } else if (file?.buffer) {
        // Фолбек: если sharp недоступен, сохраняем оригинал как favicon
        const faviconFile = {
          originalname: 'favicon-fallback.png',
          mimetype: file.mimetype || 'image/png',
          size: file.size,
          buffer: file.buffer,
        } as unknown as Express.Multer.File;
        const favSaved = await this.filesService.uploadFile(faviconFile, 'favicons');
        faviconUrl = favSaved.url;
      }
    } catch {
      // Безопасно игнорируем ошибки генерации фавиконки, логотип уже загружен
      // console.error('Favicon generation failed:', e);
    }

    return { data: { url: saved.url, faviconUrl, id: (saved as any).id ?? undefined, name: saved.name } };
  }

  @Post('branding/favicon')
  @UseInterceptors(FileInterceptor('favicon'))
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    const saved = await this.filesService.uploadFile(file, 'favicons');
    return { data: { url: saved.url, id: (saved as any).id ?? undefined, name: saved.name } };
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

  // Academic Hour Settings
  @Get('academic-hour/duration')
  async getAcademicHourDuration() {
    const minutes = await this.systemService.getAcademicHourDuration();
    return { data: { minutes } };
  }

  @Put('academic-hour/duration')
  async updateAcademicHourDuration(@Body() body: { minutes: number }) {
    const result = await this.systemService.setAcademicHourDuration(body.minutes);
    return { data: result };
  }

  @Get('settings/all')
  async getAllSystemSettings() {
    const settings = await this.systemService.getAllSystemSettings();
    return { data: settings };
  }

  @Put('settings/:key')
  async updateSystemSetting(@Param('key') key: string, @Body() body: { value: string }) {
    const result = await this.systemService.updateSystemSetting(key, body.value);
    return { data: result };
  }
}
