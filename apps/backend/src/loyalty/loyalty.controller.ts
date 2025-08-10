import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { LoyaltyFilterDto } from './dto/loyalty-filter.dto';
import { ReviewReactionDto } from './dto/review-reaction.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';

@Controller('loyalty')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('reviews')
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async createReview(req: ExpressRequest & { user: { id: number } }, @Body() createReviewDto: CreateReviewDto) {
    return this.loyaltyService.createReview(req.user.id, createReviewDto);
  }

  @Get('reviews')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  async getReviews(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getReviews(filter);
  }

  @Get('reviews/:id')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  async getReview(@Param('id') id: string) {
    return this.loyaltyService.getReview(+id);
  }

  @Post('reviews/:id/reactions')
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  async addReaction(
    @Param('id') reviewId: string,
    @Body() reactionDto: ReviewReactionDto,
    req: ExpressRequest & { user: { id: number } },
  ) {
    return this.loyaltyService.addReaction(+reviewId, req.user.id, reactionDto);
  }

  @Get('analytics')
  @Roles('ADMIN', 'FINANCIST')
  async getAnalytics(@Query() filter: LoyaltyFilterDto) {
    // Возвращаем аналитику в формате LoyaltyAnalytics, рассчитанную из feedback
    return this.loyaltyService.getAnalyticsFromFeedback(filter);
  }

  @Get('analytics/trends')
  @Roles('ADMIN', 'FINANCIST')
  async getTrends(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getTrends(filter);
  }

  @Get('analytics/teacher/:teacherId')
  @Roles('ADMIN', 'FINANCIST')
  async getTeacherAnalytics(
    @Param('teacherId') teacherId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getTeacherAnalytics(+teacherId, filter);
  }

  @Get('analytics/group/:groupId')
  @Roles('ADMIN', 'FINANCIST')
  async getGroupAnalytics(
    @Param('groupId') groupId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getGroupAnalytics(+groupId, filter);
  }

  @Get('analytics/summary')
  @Roles('ADMIN', 'FINANCIST')
  async getSummary(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getSummary(filter);
  }

  @Get('analytics/repeat-purchases')
  @Roles('ADMIN', 'FINANCIST')
  async getRepeatPurchaseAnalytics(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getRepeatPurchaseRate(filter);
  }

  @Get('analytics/feedback-based')
  @Roles('ADMIN', 'FINANCIST')
  async getFeedbackBasedLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackBasedLoyalty(filter);
  }

  @Get('analytics/emotional')
  @Roles('ADMIN', 'FINANCIST')
  async getEmotionalLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getEmotionalLoyalty(filter);
  }

  @Get('feedback-responses')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  async getFeedbackResponses(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponses(filter);
  }

  @Get('feedback-responses/:id')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  async getFeedbackResponse(@Param('id') id: string) {
    return await this.loyaltyService.getFeedbackResponse(+id);
  }

  @Get('feedback-responses/stats')
  @Roles('ADMIN', 'FINANCIST')
  async getFeedbackResponsesStats(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponsesStats(filter);
  }
}
