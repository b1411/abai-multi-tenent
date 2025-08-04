import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { KtpService } from './ktp.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CreateKtpDto, UpdateKtpDto, KtpFilterDto } from './dto/ktp.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('KTP (Календарно-тематическое планирование)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ktp')
export class KtpController {
  constructor(private readonly ktpService: KtpService) { }

  @ApiOperation({ summary: 'Получить все КТП с фильтрацией' })
  @ApiResponse({ status: 200, description: 'Список КТП' })
  @Get()
  async findAll(@Query() filter: KtpFilterDto) {
    return await this.ktpService.findAll(filter);
  }

  @ApiOperation({ summary: 'Получить статистику КТП' })
  @ApiResponse({ status: 200, description: 'Статистика КТП' })
  @Get('statistics/overview')
  async getStatistics(@Query() filter: KtpFilterDto) {
    return await this.ktpService.getStatistics(filter);
  }

  @ApiOperation({ summary: 'Получить КПИ по заполнению КТП' })
  @ApiResponse({ status: 200, description: 'КПИ заполнения КТП' })
  @Get('kpi/completion')
  async getCompletionKpi(@Query() filter: KtpFilterDto) {
    return await this.ktpService.getCompletionKpi(filter);
  }

  @ApiOperation({ summary: 'Получить КТП преподавателя' })
  @ApiResponse({ status: 200, description: 'КТП преподавателя' })
  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId') teacherId: string, @Query() filter: KtpFilterDto) {
    return await this.ktpService.findByTeacher(+teacherId, filter);
  }

  @ApiOperation({ summary: 'Автоматически создать КТП на основе учебного плана' })
  @ApiResponse({ status: 201, description: 'КТП автоматически создан' })
  @Post('generate/:studyPlanId')
  async generateFromStudyPlan(@Param('studyPlanId') studyPlanId: string) {
    return await this.ktpService.generateFromStudyPlan(+studyPlanId);
  }

  @ApiOperation({ summary: 'Получить КТП по ID' })
  @ApiResponse({ status: 200, description: 'КТП найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ktpService.findOne(+id);
  }

  @ApiOperation({ summary: 'Создать новый КТП' })
  @ApiResponse({ status: 201, description: 'КТП создан' })
  @Post()
  async create(@Body() createKtpDto: CreateKtpDto) {
    return await this.ktpService.create(createKtpDto);
  }

  @ApiOperation({ summary: 'Обновить КТП' })
  @ApiResponse({ status: 200, description: 'КТП обновлен' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateKtpDto: UpdateKtpDto) {
    return await this.ktpService.update(+id, updateKtpDto);
  }

  @ApiOperation({ summary: 'Удалить КТП' })
  @ApiResponse({ status: 200, description: 'КТП удален' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.ktpService.remove(+id);
  }

  @ApiOperation({ summary: 'Обновить статус урока в КТП' })
  @ApiResponse({ status: 200, description: 'Статус урока обновлен' })
  @Put(':id/lesson/:lessonId/status')
  async updateLessonStatus(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @Body() body: { status: 'planned' | 'in_progress' | 'completed' }
  ) {
    return await this.ktpService.updateLessonStatus(+id, +lessonId, body.status);
  }
}
