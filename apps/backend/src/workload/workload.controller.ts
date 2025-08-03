import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkloadService } from './workload.service';
import { CreateWorkloadDto } from './dto/create-workload.dto';
import { UpdateWorkloadDto } from './dto/update-workload.dto';
import { WorkloadFilterDto } from './dto/workload-filter.dto';

@ApiTags('workload')
@Controller('workload')
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) { }

  @Post()
  @ApiOperation({ summary: 'Create teacher workload' })
  @ApiResponse({ status: 201, description: 'Workload created successfully' })
  create(@Body() createWorkloadDto: CreateWorkloadDto) {
    return this.workloadService.create(createWorkloadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teacher workloads' })
  @ApiResponse({ status: 200, description: 'List of workloads retrieved successfully' })
  findAll(@Query() filter: WorkloadFilterDto) {
    return this.workloadService.findAll(filter);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get workload analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getAnalytics(@Query() filter: WorkloadFilterDto) {
    return this.workloadService.getAnalytics(filter);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get workloads by teacher' })
  @ApiResponse({ status: 200, description: 'Teacher workloads retrieved successfully' })
  findByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.workloadService.findByTeacher(teacherId, academicYear);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workload by id' })
  @ApiResponse({ status: 200, description: 'Workload retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workload not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workloadService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workload' })
  @ApiResponse({ status: 200, description: 'Workload updated successfully' })
  @ApiResponse({ status: 404, description: 'Workload not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkloadDto: UpdateWorkloadDto,
  ) {
    return this.workloadService.update(id, updateWorkloadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workload' })
  @ApiResponse({ status: 200, description: 'Workload deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workload not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workloadService.remove(id);
  }

  @Post(':id/daily-hours')
  @ApiOperation({ summary: 'Add daily hours to workload' })
  @ApiResponse({ status: 201, description: 'Daily hours added successfully' })
  addDailyHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dailyHoursData: any,
  ) {
    return this.workloadService.addDailyHours(id, dailyHoursData);
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate workload automatically' })
  @ApiResponse({ status: 200, description: 'Workload recalculated successfully' })
  async recalculateWorkload(@Param('id', ParseIntPipe) id: number) {
    await this.workloadService.recalculateWorkload(id);
    return { message: 'Workload recalculated successfully' };
  }

  @Post('generate-from-schedule')
  @ApiOperation({ summary: 'Generate workload from schedule' })
  @ApiResponse({ status: 201, description: 'Workload generated from schedule successfully' })
  generateFromSchedule(
    @Body() data: { teacherId: number; academicYear: string },
  ) {
    return this.workloadService.generateWorkloadFromSchedule(data.teacherId, data.academicYear);
  }

  @Get('calculate-from-schedule/:teacherId')
  @ApiOperation({ summary: 'Calculate workload from schedule without creating' })
  @ApiResponse({ status: 200, description: 'Workload calculated successfully' })
  calculateFromSchedule(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.workloadService.calculateWorkloadFromSchedule(teacherId, academicYear);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export workloads' })
  @ApiResponse({ status: 200, description: 'Workload export file' })
  async exportWorkloads(
    @Query() filter: WorkloadFilterDto,
    @Query('format') format: 'xlsx' | 'csv' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.workloadService.exportWorkloads(filter, format);

    const filename = `workload-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : format === 'csv'
        ? 'text/csv'
        : 'application/pdf';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(buffer);
  }

  @Get('template')
  @ApiOperation({ summary: 'Download workload template' })
  @ApiResponse({ status: 200, description: 'Workload template file' })
  async downloadTemplate(
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.workloadService.downloadTemplate(format);

    const filename = `workload-template.${format}`;
    const mimeType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(buffer);
  }

  @Get('teacher/:teacherId/export')
  @ApiOperation({ summary: 'Export teacher workload' })
  @ApiResponse({ status: 200, description: 'Teacher workload export file' })
  async exportTeacherWorkload(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('format') format: 'xlsx' | 'pdf' = 'xlsx',
    @Res() res: Response,
    @Query('academicYear') academicYear?: string,

  ) {
    const buffer = await this.workloadService.exportTeacherWorkload(teacherId, academicYear, format);

    const filename = `teacher-workload-${teacherId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(buffer);
  }

  @Post('recalculate-all/:year/:month')
  @ApiOperation({ summary: 'Recalculate worked hours for all teachers' })
  @ApiResponse({ status: 200, description: 'All teachers worked hours recalculated successfully' })
  async recalculateAllWorkedHours(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.workloadService.recalculateAllWorkedHours(year, month);
  }

  @Post('sync-teacher-hours/:teacherId/:year/:month')
  @ApiOperation({ summary: 'Sync teacher worked hours with workload data' })
  @ApiResponse({ status: 200, description: 'Teacher hours synced successfully' })
  async syncTeacherHours(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.workloadService.syncTeacherWorkedHours(teacherId, year, month);
  }

  @Get('real-time-stats')
  @ApiOperation({ summary: 'Get real-time workload statistics' })
  @ApiResponse({ status: 200, description: 'Real-time statistics retrieved successfully' })
  getRealTimeStats(@Query() filter: WorkloadFilterDto) {
    return this.workloadService.getRealTimeStats(filter);
  }

  // Эндпоинты для WorkloadV2
  @Post('recalculate-all')
  @ApiOperation({ summary: 'Recalculate all teachers worked hours' })
  @ApiResponse({ status: 200, description: 'All teachers worked hours recalculated successfully' })
  async recalculateAll(@Body() data: { year: number; month: number }) {
    return this.workloadService.recalculateAllWorkedHours(data.year, data.month);
  }

  @Post('sync-teacher-hours')
  @ApiOperation({ summary: 'Sync specific teacher worked hours' })
  @ApiResponse({ status: 200, description: 'Teacher hours synced successfully' })
  async syncSpecificTeacherHours(@Body() data: { teacherId: number; year: number; month: number }) {
    return this.workloadService.syncTeacherWorkedHours(data.teacherId, data.year, data.month);
  }

  // Новые эндпоинты для отработанных часов (используемые фронтендом)
  @Get('worked-hours/:month/:year')
  @ApiOperation({ summary: 'Get all teachers worked hours for specific month/year' })
  @ApiResponse({ status: 200, description: 'Worked hours retrieved successfully' })
  getAllWorkedHours(
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.workloadService.getAllTeachersWorkedHours(month, year);
  }

  @Get('teacher-details/:teacherId/:month/:year')
  @ApiOperation({ summary: 'Get teacher worked hours details' })
  @ApiResponse({ status: 200, description: 'Teacher details retrieved successfully' })
  getTeacherWorkedHoursDetails(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.workloadService.getTeacherWorkedHoursDetails(teacherId, month, year);
  }
}
