#!/usr/bin/env tsx

/**
 * Тест публичного доступа к файлам в S3
 */

import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3.adapter';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

async function testPublicAccess() {
  console.log('🔍 Проверка публичного доступа к файлам в S3...\n');

  const configService = new ConfigService(process.env);
  const adapter = new S3StorageAdapter(configService);

  try {
    // Загружаем тестовый файл
    console.log('1️⃣ Загрузка тестового файла...');
    const testContent = `Тестовый файл для проверки публичного доступа\nВремя: ${new Date().toISOString()}`;
    const mockFile = {
      buffer: Buffer.from(testContent),
      mimetype: 'text/plain',
      size: Buffer.byteLength(testContent),
      originalname: 'test-public-access.txt',
    } as Express.Multer.File;

    const timestamp = Date.now();
    const fileName = `public-test-${timestamp}.txt`;

    const uploadResult = await adapter.upload(mockFile, 'test', fileName);
    console.log('✅ Файл загружен');
    console.log(`   URL: ${uploadResult.url}\n`);

    // Пробуем разные варианты URL
    const urlsToTest = [
      uploadResult.url,
      `https://s3.kz-1.srvstorage.kz/abai-bucket/test/${fileName}`,
      `https://abai-bucket.s3.kz-1.srvstorage.kz/test/${fileName}`,
    ];

    console.log('2️⃣ Проверка доступности по разным URL...\n');

    for (const url of urlsToTest) {
      console.log(`Проверяем: ${url}`);
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });

        console.log(`   HTTP статус: ${response.status}`);
        console.log(`   Status text: ${response.statusText}`);

        if (response.ok) {
          const content = await response.text();
          console.log(`   ✅ Файл доступен!`);
          console.log(`   Содержимое: ${content.substring(0, 50)}...`);
          console.log('');

          // Удаляем файл
          await adapter.delete(uploadResult.url);
          console.log('✅ Файл удален\n');

          console.log('🎉 Публичный доступ настроен правильно!');
          console.log(`✨ Используйте этот формат URL: ${url}`);
          return;
        } else {
          console.log(`   ❌ Ошибка доступа\n`);

          // Пробуем получить тело ошибки
          const errorText = await response.text();
          if (errorText) {
            console.log(`   Тело ответа: ${errorText.substring(0, 200)}\n`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Ошибка: ${error.message}\n`);
      }
    }

    console.log('\n⚠️ Ни один URL не доступен публично!');
    console.log('\n📋 Что нужно сделать в панели srvstorage.kz:\n');
    console.log('1. Зайди в настройки bucket "abai-bucket"');
    console.log('2. Найди раздел "Публичный доступ" или "ACL" или "Bucket Policy"');
    console.log('3. Включи публичное чтение файлов');
    console.log('4. Сохрани изменения\n');
    console.log('Подробная инструкция: apps/backend/src/files/storage/SRVSTORAGE_SETUP.md');

    // Не удаляем файл, чтобы можно было проверить вручную
    console.log(`\n💡 Попробуй открыть этот URL в браузере:`);
    console.log(uploadResult.url);

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.stack) {
      console.error(`\n📚 Stack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

testPublicAccess().catch((error) => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
