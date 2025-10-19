#!/usr/bin/env tsx

/**
 * Скрипт для быстрой проверки подключения к S3
 *
 * Использование:
 *   npx tsx apps/backend/src/files/storage/test-s3-connection.ts
 *
 * Этот скрипт:
 * 1. Проверяет доступность S3 bucket
 * 2. Загружает тестовый файл
 * 3. Проверяет доступность загруженного файла
 * 4. Удаляет тестовый файл
 */

import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3.adapter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env из корня проекта
const envPath = path.join(__dirname, '../../../../../.env');
dotenv.config({ path: envPath });

async function testS3Connection() {
  console.log('🔍 Проверка подключения к S3...\n');

  // Проверяем наличие переменных окружения
  const requiredEnvVars = {
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_PUBLIC_URL: process.env.AWS_S3_PUBLIC_URL,
  };

  console.log('📋 Конфигурация S3:');
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (key.includes('SECRET') || key.includes('KEY_ID')) {
      console.log(`   ${key}: ${value ? '***' + value.slice(-4) : '❌ не установлен'}`);
    } else {
      console.log(`   ${key}: ${value || '❌ не установлен'}`);
    }
  });
  console.log('');

  // Создаем адаптер
  const configService = new ConfigService(process.env);
  const adapter = new S3StorageAdapter(configService);

  try {
    // Тест 1: Проверка доступности
    console.log('1️⃣ Проверка доступности bucket...');
    const isAvailable = await adapter.isAvailable();
    if (!isAvailable) {
      console.error('❌ Bucket недоступен');
      return;
    }
    console.log('✅ Bucket доступен\n');

    // Тест 2: Загрузка файла
    console.log('2️⃣ Загрузка тестового файла...');
    const testContent = `Тестовый файл для проверки S3\nВремя: ${new Date().toISOString()}`;
    const mockFile = {
      buffer: Buffer.from(testContent),
      mimetype: 'text/plain',
      size: Buffer.byteLength(testContent),
      originalname: 'test-connection.txt',
    } as Express.Multer.File;

    const timestamp = Date.now();
    const fileName = `test-connection-${timestamp}.txt`;

    const uploadResult = await adapter.upload(mockFile, 'test', fileName);
    console.log('✅ Файл загружен');
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Путь: ${uploadResult.pathname}`);
    console.log(`   Размер: ${uploadResult.size} байт\n`);

    // Тест 3: Проверка доступности файла через HTTP
    console.log('3️⃣ Проверка доступности файла через HTTP...');
    try {
      const response = await fetch(uploadResult.url);
      if (response.ok) {
        const content = await response.text();
        console.log('✅ Файл доступен по URL');
        console.log(`   HTTP статус: ${response.status}`);
        console.log(`   Содержимое: ${content.substring(0, 50)}...\n`);
      } else {
        console.warn(`⚠️ Файл недоступен: HTTP ${response.status}\n`);
      }
    } catch (error) {
      console.warn(`⚠️ Ошибка при проверке HTTP доступности: ${error.message}\n`);
    }

    // Тест 4: Удаление файла
    console.log('4️⃣ Удаление тестового файла...');
    await adapter.delete(uploadResult.url);
    console.log('✅ Файл удален\n');

    console.log('🎉 Все тесты пройдены успешно!');
    console.log('\n✨ S3 хранилище настроено правильно и готово к использованию');

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании S3:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`\n📚 Stack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

// Запускаем тесты
testS3Connection().catch((error) => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
