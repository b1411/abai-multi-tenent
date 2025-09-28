import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProctoringService } from './proctoring.service';
import { CreateProctoringSessionDto, ProctoringResultDto } from './dto/create-proctoring.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from 'generated/prisma';

@ApiTags('proctoring')
@Controller('proctoring')
@UseGuards(AuthGuard, RolesGuard)
export class ProctoringController {
    constructor(private readonly proctoringService: ProctoringService) { }

    @Post('session')
    @Roles('STUDENT', 'ADMIN', 'TEACHER')
    @ApiOperation({ summary: 'Создать сессию прокторинга' })
    @ApiResponse({ status: 201, description: 'Сессия создана' })
    async createSession(
        @CurrentUser() user: { id: number; role: UserRole },
        @Body() dto: CreateProctoringSessionDto
    ) {
        return this.proctoringService.createSession(user.id, dto);
    }

    @Post('session/:id/end')
    @Roles('STUDENT', 'ADMIN', 'TEACHER')
    @ApiOperation({ summary: 'Завершить сессию прокторинга' })
    @ApiResponse({ status: 200, description: 'Сессия завершена' })
    async endSession(
        @Param('id', ParseIntPipe) sessionId: number,
        @Body() results?: ProctoringResultDto
    ) {
        return this.proctoringService.endSession(sessionId, results);
    }

    @Get('session/:id')
    @Roles('STUDENT', 'ADMIN', 'TEACHER')
    @ApiOperation({ summary: 'Получить сессию прокторинга' })
    @ApiResponse({ status: 200, description: 'Сессия найдена' })
    async getSession(@Param('id', ParseIntPipe) sessionId: number) {
        return this.proctoringService.getSession(sessionId);
    }

    @Get('homework/:homeworkId/sessions')
    @Roles('ADMIN', 'TEACHER')
    @ApiOperation({ summary: 'Получить сессии прокторинга для домашнего задания' })
    @ApiResponse({ status: 200, description: 'Сессии найдены' })
    async getHomeworkSessions(@Param('homeworkId', ParseIntPipe) homeworkId: number) {
        return this.proctoringService.getHomeworkProctoringSessions(homeworkId);
    }

    @Get('sessions')
    @Roles('ADMIN', 'TEACHER')
    @ApiOperation({ summary: 'Получить все сессии прокторинга' })
    @ApiResponse({ status: 200, description: 'Список всех сессий' })
    @ApiQuery({ name: 'status', required: false, description: 'Фильтр по статусу' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Фильтр по студенту' })
    @ApiQuery({ name: 'homeworkId', required: false, description: 'Фильтр по домашнему заданию' })
    @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
    @ApiQuery({ name: 'limit', required: false, description: 'Количество элементов на странице' })
    getAllSessions(
        @Query('status') status?: string,
        @Query('studentId') studentId?: string,
        @Query('homeworkId') homeworkId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const filters = {
            status: status as any,
            studentId: studentId ? parseInt(studentId) : undefined,
            homeworkId: homeworkId ? parseInt(homeworkId) : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        };
    return this.proctoringService.getAllSessions(filters);
  }

  @Post('session/:id/message')
  @Roles('STUDENT', 'ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Добавить сообщение в транскрипцию прокторинга' })
  @ApiResponse({ status: 200, description: 'Сообщение добавлено' })
  async addMessageToTranscript(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() message: {
      type: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      isAudio?: boolean;
    }
  ) {
    console.log('Received message for session', sessionId, message);
    await this.proctoringService.addMessageToTranscript(sessionId, {
      ...message,
      timestamp: new Date(message.timestamp)
    });
    return { success: true };
  }
}