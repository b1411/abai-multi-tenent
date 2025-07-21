import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';

@Module({
  controllers: [ScheduleController],
  providers: [ScheduleService, PrismaService, JwtService, AiAssistantService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
