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
import { EdoService } from './edo.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApproveDocumentDto } from './dto/approve-document.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { DocumentFilterDto } from './dto/document-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { UsersService } from '../users/users.service';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@ApiTags('edo')
@Controller('edo')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class EdoController {
  constructor(
    private readonly edoService: EdoService,
    private readonly usersService: UsersService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Post()
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Создать документ' })
  @ApiResponse({ status: 201, description: 'Документ успешно создан' })
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.edoService.create(createDocumentDto, req.user.id);
  }

  @Get('users/approvers')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Получить список согласующих' })
  @ApiResponse({ status: 200, description: 'Список согласующих получен' })
  getApprovers() {
    // Возвращаем пользователей, которые могут согласовывать документы
    return this.usersService.findAll();
  }

  // Templates routes - должны быть перед динамическими роутами
  @Get('templates')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Получить шаблоны документов' })
  @ApiResponse({ status: 200, description: 'Шаблоны документов получены' })
  getAllTemplates(@Query('type') type?: any) {
    return this.templatesService.findAll(type);
  }

  @Get('templates/init-defaults')
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Инициализировать шаблоны по умолчанию' })
  @ApiResponse({ status: 200, description: 'Шаблоны по умолчанию созданы' })
  initDefaultTemplates(@Request() req) {
    return this.templatesService.createDefaultTemplates(req.user.id);
  }

  @Get('templates/:id')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Получить шаблон по ID' })
  @ApiResponse({ status: 200, description: 'Шаблон найден' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  getTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post('templates')
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Создать шаблон документа' })
  @ApiResponse({ status: 201, description: 'Шаблон успешно создан' })
  createTemplate(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Patch('templates/:id')
  @RequirePermission('edo', 'update')
  @ApiOperation({ summary: 'Обновить шаблон документа' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @RequirePermission('edo', 'delete')
  @ApiOperation({ summary: 'Удалить шаблон документа' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно удален' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  removeTemplate(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('templates/:id/render')
  @RequirePermission('edo', 'read')
  @ApiOperation({ summary: 'Отрендерить шаблон с данными' })
  @ApiResponse({ status: 200, description: 'Шаблон успешно отрендерен' })
  @ApiResponse({ status: 404, description: 'Шаблон не найден' })
  renderTemplate(@Param('id') id: string, @Body() data: any) {
    return this.templatesService.renderTemplate(id, data);
  }

  @Get()
  @RequirePermission('edo', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить список документов' })
  @ApiResponse({ status: 200, description: 'Список документов получен' })
  findAll(@Query() filterDto: DocumentFilterDto, @Request() req) {
    return this.edoService.findAll(filterDto, req.user.id);
  }

  @Get(':id')
  @RequirePermission('edo', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить документ по ID' })
  @ApiResponse({ status: 200, description: 'Документ найден' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.edoService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @RequirePermission('edo', 'update', { scope: 'OWN' })
  @ApiOperation({ summary: 'Обновить документ' })
  @ApiResponse({ status: 200, description: 'Документ успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.edoService.update(id, updateDocumentDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermission('edo', 'delete', { scope: 'OWN' })
  @ApiOperation({ summary: 'Удалить документ' })
  @ApiResponse({ status: 200, description: 'Документ успешно удален' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  remove(@Param('id') id: string, @Request() req) {
    return this.edoService.remove(id, req.user.id);
  }

  @Post(':id/approve')
  @RequirePermission('edo', 'update')
  @ApiOperation({ summary: 'Согласовать документ' })
  @ApiResponse({ status: 200, description: 'Документ успешно согласован' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveDocumentDto,
    @Request() req,
  ) {
    return this.edoService.approve(id, approveDto, req.user.id);
  }

  @Post(':id/reject')
  @RequirePermission('edo', 'update')
  @ApiOperation({ summary: 'Отклонить документ' })
  @ApiResponse({ status: 200, description: 'Документ успешно отклонен' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  reject(@Param('id') id: string, @Body() body: { comment?: string }, @Request() req) {
    const rejectDto: ApproveDocumentDto = {
      status: 'REJECTED' as any,
      comment: body.comment,
    };
    return this.edoService.approve(id, rejectDto, req.user.id);
  }

  @Get(':id/approvals')
  @RequirePermission('edo', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить согласования документа' })
  @ApiResponse({ status: 200, description: 'Согласования документа получены' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  getApprovals(@Param('id') id: string, @Request() req) {
    return this.edoService.getApprovals(id, req.user.id);
  }

  @Post(':id/comments')
  @RequirePermission('edo', 'create')
  @ApiOperation({ summary: 'Добавить комментарий к документу' })
  @ApiResponse({ status: 201, description: 'Комментарий успешно добавлен' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  addComment(
    @Param('id') id: string,
    @Body() commentDto: AddCommentDto,
    @Request() req,
  ) {
    return this.edoService.addComment(id, commentDto, req.user.id);
  }

  @Get(':id/comments')
  @RequirePermission('edo', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить комментарии к документу' })
  @ApiResponse({ status: 200, description: 'Комментарии к документу получены' })
  @ApiResponse({ status: 404, description: 'Документ не найден' })
  getComments(@Param('id') id: string, @Request() req) {
    return this.edoService.getComments(id, req.user.id);
  }
}
