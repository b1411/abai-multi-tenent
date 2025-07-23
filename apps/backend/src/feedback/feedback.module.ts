import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackService } from './feedback.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [FeedbackController],
    providers: [FeedbackService, PrismaService, JwtService],
    exports: [FeedbackService],
})
export class FeedbackModule { }
