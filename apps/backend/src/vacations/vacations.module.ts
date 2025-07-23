import { Module } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [VacationsController],
    providers: [VacationsService, PrismaService, JwtService],
    exports: [VacationsService],
})
export class VacationsModule { }
