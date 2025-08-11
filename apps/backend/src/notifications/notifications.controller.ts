import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Sse,
  MessageEvent,
  Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Observable, map, filter } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, AddNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate } from '../common/decorators/paginate.decorator';
import { PaginateQueryDto } from '../common/dtos/paginate.dto';

@ApiTags('Notifications')
@Controller('notifications')
@Roles('STUDENT', 'TEACHER', 'PARENT', 'ADMIN', "FINANCIST", "HR")
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Создать уведомление' })
  @ApiResponse({ status: 201, description: 'Уведомление создано' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('add')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Добавить уведомления для пользователей' })
  @ApiResponse({ status: 201, description: 'Уведомления добавлены' })
  addNotifications(@Body() addNotificationDto: AddNotificationDto) {
    return this.notificationsService.addNotification(addNotificationDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Получить все уведомления с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список уведомлений' })
  findAll(@Paginate() paginateQuery: PaginateQueryDto) {
    return this.notificationsService.findAll(paginateQuery);
  }

  @Get('my')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Получить мои уведомления' })
  @ApiResponse({ status: 200, description: 'Уведомления пользователя' })

  getMyNotifications(
    @Req() req: any,
    @Paginate() paginateQuery: PaginateQueryDto
  ) {
    return this.notificationsService.findByUserId(+req.user.id, paginateQuery);
  }

  @Get('unread-count/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Получить количество непрочитанных уведомлений' })
  @ApiResponse({ status: 200, description: 'Количество непрочитанных уведомлений' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(+userId);
  }

  // SSE endpoint без авторизации
  @Sse('stream')
  @ApiOperation({ summary: 'SSE поток уведомлений (без авторизации)' })
  @ApiResponse({ status: 200, description: 'Поток событий Server-Sent Events' })
  streamNotifications(@Query('userId') userId: string, @Query('token') token?: string): Observable<MessageEvent> {
    const userIdNum = parseInt(userId);

    console.log(`SSE: Подключение для пользователя ${userIdNum}, токен: ${token ? 'есть' : 'нет'}`);

    // TODO: Здесь можно добавить валидацию токена если нужно
    // if (token) {
    //   // Валидируем JWT токен
    //   try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     console.log('Token valid for user:', decoded);
    //   } catch (error) {
    //     console.log('Invalid token:', error.message);
    //   }
    // }

    return this.notificationsService.getNotificationStream().pipe(
      filter(event => {
        console.log(`SSE: Проверяем событие для пользователя ${event.userId}, текущий: ${userIdNum}`);
        return event.userId === userIdNum;
      }),
      map(event => {
        console.log(`SSE: Отправляем уведомление пользователю ${userIdNum}:`, event.notification);
        return {
          data: JSON.stringify({
            id: event.notification.id,
            type: event.notification.type,
            message: event.notification.message,
            url: event.notification.url,
            createdAt: event.notification.createdAt,
            read: event.notification.read
          }),
          type: 'notification'
        };
      })
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  @ApiResponse({ status: 200, description: 'Информация об уведомлении' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить уведомление как прочитанное' })
  @ApiResponse({ status: 200, description: 'Уведомление отмечено как прочитанное' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  @Patch('read-all/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Отметить все уведомления как прочитанные' })
  @ApiResponse({ status: 200, description: 'Все уведомления отмечены как прочитанные' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(+userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Обновить уведомление' })
  @ApiResponse({ status: 200, description: 'Уведомление обновлено' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Удалить уведомление' })
  @ApiResponse({ status: 200, description: 'Уведомление удалено' })
  @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }
}
