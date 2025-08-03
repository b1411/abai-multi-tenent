import { Module } from '@nestjs/common';
import { WorkloadService } from './workload.service';
import { WorkloadController } from './workload.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherWorkedHoursService } from '../teachers/teacher-worked-hours.service';
import { ScheduleService } from '../schedule/schedule.service';
import { SystemService } from '../system/system.service';

@Module({
  controllers: [WorkloadController],
  providers: [
    WorkloadService, 
    PrismaService, 
    TeacherWorkedHoursService,
    ScheduleService,
    SystemService
  ],
  exports: [WorkloadService],
})
export class WorkloadModule {}
