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
import { LoyaltyService } from './loyalty.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { LoyaltyFilterDto } from './dto/loyalty-filter.dto';
import { ReviewReactionDto } from './dto/review-reaction.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('loyalty')
@UseGuards(AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('reviews')
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.loyaltyService.createReview(req.user.id, createReviewDto);
  }

  @Get('reviews')
  async getReviews(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getReviews(filter);
  }

  @Get('reviews/:id')
  async getReview(@Param('id') id: string) {
    return this.loyaltyService.getReview(+id);
  }

  @Post('reviews/:id/reactions')
  async addReaction(
    @Param('id') reviewId: string,
    @Body() reactionDto: ReviewReactionDto,
    @Request() req,
  ) {
    return this.loyaltyService.addReaction(+reviewId, req.user.id, reactionDto);
  }

  @Get('analytics')
  async getAnalytics(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getAnalytics(filter);
  }

  @Get('analytics/trends')
  async getTrends(@Query() filter: LoyaltyFilterDto) {
    return this.loyaltyService.getTrends(filter);
  }

  @Get('analytics/teacher/:teacherId')
  async getTeacherAnalytics(
    @Param('teacherId') teacherId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getTeacherAnalytics(+teacherId, filter);
  }

  @Get('analytics/group/:groupId')
  async getGroupAnalytics(
    @Param('groupId') groupId: string,
    @Query() filter: LoyaltyFilterDto,
  ) {
    return this.loyaltyService.getGroupAnalytics(+groupId, filter);
  }

  @Get('analytics/summary')
  async getSummary(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getSummary(filter);
  }

  @Get('analytics/repeat-purchases')
  async getRepeatPurchaseAnalytics(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getRepeatPurchaseRate(filter);
  }

  @Get('analytics/feedback-based')
  async getFeedbackBasedLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackBasedLoyalty(filter);
  }

  @Get('analytics/emotional')
  async getEmotionalLoyalty(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getEmotionalLoyalty(filter);
  }

  @Get('feedback-responses')
  async getFeedbackResponses(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponses(filter);
  }

  @Get('feedback-responses/:id')
  async getFeedbackResponse(@Param('id') id: string) {
    return await this.loyaltyService.getFeedbackResponse(+id);
  }

  @Get('feedback-responses/stats')
  async getFeedbackResponsesStats(@Query() filter: LoyaltyFilterDto) {
    return await this.loyaltyService.getFeedbackResponsesStats(filter);
  }
}
