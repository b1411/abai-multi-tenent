import apiClient from './apiClient';

export interface UploadedFile {
  id: number;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadResponse {
  id: number;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

class FileService {
  /**
   * Загрузить файл
   */
  async uploadFile(file: File, category: string = 'general'): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return await apiClient.postFormData<UploadedFile>('files/upload', formData);
  }

  /**
   * Загрузить несколько файлов
   */
  async uploadFiles(files: File[], category: string = 'general'): Promise<UploadedFile[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);

    return await apiClient.postFormData<UploadedFile[]>('files/upload-multiple', formData);
  }

  /**
   * Загрузить изображение для квиза
   */
  async uploadQuizImage(file: File): Promise<string> {
    try {
      const uploadedFile = await this.uploadFile(file, 'quiz-images');
      // Если это Vercel Blob URL - возвращаем как есть
      if (uploadedFile.url && uploadedFile.url.startsWith('https://')) {
        return uploadedFile.url;
      }
      // Иначе возвращаем публичный URL
      return this.getPublicImageUrl(uploadedFile.id);
    } catch (error) {
      console.error('Error uploading quiz image:', error);
      throw new Error('Ошибка при загрузке изображения');
    }
  }

  /**
   * Загрузить изображение для урока
   */
  async uploadLessonImage(file: File): Promise<string> {
    try {
      const uploadedFile = await this.uploadFile(file, 'lesson-images');
      // Если это Vercel Blob URL - возвращаем как есть
      if (uploadedFile.url && uploadedFile.url.startsWith('https://')) {
        return uploadedFile.url;
      }
      // Иначе возвращаем публичный URL
      return this.getPublicImageUrl(uploadedFile.id);
    } catch (error) {
      console.error('Error uploading lesson image:', error);
      throw new Error('Ошибка при загрузке изображения');
    }
  }

  /**
   * Получить информацию о файле
   */
  async getFile(id: number): Promise<UploadedFile> {
    return await apiClient.get<UploadedFile>(`files/${id}`);
  }

  /**
   * Удалить файл
   */
  async deleteFile(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`files/${id}`);
  }

  /**
   * Скачать файл
   */
  async downloadFile(id: number, filename?: string): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/files/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при скачивании файла');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `file_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Получить публичный URL для изображения
   */
  getPublicImageUrl(fileId: number): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}/public/files/${fileId}`;
  }

  /**
   * Получить URL для предварительного просмотра изображения
   */
  getImagePreviewUrl(url: string, width?: number, height?: number): string {
    if (!url) return '';

    // Если это Vercel Blob URL, возвращаем как есть
    if (url.includes('vercel-storage.com')) {
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());

      if (params.toString()) {
        return `${url}?${params.toString()}`;
      }
      return url;
    }

    // Если это ID файла из базы, формируем публичный URL
    if (/^\d+$/.test(url)) {
      return this.getPublicImageUrl(parseInt(url));
    }

    return url;
  }

  /**
   * Получить корректный URL для отображения изображения
   */
  getDisplayImageUrl(file: UploadedFile | { id: number; url: string }): string {
    // Если есть прямой Vercel Blob URL, используем его
    if (file.url && file.url.startsWith('https://')) {
      return file.url;
    }

    // Иначе используем публичный роут
    return this.getPublicImageUrl(file.id);
  }

  /**
   * Проверить, является ли файл изображением
   */
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Получить размер файла в читаемом формате
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Валидация файла перед загрузкой
   */
  validateFile(file: File, options?: {
    maxSize?: number; // в байтах
    allowedTypes?: string[];
  }): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes } = options || {}; // 10MB по умолчанию

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Файл слишком большой. Максимальный размер: ${this.formatFileSize(maxSize)}`
      };
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Создать превью изображения
   */
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file)) {
        reject(new Error('Файл не является изображением'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Ошибка при чтении файла'));
      };
      reader.readAsDataURL(file);
    });
  }
}

export const fileService = new FileService();
export default fileService;
