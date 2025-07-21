import apiClient from './apiClient';

export interface FileUploadResponse {
  id: number;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export class FileService {
  private baseUrl = '/files';

  // Загрузить один файл
  async uploadFile(file: File, category: string = 'homework'): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return await apiClient.postFormData<FileUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  // Загрузить несколько файлов
  async uploadFiles(files: File[], category: string = 'homework'): Promise<FileUploadResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('category', category);

    return await apiClient.postFormData<FileUploadResponse[]>(`${this.baseUrl}/upload-multiple`, formData);
  }

  // Скачать файл
  async downloadFile(id: number, fileName?: string): Promise<void> {
    try {
      const blob = await apiClient.getBlob(`${this.baseUrl}/${id}/download`);

      // Создаем blob URL и скачиваем файл
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `file_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Получить информацию о файле
  async getFile(id: number): Promise<FileUploadResponse> {
    return await apiClient.get<FileUploadResponse>(`${this.baseUrl}/${id}`);
  }

  // Удалить файл
  async deleteFile(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const fileService = new FileService();
