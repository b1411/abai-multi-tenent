import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { LessonScheduleService } from './lesson-schedule.service';
import { ScheduleAiService } from './schedule-ai.service';
import { ScheduleManagementService } from './schedule-management.service';
import { ScheduleAiFlowService } from './schedule-ai-flow.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleAiController } from './schedule-ai.controller';
import { ScheduleAiFlowController } from './schedule-ai-flow.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [ScheduleController, ScheduleAiController, ScheduleAiFlowController],
  providers: [
    ScheduleService,
    LessonScheduleService,
    ScheduleAiService,
  ScheduleManagementService,
  ScheduleAiFlowService,
    PrismaService,
    JwtService,
  AiAssistantService,
  NotificationsService
  ],
  exports: [
    ScheduleService,
    LessonScheduleService,
    ScheduleAiService,
  ScheduleManagementService,
  ScheduleAiFlowService
  ],
})
export class ScheduleModule { }
