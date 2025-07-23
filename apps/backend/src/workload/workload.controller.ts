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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkloadService } from './workload.service';
import { CreateWorkloadDto } from './dto/create-workload.dto';
import { UpdateWorkloadDto } from './dto/update-workload.dto';
import { WorkloadFilterDto } from './dto/workload-filter.dto';

@ApiTags('workload')
@Controller('workload')
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) {}

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
}
