import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, AlertCircle, Plus, Minus } from 'lucide-react';
import { Task, CreateTaskData, UpdateTaskData, TaskPriority, TaskStatus, TaskCategory } from '../types/task';
import { teacherService } from '../services/teacherService';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  middlename?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData | UpdateTaskData) => Promise<void>;
  task?: Task | null;
  categories?: TaskCategory[];
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    assigneeId: undefined as number | undefined,
    dueDate: '',
    categoryId: undefined as number | undefined,
    tags: [] as string[],
    attachments: [] as string[]
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Загрузка пользователей при открытии формы
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (task) {
        populateFormFromTask(task);
      } else {
        resetForm();
      }
    }
  }, [isOpen, task]);

  const loadUsers = async () => {
    try {
      const availableUsers = await teacherService.getAvailableUsers();
      setUsers(availableUsers);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const populateFormFromTask = (taskData: Task) => {
    setFormData({
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority,
      status: taskData.status,
      assigneeId: taskData.assigneeId,
      dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '',
      categoryId: taskData.categoryId,
      tags: [...taskData.tags],
      attachments: [...taskData.attachments]
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      assigneeId: undefined,
      dueDate: '',
      categoryId: undefined,
      tags: [],
      attachments: []
    });
    setErrors({});
    setNewTag('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Дата выполнения не может быть в прошлом';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const taskData: CreateTaskData | UpdateTaskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        assigneeId: formData.assigneeId,
        dueDate: formData.dueDate || undefined,
        categoryId: formData.categoryId,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined
      };

      // Добавляем статус только при редактировании
      if (task) {
        (taskData as UpdateTaskData).status = formData.status;
      }

      await onSubmit(taskData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения задачи:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'text-gray-600';
      case TaskPriority.MEDIUM:
        return 'text-blue-600';
      case TaskPriority.HIGH:
        return 'text-orange-600';
      case TaskPriority.URGENT:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Низкий';
      case TaskPriority.MEDIUM:
        return 'Средний';
      case TaskPriority.HIGH:
        return 'Высокий';
      case TaskPriority.URGENT:
        return 'Срочный';
      default:
        return priority;
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'В ожидании';
      case TaskStatus.IN_PROGRESS:
        return 'В работе';
      case TaskStatus.COMPLETED:
        return 'Завершена';
      case TaskStatus.CANCELLED:
        return 'Отменена';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Редактировать задачу' : 'Новая задача'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Название задачи */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Введите название задачи"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Подробное описание задачи"
            />
          </div>

          {/* Приоритет и статус */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Приоритет
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={TaskPriority.LOW}>Низкий</option>
                <option value={TaskPriority.MEDIUM}>Средний</option>
                <option value={TaskPriority.HIGH}>Высокий</option>
                <option value={TaskPriority.URGENT}>Срочный</option>
              </select>
              <p className={`mt-1 text-sm ${getPriorityColor(formData.priority)}`}>
                {getPriorityText(formData.priority)}
              </p>
            </div>

            {/* Статус (только при редактировании) */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={TaskStatus.PENDING}>В ожидании</option>
                  <option value={TaskStatus.IN_PROGRESS}>В работе</option>
                  <option value={TaskStatus.COMPLETED}>Завершена</option>
                  <option value={TaskStatus.CANCELLED}>Отменена</option>
                </select>
                <p className="mt-1 text-sm text-gray-600">
                  {getStatusText(formData.status)}
                </p>
              </div>
            )}
          </div>

          {/* Ответственный и дата выполнения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Ответственный
              </label>
              <select
                value={formData.assigneeId || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  assigneeId: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Не назначен</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.surname}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата выполнения
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Категория */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Категория
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  categoryId: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Без категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="space-y-2">
              {/* Добавление нового тега */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Добавить тег"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Список тегов */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : (task ? 'Сохранить изменения' : 'Создать задачу')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
