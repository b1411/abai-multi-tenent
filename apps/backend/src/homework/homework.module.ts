import { Module } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { HomeworkController, LessonHomeworkController } from './homework.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { TenantConfigService } from 'src/common/tenant-config.service';

@Module({
  controllers: [HomeworkController, LessonHomeworkController],
  providers: [HomeworkService, PrismaService, JwtService, TenantConfigService],
  exports: [HomeworkService],
})
export class HomeworkModule { }
