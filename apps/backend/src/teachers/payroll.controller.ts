import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PayrollCalculationService } from './payroll-calculation.service';
import { TeacherWorkedHoursService } from './teacher-worked-hours.service';

interface RecalculatePayrollDto {
  teacherId?: number;
  month: number;
  year: number;
}

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollCalculationService,
    private readonly workedHoursService: TeacherWorkedHoursService,
  ) {}

  // Пересчет зарплат (основная кнопка)
  @Post('recalculate')
  recalculatePayroll(@Body() dto: RecalculatePayrollDto) {
    return this.payrollService.recalculatePayroll(dto);
  }

  // Сводка по зарплатам за месяц
  @Get('summary/:year/:month')
  getPayrollSummary(@Param('year') year: string, @Param('month') month: string) {
    return this.payrollService.getPayrollSummary(+month, +year);
  }

  // Пересчет отработанных часов для всех преподавателей
  @Post('recalculate-worked-hours/:year/:month')
  recalculateWorkedHours(@Param('year') year: string, @Param('month') month: string) {
    return this.workedHoursService.recalculateAllForMonth(+month, +year);
  }

  // Отработанные часы всех преподавателей за месяц
  @Get('worked-hours/:year/:month')
  getAllWorkedHours(@Param('year') year: string, @Param('month') month: string) {
    return this.workedHoursService.getAllTeachersWorkedHours(+month, +year);
  }

  // Получить детали зарплаты конкретного преподавателя
  @Get('details/:teacherId/:year/:month')
  getPayrollDetails(
    @Param('teacherId') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.getPayrollDetails(+teacherId, +month, +year);
  }
}
