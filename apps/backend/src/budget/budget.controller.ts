import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { BudgetItem } from './entities/budget-item.entity';

@ApiTags('budget')
@ApiBearerAuth()
@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Создать статью бюджета' })
  @ApiResponse({ status: 201, description: 'Статья бюджета создана', type: BudgetItem })
  async create(@Body() createBudgetItemDto: CreateBudgetItemDto) {
    return await this.budgetService.create(createBudgetItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список статей бюджета' })
  @ApiResponse({ status: 200, description: 'Список статей бюджета' })
  async findAll(
    @Query('period') period?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('responsible') responsible?: string,
  ) {
    return await this.budgetService.findAll({
      period,
      type,
      category,
      status,
      responsible,
    });
  }

  @Get('analytics/:period')
  @ApiOperation({ summary: 'Получить аналитику по бюджету' })
  @ApiResponse({ status: 200, description: 'Аналитика бюджета' })
  async getAnalytics(@Param('period') period: string) {
    return await this.budgetService.getAnalytics(period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить статью бюджета по ID' })
  @ApiResponse({ status: 200, description: 'Статья бюджета', type: BudgetItem })
  @ApiResponse({ status: 404, description: 'Статья бюджета не найдена' })
  async findOne(@Param('id') id: string) {
    return await this.budgetService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить статью бюджета' })
  @ApiResponse({ status: 200, description: 'Статья бюджета обновлена', type: BudgetItem })
  @ApiResponse({ status: 404, description: 'Статья бюджета не найдена' })
  async update(
    @Param('id') id: string,
    @Body() updateBudgetItemDto: UpdateBudgetItemDto,
  ) {
    return await this.budgetService.update(+id, updateBudgetItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить статью бюджета' })
  @ApiResponse({ status: 200, description: 'Статья бюджета удалена' })
  @ApiResponse({ status: 404, description: 'Статья бюджета не найдена' })
  async remove(@Param('id') id: string) {
    return await this.budgetService.remove(+id);
  }

  @Post('periods/:period/close')
  @ApiOperation({ summary: 'Закрыть период бюджета' })
  @ApiResponse({ status: 200, description: 'Период закрыт' })
  async closePeriod(
    @Param('period') period: string,
    @Body('notes') notes?: string,
  ) {
    return await this.budgetService.closePeriod(period, notes);
  }
}
