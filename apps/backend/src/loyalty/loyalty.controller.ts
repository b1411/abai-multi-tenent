import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { LoyaltyFilterDto } from './dto/loyalty-filter.dto';
import { ReviewReactionDto } from './dto/review-reaction.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('reviews')
  @RequirePermission('loyalty', 'create')
  @ApiOperation({ summary: 'Создать отзыв' })
  @ApiResponse({ status: 201, description: 'Отзыв успешно создан' })
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.loyaltyService.createReview(req.user.id, createReviewDto);
  }

  @Get('reviews')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить список отзывов' })
  @ApiResponse({ status: 200, description: 'Список отзывов получен' })
  async getReviews(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getReviews(filter);
  }

  @Get('reviews/:id')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить отзыв по ID' })
  @ApiResponse({ status: 200, description: 'Отзыв найден' })
  @ApiResponse({ status: 404, description: 'Отзыв не найден' })
  async getReview(@Param('id') id: string) {
    return this.loyaltyService.getReview(+id);
  }

  @Post('reviews/:id/reactions')
  @RequirePermission('loyalty', 'create')
  @ApiOperation({ summary: 'Добавить реакцию на отзыв' })
  @ApiResponse({ status: 201, description: 'Реакция успешно добавлена' })
  async addReaction(
    @Param('id') reviewId: string,
    @Body() reactionDto: ReviewReactionDto,
    @Request() req,
  ) {
    return this.loyaltyService.addReaction(+reviewId, req.user.id, reactionDto);
  }

  @Get('analytics')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить аналитику лояльности' })
  @ApiResponse({ status: 200, description: 'Аналитика получена' })
  async getAnalytics(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getAnalytics(filter);
  }

  @Get('analytics/trends')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить тренды лояльности' })
  @ApiResponse({ status: 200, description: 'Тренды получены' })
  async getTrends(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getTrends(filter);
  }

  @Get('analytics/teacher/:teacherId')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить аналитику лояльности по преподавателю' })
  @ApiResponse({ status: 200, description: 'Аналитика по преподавателю получена' })
  async getTeacherAnalytics(
    @Param('teacherId') teacherId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getTeacherAnalytics(+teacherId, filter);
  }

  @Get('analytics/group/:groupId')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить аналитику лояльности по группе' })
  @ApiResponse({ status: 200, description: 'Аналитика по группе получена' })
  async getGroupAnalytics(
    @Param('groupId') groupId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getGroupAnalytics(+groupId, filter);
  }

  @Get('analytics/summary')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить сводную аналитику лояльности' })
  @ApiResponse({ status: 200, description: 'Сводная аналитика получена' })
  async getSummary(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getSummary(filter);
  }

  @Get('analytics/repeat-purchases')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить аналитику повторных покупок' })
  @ApiResponse({ status: 200, description: 'Аналитика повторных покупок получена' })
  async getRepeatPurchaseAnalytics(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getRepeatPurchaseRate(filter);
  }

  @Get('analytics/feedback-based')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить лояльность на основе отзывов' })
  @ApiResponse({ status: 200, description: 'Данные лояльности на основе отзывов получены' })
  async getFeedbackBasedLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackBasedLoyalty(filter);
  }

  @Get('analytics/emotional')
  @RequirePermission('loyalty', 'read')
  @ApiOperation({ summary: 'Получить эмоциональную лояльность' })
  @ApiResponse({ status: 200, description: 'Данные эмоциональной лояльности получены' })
  async getEmotionalLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getEmotionalLoyalty(filter);
  }

  @Get('feedback-responses')
  @RequirePermission('feedback', 'read')
  @ApiOperation({ summary: 'Получить ответы на отзывы' })
  @ApiResponse({ status: 200, description: 'Ответы на отзывы получены' })
  async getFeedbackResponses(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponses(filter);
  }

  @Get('feedback-responses/:id')
  @RequirePermission('feedback', 'read')
  @ApiOperation({ summary: 'Получить ответ на отзыв по ID' })
  @ApiResponse({ status: 200, description: 'Ответ на отзыв найден' })
  @ApiResponse({ status: 404, description: 'Ответ на отзыв не найден' })
  async getFeedbackResponse(@Param('id') id: string) {
    return await this.loyaltyService.getFeedbackResponse(+id);
  }

  @Get('feedback-responses/stats')
  @RequirePermission('feedback', 'read')
  @ApiOperation({ summary: 'Получить статистику ответов на отзывы' })
  @ApiResponse({ status: 200, description: 'Статистика ответов получена' })
  async getFeedbackResponsesStats(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponsesStats(filter);
  }
}
