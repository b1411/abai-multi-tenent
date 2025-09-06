import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiTutorsModule } from '../ai-tutors/ai-tutors.module';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
  imports: [AiTutorsModule],
  controllers: [AiChatController],
  providers: [AiChatService, PrismaService, JwtService],
  exports: [AiChatService],
})
export class AiChatModule {}
