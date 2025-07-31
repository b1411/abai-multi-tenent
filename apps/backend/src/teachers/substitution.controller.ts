import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { SubstitutionService } from './substitution.service';

interface CreateSubstitutionDto {
  scheduleId: string;
  substituteTeacherId: number;
  reason: string;
}

interface AvailableTeachersQueryDto {
  date: string;
  startTime: string;
  endTime: string;
  excludeTeacherId?: string;
}

@Controller('substitutions')
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  // Создать замещение
  @Post()
  createSubstitution(@Body() createDto: CreateSubstitutionDto) {
    return this.substitutionService.createSubstitution(createDto);
  }

  // Убрать замещение
  @Delete(':scheduleId')
  removeSubstitution(@Param('scheduleId') scheduleId: string) {
    return this.substitutionService.removeSubstitution(scheduleId);
  }

  // Получить доступных преподавателей для замещения
  @Get('available-teachers')
  getAvailableTeachers(@Query() query: AvailableTeachersQueryDto) {
    const { date, startTime, endTime, excludeTeacherId } = query;
    return this.substitutionService.getAvailableTeachers({
      date: new Date(date),
      startTime,
      endTime,
      excludeTeacherId: excludeTeacherId ? +excludeTeacherId : undefined,
    });
  }

  // Проверить доступность преподавателя
  @Get('check-availability/:teacherId')
  checkTeacherAvailability(
    @Param('teacherId') teacherId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.substitutionService.checkTeacherAvailability({
      teacherId: +teacherId,
      date: new Date(date),
      startTime,
      endTime,
    });
  }

  // Получить все замещения с фильтрами
  @Get()
  getSubstitutions(
    @Query('teacherId') teacherId?: string,
    @Query('substituteId') substituteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.substitutionService.getSubstitutions({
      teacherId: teacherId ? +teacherId : undefined,
      substituteId: substituteId ? +substituteId : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Статистика замещений
  @Get('stats')
  getSubstitutionStats(@Query('teacherId') teacherId?: string) {
    return this.substitutionService.getSubstitutionStats(
      teacherId ? +teacherId : undefined,
    );
  }
}
