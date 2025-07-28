import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from 'src/common/guards/permission.guard';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('events')
  @RequirePermission('calendar', 'create', { scope: 'OWN' })
  @ApiOperation({ summary: 'Создать новое событие' })
  @ApiResponse({ status: 201, description: 'Событие создано успешно' })
  async createEvent(@Req() req: any, @Body() createEventDto: CreateEventDto) {
    return this.calendarService.createEvent(req.user.id, createEventDto);
  }

  @Get('events')
  @RequirePermission('calendar', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить события пользователя' })
  @ApiResponse({ status: 200, description: 'События получены успешно' })
  async getUserEvents(@Req() req: any, @Query() filterDto: EventFilterDto) {
    return this.calendarService.getUserEvents(req.user.id, filterDto);
  }

  @Get('events/today')
  @RequirePermission('calendar', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить события на сегодня' })
  @ApiResponse({ status: 200, description: 'События на сегодня получены успешно' })
  async getTodaysEvents(@Req() req: any) {
    return this.calendarService.getTodaysEvents(req.user.id);
  }

  @Get('events/:eventId')
  @RequirePermission('calendar', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить событие по ID' })
  @ApiResponse({ status: 200, description: 'Событие получено успешно' })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ) {
    return this.calendarService.getEventById(eventId, req.user.id);
  }

  @Put('events/:eventId')
  @RequirePermission('calendar', 'update', { scope: 'OWN' })
  @ApiOperation({ summary: 'Обновить событие' })
  @ApiResponse({ status: 200, description: 'Событие обновлено успешно' })
  async updateEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.calendarService.updateEvent(eventId, req.user.id, updateEventDto);
  }

  @Delete('events/:eventId')
  @RequirePermission('calendar', 'delete', { scope: 'OWN' })
  @ApiOperation({ summary: 'Удалить событие' })
  @ApiResponse({ status: 200, description: 'Событие удалено успешно' })
  async deleteEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ) {
    return this.calendarService.deleteEvent(eventId, req.user.id);
  }

  @Put('events/:eventId/status')
  @RequirePermission('calendar', 'update', { scope: 'OWN' })
  @ApiOperation({ summary: 'Обновить статус участия в событии' })
  @ApiResponse({ status: 200, description: 'Статус участия обновлен успешно' })
  async updateParticipantStatus(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
    @Body() data: { status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE'; comment?: string },
  ) {
    return this.calendarService.updateParticipantStatus(
      eventId,
      req.user.id,
      data.status,
      data.comment,
    );
  }

  @Post('events/:eventId/reminders')
  @RequirePermission('calendar', 'create', { scope: 'OWN' })
  @ApiOperation({ summary: 'Создать напоминание для события' })
  @ApiResponse({ status: 201, description: 'Напоминание создано успешно' })
  async createReminder(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
    @Body() data: { minutes: number; method?: string },
  ) {
    return this.calendarService.createReminder(
      eventId,
      req.user.id,
      data.minutes,
      data.method,
    );
  }

  @Delete('reminders/:reminderId')
  @RequirePermission('calendar', 'delete', { scope: 'OWN' })
  @ApiOperation({ summary: 'Удалить напоминание' })
  @ApiResponse({ status: 200, description: 'Напоминание удалено успешно' })
  async deleteReminder(
    @Param('reminderId', ParseIntPipe) reminderId: number,
    @Req() req: any,
  ) {
    return this.calendarService.deleteReminder(reminderId, req.user.id);
  }
}
