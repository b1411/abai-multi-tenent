import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ActivityMonitoringService } from './activity-monitoring.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';

@Controller('activity-monitoring')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ActivityMonitoringController {
  constructor(private readonly activityMonitoringService: ActivityMonitoringService) {}

  @Get('online-users')
  async getOnlineUsers(@Request() req: any) {
    return await this.activityMonitoringService.getOnlineUsers(req.user.id);
  }

  @Get('user-activity')
  async getUserActivity(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : undefined;
    return await this.activityMonitoringService.getUserActivity(
      req.user.id,
      parsedUserId,
      limit,
      offset,
    );
  }

  @Get('stats')
  async getActivityStats(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number = 7,
  ) {
    return await this.activityMonitoringService.getActivityStats(req.user.id, days);
  }

  @Get('cleanup-logs')
  async cleanupOldLogs(@Request() req: any) {
    return await this.activityMonitoringService.cleanupOldLogs();
  }
}
