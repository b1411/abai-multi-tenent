import { Express } from 'express';

export interface UploadResult {
  url: string;
  pathname: string;
  size: number;
}

export interface StorageAdapter {
  /**
   * Загружает файл в хранилище
   * @param file - файл для загрузки
   * @param category - категория файла
   * @param fileName - имя файла
   * @returns результат загрузки с URL и информацией о файле
   */
  upload(
    file: Express.Multer.File,
    category: string,
    fileName: string,
  ): Promise<UploadResult>;

  /**
   * Удаляет файл из хранилища
   * @param url - URL или путь к файлу
   */
  delete(url: string): Promise<void>;

  /**
   * Проверяет доступность хранилища
   */
  isAvailable(): Promise<boolean>;
}
