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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { SalariesService } from './salaries.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryFilterDto } from './dto/salary-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('salaries')
@Controller('salaries')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Post()
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Создать зарплату' })
  @ApiResponse({ status: 201, description: 'Зарплата создана' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 404, description: 'Учитель не найден' })
  create(@Body() createSalaryDto: CreateSalaryDto) {
    return this.salariesService.create(createSalaryDto);
  }

  @Get()
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить список зарплат' })
  @ApiResponse({ status: 200, description: 'Список зарплат' })
  findAll(@Query() filterDto: SalaryFilterDto) {
    return this.salariesService.findAll(filterDto);
  }

  @Get('statistics')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить статистику по зарплатам' })
  @ApiResponse({ status: 200, description: 'Статистика зарплат' })
  getStatistics(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.salariesService.getSalaryStatistics(year, month);
  }

  @Get('history/:teacherId')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить историю зарплат учителя' })
  @ApiResponse({ status: 200, description: 'История зарплат учителя' })
  @ApiResponse({ status: 404, description: 'Учитель не найден' })
  getSalaryHistory(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.salariesService.getSalaryHistory(teacherId);
  }

  @Get(':id')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить зарплату по ID' })
  @ApiResponse({ status: 200, description: 'Зарплата найдена' })
  @ApiResponse({ status: 404, description: 'Зарплата не найдена' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salariesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Обновить зарплату' })
  @ApiResponse({ status: 200, description: 'Зарплата обновлена' })
  @ApiResponse({ status: 404, description: 'Зарплата не найдена' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalaryDto: UpdateSalaryDto,
  ) {
    return this.salariesService.update(id, updateSalaryDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Удалить зарплату' })
  @ApiResponse({ status: 200, description: 'Зарплата удалена' })
  @ApiResponse({ status: 404, description: 'Зарплата не найдена' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salariesService.remove(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Утвердить зарплату' })
  @ApiResponse({ status: 200, description: 'Зарплата утверждена' })
  @ApiResponse({ status: 400, description: 'Нельзя утвердить зарплату' })
  @ApiResponse({ status: 404, description: 'Зарплата не найдена' })
  approveSalary(@Param('id', ParseIntPipe) id: number) {
    // Временно используем ID 1 как approvedBy
    return this.salariesService.approveSalary(id, 1);
  }

  @Post(':id/mark-paid')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Отметить зарплату как выплаченную' })
  @ApiResponse({ status: 200, description: 'Зарплата отмечена как выплаченная' })
  @ApiResponse({ status: 400, description: 'Нельзя отметить зарплату как выплаченную' })
  @ApiResponse({ status: 404, description: 'Зарплата не найдена' })
  markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.salariesService.markAsPaid(id);
  }

  @Get('export')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Экспорт зарплат' })
  @ApiResponse({ status: 200, description: 'Файл экспорта зарплат' })
  async exportSalaries(
    @Query() filterDto: SalaryFilterDto,
    @Query('format') format: 'xlsx' | 'csv' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.salariesService.exportSalaries(filterDto, format);
    
    const filename = `salaries-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'xlsx' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : format === 'csv'
      ? 'text/csv'
      : 'application/pdf';
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }

  @Post('recalculate')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Пересчитать зарплаты' })
  @ApiResponse({ status: 200, description: 'Зарплаты пересчитаны' })
  async recalculateSalaries(
    @Body() filters?: { month?: number; year?: number },
  ) {
    return this.salariesService.recalculateSalaries(filters);
  }
}
