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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { DocumentType } from './dto/create-document.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('edo/templates')
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Get()
  findAll(@Query('type') type?: DocumentType) {
    return this.templatesService.findAll(type);
  }

  @Get('init-defaults')
  initDefaults(@Request() req) {
    return this.templatesService.createDefaultTemplates(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/render')
  renderTemplate(@Param('id') id: string, @Body() data: any) {
    return this.templatesService.renderTemplate(id, data);
  }
}
