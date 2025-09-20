import { Module } from '@nestjs/common';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { PayrollNotificationsService } from '../teachers/payroll-notifications.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TeacherWorkedHoursService } from 'src/teachers/teacher-worked-hours.service';
import { ScheduleService } from 'src/schedule/schedule.service';
import { SystemService } from 'src/system/system.service';
import { TenantConfigService } from 'src/common/tenant-config.service';

@Module({
    controllers: [SalariesController],
    providers: [SalariesService, PrismaService, JwtService, PayrollNotificationsService, NotificationsService, TeacherWorkedHoursService, ScheduleService, SystemService, TenantConfigService],
    exports: [SalariesService],
})
export class SalariesModule { }
