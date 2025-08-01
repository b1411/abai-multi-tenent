import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { Response as ExpressResponse } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('public-files')
@Controller('public/files')
export class PublicFilesController {
  constructor(private readonly filesService: FilesService) {}

  // Публичный роут для получения изображений без авторизации
  @Get(':id')
  @ApiOperation({ summary: 'Получить публичное изображение по ID' })
  async getPublicImage(@Param('id') id: string, @Res() res: ExpressResponse) {
    try {
      const file = await this.filesService.findOne(+id);
      
      // Проверяем, что это изображение
      if (!file.type?.startsWith('image/') && !file.url.includes('image')) {
        return res.status(403).json({ message: 'Доступ разрешен только к изображениям' });
      }

      // Если файл в Vercel Blob, редиректим на оригинальный URL
      if (file.url.startsWith('https://')) {
        return res.redirect(302, file.url);
      }

      // Для локальных файлов
      const filePath = join(process.cwd(), file.url.startsWith('/') ? file.url.substring(1) : file.url);
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ message: 'Файл не найден' });
      }

      // Устанавливаем headers для изображения
      res.set({
        'Content-Type': file.type || 'image/png',
        'Cache-Control': 'public, max-age=86400', // Кешируем на сутки
        'Content-Length': file.size?.toString() || '0',
      });

      const fileStream = createReadStream(filePath);
      fileStream.on('error', (error) => {
        console.error('Error reading file:', error);
        res.status(404).json({ message: 'Ошибка чтения файла' });
      });

      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving public image:', error);
      res.status(404).json({ message: 'Изображение не найдено' });
    }
  }
}
