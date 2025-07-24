import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { LessonScheduleService } from './lesson-schedule.service';
import { ScheduleAiService } from './schedule-ai.service';
import { ScheduleManagementService } from './schedule-management.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleAiController } from './schedule-ai.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';

@Module({
  controllers: [ScheduleController, ScheduleAiController],
  providers: [
    ScheduleService,
    LessonScheduleService,
    ScheduleAiService,
    ScheduleManagementService,
    PrismaService,
    JwtService,
    AiAssistantService
  ],
  exports: [
    ScheduleService,
    LessonScheduleService,
    ScheduleAiService,
    ScheduleManagementService
  ],
})
export class ScheduleModule { }
