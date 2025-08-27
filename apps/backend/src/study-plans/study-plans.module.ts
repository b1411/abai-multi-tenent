import { Module } from '@nestjs/common';
import { StudyPlansService } from './study-plans.service';
import { StudyPlansController } from './study-plans.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { AiAssistantService } from 'src/ai-assistant/ai-assistant.service';
import { ImportProgressService } from './import-progress.service';

@Module({
  controllers: [StudyPlansController],
  providers: [StudyPlansService, PrismaService, JwtService, AiAssistantService, ImportProgressService],
})
export class StudyPlansModule {}
