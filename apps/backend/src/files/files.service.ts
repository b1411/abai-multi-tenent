import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileEntity } from './entities/file.entity';
import { PrismaService } from '../prisma/prisma.service';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(file: Express.Multer.File, category: string, user?: any): Promise<FileEntity> {
    if (!file) {
      throw new Error('Файл не был загружен');
    }

    console.log('Uploading file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferSize: file.buffer?.length,
      category
    });

    // Создаем папку uploads если её нет
    const uploadsDir = path.join(process.cwd(), 'uploads', category || 'general');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = uniqueSuffix + fileExtension;
    const filePath = path.join(uploadsDir, fileName);

    // Сохраняем файл с правильной кодировкой
    fs.writeFileSync(filePath, file.buffer);
    
    // Проверяем размер сохраненного файла
    const stats = fs.statSync(filePath);
    console.log('File saved:', {
      fileName,
      originalSize: file.size,
      savedSize: stats.size,
      filePath
    });

    // Сохраняем информацию о файле в базу данных
    const fileRecord = await this.prisma.file.create({
      data: {
        name: fileName,
        url: `/uploads/${category || 'general'}/${fileName}`,
        type: file.mimetype,
        size: file.size,
        mime: file.mimetype,
      },
    });

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      originalName: file.originalname,
      url: fileRecord.url,
      type: fileRecord.type,
      size: fileRecord.size,
      category: category || 'general',
      uploadedBy: user?.id || null,
      createdAt: fileRecord.createdAt,
      updatedAt: fileRecord.updatedAt,
      deletedAt: fileRecord.deletedAt,
    } as FileEntity;
  }

  async uploadFiles(files: Express.Multer.File[], category: string, user?: any): Promise<FileEntity[]> {
    const uploadedFiles: FileEntity[] = [];

    for (const file of files) {
      const uploadedFile = await this.uploadFile(file, category, user);
      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  }

  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  findAll() {
    return `This action returns all files`;
  }

  async findOne(id: number): Promise<FileEntity> {
    const file = await this.prisma.file.findUnique({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException(`Файл с ID ${id} не найден`);
    }

    return {
      id: file.id,
      name: file.name,
      originalName: file.name,
      url: file.url,
      type: file.type,
      size: file.size,
      category: 'general',
      uploadedBy: null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
    } as FileEntity;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  async remove(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException(`Файл с ID ${id} не найден`);
    }

    // Мягкое удаление
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Опционально: удаляем физический файл
    try {
      const filePath = path.join(process.cwd(), file.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
    }

    return { message: 'Файл успешно удален' };
  }
}
