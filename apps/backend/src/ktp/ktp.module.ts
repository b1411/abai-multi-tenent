import { Module } from '@nestjs/common';
import { KtpController } from './ktp.controller';
import { KtpService } from './ktp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [KtpController],
    providers: [KtpService, PrismaService, JwtService],
    exports: [KtpService],
})
export class KtpModule { }
