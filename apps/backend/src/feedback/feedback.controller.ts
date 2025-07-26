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
import { ThrottleGuard } from '../common/guards/throttle.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Throttle } from '../common/decorators/throttle.decorator';
import { UserRole } from 'generated/prisma';

@Controller('feedback')
@UseGuards(AuthGuard, RolesGuard, ThrottleGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Создание шаблона (только для админов)
  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @Throttle(300, 10) // 10 запросов в 5 минут
  async createTemplate(
    @Body(ValidationPipe) createTemplateDto: CreateFeedbackTemplateDto,
    @Request() req,
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
    } catch (error) {
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
  @Throttle(60, 5) // 5 запросов в минуту
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
    } catch (error) {
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
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении статистики',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение аналитики по формам обратной связи (только для админов)
  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.HR)
  async getFeedbackAnalytics(
    @Query('templateId') templateId?: string,
    @Query('period') period?: string,
  ) {
    try {
      return await this.feedbackService.getFeedbackAnalytics(
        templateId ? parseInt(templateId) : undefined,
        period,
      );
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении аналитики',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение эмоционального состояния студента на основе фидбеков
  @Get('students/:studentId/emotional-state')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER)
  async getStudentEmotionalState(@Param('studentId', ParseIntPipe) studentId: number) {
    try {
      return await this.feedbackService.getStudentEmotionalStateFromFeedbacks(studentId);
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении эмоционального состояния',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Получение истории эмоциональных ответов студента
  @Get('students/:studentId/emotional-history')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER)
  async getStudentEmotionalHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('period') period?: string,
  ) {
    try {
      return await this.feedbackService.getStudentEmotionalHistory(studentId, period);
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении истории эмоционального состояния',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
