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
  async createReview(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.loyaltyService.createReview(createReviewDto, req.user.id);
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
    return this.loyaltyService.addReaction(+reviewId, reactionDto, req.user.id);
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
    return await this.loyaltyService.getRepeatPurchaseAnalytics(filter);
  }

  @Post('repeat-purchases/update')
  async updateRepeatPurchases() {
    await this.loyaltyService.updateRepeatPurchases();
    return { message: 'Repeat purchases updated successfully' };
  }
}
