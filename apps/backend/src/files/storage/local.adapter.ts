import { Injectable, Logger } from '@nestjs/common';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { StorageAdapter, UploadResult } from './storage.adapter';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads');
  }

  async upload(
    file: Express.Multer.File,
    category: string,
    fileName: string,
  ): Promise<UploadResult> {
    this.logger.log(`Uploading file locally: ${category}/${fileName}`);

    try {
      // Создаем папку для категории если её нет
      const categoryDir = path.join(this.baseDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }

      const filePath = path.join(categoryDir, fileName);

      // Сохраняем файл
      fs.writeFileSync(filePath, file.buffer);

      // Проверяем размер сохраненного файла
      const stats = fs.statSync(filePath);
      this.logger.log(`File saved locally: ${filePath}, size: ${stats.size}`);

      const url = `/uploads/${category}/${fileName}`;

      return {
        url,
        pathname: `${category}/${fileName}`,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to save file locally: ${error.message}`, error.stack);
      throw new Error(`Local storage upload failed: ${error.message}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), url);

      this.logger.log(`Deleting local file: ${filePath}`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Local file deleted: ${filePath}`);
      } else {
        this.logger.warn(`File not found: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete local file: ${error.message}`, error.stack);
      throw new Error(`Local storage delete failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем, можем ли создать директорию uploads
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      return true;
    } catch (error) {
      this.logger.warn(`Local storage is not available: ${error.message}`);
      return false;
    }
  }
}
