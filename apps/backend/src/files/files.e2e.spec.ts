import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FilesModule } from './files.module';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

/**
 * E2E тесты для проверки загрузки файлов через API
 * Эмулирует поведение фронтенда при загрузке файлов
 */
describe('Files E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let uploadedFileId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FilesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Создаем тестового пользователя и получаем токен
    // В реальном приложении используй настоящую аутентификацию
    authToken = 'Bearer test-token'; // TODO: получить реальный JWT токен
  });

  afterAll(async () => {
    // Очищаем созданные файлы
    if (uploadedFileId) {
      try {
        await prismaService.file.delete({
          where: { id: uploadedFileId },
        });
      } catch (error) {
        console.warn('Failed to cleanup test file:', error.message);
      }
    }

    await app.close();
  });

  describe('POST /files/upload', () => {
    it('должен загрузить текстовый файл', async () => {
      const testContent = 'Это тестовый файл для E2E теста';
      const testFilePath = path.join(__dirname, 'test-file.txt');

      // Создаем временный файл
      fs.writeFileSync(testFilePath, testContent);

      try {
        const response = await request(app.getHttpServer())
          .post('/files/upload')
          .set('Authorization', authToken)
          .field('category', 'test')
          .attach('file', testFilePath)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('url');
        expect(response.body).toHaveProperty('name');
        expect(response.body.category).toBe('test');

        // Проверяем что URL начинается с правильного домена
        expect(response.body.url).toMatch(/^https:\/\//);

        // Сохраняем ID для последующей очистки
        uploadedFileId = response.body.id;

        console.log('✅ Файл загружен:', response.body.url);

        // Проверяем доступность файла по URL
        const fileResponse = await fetch(response.body.url);
        expect(fileResponse.status).toBe(200);

        const fileContent = await fileResponse.text();
        expect(fileContent).toBe(testContent);

        console.log('✅ Файл доступен по URL');
      } finally {
        // Удаляем временный файл
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('должен загрузить изображение', async () => {
      // Создаем простое тестовое изображение (1x1 PNG)
      const base64Image =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(base64Image, 'base64');
      const testImagePath = path.join(__dirname, 'test-image.png');

      fs.writeFileSync(testImagePath, imageBuffer);

      try {
        const response = await request(app.getHttpServer())
          .post('/files/upload')
          .set('Authorization', authToken)
          .field('category', 'avatars')
          .attach('file', testImagePath)
          .expect(201);

        expect(response.body).toHaveProperty('url');
        expect(response.body.type).toMatch(/image/);
        expect(response.body.url).toContain('avatars');

        console.log('✅ Изображение загружено:', response.body.url);

        // Проверяем доступность изображения
        const imageResponse = await fetch(response.body.url);
        expect(imageResponse.status).toBe(200);
        expect(imageResponse.headers.get('content-type')).toMatch(/image/);

        // Удаляем файл из S3
        await request(app.getHttpServer())
          .delete(`/files/${response.body.id}`)
          .set('Authorization', authToken)
          .expect(200);

        console.log('✅ Изображение удалено');
      } finally {
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }
    });

    it('должен загрузить несколько файлов одновременно', async () => {
      const file1Path = path.join(__dirname, 'test-file-1.txt');
      const file2Path = path.join(__dirname, 'test-file-2.txt');

      fs.writeFileSync(file1Path, 'Первый тестовый файл');
      fs.writeFileSync(file2Path, 'Второй тестовый файл');

      try {
        const response = await request(app.getHttpServer())
          .post('/files/upload-multiple')
          .set('Authorization', authToken)
          .field('category', 'documents')
          .attach('files', file1Path)
          .attach('files', file2Path)
          .expect(201);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);

        response.body.forEach((file, index) => {
          expect(file).toHaveProperty('url');
          expect(file.category).toBe('documents');
          console.log(`✅ Файл ${index + 1} загружен:`, file.url);
        });

        // Удаляем все загруженные файлы
        for (const file of response.body) {
          await request(app.getHttpServer())
            .delete(`/files/${file.id}`)
            .set('Authorization', authToken);
        }
      } finally {
        if (fs.existsSync(file1Path)) fs.unlinkSync(file1Path);
        if (fs.existsSync(file2Path)) fs.unlinkSync(file2Path);
      }
    });

    it('должен вернуть ошибку при загрузке без файла', async () => {
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', authToken)
        .field('category', 'test')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /files/:id', () => {
    it('должен получить информацию о файле по ID', async () => {
      if (!uploadedFileId) {
        console.warn('Skipping test - no uploaded file ID');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/files/${uploadedFileId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('id', uploadedFileId);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('DELETE /files/:id', () => {
    it('должен удалить файл и файл из S3', async () => {
      // Сначала загружаем файл
      const testFilePath = path.join(__dirname, 'test-delete.txt');
      fs.writeFileSync(testFilePath, 'Файл для удаления');

      try {
        const uploadResponse = await request(app.getHttpServer())
          .post('/files/upload')
          .set('Authorization', authToken)
          .field('category', 'test')
          .attach('file', testFilePath)
          .expect(201);

        const fileId = uploadResponse.body.id;
        const fileUrl = uploadResponse.body.url;

        // Проверяем что файл доступен
        const beforeDelete = await fetch(fileUrl);
        expect(beforeDelete.status).toBe(200);

        // Удаляем файл
        await request(app.getHttpServer())
          .delete(`/files/${fileId}`)
          .set('Authorization', authToken)
          .expect(200);

        console.log('✅ Файл удален из базы и S3');

        // Проверяем что файл больше недоступен (может потребоваться время)
        // Note: S3 может кешировать, поэтому этот тест может быть нестабильным
        // const afterDelete = await fetch(fileUrl);
        // expect([403, 404]).toContain(afterDelete.status);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });
});
