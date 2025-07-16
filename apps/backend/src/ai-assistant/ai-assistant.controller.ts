import { Controller, Post, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
}
