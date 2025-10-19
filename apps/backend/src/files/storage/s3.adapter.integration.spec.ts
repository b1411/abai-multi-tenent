import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3.adapter';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config({ path: '../../../../../.env' });

/**
 * Интеграционные тесты для S3StorageAdapter
 *
 * ВАЖНО: Эти тесты требуют реальное подключение к S3!
 * Убедитесь, что в .env файле указаны правильные credentials:
 * - AWS_S3_BUCKET
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_S3_ENDPOINT (для кастомных S3-совместимых хранилищ)
 *
 * Запуск: npm test -- s3.adapter.integration.spec.ts
 */
describe('S3StorageAdapter Integration Tests', () => {
  let adapter: S3StorageAdapter;
  let configService: ConfigService;
  let uploadedFileUrl: string;

  beforeAll(() => {
    // Проверяем наличие необходимых переменных окружения
    const requiredEnvVars = [
      'AWS_S3_BUCKET',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
    ];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Отсутствуют обязательные переменные окружения: ${missingVars.join(', ')}`,
      );
    }

    // Создаем настоящий ConfigService с переменными окружения
    configService = new ConfigService(process.env);
    adapter = new S3StorageAdapter(configService);
  });

  describe('Проверка подключения к S3', () => {
    it('должен успешно подключиться к S3 хранилищу', async () => {
      const isAvailable = await adapter.isAvailable();
      expect(isAvailable).toBe(true);
    }, 10000); // 10 секунд таймаут
  });

  describe('Загрузка файлов', () => {
    it('должен загрузить текстовый файл', async () => {
      const mockFile = {
        buffer: Buffer.from('Это тестовый файл для проверки S3 адаптера'),
        mimetype: 'text/plain',
        size: 87,
        originalname: 'test.txt',
      } as Express.Multer.File;

      const timestamp = Date.now();
      const fileName = `test-${timestamp}.txt`;

      const result = await adapter.upload(mockFile, 'test-uploads', fileName);

      expect(result).toBeDefined();
      expect(result.url).toContain('abai-bucket');
      expect(result.url).toContain('test-uploads');
      expect(result.pathname).toBe(`test-uploads/${fileName}`);
      expect(result.size).toBe(87);

      // Сохраняем URL для последующего удаления
      uploadedFileUrl = result.url;

      console.log('✅ Файл успешно загружен:', result.url);
    }, 15000);

    it('должен загрузить изображение', async () => {
      // Создаем простое изображение в виде буфера
      const mockImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const mockFile = {
        buffer: mockImageBuffer,
        mimetype: 'image/png',
        size: mockImageBuffer.length,
        originalname: 'test-image.png',
      } as Express.Multer.File;

      const timestamp = Date.now();
      const fileName = `test-image-${timestamp}.png`;

      const result = await adapter.upload(mockFile, 'test-uploads', fileName);

      expect(result).toBeDefined();
      expect(result.url).toContain('.png');
      expect(result.mimetype || mockFile.mimetype).toBe('image/png');

      console.log('✅ Изображение успешно загружено:', result.url);

      // Удаляем загруженный файл
      await adapter.delete(result.url);
    }, 15000);

    it('должен загрузить файл с кириллицей в категории', async () => {
      const mockFile = {
        buffer: Buffer.from('Тест с кириллицей'),
        mimetype: 'text/plain',
        size: 34,
        originalname: 'тест.txt',
      } as Express.Multer.File;

      const timestamp = Date.now();
      const fileName = `test-cyrillic-${timestamp}.txt`;

      const result = await adapter.upload(mockFile, 'avatars', fileName);

      expect(result).toBeDefined();
      expect(result.pathname).toContain('avatars');

      console.log('✅ Файл с кириллицей успешно загружен:', result.url);

      // Удаляем загруженный файл
      await adapter.delete(result.url);
    }, 15000);
  });

  describe('Удаление файлов', () => {
    it('должен удалить загруженный файл', async () => {
      // Сначала загружаем файл
      const mockFile = {
        buffer: Buffer.from('Файл для удаления'),
        mimetype: 'text/plain',
        size: 35,
        originalname: 'to-delete.txt',
      } as Express.Multer.File;

      const timestamp = Date.now();
      const fileName = `to-delete-${timestamp}.txt`;

      const uploadResult = await adapter.upload(mockFile, 'test-uploads', fileName);

      // Теперь удаляем
      await expect(adapter.delete(uploadResult.url)).resolves.not.toThrow();

      console.log('✅ Файл успешно удален:', uploadResult.url);
    }, 20000);

    it('не должен выбрасывать ошибку при удалении несуществующего файла', async () => {
      const fakeUrl = 'test-uploads/non-existent-file.txt';

      // S3 не выбрасывает ошибку при удалении несуществующего файла
      await expect(adapter.delete(fakeUrl)).resolves.not.toThrow();
    }, 10000);
  });

  describe('Работа с разными категориями', () => {
    it('должен загружать файлы в разные категории', async () => {
      const categories = ['avatars', 'documents', 'homework-submissions'];
      const uploadedFiles: string[] = [];

      for (const category of categories) {
        const mockFile = {
          buffer: Buffer.from(`Файл для категории ${category}`),
          mimetype: 'text/plain',
          size: 50,
          originalname: 'test.txt',
        } as Express.Multer.File;

        const timestamp = Date.now();
        const fileName = `test-${timestamp}.txt`;

        const result = await adapter.upload(mockFile, category, fileName);

        expect(result.pathname).toContain(category);
        uploadedFiles.push(result.url);

        console.log(`✅ Файл загружен в категорию "${category}":`, result.url);

        // Небольшая задержка между загрузками
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Удаляем все загруженные файлы
      for (const url of uploadedFiles) {
        await adapter.delete(url);
      }
    }, 30000);
  });

  afterAll(async () => {
    // Очищаем оставшиеся тестовые файлы
    if (uploadedFileUrl) {
      try {
        await adapter.delete(uploadedFileUrl);
        console.log('🧹 Очистка: удален файл', uploadedFileUrl);
      } catch (error) {
        console.warn('⚠️ Не удалось удалить файл при очистке:', error.message);
      }
    }
  });
});
