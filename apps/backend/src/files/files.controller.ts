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
  Header,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { Express, Response } from 'express';
import { Response as ExpressResponse } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

type RequestWithUser = Express.Request & {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
};
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('files')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
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

  @Get(':id/download')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @ApiOperation({ summary: 'Скачать файл по ID' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.findOne(+id);

    // Правильно формируем путь к файлу - убираем ведущий слеш из URL
    const filePath = join(process.cwd(), file.url.startsWith('/') ? file.url.substring(1) : file.url);

    console.log('Downloading file:', {
      fileId: id,
      fileName: file.name,
      originalName: file.originalName,
      filePath: filePath,
      fileExists: existsSync(filePath)
    });

    // Устанавливаем правильные headers
    res.set({
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.originalName || file.name}"`,
      'Content-Length': file.size?.toString() || '0',
    });

    const fileStream = createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('Error reading file:', error);
      res.status(404).send('File not found');
    });

    fileStream.pipe(res);
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
