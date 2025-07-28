import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('student')
  @RequirePermission('dashboard', 'read', { scope: 'OWN' })
  getStudentDashboard(@Request() req) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }

  @Get('teacher')
  @RequirePermission('dashboard', 'read', { scope: 'OWN' })
  getTeacherDashboard(@Request() req) {
    return this.dashboardService.getTeacherDashboard(req.user.id);
  }

  @Get('admin')
  @RequirePermission('dashboard', 'read')
  getAdminDashboard(@Request() req) {
    return this.dashboardService.getAdminDashboard(req.user.id);
  }

  @Get('parent')
  @RequirePermission('dashboard', 'read', { scope: 'OWN' })
  getParentDashboard(@Request() req) {
    return this.dashboardService.getParentDashboard(req.user.id);
  }

  @Get('financist')
  @RequirePermission('dashboard', 'read')
  getFinancistDashboard(@Request() req) {
    return this.dashboardService.getFinancistDashboard(req.user.id);
  }

  @Get('hr')
  @RequirePermission('dashboard', 'read')
  getHRDashboard(@Request() req) {
    return this.dashboardService.getHRDashboard(req.user.id);
  }
}
