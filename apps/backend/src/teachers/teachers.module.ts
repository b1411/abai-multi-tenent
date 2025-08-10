import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { PayrollController } from './payroll.controller';
import { SubstitutionController } from './substitution.controller';
import { TeacherSalaryRateService } from './teacher-salary-rate.service';
import { TeacherWorkedHoursService } from './teacher-worked-hours.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { SubstitutionService } from './substitution.service';
import { PayrollNotificationsService } from './payroll-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from 'src/schedule/schedule.service';
import { SystemService } from '../system/system.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [TeachersController, PayrollController, SubstitutionController],
  providers: [
    TeachersService,
    TeacherSalaryRateService,
    TeacherWorkedHoursService,
    PayrollCalculationService,
    SubstitutionService,
    PayrollNotificationsService,
    PrismaService,
    ScheduleService,
  SystemService,
  NotificationsService
  ],
  exports: [
    TeachersService,
    TeacherSalaryRateService,
    TeacherWorkedHoursService,
    PayrollCalculationService,
    SubstitutionService,
    PayrollNotificationsService,
  ],
})
export class TeachersModule {}
