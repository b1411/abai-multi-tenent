# Настройка S3 хранилища для srvstorage.kz

## Текущая конфигурация

Уже добавлено в `.env`:
```env
AWS_S3_BUCKET=abai-bucket
AWS_REGION=kz-1
AWS_ACCESS_KEY_ID=f3118678250e4306bedbb370f83e94d7
AWS_SECRET_ACCESS_KEY=09d6fb9bc3244d5382ef258930631462
AWS_S3_ENDPOINT=https://s3.kz-1.srvstorage.kz
AWS_S3_PUBLIC_URL=https://s3.kz-1.srvstorage.kz/abai-bucket
```

## ✅ Что уже работает

- ✅ Подключение к S3 хранилищу
- ✅ Загрузка файлов
- ✅ Удаление файлов
- ✅ Автоматический выбор S3 как основного хранилища

## ⚠️ Что нужно настроить

### Публичный доступ к файлам

Сейчас файлы загружаются успешно, но недоступны публично (HTTP 403).

**Нужно сделать в панели управления srvstorage.kz:**

1. Войдите в панель управления: https://panel.srvstorage.kz
2. Выберите bucket `abai-bucket`
3. Найдите настройки публичного доступа (Public Access / Access Control)
4. Включите публичный доступ для чтения файлов

**Альтернативный вариант - через Bucket Policy:**

Если srvstorage.kz поддерживает Bucket Policy, добавьте:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::abai-bucket/*"
    }
  ]
}
```

## Проверка работы

После настройки публичного доступа, запустите:

```bash
npx tsx apps/backend/src/files/storage/test-s3-connection.ts
```

Вы должны увидеть:
```
✅ Файл доступен по URL
   HTTP статус: 200
```

## Использование в приложении

После настройки публичного доступа, все файлы будут автоматически загружаться в S3:

```typescript
// В любом месте приложения
const file = await filesService.uploadFile(
  multerFile,
  'avatars',
  user
);

console.log(file.url);
// https://s3.kz-1.srvstorage.kz/abai-bucket/avatars/1760872212277-abc123.jpg
```

## Тестирование

### Unit тесты
```bash
npm test -- s3.adapter.spec.ts
```

### Integration тесты (требуют реальное подключение к S3)
```bash
npm test -- s3.adapter.integration.spec.ts
```

### Быстрая проверка подключения
```bash
npx tsx apps/backend/src/files/storage/test-s3-connection.ts
```

## Отладка

### Проблема: Файлы не загружаются

Проверьте логи приложения:
```bash
npm run start:dev
```

Должно быть:
```
[FilesService] Using storage adapter: S3StorageAdapter
```

### Проблема: Ошибка подключения

Проверьте:
- Правильность credentials (Access Key ID и Secret Key)
- Доступность endpoint: https://s3.kz-1.srvstorage.kz
- Существование bucket `abai-bucket`

### Проблема: HTTP 403 при доступе к файлам

Настройте публичный доступ в панели управления srvstorage.kz (см. выше)

## Переключение на другое хранилище

Если нужно вернуться к локальному хранилищу или Vercel Blob, просто удалите или закомментируйте переменные S3 в `.env`:

```env
# AWS_S3_BUCKET=abai-bucket
# AWS_REGION=kz-1
# ...
```

Система автоматически переключится на следующее доступное хранилище.
