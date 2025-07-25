import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityMonitoringController } from './activity-monitoring.controller';
import { ActivityMonitoringService } from './activity-monitoring.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { ActivityInterceptor } from './interceptors/activity.interceptor';
import { ActivityGateway } from './gateways/activity.gateway';

@Module({
  controllers: [ActivityMonitoringController],
  providers: [
    ActivityMonitoringService,
    PrismaService,
    JwtService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
    ActivityGateway,
  ],
  exports: [ActivityMonitoringService, ActivityGateway],
})
export class ActivityMonitoringModule { }
