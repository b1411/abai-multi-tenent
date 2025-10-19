# Storage Adapters

Система хранения файлов с поддержкой нескольких типов хранилищ: S3, Vercel Blob и локальное хранилище.

## Архитектура

Система использует паттерн Strategy для работы с разными типами хранилищ через единый интерфейс `StorageAdapter`.

### Приоритет адаптеров

1. **S3StorageAdapter** - основное облачное хранилище (рекомендуется для продакшена)
2. **VercelBlobAdapter** - альтернативное облачное хранилище для Vercel
3. **LocalStorageAdapter** - локальное хранилище (fallback)

Система автоматически выбирает первый доступный адаптер из списка.

## Конфигурация

### AWS S3

Добавьте следующие переменные окружения в `.env`:

```env
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_PUBLIC_URL=https://cdn.yourdomain.com  # опционально
```

#### Настройка S3 Bucket

1. Создайте bucket в AWS S3 или S3-совместимом хранилище (например, srvstorage.kz)

2. **Настройте публичный доступ для чтения файлов:**

   Для AWS S3:
   - Перейдите в настройки bucket → Permissions
   - Отключите "Block all public access"
   - Добавьте Bucket Policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

   Для S3-совместимых хранилищ (например, srvstorage.kz):
   - Настройки публичного доступа обычно находятся в панели управления хранилищем
   - Убедитесь, что bucket имеет публичный доступ на чтение

3. **Включите CORS** (если планируете загружать файлы из браузера):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### Vercel Blob

```env
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### Локальное хранилище

Не требует настройки. Файлы сохраняются в `./uploads/`

## Использование

### Загрузка файла

```typescript
const file = await filesService.uploadFile(
  multerFile,
  'avatars', // category
  user
);
```

### Удаление файла

```typescript
await filesService.remove(fileId);
```

## Добавление нового адаптера

1. Создайте класс, реализующий интерфейс `StorageAdapter`:

```typescript
import { StorageAdapter, UploadResult } from './storage.adapter';

export class MyStorageAdapter implements StorageAdapter {
  async upload(file, category, fileName): Promise<UploadResult> {
    // Реализация загрузки
  }

  async delete(url: string): Promise<void> {
    // Реализация удаления
  }

  async isAvailable(): Promise<boolean> {
    // Проверка доступности
  }
}
```

2. Добавьте адаптер в `FilesService`:

```typescript
this.storageAdapters = [
  new S3StorageAdapter(configService),
  new MyStorageAdapter(),
  new VercelBlobAdapter(),
  new LocalStorageAdapter(),
];
```

## Миграция с локального хранилища на S3

1. Настройте S3 bucket и добавьте переменные окружения
2. Перезапустите приложение
3. Новые файлы будут загружаться в S3
4. Для миграции существующих файлов используйте AWS CLI:

```bash
aws s3 sync ./uploads s3://your-bucket-name/
```

5. Обновите URL файлов в базе данных

## Troubleshooting

### Файлы не загружаются в S3

Проверьте:
- Правильность AWS credentials
- Права доступа к bucket
- Наличие переменных окружения
- Логи приложения для деталей ошибки

### Ошибка "Access Denied"

Убедитесь, что:
- IAM пользователь имеет права `s3:PutObject` и `s3:DeleteObject`
- Bucket policy разрешает публичное чтение

### Медленная загрузка

Рассмотрите использование:
- CloudFront CDN перед S3
- Transfer Acceleration для S3
- Оптимизацию размеров изображений
