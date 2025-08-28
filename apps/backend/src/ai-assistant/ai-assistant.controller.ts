import { Controller, Post, UseGuards, UseInterceptors, UploadedFiles, Body, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AiAssistantService } from './ai-assistant.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('AI Assistant')
@Controller('ai-assistant')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) { }

  @Post('session')
  @ApiOperation({ summary: 'Создать ephemeral token для OpenAI Realtime API' })
  @ApiResponse({
    status: 201,
    description: 'Ephemeral token создан успешно',
    schema: {
      type: 'object',
      properties: {
        client_secret: {
          type: 'object',
          properties: {
            value: { type: 'string', description: 'Ephemeral token' },
            expires_at: { type: 'number', description: 'Время истечения токена (Unix timestamp)' },
          },
        },
      },
    },
  })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  async createSession() {
    return this.aiAssistantService.createEphemeralToken();
  }


  @Post('openai-responses')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Отправить сообщение в Neuro Abai AI' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Сообщение и файлы для анализа',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Текст сообщения' },
        scenario: { type: 'string', description: 'Сценарий анализа' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Файлы для анализа'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Ответ от AI получен успешно',
    schema: {
      type: 'string',
      description: 'Ответ от AI ассистента'
    }
  })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT', "FINANCIST")
  async sendMessage(
    @Body() body: { message?: string; messages?: { role: string; content: string }[]; scenario?: string },
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // prefer full conversation if provided as structured messages; fallback to single message
    const message = body.messages && Array.isArray(body.messages)
      ? body.messages.map(m => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n\n')
      : (body.message ?? '');
    const scenario = body.scenario ?? '';
    return await this.aiAssistantService.processNeuroAbaiRequest(message, scenario, files);
  }

  @Post('suggestions')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Создать AI предложение для КТП' })
  @ApiConsumes('multipart/form-data')
  @Roles('TEACHER', 'ADMIN')
  async createSuggestion(
    @Body() body: { curriculumPlanId: number; message?: string },
    @Req() req: Request,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const user: any = (req as any).user;
    return await this.aiAssistantService.generateKtpSuggestion(body.curriculumPlanId, user.id, body.message, files);
  }

  @Get('suggestions/:id')
  @ApiOperation({ summary: 'Получить AI предложение и аудит' })
  @Roles('TEACHER', 'ADMIN')
  async getSuggestion(@Param('id') id: string) {
    return await this.aiAssistantService.getSuggestionWithAudit(Number(id));
  }

  @Post('suggestions/:id/apply')
  @ApiOperation({ summary: 'Применить AI предложение к КТП' })
  @Roles('TEACHER', 'ADMIN')
  async applySuggestion(@Param('id') id: string, @Req() req: Request) {
    const user: any = (req as any).user;
    return await this.aiAssistantService.applySuggestion(Number(id), user.id);
  }

  @Get('tools')
  @ApiOperation({ summary: 'Получить список инструментов агента' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  async getTools(@Req() req: Request) {
    const user: any = (req as any).user;
    return await this.aiAssistantService.getAvailableTools(user.id);
  }

  @Post('agent-action')
  @ApiOperation({ summary: 'Выполнить или просмотреть действие агента (dryRun)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        actionId: { type: 'string' },
        args: { type: 'object' },
        dryRun: { type: 'boolean' }
      },
      required: ['actionId']
    }
  })
  @Roles('ADMIN', 'TEACHER')
  async agentAction(@Body() body: { actionId: string; args?: any; dryRun?: boolean }, @Req() req: Request) {
    const user: any = (req as any).user;
    return await this.aiAssistantService.handleAgentAction(body.actionId, user.id, body.args, body.dryRun ?? true);
  }

  @Post('generate-actions')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Сгенерировать предложения действий (action proposals) от LLM' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Запрос на генерацию предложений действий агента',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Текст запроса / контекст для агента' },
        context: { type: 'object', description: 'Дополнительный контекст (опционально)' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Файлы для анализа (опционально)'
        }
      },
      required: ['message']
    }
  })
  @Roles('ADMIN', 'TEACHER')
  async generateActions(
    @Body() body: { message?: string; messages?: { role: string; content: string }[]; context?: any },
    @UploadedFiles() files?: Express.Multer.File[],
    @Req() req?: Request
  ) {
    const user: any = req ? (req as any).user : undefined;
    const message = body.messages && Array.isArray(body.messages)
      ? body.messages.map(m => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n\n')
      : (body.message ?? '');
    return await this.aiAssistantService.generateActionProposals(message, user?.id, body.context, files);
  }
}
