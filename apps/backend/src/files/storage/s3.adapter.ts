import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { StorageAdapter, UploadResult } from './storage.adapter';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly publicUrl: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    this.publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');
    this.endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    // Логируем конфигурацию для отладки
    this.logger.log('S3 Adapter Configuration:');
    this.logger.log(`  Bucket: ${this.bucketName || 'NOT SET'}`);
    this.logger.log(`  Region: ${this.region}`);
    this.logger.log(`  Endpoint: ${this.endpoint || 'NOT SET'}`);
    this.logger.log(`  Public URL: ${this.publicUrl || 'NOT SET'}`);
    this.logger.log(`  Access Key: ${this.configService.get<string>('AWS_ACCESS_KEY_ID') ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  Secret Key: ${this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ? 'SET' : 'NOT SET'}`);

    const s3Config: any = {
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    };

    // Если указан кастомный endpoint (например, для S3-совместимых хранилищ)
    if (this.endpoint) {
      s3Config.endpoint = this.endpoint;
      // Используем path-style для API операций (загрузка, удаление, проверка)
      // но формируем публичные URL в vHosted стиле для доступа к файлам
      s3Config.forcePathStyle = true;
    }

    this.s3Client = new S3Client(s3Config);
  }

  async upload(
    file: Express.Multer.File,
    category: string,
    fileName: string,
  ): Promise<UploadResult> {
    const key = `${category}/${fileName}`;

    this.logger.log(`Uploading file to S3: ${key}`);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL убран - современные S3 хранилища используют Bucket Policy для публичного доступа
      });

      await this.s3Client.send(command);

      // Формируем URL для доступа к файлу
      let url: string;
      if (this.publicUrl) {
        // Используем кастомный URL если указан
        url = `${this.publicUrl}/${key}`;
      } else if (this.endpoint) {
        // Для кастомных endpoint используем vHosted адресацию
        // Извлекаем домен из endpoint (https://s3.kz-1.storage.selcloud.ru -> s3.kz-1.storage.selcloud.ru)
        const endpointDomain = this.endpoint.replace(/^https?:\/\//, '');
        url = `https://${this.bucketName}.${endpointDomain}/${key}`;
      } else {
        // Стандартный AWS S3 URL
        url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      }

      this.logger.log(`File uploaded successfully: ${url}`);

      return {
        url,
        pathname: key,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async delete(url: string): Promise<void> {
    try {
      // Извлекаем ключ из URL
      const key = this.extractKeyFromUrl(url);

      this.logger.log(`Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucketName,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.warn(`S3 is not available: ${error.message}`);
      return false;
    }
  }

  private extractKeyFromUrl(url: string): string {
    // Если используется кастомный public URL
    if (this.publicUrl && url.startsWith(this.publicUrl)) {
      return url.replace(`${this.publicUrl}/`, '');
    }

    // Если используется кастомный endpoint с vHosted адресацией
    if (this.endpoint) {
      const endpointDomain = this.endpoint.replace(/^https?:\/\//, '');
      const vHostedPattern = new RegExp(
        `https://${this.bucketName}\\.${endpointDomain.replace(/\./g, '\\.')}/(.+)`,
      );
      const match = url.match(vHostedPattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Если используется стандартный AWS S3 URL (vHosted)
    const awsVHostedPattern = new RegExp(
      `https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`,
    );
    const awsMatch = url.match(awsVHostedPattern);
    if (awsMatch && awsMatch[1]) {
      return awsMatch[1];
    }

    // Если URL уже является ключом
    return url;
  }
}
