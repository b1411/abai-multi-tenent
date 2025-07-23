import { Module } from '@nestjs/common';
import { LessonResultsService } from './lesson-results.service';
import { LessonResultsController } from './lesson-results.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [LessonResultsController],
  providers: [LessonResultsService, PrismaService, JwtService, NotificationsService],
  exports: [LessonResultsService],
})
export class LessonResultsModule {}
