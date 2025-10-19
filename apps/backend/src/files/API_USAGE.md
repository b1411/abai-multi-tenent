# API для загрузки файлов

Документация по использованию API загрузки файлов с фронтенда.

## 🌐 Endpoints

### 1. Загрузка одного файла

```
POST /files/upload
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'filename.jpg');
formData.append('category', 'avatars'); // опционально
```

**Категории:**
- `avatars` - аватарки пользователей
- `documents` - документы
- `homework` - домашние задания
- `materials` - учебные материалы
- `presentations` - презентации
- `videos` - видео
- `test` - тестовые файлы

**Response (201 Created):**
```json
{
  "id": 123,
  "name": "1760874307151-abc.jpg",
  "originalName": "photo.jpg",
  "url": "https://14f76c06-7503-4446-a00c-ece4879dd79e.srvstatic.kz/avatars/1760874307151-abc.jpg",
  "type": "image/jpeg",
  "size": 524288,
  "category": "avatars",
  "uploadedBy": "user-id",
  "createdAt": "2025-10-19T11:45:07.151Z",
  "updatedAt": "2025-10-19T11:45:07.151Z"
}
```

---

### 2. Загрузка нескольких файлов

```
POST /files/upload-multiple
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('files', file1, 'file1.pdf');
formData.append('files', file2, 'file2.pdf');
formData.append('category', 'documents');
```

**Response (201 Created):**
```json
[
  {
    "id": 123,
    "url": "https://..../file1.pdf",
    ...
  },
  {
    "id": 124,
    "url": "https://..../file2.pdf",
    ...
  }
]
```

---

### 3. Получить информацию о файле

```
GET /files/:id
```

**Response (200 OK):**
```json
{
  "id": 123,
  "name": "file.jpg",
  "url": "https://..../file.jpg",
  ...
}
```

---

### 4. Удалить файл

```
DELETE /files/:id
```

**Response (200 OK):**
```json
{
  "message": "Файл успешно удален"
}
```

Файл удаляется как из базы данных, так и из S3 хранилища.

---

## 💻 Примеры использования

### React / Next.js

```typescript
import { useState } from 'react';

interface UploadedFile {
  id: number;
  url: string;
  name: string;
}

export function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'avatars');

      const response = await fetch('http://localhost:8000/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`, // из localStorage/cookie
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result);

      console.log('File uploaded:', result.url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />

      {uploading && <p>Загрузка...</p>}

      {uploadedFile && (
        <div>
          <p>Файл загружен!</p>
          <img src={uploadedFile.url} alt="Uploaded" />
        </div>
      )}
    </div>
  );
}
```

---

### Vanilla JavaScript

```javascript
async function uploadFile(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'documents');

  try {
    const response = await fetch('http://localhost:8000/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Uploaded:', result.url);

    // Показываем превью
    document.getElementById('preview').src = result.url;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Использование
document.getElementById('fileInput').addEventListener('change', (e) => {
  uploadFile(e.target);
});
```

---

### Axios

```typescript
import axios from 'axios';

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'avatars');

  const response = await axios.post(
    'http://localhost:8000/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    }
  );

  return response.data;
};
```

---

### Vue.js

```vue
<template>
  <div>
    <input type="file" @change="handleFileUpload" />
    <div v-if="uploading">Загрузка...</div>
    <img v-if="uploadedUrl" :src="uploadedUrl" alt="Uploaded" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      uploading: false,
      uploadedUrl: null,
    };
  },
  methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'avatars');

      try {
        const response = await fetch('http://localhost:8000/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.$store.state.token}`,
          },
          body: formData,
        });

        const result = await response.json();
        this.uploadedUrl = result.url;
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        this.uploading = false;
      }
    },
  },
};
</script>
```

---

## 🧪 Тестирование

### 1. HTML тест (в браузере)

Открой файл `test-upload.html` в браузере:

```bash
# Открой в браузере:
apps/backend/src/files/test-upload.html
```

Или запусти через Live Server в VS Code.

### 2. Скрипт тестирования

```bash
# Запусти backend
npm run start:dev

# В другом терминале
npx tsx apps/backend/src/files/test-api-upload.ts
```

### 3. E2E тесты

```bash
npm test -- files.e2e.spec.ts
```

---

## ⚠️ Важные моменты

### Размер файлов

По умолчанию максимальный размер: **10 MB**

Для изменения настрой в `main.ts`:

```typescript
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

### CORS

Если фронтенд на другом домене, настрой CORS в `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
});
```

### Авторизация

Все endpoints требуют JWT токен в header:

```
Authorization: Bearer {token}
```

Для тестирования можно временно убрать `@UseGuards(AuthGuard)` из контроллера.

### Валидация типов файлов

Можно добавить в контроллер:

```typescript
@UseInterceptors(FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  },
}))
```

---

## 📦 Куда загружаются файлы

Файлы загружаются в **S3 хранилище** (srvstorage.kz) и доступны по публичным URL:

```
https://14f76c06-7503-4446-a00c-ece4879dd79e.srvstatic.kz/category/filename.jpg
```

### Fallback

Если S3 недоступен, файлы сохраняются локально:
```
/uploads/category/filename.jpg
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
→ Неправильный или отсутствующий JWT токен

### 413 Payload Too Large
→ Файл слишком большой, увеличь лимит в настройках

### 500 Internal Server Error
→ Проверь логи backend, возможно проблема с S3 credentials

### CORS Error
→ Настрой CORS в backend для твоего фронтенд домена

---

**Готово! API загрузки файлов полностью работает с S3 хранилищем! 🚀**
