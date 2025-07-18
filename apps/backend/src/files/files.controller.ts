import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Res,
  StreamableFile,
  Header
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileUploadInterceptor } from '../common/interceptors/file-upload.interceptor';
import { Express } from 'express';
import { Response as ExpressResponse } from 'express';

type RequestWithUser = Express.Request & {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
};
import { createReadStream } from 'fs';
import { join } from 'path';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить один файл' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        category: {
          type: 'string',
          description: 'Категория файла: video, presentation, homework, material',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    return this.filesService.uploadFile(file, category, req.user);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Загрузить несколько файлов' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        category: {
          type: 'string',
          description: 'Категория файлов',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    return this.filesService.uploadFiles(files, category, req.user);
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Скачать файл по ID' })
  async downloadFile(@Param('id') id: string) {
    const file = await this.filesService.findOne(+id);
    const stream = createReadStream(join(process.cwd(), file.url));

    return new StreamableFile(stream, {
      type: file.type,
      disposition: `attachment; filename="${file.name}"`,
    });
  }

  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(+id);
  }
}
