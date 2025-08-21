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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
        return this.tasksService.create(createTaskDto, req.user.id);
    }

    @Get()
    findAll(@Query() filterDto: TaskFilterDto, @Request() req) {
        return this.tasksService.findAll(filterDto, req.user.id);
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.tasksService.getTaskStats(req.user.id);
    }

    @Get('categories')
    getCategories() {
        return this.tasksService.getCategories();
    }

    @Post('categories')
    createCategory(
        @Body() data: { name: string; color?: string; description?: string },
    ) {
        return this.tasksService.createCategory(data.name, data.color, data.description);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.tasksService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @Request() req,
    ) {
        return this.tasksService.update(id, updateTaskDto, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.tasksService.remove(id, req.user.id);
    }
}
