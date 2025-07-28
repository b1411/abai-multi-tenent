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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { DocumentType } from './dto/create-document.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('edo-templates')
@Controller('edo/templates')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Создать шаблон документа' })
  @ApiResponse({ status: 201, description: 'Шаблон успешно создан' })
  create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Get()
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Получить все шаблоны документов' })
  @ApiResponse({ status: 200, description: 'Шаблоны получены' })
  findAll(@Query('type') type?: DocumentType) {
    return this.templatesService.findAll(type);
  }

  @Get('init-defaults')
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Инициализировать шаблоны по умолчанию' })
  @ApiResponse({ status: 200, description: 'Шаблоны по умолчанию созданы' })
  initDefaults(@Request() req) {
    return this.templatesService.createDefaultTemplates(req.user.id);
  }

  @Get(':id')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Получить шаблон по ID' })
  @ApiResponse({ status: 200, description: 'Шаблон найден' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('edo', 'update')
  @ApiOperation({ summary: 'Обновить шаблон документа' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @RequirePermission('edo', 'delete')
  @ApiOperation({ summary: 'Удалить шаблон документа' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно удален' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/render')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Отрендерить шаблон с данными' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно отрендерен' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  renderTemplate(@Param('id') id: string, @Body() data: any) {
    return this.templatesService.renderTemplate(id, data);
  }
}
