import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('student')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get student dashboard data' })
  getStudentDashboard(@Request() req) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }

  @Get('teacher')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Get teacher dashboard data' })
  getTeacherDashboard(@Request() req) {
    return this.dashboardService.getTeacherDashboard(req.user.id);
  }

  @Get('admin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  getAdminDashboard(@Request() req) {
    return this.dashboardService.getAdminDashboard(req.user.id);
  }

  @Get('parent')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get parent dashboard data' })
  getParentDashboard(@Request() req) {
    return this.dashboardService.getParentDashboard(req.user.id);
  }

  @Get('financist')
  @Roles('FINANCIST')
  @ApiOperation({ summary: 'Get financist dashboard data' })
  getFinancistDashboard(@Request() req) {
    return this.dashboardService.getFinancistDashboard(req.user.id);
  }

  @Get('hr')
  @Roles('HR')
  @ApiOperation({ summary: 'Get HR dashboard data' })
  getHRDashboard(@Request() req) {
    return this.dashboardService.getHRDashboard(req.user.id);
  }

  // Widget API endpoints
  @Get('widgets')
  @ApiOperation({ summary: 'Get user widgets' })
  getUserWidgets(@Request() req) {
    return this.dashboardService.getUserWidgets(req.user.id);
  }

  @Post('widgets')
  @ApiOperation({ summary: 'Add new widget' })
  addWidget(@Request() req, @Body() widgetData: any) {
    return this.dashboardService.addWidget(req.user.id, widgetData);
  }

  @Put('widgets/:id')
  @ApiOperation({ summary: 'Update widget' })
  updateWidget(@Param('id') widgetId: string, @Body() widgetData: any) {
    return this.dashboardService.updateWidget(widgetId, widgetData);
  }

  @Delete('widgets/:id')
  @ApiOperation({ summary: 'Delete widget' })
  deleteWidget(@Param('id') widgetId: string) {
    return this.dashboardService.deleteWidget(widgetId);
  }

  @Get('widgets/data/:type')
  @ApiOperation({ summary: 'Get widget data by type' })
  getWidgetData(@Request() req, @Param('type') widgetType: string, @Query() config?: any) {
    return this.dashboardService.getWidgetData(req.user.id, widgetType, config);
  }

  @Get('widget-data/:widgetType')
  @ApiOperation({ summary: 'Get widget data by widget type' })
  getWidgetDataByType(@Request() req, @Param('widgetType') widgetType: string, @Query() query: any) {
    return this.dashboardService.getWidgetData(req.user.id, widgetType, query);
  }

  @Get('layout')
  @ApiOperation({ summary: 'Get dashboard layout' })
  getDashboardLayout(@Request() req) {
    return this.dashboardService.getDashboardLayout(req.user.id);
  }

  @Put('layout')
  @ApiOperation({ summary: 'Save dashboard layout' })
  saveDashboardLayout(@Request() req, @Body() layoutData: any) {
    return this.dashboardService.saveDashboardLayout(req.user.id, layoutData);
  }

  // Additional widget endpoints
  @Get('finance-overview')
  @ApiOperation({ summary: 'Get finance overview data' })
  getFinanceOverview(@Request() req) {
    return this.dashboardService.getFinanceOverview(req.user);
  }

  @Get('system-alerts')
  @ApiOperation({ summary: 'Get system alerts data' })
  getSystemAlerts(@Request() req) {
    return this.dashboardService.getSystemAlerts(req.user);
  }

  @Get('classroom-usage')
  @ApiOperation({ summary: 'Get classroom usage data' })
  getClassroomUsage(@Request() req) {
    return this.dashboardService.getClassroomUsage(req.user);
  }

  @Get('teacher-workload')
  @ApiOperation({ summary: 'Get teacher workload data' })
  getTeacherWorkload(@Request() req) {
    return this.dashboardService.getTeacherWorkload(req.user);
  }
}
