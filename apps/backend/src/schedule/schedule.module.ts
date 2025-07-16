import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [ScheduleController],
  providers: [ScheduleService, PrismaService, JwtService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
