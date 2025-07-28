import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityMonitoringService } from './activity-monitoring.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('activity-monitoring')
@Controller('activity-monitoring')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ActivityMonitoringController {
  constructor(private readonly activityMonitoringService: ActivityMonitoringService) {}

  @Get('online-users')
  @RequirePermission('activity-monitoring', 'read')
  @ApiOperation({ summary: 'Получить список пользователей онлайн' })
  @ApiResponse({ status: 200, description: 'Список пользователей онлайн получен' })
  async getOnlineUsers(@Request() req: any) {
    return await this.activityMonitoringService.getOnlineUsers(req.user.id);
  }

  @Get('user-activity')
  @RequirePermission('activity-monitoring', 'read')
  @ApiOperation({ summary: 'Получить активность пользователя' })
  @ApiResponse({ status: 200, description: 'Активность пользователя получена' })
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
  @RequirePermission('activity-monitoring', 'read')
  @ApiOperation({ summary: 'Получить статистику активности' })
  @ApiResponse({ status: 200, description: 'Статистика активности получена' })
  async getActivityStats(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number = 7,
  ) {
    return await this.activityMonitoringService.getActivityStats(req.user.id, days);
  }

  @Get('cleanup-logs')
  @RequirePermission('activity-monitoring', 'delete')
  @ApiOperation({ summary: 'Очистить старые логи активности' })
  @ApiResponse({ status: 200, description: 'Старые логи успешно очищены' })
  async cleanupOldLogs(@Request() req: any) {
    return await this.activityMonitoringService.cleanupOldLogs();
  }
}
