import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { LessonScheduleService } from '../schedule/lesson-schedule.service';
import { TenantConfigService } from 'src/common/tenant-config.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, LessonScheduleService, PrismaService, JwtService, TenantConfigService],
})
export class LessonsModule { }
