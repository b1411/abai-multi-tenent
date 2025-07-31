import { Module } from '@nestjs/common';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { PayrollNotificationsService } from '../teachers/payroll-notifications.service';

@Module({
    controllers: [SalariesController],
    providers: [SalariesService, PrismaService, JwtService, PayrollNotificationsService],
    exports: [SalariesService],
})
export class SalariesModule { }
