import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AiTutorsService } from './ai-tutors.service';

@ApiTags('AI Tutors')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('ai-tutors')
export class AiTutorsController {
  constructor(private readonly service: AiTutorsService) {}

  @Get()
  @ApiOperation({ summary: 'Список доступных AI-тьюторов (для всех аутентифицированных)' })
  async list(@Req() req: Request) {
    const user: any = (req as any).user;
    return await this.service.list(user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить AI-тьютора по id' })
  async getOne(@Param('id') id: string) {
    return await this.service.getOne(Number(id));
  }

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Создать AI-тьютора (ADMIN/TEACHER)' })
  async create(
    @Body() body: { subject: string; name?: string; avatarUrl?: string; extraInstructions?: string; isPublic?: boolean; fileIds?: number[] },
    @Req() req: Request
  ) {
    const user: any = (req as any).user;
    const tutor = await this.service.create({
      subject: body.subject,
      name: body.name ?? null,
      avatarUrl: body.avatarUrl ?? null,
      extraInstructions: body.extraInstructions ?? null,
      isPublic: body.isPublic ?? true,
      createdBy: user.id
    });
    let ingest = null;
    if (Array.isArray(body.fileIds) && body.fileIds.length > 0) {
      ingest = await this.service.ingestFiles(tutor.id, body.fileIds);
    }
    return { tutor, ingest };
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Обновить AI-тьютора (ADMIN/TEACHER)' })
  async update(
    @Param('id') id: string,
    @Body() body: { subject?: string; name?: string; avatarUrl?: string; extraInstructions?: string; isPublic?: boolean }
  ) {
    return await this.service.update(Number(id), {
      subject: body.subject,
      name: body.name,
      avatarUrl: body.avatarUrl,
      extraInstructions: body.extraInstructions,
      isPublic: body.isPublic
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Удалить AI-тьютора (soft delete)' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(Number(id));
  }

  @Post(':id/ingest-files')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Привязать файлы к тьютору и обновить knowledgeText' })
  async ingestFiles(@Param('id') id: string, @Body() body: { fileIds: number[] }) {
    return await this.service.ingestFiles(Number(id), Array.isArray(body.fileIds) ? body.fileIds : []);
  }

  @Get(':id/prompt')
  @ApiOperation({ summary: 'Получить system prompt для realtime session.update' })
  async getPrompt(@Param('id') id: string) {
    const prompt = await this.service.buildPrompt(Number(id));
    return { prompt };
  }
}
