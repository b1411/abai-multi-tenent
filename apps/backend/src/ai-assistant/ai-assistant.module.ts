import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Module({
    controllers: [AiAssistantController],
    providers: [AiAssistantService, PrismaService, JwtService],
    exports: [AiAssistantService],
})
export class AiAssistantModule { }
