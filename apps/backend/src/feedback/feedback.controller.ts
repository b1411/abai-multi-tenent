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
  Request,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackTemplateDto } from './dto/create-feedback-template.dto';
import { UpdateFeedbackTemplateDto } from './dto/update-feedback-template.dto';
import { CreateFeedbackResponseDto } from './dto/create-feedback-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Controller('feedback')
@UseGuards(AuthGuard, RolesGuard)
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly prisma: PrismaService,
  ) { }

  // Создание шаблона (только для админов)
  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async createTemplate(
    @Body(ValidationPipe) createTemplateDto: CreateFeedbackTemplateDto,
  ) {
    try {
      return await this.feedbackService.createTemplate(createTemplateDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при создании шаблона',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение шаблонов для текущего пользователя
  @Get('templates/my')
  async getMyTemplates(@Request() req) {
    return await this.feedbackService.getTemplatesForUser(req.user.id);
  }

  // Получение всех активных шаблонов (для админов)
  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getActiveTemplates() {
    try {
      return await this.feedbackService.getActiveTemplates();
    } catch {
      throw new HttpException(
        'Ошибка при получении шаблонов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Проверка обязательных форм для текущего пользователя
  @Get('mandatory-check')
  async checkMandatoryFeedback(@Request() req) {
    return await this.feedbackService.checkMandatoryFeedback(req.user.id);
  }

  // Отправка ответа на форму
  @Post('responses')
  async submitResponse(
    @Body(ValidationPipe) responseDto: CreateFeedbackResponseDto,
    @Request() req,
  ) {
    try {
      // Валидация ответов на основе шаблона
      await this.feedbackService.validateResponse(responseDto);
      return await this.feedbackService.submitResponse(req.user.id, responseDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при отправке ответа',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Создание стандартных шаблонов (включая KPI)
  @Post('templates/create-defaults')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async createDefaultTemplates() {
    try {
      return await this.feedbackService.createDefaultTemplates();
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при создании стандартных шаблонов',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Создание динамических форм оценки преподавателей для всех студентов
  @Post('templates/create-teacher-evaluations')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async createDynamicTeacherEvaluations() {
    try {
      await this.feedbackService.createDynamicTeacherEvaluationTemplates();
      return { 
        message: 'Динамические формы оценки преподавателей созданы для всех студентов',
        success: true 
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при создании динамических форм оценки преподавателей',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение конкретного шаблона
  @Get('templates/:id')
  async getTemplate(@Param('id', ParseIntPipe) id: number) {
    try {
      const template = await this.feedbackService.getTemplate(id);
      if (!template) {
        throw new HttpException('Шаблон не найден', HttpStatus.NOT_FOUND);
      }
      return template;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Ошибка при получении шаблона',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Обновление шаблона (только для админов)
  @Put('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateTemplateDto: UpdateFeedbackTemplateDto,
  ) {
    try {
      return await this.feedbackService.updateTemplate(id, updateTemplateDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при обновлении шаблона',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Удаление шаблона (только для админов)
  @Delete('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.feedbackService.deleteTemplate(id);
      return { message: 'Шаблон успешно удален' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при удалении шаблона',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Активация/деактивация шаблона (только для админов)
  @Put('templates/:id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async toggleTemplateActive(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.feedbackService.toggleTemplateActive(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при изменении статуса шаблона',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение ответов на шаблон (для аналитики)
  @Get('templates/:id/responses')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getTemplateResponses(
    @Param('id', ParseIntPipe) id: number,
    @Query('period') period?: string,
  ) {
    try {
      return await this.feedbackService.getTemplateResponses(id, period);
    } catch {
      throw new HttpException(
        'Ошибка при получении ответов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Сброс статуса обязательной формы для пользователя (только для админов)
  @Put('users/:userId/reset-mandatory')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async resetMandatoryStatus(@Param('userId', ParseIntPipe) userId: number) {
    try {
      await this.feedbackService.resetMandatoryStatus(userId);
      return { message: 'Статус обязательной формы сброшен' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при сбросе статуса',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение статистики по заполнению форм (только для админов)
  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getFeedbackStatistics(@Query('period') period?: string) {
    try {
      return await this.feedbackService.getFeedbackStatistics(period);
    } catch {
      throw new HttpException(
        'Ошибка при получении статистики',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение аналитики по формам обратной связи (только для админов)
  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getAnalytics(
    @Query('templateId') templateId?: string,
    @Query('period') period?: string,
  ) {
    try {
      // Получаем базовую статистику
      const statistics = await this.feedbackService.getFeedbackStatistics(period);
      
      // Получаем детальную аналитику
      const analytics = await this.feedbackService.getFeedbackAnalytics(
        templateId ? parseInt(templateId) : undefined,
        period,
      );

      // Комбинируем данные для фронтенда
      return {
        totalResponses: statistics.totalResponses,
        completionRate: statistics.completionRate,
        byRole: statistics.responsesByRole,
        period: statistics.period,
        ...analytics,
      };
    } catch {
      throw new HttpException(
        'Ошибка при получении аналитики',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение эмоционального состояния студента на основе фидбеков
  @Get('students/:studentId/emotional-state')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentEmotionalState(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Request() req,
  ) {
    try {
      // Self-access restriction for students
      if (req.user.role === UserRole.STUDENT) {
        const selfStudent = await this.prisma.student.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        });
        if (!selfStudent || selfStudent.id !== studentId) {
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
      }
      return await this.feedbackService.getStudentEmotionalStateFromFeedbacks(studentId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Ошибка при получении эмоционального состояния',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение истории эмоциональных ответов студента
  @Get('students/:studentId/emotional-history')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentEmotionalHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Request() req,
    @Query('period') period?: string,
  ) {
    try {
      // Self-access restriction for students
      if (req?.user?.role === UserRole.STUDENT) {
        const selfStudent = await this.prisma.student.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        });
        if (!selfStudent || selfStudent.id !== studentId) {
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
      }
      return await this.feedbackService.getStudentEmotionalHistory(studentId, period);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Ошибка при получении истории эмоционального состояния',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение анонимизированных ответов студентов (только для админов)
  @Get('responses')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getAnonymizedResponses(
    @Query('templateId') templateId?: string,
    @Query('period') period?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    try {
      return await this.feedbackService.getAnonymizedResponses({
        templateId: templateId ? parseInt(templateId) : undefined,
        period,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch {
      throw new HttpException(
        'Ошибка при получении ответов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Эмоциональная сводка (агрегация без моков)
  @Get('emotional/overview')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getEmotionalOverview(@Query('days') days?: string) {
    try {
      return await this.feedbackService.getEmotionalOverview(days ? parseInt(days) : 7);
    } catch {
      throw new HttpException(
        'Ошибка при получении эмоциональной сводки',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
