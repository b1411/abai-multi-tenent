import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherSalaryRateService } from './teacher-salary-rate.service';
import { TeacherWorkedHoursService } from './teacher-worked-hours.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { CreateTeacherSalaryRateDto } from './dto/create-teacher-salary-rate.dto';
import { UpdateTeacherSalaryRateDto } from './dto/update-teacher-salary-rate.dto';

@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly salaryRateService: TeacherSalaryRateService,
    private readonly workedHoursService: TeacherWorkedHoursService,
    private readonly payrollService: PayrollCalculationService,
  ) {}

  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  findAll() {
    return this.teachersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(+id, updateTeacherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(+id);
  }

  // Управление ставками
  @Post(':id/salary-rate')
  createSalaryRate(@Param('id') teacherId: string, @Body() createDto: CreateTeacherSalaryRateDto) {
    return this.salaryRateService.create({ ...createDto, teacherId: +teacherId });
  }

  @Get(':id/salary-rate')
  getSalaryRate(@Param('id') teacherId: string) {
    return this.salaryRateService.findByTeacher(+teacherId);
  }

  @Get(':id/salary-rate/history')
  getSalaryRateHistory(@Param('id') teacherId: string) {
    return this.salaryRateService.findHistoryByTeacher(+teacherId);
  }

  @Patch('salary-rate/:rateId')
  updateSalaryRate(@Param('rateId') rateId: string, @Body() updateDto: UpdateTeacherSalaryRateDto) {
    return this.salaryRateService.update(+rateId, updateDto);
  }

  // Отработанные часы
  @Get(':id/worked-hours/:year/:month')
  getWorkedHours(
    @Param('id') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.workedHoursService.getWorkedHours(+teacherId, +month, +year);
  }

  @Get(':id/worked-hours/:year')
  getWorkedHoursByYear(@Param('id') teacherId: string, @Param('year') year: string) {
    return this.workedHoursService.getWorkedHoursByYear(+teacherId, +year);
  }

  @Get(':id/worked-hours-stats/:year')
  getWorkedHoursStats(@Param('id') teacherId: string, @Param('year') year: string) {
    return this.workedHoursService.getTeacherWorkedHoursStats(+teacherId, +year);
  }

  @Get(':id/worked-hours-details/:year/:month')
  getWorkedHoursDetails(
    @Param('id') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.workedHoursService.getTeacherWorkedHoursDetails(+teacherId, +month, +year);
  }

  @Post(':id/calculate-worked-hours/:year/:month')
  calculateWorkedHours(
    @Param('id') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.workedHoursService.calculateAndSaveWorkedHours({
      teacherId: +teacherId,
      month: +month,
      year: +year,
    });
  }

  // Расчет зарплат
  @Get(':id/payroll')
  getPayrollHistory(@Param('id') teacherId: string, @Query('year') year?: string) {
    return this.payrollService.getTeacherPayrollHistory(+teacherId, year ? +year : undefined);
  }

  @Get(':id/payroll/:year/:month')
  getPayrollDetails(
    @Param('id') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.getPayrollDetails(+teacherId, +month, +year);
  }

  @Post(':id/calculate-salary/:year/:month')
  calculateSalary(
    @Param('id') teacherId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.calculateSalaryForTeacher(+teacherId, +month, +year);
  }
}
