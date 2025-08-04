import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { FeedbackAggregationService } from './feedback-aggregation.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [],
  controllers: [KpiController],
  providers: [KpiService, FeedbackAggregationService, PrismaService, JwtService],
  exports: [KpiService, FeedbackAggregationService],
})
export class KpiModule { }
