import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query, ParseIntPipe, Req, UploadedFile, UseInterceptors, NotFoundException, Sse } from '@nestjs/common';
import { StudyPlansService } from './study-plans.service';
import { StudyPlanFilterDto } from './dto/study-plan-filter.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { UpdateStudyPlanDto } from './dto/update-study-plan-dto';
import { StudyPlan } from './entities/study-plan.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';
import { ImportStudyPlanFileDto } from './dto/import-study-plan-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportProgressService } from './import-progress.service';
import { map } from 'rxjs/operators';

@Controller('study-plans')
@ApiTags('Study Plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
export class StudyPlansController {
  constructor(
    private readonly studyPlansService: StudyPlansService,
    private readonly importProgress: ImportProgressService
  ) { }

  @Get()
  @Roles("ADMIN", "TEACHER", "STUDENT", "PARENT")
  @ApiOperation({ summary: 'Получить все учебные планы' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список учебных планов с пагинацией',
    type: PaginateResponseDto<StudyPlan>
  })
  findAll(@Query() filter: StudyPlanFilterDto, @Req() req: any): Promise<PaginateResponseDto<StudyPlan>> {
    // Для студентов возвращаем только их планы
    if (req.user.role === 'STUDENT') {
      return this.studyPlansService.findStudentStudyPlans(filter, req.user.id);
    }
    // Для родителей возвращаем планы их детей
    if (req.user.role === 'PARENT') {
      return this.studyPlansService.findParentChildrenStudyPlans(filter, req.user.id);
    }
    // Для преподавателя — только свои планы
    if (req.user.role === 'TEACHER') {
      return this.studyPlansService.findAll({ ...filter }, { id: req.user.id, role: 'TEACHER' });
    }
    // Для админов возвращаем все планы
    return this.studyPlansService.findAll(filter);
  }

  @Get('me')
  @Roles("STUDENT")
  @ApiOperation({ summary: 'Получить учебные планы текущего студента' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список учебных планов студента',
    type: PaginateResponseDto<StudyPlan>
  })
  findMyStudyPlans(@Query() filter: StudyPlanFilterDto, @Req() req: any): Promise<PaginateResponseDto<StudyPlan>> {
    return this.studyPlansService.findStudentStudyPlans(filter, req.user.id);
  }

  @Get('my-children')
  @Roles("PARENT")
  @ApiOperation({ summary: 'Получить учебные планы детей родителя' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список учебных планов детей родителя',
    type: PaginateResponseDto<StudyPlan>
  })
  findMyChildrenStudyPlans(@Query() filter: StudyPlanFilterDto, @Req() req: any): Promise<PaginateResponseDto<StudyPlan>> {
    return this.studyPlansService.findParentChildrenStudyPlans(filter, req.user.id);
  }

  @Get(':id')
  @Roles("ADMIN", "TEACHER", "STUDENT", "PARENT")
  @ApiOperation({ summary: 'Получить учебный план по ID' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные учебного плана',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StudyPlan> {
    return this.studyPlansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый учебный план' })
  @ApiResponse({ 
    status: 201, 
    description: 'Учебный план успешно создан',
    type: StudyPlan
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  create(@Body() createStudyPlanDto: CreateStudyPlanDto): Promise<StudyPlan> {
    return this.studyPlansService.create(createStudyPlanDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить учебный план' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Учебный план успешно обновлен',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStudyPlanDto: UpdateStudyPlanDto): Promise<StudyPlan> {
    return this.studyPlansService.update(id, updateStudyPlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить учебный план (мягкое удаление)' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Учебный план успешно удален',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<StudyPlan> {
    return this.studyPlansService.softRemove(id);
  }

  @Post('import-file')
  @Roles("ADMIN","TEACHER")
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Импорт учебного плана и КТП из файла (docx/pdf)' })
  @ApiResponse({ status: 201, description: 'Импорт выполнен' })
  importFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportStudyPlanFileDto
  ) {
    return this.studyPlansService.importFromFile(file, dto);
  }

  @Post('import-file-async')
  @Roles("ADMIN","TEACHER")
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Асинхронный импорт учебного плана и КТП (docx/pdf) с прогрессом' })
  @ApiResponse({ status: 201, description: 'Импорт запущен' })
  importFromFileAsync(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportStudyPlanFileDto
  ) {
    const job = this.importProgress.createJob();

    // Отмечаем что загрузка завершена (файл получен целиком)
    this.importProgress.updateUpload(job.jobId, 100);

    // Запускаем асинхронно
    setImmediate(() => {
      this.studyPlansService.importFromFileWithProgress(job.jobId, this.importProgress, file, dto);
    });

    return { jobId: job.jobId };
  }

  @Get('import-progress/:jobId')
  @Roles("ADMIN","TEACHER")
  @ApiOperation({ summary: 'Получить прогресс асинхронного импорта' })
  @ApiParam({ name: 'jobId', description: 'ID джоба импорта' })
  @ApiResponse({ status: 200, description: 'Состояние прогресса' })
  getImportProgress(@Param('jobId') jobId: string) {
    const job = this.importProgress.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Import job not found');
    }
    return job;
  }

  @Sse('import-progress/:jobId/sse')
  @Roles("ADMIN","TEACHER")
  @ApiOperation({ summary: 'SSE поток прогресса импорта' })
  sseImportProgress(@Param('jobId') jobId: string) {
    const job = this.importProgress.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Import job not found');
    }
    // Отдаём поток. Клиент: new EventSource(`/api/study-plans/import-progress/${jobId}/sse?access_token=...`)
    return this.importProgress.subscribe(jobId).pipe(
      map(data => ({ data }))
    );
  }
}
