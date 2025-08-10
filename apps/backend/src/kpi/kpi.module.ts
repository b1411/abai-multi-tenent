import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { FeedbackAggregationService } from './feedback-aggregation.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [],
  controllers: [KpiController],
  providers: [KpiService, FeedbackAggregationService, PrismaService, JwtService, NotificationsService],
  exports: [KpiService, FeedbackAggregationService],
})
export class KpiModule { }
