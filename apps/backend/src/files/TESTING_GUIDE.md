# 🧪 Руководство по тестированию S3 хранилища

Все способы тестирования загрузки файлов в S3.

---

## 🚀 Быстрый старт

### 1. Запусти backend

```bash
npm run start:dev
```

Сервер запустится на `http://localhost:8000`

---

## 📋 Способы тестирования

### ⚡ 1. HTML тест (самый простой)

**Что:** Интерактивная веб-страница для загрузки файлов

**Как запустить:**
1. Открой файл в браузере:
   ```
   apps/backend/src/files/test-upload.html
   ```
2. Или через VS Code: ПКМ → Open with Live Server

**Что можно сделать:**
- ✅ Загрузить один файл
- ✅ Загрузить несколько файлов
- ✅ Выбрать категорию
- ✅ Увидеть превью изображений
- ✅ Проверить публичную доступность

**Результат:**
Увидишь загруженные файлы с публичными URL, можешь сразу открыть их в новой вкладке.

---

### 🔧 2. Тест S3 подключения

**Что:** Проверка базового подключения к S3

**Как запустить:**
```bash
npx tsx apps/backend/src/files/storage/test-s3-connection.ts
```

**Что проверяет:**
- ✅ Доступность bucket
- ✅ Загрузка файла в S3
- ✅ Публичная доступность (HTTP 200)
- ✅ Удаление файла из S3

**Ожидаемый результат:**
```
✅ Bucket доступен
✅ Файл загружен
✅ Файл доступен по URL (HTTP 200)
✅ Файл удален
🎉 Все тесты пройдены успешно!
```

---

### 🌐 3. Тест API через HTTP

**Что:** Эмуляция фронтенда через скрипт

**Как запустить:**
```bash
npx tsx apps/backend/src/files/test-api-upload.ts
```

**Что проверяет:**
- ✅ Загрузка одного файла через API
- ✅ Загрузка изображения
- ✅ Загрузка нескольких файлов
- ✅ Удаление файлов

**Требования:**
- Backend должен быть запущен
- Временно отключи AuthGuard или используй реальный JWT токен

---

### 🧪 4. E2E тесты (Jest)

**Что:** Автоматические тесты API

**Как запустить:**
```bash
npm test -- files.e2e.spec.ts
```

**Что проверяет:**
- ✅ POST /files/upload
- ✅ POST /files/upload-multiple
- ✅ GET /files/:id
- ✅ DELETE /files/:id
- ✅ Публичная доступность файлов

---

### 🔍 5. Проверка публичного доступа

**Что:** Специфичная проверка доступности файлов

**Как запустить:**
```bash
npx tsx apps/backend/src/files/storage/test-public-access.ts
```

**Что проверяет:**
- Пробует разные форматы URL
- Проверяет HTTP статус
- Читает содержимое файла

---

## 🎯 Рекомендуемая последовательность

### При первом запуске:

1. **Проверь S3 подключение:**
   ```bash
   npx tsx apps/backend/src/files/storage/test-s3-connection.ts
   ```
   Должно быть: все ✅

2. **Проверь публичный доступ:**
   ```bash
   npx tsx apps/backend/src/files/storage/test-public-access.ts
   ```
   Должно быть: HTTP 200

3. **Протестируй через HTML:**
   - Открой `test-upload.html`
   - Загрузи картинку
   - Увидишь превью → все работает!

### Для разработки:

**Используй HTML тест** - самый удобный для ручного тестирования

### Перед деплоем:

```bash
npm test -- files.e2e.spec.ts
```

Все тесты должны пройти ✅

---

## 🐛 Troubleshooting

### ❌ Bucket недоступен

**Проблема:** `S3 is not available`

**Решение:**
1. Проверь `.env` файл:
   ```env
   AWS_S3_BUCKET=abai-bucket
   AWS_REGION=kz-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_ENDPOINT=https://s3.kz-1.srvstorage.kz
   ```
2. Проверь credentials в панели srvstorage.kz
3. Убедись что bucket существует

---

### ❌ Access Denied при загрузке

**Проблема:** `AccessDenied: Access Denied`

**Решение:**
1. Зайди в панель srvstorage.kz
2. Проверь права Access Key:
   - ✅ s3:PutObject
   - ✅ s3:GetObject
   - ✅ s3:DeleteObject
   - ✅ s3:ListBucket

---

### ❌ HTTP 403 при доступе к файлу

**Проблема:** Файл загружен, но недоступен публично

**Решение:**
1. Зайди в панель srvstorage.kz
2. Bucket `abai-bucket` → Настройки
3. Включи "Публичный доступ на чтение"

**Проверка:**
```bash
npx tsx apps/backend/src/files/storage/test-public-access.ts
```

---

### ❌ 401 Unauthorized в API тестах

**Проблема:** API требует авторизацию

**Решение:**

**Вариант 1 - Получи реальный токен:**
```javascript
// В test-api-upload.ts
const TEST_TOKEN = 'твой-реальный-jwt-токен';
```

**Вариант 2 - Временно отключи guard:**
```typescript
// files.controller.ts
// @UseGuards(AuthGuard, RolesGuard)  // закомментируй
@Controller('files')
export class FilesController {
  // ...
}
```

⚠️ Не забудь вернуть guard после тестов!

---

### ❌ CORS Error в браузере

**Проблема:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Решение:**
```typescript
// main.ts
app.enableCors({
  origin: '*', // для тестов
  credentials: true,
});
```

Для продакшена укажи конкретные домены:
```typescript
origin: ['http://localhost:3000', 'https://yourdomain.com']
```

---

## 📊 Чек-лист готовности

Перед использованием в продакшене проверь:

- [ ] ✅ S3 подключение работает
- [ ] ✅ Файлы загружаются в S3
- [ ] ✅ Файлы доступны публично (HTTP 200)
- [ ] ✅ Файлы удаляются из S3
- [ ] ✅ API endpoints работают
- [ ] ✅ Авторизация включена
- [ ] ✅ CORS настроен для production
- [ ] ✅ Размер файлов ограничен
- [ ] ✅ Все E2E тесты проходят

---

## 🎓 Полезные команды

```bash
# Проверить, что backend запущен
curl http://localhost:8000/

# Проверить доступность файла
curl -I https://14f76c06-7503-4446-a00c-ece4879dd79e.srvstatic.kz/test/file.txt

# Посмотреть логи backend
npm run start:dev

# Запустить все тесты
npm test

# Запустить только E2E тесты файлов
npm test -- files.e2e.spec.ts
```

---

**Готово! Все инструменты для тестирования S3 хранилища под рукой! 🚀**
