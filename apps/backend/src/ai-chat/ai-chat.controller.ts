import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AiChatService } from './ai-chat.service';

@ApiTags('AI Chat')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly service: AiChatService) {}

  // --- Threads ---

  @Get('threads')
  @ApiOperation({ summary: 'Список тредов пользователя (опц. по тьютору)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async listThreads(@Req() req: Request, @Query('tutorId') tutorId?: string) {
    const user: any = (req as any).user;
    const tId = tutorId ? Number(tutorId) : undefined;
    return await this.service.listThreads(user.id, tId);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Создать тред для данного тьютора' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async createThread(@Req() req: Request, @Body() body: { tutorId: number; title?: string | null }) {
    const user: any = (req as any).user;
    return await this.service.createThread(user.id, Number(body.tutorId), body.title ?? null);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Получить тред (проверка владения)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async getThread(@Req() req: Request, @Param('id') id: string) {
    const user: any = (req as any).user;
    return await this.service.getThread(user.id, Number(id));
  }

  @Patch('threads/:id')
  @ApiOperation({ summary: 'Обновить тред (например, title)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async updateThread(@Req() req: Request, @Param('id') id: string, @Body() body: { title?: string | null }) {
    const user: any = (req as any).user;
    return await this.service.updateThread(user.id, Number(id), body.title ?? null);
  }

  @Post('threads/:id/generate-title')
  @ApiOperation({ summary: 'Сгенерировать title для треда на основе первого сообщения' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async generateTitle(@Req() req: Request, @Param('id') id: string) {
    const user: any = (req as any).user;
    const title = await this.service.generateTitle(user.id, Number(id));
    // update the thread with the generated title
    return await this.service.updateThread(user.id, Number(id), title);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Список сообщений треда (asc), пагинация через limit и beforeId' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async listMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string
  ) {
    const user: any = (req as any).user;
    const lim = limit ? Math.max(1, Math.min(500, Number(limit))) : 100;
    const cursor = beforeId ? Number(beforeId) : undefined;
    return await this.service.listMessages(user.id, Number(id), lim, cursor);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Отправить сообщение (persist) и получить ответ ассистента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { content: string; attachments?: any }
  ) {
    const user: any = (req as any).user;
    return await this.service.sendMessage(user.id, Number(id), { content: body.content, attachments: body.attachments });
  }
}
