import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, PrismaService, JwtService],
  exports: [QuizService],
})
export class QuizModule {}
