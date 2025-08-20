import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { ScheduleAiFlowService } from './schedule-ai-flow.service';
import { GenerateScheduleDto } from '../ai-assistant/dto/generate-schedule.dto';

@ApiTags('Schedule AI Flow')
@Controller('schedule-flow')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ScheduleAiFlowController {
  constructor(private readonly flow: ScheduleAiFlowService) {}

  @Post('draft')
  @ApiOperation({ summary: 'Создать эвристический черновик расписания' })
  @ApiResponse({ status: 201, description: 'Черновик создан' })
  draft(@Body() dto: GenerateScheduleDto) {
    return this.flow.heuristicDraft(dto);
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Оптимизировать черновик через AI' })
  @ApiResponse({ status: 200, description: 'Оптимизация выполнена' })
  async optimize(@Body() body: { draft: any[]; params: GenerateScheduleDto }) {
    return this.flow.aiOptimize(body.draft, body.params);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Локальная проверка конфликтов' })
  @ApiResponse({ status: 200 })
  validate(@Body() body: { generated: any }) {
    return this.flow.validateConflicts(body.generated);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Применить итоговое расписание' })
  @ApiResponse({ status: 201, description: 'Расписание сохранено' })
  apply(@Body() body: { generated: any }) {
    return this.flow.apply(body.generated);
  }
}
