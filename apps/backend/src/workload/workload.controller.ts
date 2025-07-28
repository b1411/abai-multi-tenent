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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkloadService } from './workload.service';
import { CreateWorkloadDto } from './dto/create-workload.dto';
import { UpdateWorkloadDto } from './dto/update-workload.dto';
import { WorkloadFilterDto } from './dto/workload-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('workload')
@Controller('workload')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) { }

  @Post()
  @RequirePermission('workload', 'create')
  @ApiOperation({ summary: 'Create teacher workload' })
  @ApiResponse({ status: 201, description: 'Workload created successfully' })
  create(@Body() createWorkloadDto: CreateWorkloadDto) {
    return this.workloadService.create(createWorkloadDto);
  }

  @Get()
  @RequirePermission('workload', 'read')
  @ApiOperation({ summary: 'Get all teacher workloads' })
  @ApiResponse({ status: 200, description: 'List of workloads retrieved successfully' })
  findAll(@Query() filter: WorkloadFilterDto) {
    return this.workloadService.findAll(filter);
  }

  @Get('analytics')
  @RequirePermission('workload', 'read')
  @ApiOperation({ summary: 'Get workload analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getAnalytics(@Query() filter: WorkloadFilterDto) {
    return this.workloadService.getAnalytics(filter);
  }

  @Get('teacher/:teacherId')
  @RequirePermission('workload', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Get workloads by teacher' })
  @ApiResponse({ status: 200, description: 'Teacher workloads retrieved successfully' })
  findByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.workloadService.findByTeacher(teacherId, academicYear);
  }

  @Get(':id')
  @RequirePermission('workload', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Get workload by id' })
  @ApiResponse({ status: 200, description: 'Workload retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workload not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workloadService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('workload', 'update')
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
  @RequirePermission('workload', 'delete')
  @ApiOperation({ summary: 'Delete workload' })
  @ApiResponse({ status: 200, description: 'Workload deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workload not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workloadService.remove(id);
  }

  @Post(':id/daily-hours')
  @RequirePermission('workload', 'update')
  @ApiOperation({ summary: 'Add daily hours to workload' })
  @ApiResponse({ status: 201, description: 'Daily hours added successfully' })
  addDailyHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dailyHoursData: any,
  ) {
    return this.workloadService.addDailyHours(id, dailyHoursData);
  }

  @Post(':id/recalculate')
  @RequirePermission('workload', 'update')
  @ApiOperation({ summary: 'Recalculate workload automatically' })
  @ApiResponse({ status: 200, description: 'Workload recalculated successfully' })
  async recalculateWorkload(@Param('id', ParseIntPipe) id: number) {
    await this.workloadService.recalculateWorkload(id);
    return { message: 'Workload recalculated successfully' };
  }

  @Post('generate-from-schedule')
  @RequirePermission('workload', 'create')
  @ApiOperation({ summary: 'Generate workload from schedule' })
  @ApiResponse({ status: 201, description: 'Workload generated from schedule successfully' })
  generateFromSchedule(
    @Body() data: { teacherId: number; academicYear: string },
  ) {
    return this.workloadService.generateWorkloadFromSchedule(data.teacherId, data.academicYear);
  }

  @Get('calculate-from-schedule/:teacherId')
  @RequirePermission('workload', 'read')
  @ApiOperation({ summary: 'Calculate workload from schedule without creating' })
  @ApiResponse({ status: 200, description: 'Workload calculated successfully' })
  calculateFromSchedule(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.workloadService.calculateWorkloadFromSchedule(teacherId, academicYear);
  }

  @Get('export')
  @RequirePermission('workload', 'read')
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
  @RequirePermission('workload', 'read')
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
  @RequirePermission('workload', 'read', { scope: 'OWN' })
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
}
