import { Module } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtService } from 'src/jwt/jwt.service';

@Module({
    controllers: [VacationsController],
    providers: [VacationsService, PrismaService, NotificationsService, JwtService],
    exports: [VacationsService],
})
export class VacationsModule { }
