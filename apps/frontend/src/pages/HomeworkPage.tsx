import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBook, 
  FaUpload, 
  FaDownload, 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaComment,
  FaPaperclip,
  FaPlus,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaUser,
  FaUsers,
  FaStar
} from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';

interface Homework {
  id: string;
  subjectId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: {
    id: string;
    name: string;
    type: string;
    size: number;
  }[];
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade?: number;
  feedback?: string;
  submissionDate?: string;
  submission?: {
    files: {
      id: string;
      name: string;
      type: string;
      size: number;
    }[];
    comment?: string;
    submittedAt?: string;
  };
  teacherId: string;
  teacherName: string;
  classId: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  maxScore: number;
}

// Компонент для отображения статуса задания
const StatusBadge: React.FC<{ status: Homework['status'] }> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Ожидает выполнения';
      case 'submitted':
        return 'На проверке';
      case 'graded':
        return 'Проверено';
      case 'overdue':
        return 'Просрочено';
      default:
        return status;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
      {getStatusText()}
    </span>
  );
};

// Модальное окно для создания/редактирования задания
const HomeworkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Homework>) => void;
  initialData?: Partial<Homework>;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Homework>>(initialData || {
    title: '',
    description: '',
    dueDate: '',
    subjectId: '',
    classId: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-xs sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {initialData ? 'Редактировать задание' : 'Новое задание'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Предмет
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Выберите предмет</option>
                  <option value="math">Математика</option>
                  <option value="physics">Физика</option>
                  <option value="chemistry">Химия</option>
                  <option value="biology">Биология</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Класс
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Выберите класс</option>
                  <option value="10A">10A</option>
                  <option value="10B">10B</option>
                  <option value="11A">11A</option>
                  <option value="11B">11B</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Срок сдачи
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Прикрепить файлы
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Загрузить файлы</span>
                      <input type="file" className="sr-only" multiple />
                    </label>
                    <p className="pl-1">или перетащите их сюда</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF до 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Сохранить
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Добавим больше тестовых данных
const mockHomeworks: Homework[] = [
  {
    id: '1',
    subjectId: 'math',
    subject: 'Математика',
    title: 'Квадратные уравнения',
    description: 'Решить задачи 1-5 из учебника на странице 42. Обязательно показать полное решение с формулами.',
    dueDate: '2024-03-15T23:59:59',
    attachments: [
      {
        id: '1',
        name: 'Примеры_решения.pdf',
        type: 'application/pdf',
        size: 1024576
      }
    ],
    status: 'pending',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.М.',
    classId: '10A',
    createdAt: '2024-03-10T10:00:00',
    priority: 'high',
    estimatedTime: '45',
    maxScore: 10
  },
  {
    id: '2',
    subjectId: 'physics',
    subject: 'Физика',
    title: 'Законы Ньютона',
    description: 'Подготовить презентацию по трем законам Ньютона. Включить практические примеры из жизни.',
    dueDate: '2024-03-18T23:59:59',
    attachments: [
      {
        id: '2',
        name: 'Требования_к_презентации.docx',
        type: 'application/docx',
        size: 512000
      }
    ],
    status: 'submitted',
    teacherId: 'petrov',
    teacherName: 'Петров А.С.',
    classId: '10A',
    createdAt: '2024-03-08T11:30:00',
    priority: 'medium',
    estimatedTime: '90',
    maxScore: 15,
    submission: {
      files: [
        {
          id: 'sub1',
          name: 'Законы_Ньютона_Презентация.pptx',
          type: 'application/pptx',
          size: 2048576
        }
      ],
      comment: 'Презентация готова, добавил анимации для наглядности',
      submittedAt: '2024-03-15T14:30:00'
    }
  },
  {
    id: '3',
    subjectId: 'chemistry',
    subject: 'Химия',
    title: 'Периодическая система элементов',
    description: 'Выучить первые 20 элементов таблицы Менделеева, их свойства и применение.',
    dueDate: '2024-03-20T23:59:59',
    attachments: [
      {
        id: '3',
        name: 'Таблица_Менделеева.pdf',
        type: 'application/pdf',
        size: 2048576
      },
      {
        id: '4',
        name: 'Конспект_урока.pdf',
        type: 'application/pdf',
        size: 1048576
      }
    ],
    status: 'graded',
    grade: 5,
    feedback: 'Отличная работа! Особенно хорошо раскрыты практические применения элементов.',
    teacherId: 'smirnova',
    teacherName: 'Смирнова Е.В.',
    classId: '10A',
    createdAt: '2024-03-05T09:15:00',
    priority: 'medium',
    estimatedTime: '60',
    maxScore: 5
  }
];

// Обновленное модальное окно для просмотра задания
const HomeworkDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  homework: Homework;
  onSubmit?: (files: File[], comment: string) => void;
}> = ({ isOpen, onClose, homework, onSubmit }) => {
  const { user } = useAuth();
  const role = user?.role;
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const getTimeRemaining = () => {
    const now = new Date();
    const due = new Date(homework.dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Срок сдачи истек';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}д ${hours}ч ${minutes}м`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-xs sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{homework.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <FaBook className="mr-1" />
                {homework.subject}
              </span>
              <span className="flex items-center">
                <FaUser className="mr-1" />
                {homework.teacherName}
              </span>
              <span className="flex items-center">
                <FaUsers className="mr-1" />
                Класс {homework.classId}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Срок сдачи</div>
            <div className="font-medium text-blue-700">
              {new Date(homework.dueDate).toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Осталось: {getTimeRemaining()}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Приоритет</div>
            <div className="font-medium text-purple-700">
              {homework.priority === 'high' ? 'Высокий' :
               homework.priority === 'medium' ? 'Средний' : 'Низкий'}
            </div>
            <div className="text-sm text-purple-600 mt-1">
              Примерное время: {homework.estimatedTime} мин
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Статус</div>
            <StatusBadge status={homework.status} />
            <div className="text-sm text-green-600 mt-1">
              Макс. баллов: {homework.maxScore}
            </div>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <h4 className="text-lg font-medium mb-2">Описание задания</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            {homework.description}
          </div>
        </div>

        {homework.attachments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Материалы</h4>
            <div className="space-y-2">
              {homework.attachments.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FaPaperclip className="text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600">
                    <FaDownload className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(role === 'STUDENT' && homework.status === 'pending') && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium mb-4">Сдать задание</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий к работе
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Опишите выполненную работу..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Прикрепить файлы
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Загрузить файлы</span>
                        <input
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                      </label>
                      <p className="pl-1">или перетащите их сюда</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      До 10 файлов, максимум 50MB каждый
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onSubmit?.(files, comment)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Сдать задание
                </button>
              </div>
            </div>
          </div>
        )}

        {homework.submission && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium mb-4">Сданная работа</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  Сдано {new Date(homework.submission.submittedAt!).toLocaleString()}
                </div>
                {homework.submission.comment && (
                  <div className="mt-2">{homework.submission.comment}</div>
                )}
              </div>

              <div className="space-y-2">
                {homework.submission.files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <FaPaperclip className="text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button className="text-blue-500 hover:text-blue-600">
                      <FaDownload className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {homework.grade && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium mb-4">Оценка</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {homework.grade} из {homework.maxScore}
                  </div>
                  <div className="text-sm text-green-600">
                    {(homework.grade / homework.maxScore * 100).toFixed(0)}%
                  </div>
                </div>
                {homework.feedback && (
                  <div className="flex-1 ml-6">
                    <div className="text-sm text-gray-500 mb-1">Комментарий преподавателя</div>
                    <div>{homework.feedback}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    status: '',
    search: ''
  });

  // Функция фильтрации заданий в зависимости от роли
  const getFilteredHomeworks = () => {
    let filtered = [...mockHomeworks];

    // Фильтрация по роли
    switch (role) {
      case 'STUDENT':
        // Студент видит только свои задания
        filtered = filtered.filter(hw => hw.classId === '10A'); // В реальном приложении фильтруем по ID студента
        break;
      case 'PARENT':
        // Родитель видит задания своего ребенка
        filtered = filtered.filter(hw => hw.classId === '10A'); // В реальном приложении фильтруем по ID ребенка
        break;
      case 'TEACHER':
        // Учитель видит задания, которые он создал
        filtered = filtered.filter(hw => hw.teacherId === 'ivanova');
        break;
      case 'ADMIN':
        // Администратор видит все задания
        break;
    }

    // Применяем фильтры
    if (filters.subject) {
      filtered = filtered.filter(hw => hw.subjectId === filters.subject);
    }
    if (filters.status) {
      filtered = filtered.filter(hw => hw.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(hw =>
        hw.title.toLowerCase().includes(search) ||
        hw.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {role === 'STUDENT' ? 'Мои задания' :
           role === 'PARENT' ? 'Задания ребенка' :
           role === 'TEACHER' ? 'Управление заданиями' :
           'Все задания'}
        </h1>
        
        {(role === 'TEACHER' || role === 'ADMIN') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <FaPlus className="mr-2" />
            Новое задание
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <select
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-md"
        >
          <option value="">Все предметы</option>
          <option value="math">Математика</option>
          <option value="physics">Физика</option>
          <option value="chemistry">Химия</option>
          <option value="biology">Биология</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-md"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает выполнения</option>
          <option value="submitted">На проверке</option>
          <option value="graded">Проверено</option>
          <option value="overdue">Просрочено</option>
        </select>

        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Поиск по заданиям..."
            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-md"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Список заданий */}
      <div className="space-y-4">
        {getFilteredHomeworks().map(homework => (
          <div
            key={homework.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    {homework.subject}
                  </span>
                  <StatusBadge status={homework.status} />
                  {homework.priority === 'high' && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                      Важное
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium mb-2">{homework.title}</h3>
                <p className="text-gray-600 line-clamp-2 mb-4">{homework.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FaClock className="mr-1" />
                    Срок: {new Date(homework.dueDate).toLocaleDateString()}
                  </span>
                  {homework.grade && (
                    <span className="flex items-center text-green-600">
                      <FaStar className="mr-1" />
                      Оценка: {homework.grade}/{homework.maxScore}
                    </span>
                  )}
                  <span className="flex items-center">
                    <FaUser className="mr-1" />
                    {homework.teacherName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedHomework(homework)}
                className="px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-md ml-4"
              >
                Подробнее
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальные окна */}
      <AnimatePresence>
        {isModalOpen && (
          <HomeworkModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={(data) => {
              console.log('New homework:', data);
              setIsModalOpen(false);
            }}
          />
        )}
        {selectedHomework && (
          <HomeworkDetailsModal
            isOpen={true}
            onClose={() => setSelectedHomework(null)}
            homework={selectedHomework}
            onSubmit={(files, comment) => {
              console.log('Homework submission:', { files, comment });
              setSelectedHomework(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeworkPage;
