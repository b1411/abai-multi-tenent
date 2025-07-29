import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { fileService } from '../services/fileService';

interface FileUploadProps {
  onFileUpload: (content: string, fileName: string, fileId?: number) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // в MB
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onError,
  acceptedTypes = ['.doc', '.docx', '.pdf', '.txt'],
  maxSize = 10,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Проверка размера
    if (file.size > maxSize * 1024 * 1024) {
      return `Файл слишком большой. Максимальный размер: ${maxSize}MB`;
    }

    // Проверка типа файла
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Неподдерживаемый тип файла. Допустимы: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFileToServer = async (file: File): Promise<{ id: number; content: string }> => {
    // Используем существующий fileService с категорией 'document'
    const uploadedFile = await fileService.uploadFile(file, 'document');
    
    // Генерируем содержимое для предварительного просмотра
    let content = '';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Для текстовых файлов читаем содержимое
      content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsText(file);
      });
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      content = `[PDF файл: ${file.name}]\n\nФайл загружен на сервер и будет обработан автоматически.`;
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      content = `[Word документ: ${file.name}]\n\nФайл загружен на сервер и будет обработан автоматически.`;
    } else {
      content = `[Файл: ${file.name}]\n\nФайл загружен на сервер.`;
    }

    return {
      id: uploadedFile.id,
      content,
    };
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setIsUploading(true);
    try {
      const { id, content } = await uploadFileToServer(file);
      setUploadedFile({ name: file.name, size: file.size });
      onFileUpload(content, file.name, id); // Передаем ID файла
    } catch (error) {
      onError('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    onFileUpload('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : uploadedFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Обработка файла...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-600 mb-2" />
            <p className="text-green-600 font-medium mb-1">Файл загружен</p>
            <div className="flex items-center gap-2 bg-white rounded px-3 py-2 border">
              <File className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{uploadedFile.name}</span>
              <span className="text-xs text-gray-500">({formatFileSize(uploadedFile.size)})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Нажмите для замены файла</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Загрузите документ
            </h3>
            <p className="text-gray-600 mb-4">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
              <span className="bg-white px-2 py-1 rounded border">Word (.doc, .docx)</span>
              <span className="bg-white px-2 py-1 rounded border">PDF (.pdf)</span>
              <span className="bg-white px-2 py-1 rounded border">Текст (.txt)</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Максимальный размер: {maxSize}MB
            </p>
          </div>
        )}

        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
            <div className="text-blue-600 font-medium">
              Отпустите для загрузки файла
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
