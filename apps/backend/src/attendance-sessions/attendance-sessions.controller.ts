import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttendanceSessionsService } from './attendance-sessions.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { AttendanceSessionResponseDto } from './dto/attendance-session-response.dto';
import { AttendanceCheckInDto } from './dto/check-in.dto';
import { AttendanceCheckInResponseDto } from './dto/attendance-check-in-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from 'generated/prisma';

@ApiTags('attendance-sessions')
@ApiBearerAuth()
@Controller('attendance-sessions')
@UseGuards(AuthGuard, RolesGuard)
export class AttendanceSessionsController {
  constructor(private readonly attendanceSessionsService: AttendanceSessionsService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiResponse({ status: 201, description: 'QR-сессия создана', type: AttendanceSessionResponseDto })
  async createAttendanceSession(
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: { id: number; role: UserRole },
  ): Promise<AttendanceSessionResponseDto> {
    return this.attendanceSessionsService.createSession(dto, {
      id: user.id,
      role: user.role,
    });
  }

  @Post('check-in')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @ApiResponse({ status: 200, description: 'Отметка посещения сохранена', type: AttendanceCheckInResponseDto })
  async checkIn(
    @Body() dto: AttendanceCheckInDto,
    @CurrentUser() user: { id: number; role: UserRole },
  ): Promise<AttendanceCheckInResponseDto> {
    return this.attendanceSessionsService.checkIn(dto, {
      id: user.id,
      role: user.role,
    });
  }
}
