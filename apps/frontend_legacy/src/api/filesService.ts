import apiClient from './client';
import { ContentType } from './Api';

export interface FileUploadResponse {
  id: number;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export const filesService = {
  // Загрузка одного файла
  async uploadFile(file: File, category: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await apiClient.request({
      path: '/files/upload',
      method: 'POST',
      body: formData,
      type: ContentType.FormData,
    });

    return response.data;
  },

  // Загрузка нескольких файлов
  async uploadFiles(files: File[], category: string): Promise<FileUploadResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('category', category);

    const response = await apiClient.request({
      path: '/files/upload-multiple',
      method: 'POST',
      body: formData,
      type: ContentType.FormData,
    });

    return response.data;
  },

  // Получение информации о файле
  async getFile(id: number): Promise<FileUploadResponse> {
    const response = await apiClient.request({
      path: `/files/${id}`,
      method: 'GET',
    });
    return response.data;
  },

  // Скачивание файла
  async downloadFile(id: number): Promise<Blob> {
    const response = await apiClient.request({
      path: `/files/download/${id}`,
      method: 'GET',
    });
    return response.data;
  },

  // Удаление файла
  async deleteFile(id: number): Promise<{ message: string }> {
    const response = await apiClient.request({
      path: `/files/${id}`,
      method: 'DELETE',
    });
    return response.data;
  },

  // Получение URL для скачивания
  getDownloadUrl(id: number): string {
    return `${apiClient.baseUrl}/files/download/${id}`;
  },
};
