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
import { EdoService } from './edo.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApproveDocumentDto } from './dto/approve-document.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { DocumentFilterDto } from './dto/document-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UsersService } from '../users/users.service';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('edo')
@UseGuards(AuthGuard)
export class EdoController {
  constructor(
    private readonly edoService: EdoService,
    private readonly usersService: UsersService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.edoService.create(createDocumentDto, req.user.id);
  }

  @Get('users/approvers')
  getApprovers() {
    // Возвращаем пользователей, которые могут согласовывать документы
    return this.usersService.findAll();
  }

  // Templates routes - должны быть перед динамическими роутами
  @Get('templates')
  getAllTemplates(@Query('type') type?: any) {
    return this.templatesService.findAll(type);
  }

  @Get('templates/init-defaults')
  initDefaultTemplates(@Request() req) {
    return this.templatesService.createDefaultTemplates(req.user.id);
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post('templates')
  createTemplate(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('templates/:id/render')
  renderTemplate(@Param('id') id: string, @Body() data: any) {
    return this.templatesService.renderTemplate(id, data);
  }

  @Get()
  findAll(@Query() filterDto: DocumentFilterDto, @Request() req) {
    return this.edoService.findAll(filterDto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.edoService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.edoService.update(id, updateDocumentDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.edoService.remove(id, req.user.id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveDocumentDto,
    @Request() req,
  ) {
    return this.edoService.approve(id, approveDto, req.user.id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { comment?: string }, @Request() req) {
    const rejectDto: ApproveDocumentDto = {
      status: 'REJECTED' as any,
      comment: body.comment,
    };
    return this.edoService.approve(id, rejectDto, req.user.id);
  }

  @Get(':id/approvals')
  getApprovals(@Param('id') id: string, @Request() req) {
    return this.edoService.getApprovals(id, req.user.id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() commentDto: AddCommentDto,
    @Request() req,
  ) {
    return this.edoService.addComment(id, commentDto, req.user.id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @Request() req) {
    return this.edoService.getComments(id, req.user.id);
  }
}
