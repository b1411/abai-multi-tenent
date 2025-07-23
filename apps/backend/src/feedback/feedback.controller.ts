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
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackTemplateDto } from './dto/create-feedback-template.dto';
import { UpdateFeedbackTemplateDto } from './dto/update-feedback-template.dto';
import { CreateFeedbackResponseDto } from './dto/create-feedback-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Создание шаблона (только для админов)
  @Post('templates')
  async createTemplate(@Body() createTemplateDto: CreateFeedbackTemplateDto) {
    return await this.feedbackService.createTemplate(createTemplateDto);
  }

  // Получение шаблонов для текущего пользователя
  @Get('templates/my')
  async getMyTemplates(@Request() req) {
    return await this.feedbackService.getTemplatesForUser(req.user.id);
  }

  // Получение всех активных шаблонов (для админов)
  @Get('templates')
  async getActiveTemplates() {
    return await this.feedbackService.getActiveTemplates();
  }

  // Проверка обязательных форм для текущего пользователя
  @Get('mandatory-check')
  async checkMandatoryFeedback(@Request() req) {
    return await this.feedbackService.checkMandatoryFeedback(req.user.id);
  }

  // Отправка ответа на форму
  @Post('responses')
  async submitResponse(
    @Body() responseDto: CreateFeedbackResponseDto,
    @Request() req,
  ) {
    return await this.feedbackService.submitResponse(req.user.id, responseDto);
  }

  // Получение конкретного шаблона
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return await this.feedbackService.getTemplate(parseInt(id));
  }

  // Обновление шаблона (только для админов)
  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateFeedbackTemplateDto,
  ) {
    return await this.feedbackService.updateTemplate(parseInt(id), updateTemplateDto);
  }

  // Удаление шаблона (только для админов)
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return await this.feedbackService.deleteTemplate(parseInt(id));
  }

  // Активация/деактивация шаблона
  @Put('templates/:id/toggle-active')
  async toggleTemplateActive(@Param('id') id: string) {
    return await this.feedbackService.toggleTemplateActive(parseInt(id));
  }

  // Получение ответов на шаблон (для аналитики)
  @Get('templates/:id/responses')
  async getTemplateResponses(
    @Param('id') id: string,
    @Query('period') period?: string,
  ) {
    return await this.feedbackService.getTemplateResponses(parseInt(id), period);
  }

  // Сброс статуса обязательной формы для пользователя (только для админов)
  @Put('users/:userId/reset-mandatory')
  async resetMandatoryStatus(@Param('userId') userId: string) {
    return await this.feedbackService.resetMandatoryStatus(parseInt(userId));
  }

  // Получение статистики по заполнению форм
  @Get('statistics')
  async getFeedbackStatistics(@Query('period') period?: string) {
    return await this.feedbackService.getFeedbackStatistics(period);
  }

  // Получение аналитики по формам обратной связи
  @Get('analytics')
  async getFeedbackAnalytics(
    @Query('templateId') templateId?: string,
    @Query('period') period?: string,
  ) {
    return await this.feedbackService.getFeedbackAnalytics(
      templateId ? parseInt(templateId) : undefined,
      period,
    );
  }
}
