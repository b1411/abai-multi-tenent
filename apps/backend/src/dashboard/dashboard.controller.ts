import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('student')
  @Roles('STUDENT')
  getStudentDashboard(@Request() req) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }

  @Get('teacher')
  @Roles('TEACHER')
  getTeacherDashboard(@Request() req) {
    return this.dashboardService.getTeacherDashboard(req.user.id);
  }

  @Get('admin')
  @Roles('ADMIN')
  getAdminDashboard(@Request() req) {
    return this.dashboardService.getAdminDashboard(req.user.id);
  }

  @Get('parent')
  @Roles('PARENT')
  getParentDashboard(@Request() req) {
    return this.dashboardService.getParentDashboard(req.user.id);
  }

  @Get('financist')
  @Roles('FINANCIST')
  getFinancistDashboard(@Request() req) {
    return this.dashboardService.getFinancistDashboard(req.user.id);
  }

  @Get('hr')
  @Roles('HR')
  getHRDashboard(@Request() req) {
    return this.dashboardService.getHRDashboard(req.user.id);
  }
}
