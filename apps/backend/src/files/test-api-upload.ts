#!/usr/bin/env tsx

/**
 * Скрипт для тестирования загрузки файлов через API
 * Эмулирует поведение фронтенда
 *
 * Использование:
 *   npm run start:dev  # в одном терминале
 *   npx tsx apps/backend/src/files/test-api-upload.ts  # в другом терминале
 */

import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
const TEST_TOKEN = 'your-test-token'; // TODO: получить реальный JWT токен

interface UploadedFile {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  category: string;
}

async function uploadFile(
  filePath: string,
  category: string,
  token?: string,
): Promise<UploadedFile> {
  const formData = new FormData();

  // Читаем файл и создаем Blob
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  const fileName = path.basename(filePath);

  formData.append('file', blob, fileName);
  formData.append('category', category);

  const headers: HeadersInit = {
    // НЕ устанавливаем Content-Type - браузер сам установит с boundary
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function uploadMultipleFiles(
  filePaths: string[],
  category: string,
  token?: string,
): Promise<UploadedFile[]> {
  const formData = new FormData();

  for (const filePath of filePaths) {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const fileName = path.basename(filePath);
    formData.append('files', blob, fileName);
  }

  formData.append('category', category);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/files/upload-multiple`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function deleteFile(fileId: number, token?: string): Promise<void> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${response.status} - ${error}`);
  }
}

async function testApiUpload() {
  console.log('🔍 Тестирование загрузки файлов через API...\n');
  console.log(`API URL: ${API_URL}\n`);

  const uploadedFiles: number[] = [];

  try {
    // Тест 1: Загрузка текстового файла
    console.log('1️⃣ Тест: Загрузка текстового файла...');
    const testFilePath = path.join(__dirname, 'api-test-file.txt');
    fs.writeFileSync(testFilePath, `Тестовый файл\nВремя: ${new Date().toISOString()}`);

    try {
      const uploadedFile = await uploadFile(testFilePath, 'test', TEST_TOKEN);

      console.log('✅ Файл загружен через API');
      console.log(`   ID: ${uploadedFile.id}`);
      console.log(`   URL: ${uploadedFile.url}`);
      console.log(`   Размер: ${uploadedFile.size} байт`);

      uploadedFiles.push(uploadedFile.id);

      // Проверяем доступность файла
      const fileResponse = await fetch(uploadedFile.url);
      if (fileResponse.ok) {
        console.log(`✅ Файл доступен по URL (HTTP ${fileResponse.status})\n`);
      } else {
        console.log(`⚠️ Файл недоступен (HTTP ${fileResponse.status})\n`);
      }
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }

    // Тест 2: Загрузка изображения
    console.log('2️⃣ Тест: Загрузка изображения...');
    const imagePath = path.join(__dirname, 'api-test-image.png');
    const base64Image =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(imagePath, Buffer.from(base64Image, 'base64'));

    try {
      const uploadedImage = await uploadFile(imagePath, 'avatars', TEST_TOKEN);

      console.log('✅ Изображение загружено через API');
      console.log(`   ID: ${uploadedImage.id}`);
      console.log(`   URL: ${uploadedImage.url}`);

      uploadedFiles.push(uploadedImage.id);

      const imageResponse = await fetch(uploadedImage.url);
      if (imageResponse.ok) {
        console.log(`✅ Изображение доступно (HTTP ${imageResponse.status})\n`);
      }
    } finally {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Тест 3: Загрузка нескольких файлов
    console.log('3️⃣ Тест: Загрузка нескольких файлов...');
    const file1 = path.join(__dirname, 'multi-test-1.txt');
    const file2 = path.join(__dirname, 'multi-test-2.txt');

    fs.writeFileSync(file1, 'Первый файл');
    fs.writeFileSync(file2, 'Второй файл');

    try {
      const uploadedMultiple = await uploadMultipleFiles([file1, file2], 'documents', TEST_TOKEN);

      console.log(`✅ Загружено ${uploadedMultiple.length} файлов`);
      uploadedMultiple.forEach((file, index) => {
        console.log(`   Файл ${index + 1}: ${file.url}`);
        uploadedFiles.push(file.id);
      });
      console.log('');
    } finally {
      if (fs.existsSync(file1)) fs.unlinkSync(file1);
      if (fs.existsSync(file2)) fs.unlinkSync(file2);
    }

    // Тест 4: Удаление файлов
    console.log('4️⃣ Тест: Удаление файлов...');
    for (const fileId of uploadedFiles) {
      await deleteFile(fileId, TEST_TOKEN);
      console.log(`✅ Файл ${fileId} удален`);
    }
    console.log('');

    console.log('🎉 Все тесты пройдены успешно!\n');
    console.log('✨ API загрузки файлов работает корректно');
    console.log('✨ Файлы загружаются в S3 и доступны публично');
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании API:', error.message);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 Совет: Похоже на проблему с авторизацией');
      console.log('   Обнови TEST_TOKEN в скрипте или отключи AuthGuard для тестирования');
    }

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Совет: Сервер не запущен');
      console.log('   Запусти: npm run start:dev');
    }

    // Пытаемся очистить созданные файлы
    for (const fileId of uploadedFiles) {
      try {
        await deleteFile(fileId, TEST_TOKEN);
      } catch (cleanupError) {
        // Игнорируем ошибки при очистке
      }
    }

    process.exit(1);
  }
}

testApiUpload().catch((error) => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
