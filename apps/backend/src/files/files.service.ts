import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileEntity } from './entities/file.entity';
import { PrismaService } from '../prisma/prisma.service';
import { Express } from 'express';
import * as path from 'path';
import {
  StorageAdapter,
  S3StorageAdapter,
  LocalStorageAdapter,
  VercelBlobAdapter,
} from './storage';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly storageAdapters: StorageAdapter[];
  private primaryAdapter: StorageAdapter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Инициализируем адаптеры в порядке приоритета:
    // 1. S3 (основное хранилище для продакшена)
    // 2. Local (резервное локальное хранилище)
    // 3. Vercel Blob (если используется Vercel деплой)
    this.storageAdapters = [
      new S3StorageAdapter(configService),
      new LocalStorageAdapter(),
      new VercelBlobAdapter(),
    ];

    // Временно используем локальное хранилище до инициализации
    this.primaryAdapter = this.storageAdapters[1]; // LocalStorageAdapter

    // Асинхронно определяем доступный адаптер
    this.initializePrimaryAdapter();
  }

  private async initializePrimaryAdapter() {
    this.logger.log('Initializing storage adapters...');

    for (const adapter of this.storageAdapters) {
      this.logger.log(`Checking availability of ${adapter.constructor.name}...`);

      try {
        const isAvailable = await adapter.isAvailable();
        this.logger.log(`${adapter.constructor.name} available: ${isAvailable}`);

        if (isAvailable) {
          this.primaryAdapter = adapter;
          this.logger.log(`✅ Using storage adapter: ${adapter.constructor.name}`);
          break;
        }
      } catch (error) {
        this.logger.error(`Error checking ${adapter.constructor.name}: ${error.message}`);
      }
    }

    this.logger.log(`Final primary adapter: ${this.primaryAdapter.constructor.name}`);
  }

  async uploadFile(file: Express.Multer.File, category: string, user?: any): Promise<FileEntity> {
    if (!file) {
      throw new Error('Файл не был загружен');
    }

    this.logger.log(`Uploading file: ${file.originalname}, size: ${file.size}, category: ${category}`);

    // Генерируем безопасное имя файла без кириллицы
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const safeFileName = `${timestamp}-${randomString}${fileExtension}`;

    let uploadResult: any;

    // Пытаемся загрузить файл используя доступные адаптеры
    for (const adapter of this.storageAdapters) {
      try {
        if (await adapter.isAvailable()) {
          uploadResult = await adapter.upload(file, category || 'general', safeFileName);
          this.logger.log(`File uploaded using ${adapter.constructor.name}`);
          break;
        }
      } catch (error) {
        this.logger.warn(`Failed to upload using ${adapter.constructor.name}: ${error.message}`);
        continue;
      }
    }

    if (!uploadResult) {
      throw new Error('Не удалось загрузить файл ни в одно хранилище');
    }

    // Сохраняем информацию о файле в базу данных
    const fileRecord = await this.prisma.file.create({
      data: {
        name: uploadResult.pathname,
        url: uploadResult.url,
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

  create(_createFileDto: CreateFileDto) {
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

  update(id: number, _updateFileDto: UpdateFileDto) {
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

    // Удаляем файл из хранилища
    // Пытаемся удалить используя все адаптеры (один из них должен сработать)
    for (const adapter of this.storageAdapters) {
      try {
        await adapter.delete(file.url);
        this.logger.log(`File deleted using ${adapter.constructor.name}: ${file.url}`);
        break;
      } catch (error) {
        this.logger.warn(`Failed to delete using ${adapter.constructor.name}: ${error.message}`);
        continue;
      }
    }

    return { message: 'Файл успешно удален' };
  }
}
