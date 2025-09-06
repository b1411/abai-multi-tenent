import { Module } from '@nestjs/common';
import { AiTutorsController } from './ai-tutors.controller';
import { AiTutorsService } from './ai-tutors.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    imports: [],
    controllers: [AiTutorsController],
    providers: [AiTutorsService, PrismaService, JwtService],
    exports: [AiTutorsService],
})
export class AiTutorsModule { }
