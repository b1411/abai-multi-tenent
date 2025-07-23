import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [LoyaltyController],
    providers: [LoyaltyService, PrismaService, JwtService],
    exports: [LoyaltyService],
})
export class LoyaltyModule { }
