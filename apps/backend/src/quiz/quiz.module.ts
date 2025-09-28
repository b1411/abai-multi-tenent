import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { QuizAttemptService } from './quiz-attempt.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, PrismaService, JwtService, QuizAttemptService, NotificationsService],
  exports: [QuizService],
})
export class QuizModule {}
