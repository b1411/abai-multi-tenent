import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, BookOpen, Upload, Trash2, Image, FileImage } from 'lucide-react';
import { Homework, CreateHomeworkRequest, UpdateHomeworkRequest } from '../types/homework';
import { Lesson } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { fileService, FileUploadResponse } from '../services/fileService';

interface HomeworkFormProps {
  homework?: Homework;
  onSave: (data: CreateHomeworkRequest | UpdateHomeworkRequest) => void;
  onClose: () => void;
  loading?: boolean;
}

const HomeworkForm: React.FC<HomeworkFormProps> = ({
  homework,
  onSave,
  onClose,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: homework?.name || '',
    description: homework?.materials?.lecture || '',
    deadline: homework?.deadline ? new Date(homework.deadline).toISOString().slice(0, 16) : '',
    lessonId: homework?.lesson?.id || undefined
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonSearchQuery, setLessonSearchQuery] = useState(homework?.lesson?.name || '');
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    // Инициализируем selectedLesson если редактируем существующее ДЗ
    if (homework?.lesson) {
      setSelectedLesson({
        id: homework.lesson.id,
        name: homework.lesson.name,
        date: homework.lesson.date,
        studyPlan: homework.lesson.studyPlan
      } as Lesson);
    }
  }, [homework]);

  useEffect(() => {
    if (lessonSearchQuery.length > 0) {
      const debounceTimer = setTimeout(() => {
        loadLessons(lessonSearchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      loadLessons();
    }
  }, [lessonSearchQuery]);

  const loadLessons = async (searchQuery: string = '') => {
    try {
      setLoadingLessons(true);
      const response = await lessonService.getLessons({
        search: searchQuery,
        limit: 20,
        page: 1
      });
      setLessons(response.data);
    } catch (error) {
      console.error('Ошибка загрузки уроков:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData(prev => ({ ...prev, lessonId: lesson.id }));
    setLessonSearchQuery(lesson.name);
    setShowLessonDropdown(false);
  };

  const handleLessonInputChange = (value: string) => {
    setLessonSearchQuery(value);
    setShowLessonDropdown(true);
    if (!value) {
      setSelectedLesson(null);
      setFormData(prev => ({ ...prev, lessonId: undefined }));
    } else if (selectedLesson && value !== selectedLesson.name) {
      // Если пользователь вводит текст, отличный от выбранного урока, сбрасываем выбор
      setSelectedLesson(null);
      setFormData(prev => ({ ...prev, lessonId: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.deadline) return;

    // Сначала загружаем файлы, если они есть
    let additionalFileIds: number[] = [];
    if (additionalFiles.length > 0) {
      try {
        setUploadingFiles(true);
        const uploadPromises = additionalFiles.map(file => 
          fileService.uploadFile(file, 'homework')
        );
        const uploadResults = await Promise.all(uploadPromises);
        additionalFileIds = uploadResults.map(result => result.id);
        setUploadedFiles(uploadResults);
      } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
        alert('Ошибка загрузки файлов. Попробуйте еще раз.');
        return;
      } finally {
        setUploadingFiles(false);
      }
    }

    // Создаем домашнее задание с ID загруженных файлов
    onSave({
      name: formData.name,
      description: formData.description,
      deadline: new Date(formData.deadline).toISOString(),
      lessonId: formData.lessonId,
      additionalFileIds: additionalFileIds.length > 0 ? additionalFileIds : undefined
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalFiles(prev => [...prev, ...files]);
    // Очищаем input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '');
    
    if (isImage) {
      return <FileImage className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const isImageFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '');
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {homework ? 'Редактировать задание' : 'Создать домашнее задание'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название задания *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название домашнего задания"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание задания
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Введите описание домашнего задания"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Опишите задание для студентов - что им нужно сделать
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Урок
            </label>
            <div className="relative">
              <input
                type="text"
                value={lessonSearchQuery}
                onChange={(e) => handleLessonInputChange(e.target.value)}
                onFocus={() => setShowLessonDropdown(true)}
                onBlur={() => {
                  // Не закрываем dropdown сразу, чтобы дать время на клик по элементу
                  setTimeout(() => {
                    // Проверяем, не находится ли фокус на элементе списка
                    const activeElement = document.activeElement;
                    const dropdown = document.querySelector('[data-lesson-dropdown]');
                    if (!dropdown?.contains(activeElement)) {
                      setShowLessonDropdown(false);
                    }
                  }, 150);
                }}
                placeholder="Поиск урока..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              
              {showLessonDropdown && (
                <div 
                  data-lesson-dropdown
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {loadingLessons ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                        Поиск уроков...
                      </div>
                    </div>
                  ) : lessons.length > 0 ? (
                    lessons.map(lesson => (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        onMouseDown={(e) => e.preventDefault()} // Предотвращаем потерю фокуса
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        tabIndex={0} // Делаем элемент фокусируемым
                      >
                        <div className="font-medium text-sm text-gray-900">{lesson.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(lesson.date).toLocaleDateString()} 
                          {lesson.studyPlan && ` • ${lesson.studyPlan.name}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {lessonSearchQuery ? 'Уроки не найдены' : 'Введите название урока для поиска'}
                    </div>
                  )}
                  
                  {selectedLesson && (
                    <div 
                      onClick={() => {
                        setSelectedLesson(null);
                        setFormData(prev => ({ ...prev, lessonId: undefined }));
                        setLessonSearchQuery('');
                        setShowLessonDropdown(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="px-3 py-2 hover:bg-red-50 cursor-pointer border-t border-gray-200 text-red-600 text-sm"
                      tabIndex={0}
                    >
                      Убрать привязку к уроку
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Введите название урока для поиска и выберите из списка
            </p>
            {selectedLesson && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <span className="text-blue-800 font-medium">Выбран урок:</span> {selectedLesson.name}
                <span className="text-blue-600 ml-2">({new Date(selectedLesson.date).toLocaleDateString()})</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дополнительные файлы
            </label>
            <div className="border border-gray-300 rounded-md p-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Нажмите для загрузки</span> или перетащите файлы
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, JPG, PNG, GIF до 10MB</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                    disabled={loading}
                  />
                </label>
              </div>
              
              {additionalFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Загруженные файлы:</h4>
                  {additionalFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center">
                        {isImageFile(file) ? (
                          <div className="flex items-center">
                            <img 
                              src={getImagePreview(file)} 
                              alt={file.name}
                              className="h-10 w-10 object-cover rounded mr-3"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)} • Изображение</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            {getFileIcon(file)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Добавьте дополнительные материалы к заданию (инструкции, шаблоны, примеры)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Срок сдачи *
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
                min={new Date().toISOString().slice(0, 16)}
              />
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Выберите дату и время до которого студенты должны сдать задание
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.deadline || loading || uploadingFiles}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center"
            >
              {uploadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Загрузка файлов...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {homework ? 'Обновить' : 'Создать'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkForm;
