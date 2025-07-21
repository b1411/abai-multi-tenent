import { Controller, Post, UseGuards, UseInterceptors, UploadedFiles, Body } from '@nestjs/common';
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
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  async sendMessage(
    @Body() body: { message: string; scenario: string },
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return await this.aiAssistantService.processNeuroAbaiRequest(body.message, body.scenario, files);
  }
}
