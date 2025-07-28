import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from 'src/common/guards/permission.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AuthGuard, PermissionGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @RequirePermission('tasks', 'create')
    @ApiOperation({ summary: 'Создать новую задачу' })
    @ApiResponse({ status: 201, description: 'Задача успешно создана' })
    create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
        return this.tasksService.create(createTaskDto, req.user.id);
    }

    @Get()
    @RequirePermission('tasks', 'read', { scope: 'OWN' })
    @ApiOperation({ summary: 'Получить список задач' })
    @ApiResponse({ status: 200, description: 'Список задач получен' })
    findAll(@Query() filterDto: TaskFilterDto, @Request() req) {
        return this.tasksService.findAll(filterDto, req.user.id);
    }

    @Get('stats')
    @RequirePermission('tasks', 'read', { scope: 'OWN' })
    @ApiOperation({ summary: 'Получить статистику задач' })
    @ApiResponse({ status: 200, description: 'Статистика задач получена' })
    getStats(@Request() req) {
        return this.tasksService.getTaskStats(req.user.id);
    }

    @Get('categories')
    @RequirePermission('tasks', 'read', { scope: 'OWN' })
    @ApiOperation({ summary: 'Получить категории задач' })
    @ApiResponse({ status: 200, description: 'Категории задач получены' })
    getCategories(@Request() req) {
        return this.tasksService.getCategories(req.user.id);
    }

    @Post('categories')
    @RequirePermission('tasks', 'create')
    @ApiOperation({ summary: 'Создать новую категорию задач' })
    @ApiResponse({ status: 201, description: 'Категория успешно создана' })
    createCategory(
        @Body() data: { name: string; color?: string; description?: string },
    ) {
        return this.tasksService.createCategory(data.name, data.color, data.description);
    }

    @Get(':id')
    @RequirePermission('tasks', 'read', { scope: 'OWN' })
    @ApiOperation({ summary: 'Получить задачу по ID' })
    @ApiResponse({ status: 200, description: 'Задача найдена' })
    @ApiResponse({ status: 404, description: 'Задача не найдена' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.tasksService.findOne(id, req.user.id);
    }

    @Patch(':id')
    @RequirePermission('tasks', 'update', { scope: 'OWN' })
    @ApiOperation({ summary: 'Обновить задачу' })
    @ApiResponse({ status: 200, description: 'Задача успешно обновлена' })
    @ApiResponse({ status: 404, description: 'Задача не найдена' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @Request() req,
    ) {
        return this.tasksService.update(id, updateTaskDto, req.user.id);
    }

    @Delete(':id')
    @RequirePermission('tasks', 'delete', { scope: 'OWN' })
    @ApiOperation({ summary: 'Удалить задачу' })
    @ApiResponse({ status: 200, description: 'Задача успешно удалена' })
    @ApiResponse({ status: 404, description: 'Задача не найдена' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.tasksService.remove(id, req.user.id);
    }
}
