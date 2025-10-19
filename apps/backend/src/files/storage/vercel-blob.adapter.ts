import { Injectable, Logger } from '@nestjs/common';
import { Express } from 'express';
import { put, del } from '@vercel/blob';
import { StorageAdapter, UploadResult } from './storage.adapter';

@Injectable()
export class VercelBlobAdapter implements StorageAdapter {
  private readonly logger = new Logger(VercelBlobAdapter.name);

  async upload(
    file: Express.Multer.File,
    category: string,
    fileName: string,
  ): Promise<UploadResult> {
    this.logger.log(`Uploading file to Vercel Blob: ${category}/${fileName}`);

    try {
      const blob = await put(`${category}/${fileName}`, file.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });

      this.logger.log(`File uploaded to Vercel Blob: ${blob.url}`);

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload to Vercel Blob: ${error.message}`, error.stack);
      throw new Error(`Vercel Blob upload failed: ${error.message}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from Vercel Blob: ${url}`);

      await del(url);

      this.logger.log(`File deleted from Vercel Blob: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to delete from Vercel Blob: ${error.message}`, error.stack);
      throw new Error(`Vercel Blob delete failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем наличие токена Vercel Blob
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      return !!token;
    } catch (error) {
      this.logger.warn(`Vercel Blob is not available: ${error.message}`);
      return false;
    }
  }
}
