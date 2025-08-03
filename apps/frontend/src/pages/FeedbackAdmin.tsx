import React, { useState, useEffect } from 'react';
import { feedbackService, FeedbackTemplate } from '../services/feedbackService';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { useToastContext } from '../hooks/useToastContext';

const FeedbackAdmin: React.FC = () => {
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FeedbackTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, statsData] = await Promise.all([
        feedbackService.getAllTemplates(),
        feedbackService.getAnalytics(),
      ]);
      setTemplates(templatesData);
      setStatistics(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await feedbackService.toggleTemplateActive(id);
      await loadData();
      toast.success('Статус шаблона изменен');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при изменении статуса шаблона');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;

    try {
      await feedbackService.deleteTemplate(id);
      await loadData();
      toast.success('Шаблон успешно удален');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при удалении шаблона');
    }
  };

  const handleCreateDefaultTemplates = async () => {
    try {
      await feedbackService.createDefaultTemplates();
      await loadData();
      toast.success('Стандартные шаблоны созданы');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при создании стандартных шаблонов');
    }
  };

  const handleEditTemplate = (template: FeedbackTemplate) => {
    setEditingTemplate(template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Управление обратной связью
          </h1>
          <p className="text-gray-600 mt-1">
            Настройка шаблонов форм и управление опросами
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Создать шаблон
          </button>
          <button
            onClick={handleCreateDefaultTemplates}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Добавить стандартные
          </button>
        </div>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* Статистика */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Всего ответов</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {statistics.totalResponses}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Процент заполнения</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {statistics.completionRate || 0}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Активных шаблонов</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {templates.filter(t => t.isActive).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">По ролям</h3>
            <div className="mt-2 space-y-1">
              {Object.entries(statistics.byRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between text-sm">
                  <span>{role}:</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Список шаблонов */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Шаблоны форм</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Частота
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Приоритет
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {template.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {template.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${template.priority > 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {template.priority > 0 ? 'Обязательный' : 'Опциональный'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {template.isActive ? 'Активный' : 'Неактивный'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Просмотр
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleToggleActive(template.id)}
                        className={`${template.isActive
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                          }`}
                      >
                        {template.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно просмотра шаблона */}
      {selectedTemplate && (
        <TemplateViewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {/* Модальное окно создания шаблона */}
      {showCreateForm && (
        <CreateTemplateModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadData();
          }}
        />
      )}

      {/* Модальное окно редактирования шаблона */}
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Компонент для просмотра шаблона
const TemplateViewModal: React.FC<{
  template: FeedbackTemplate;
  onClose: () => void;
}> = ({ template, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
          <p className="text-gray-600 mt-2">{template.description}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500">Роль:</span>
              <p className="text-sm text-gray-900">{template.role}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Частота:</span>
              <p className="text-sm text-gray-900">{template.frequency}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Приоритет:</span>
              <p className="text-sm text-gray-900">{template.priority}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Статус:</span>
              <p className="text-sm text-gray-900">
                {template.isActive ? 'Активный' : 'Неактивный'}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Вопросы</h3>
          <div className="space-y-4">
            {template.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                      <span>Тип: {question.type}</span>
                      <span>Категория: {question.category}</span>
                      {question.required !== false && (
                        <span className="text-red-500">Обязательный</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент для создания шаблона
const CreateTemplateModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const toast = useToastContext();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    role: 'STUDENT',
    frequency: 'MONTHLY',
    priority: 1,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Создаем простой шаблон с базовыми вопросами
      const templateData = {
        ...formData,
        questions: [
          {
            id: 'satisfaction',
            question: 'Насколько вы удовлетворены?',
            type: 'RATING_1_5' as const,
            category: 'general',
            required: true
          }
        ]
      };

      await feedbackService.createTemplate(templateData);
      onSuccess();
      toast.success('Шаблон успешно создан');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании шаблона');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Создать шаблон</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Заголовок
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="STUDENT">Студент</option>
                <option value="TEACHER">Преподаватель</option>
                <option value="HR">Сотрудник</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Частота
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="WEEKLY">Еженедельно</option>
                <option value="MONTHLY">Ежемесячно</option>
                <option value="QUARTERLY">Ежеквартально</option>
                <option value="SEMESTER">Каждый семестр</option>
                <option value="YEARLY">Ежегодно</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Приоритет (0 = опциональный, &gt;0 = обязательный)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              min="0"
              max="10"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Активный
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент для редактирования шаблона
const EditTemplateModal: React.FC<{
  template: FeedbackTemplate;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ template, onClose, onSuccess }) => {
  const toast = useToastContext();
  const [formData, setFormData] = useState({
    name: template.name,
    title: template.title,
    description: template.description || '',
    role: template.role,
    frequency: template.frequency,
    priority: template.priority,
    isActive: template.isActive,
  });
  const [questions, setQuestions] = useState(template.questions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const templateData = {
        ...formData,
        questions,
      };

      await feedbackService.updateTemplate(template.id, templateData);
      onSuccess();
      toast.success('Шаблон успешно обновлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении шаблона');
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      question: '',
      type: 'RATING_1_5' as const,
      category: 'general',
      required: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Редактировать шаблон</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Заголовок
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="STUDENT">Студент</option>
                <option value="TEACHER">Преподаватель</option>
                <option value="HR">Сотрудник</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Частота
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="WEEKLY">Еженедельно</option>
                <option value="MONTHLY">Ежемесячно</option>
                <option value="QUARTERLY">Ежеквартально</option>
                <option value="SEMESTER">Каждый семестр</option>
                <option value="YEARLY">Ежегодно</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Приоритет
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Активный
            </label>
          </div>

          {/* Вопросы */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Вопросы</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Добавить вопрос
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Вопрос {index + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Текст вопроса
                      </label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Тип вопроса
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="RATING_1_5">Рейтинг 1-5</option>
                        <option value="RATING_1_10">Рейтинг 1-10</option>
                        <option value="YES_NO">Да/Нет</option>
                        <option value="TEXT">Текст</option>
                        <option value="EMOTIONAL_SCALE">Эмоциональная шкала</option>
                        <option value="TEACHER_RATING">Оценка преподавателей</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Категория
                      </label>
                      <select
                        value={question.category}
                        onChange={(e) => handleQuestionChange(index, 'category', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="general">Общее</option>
                        <option value="teaching">Преподавание</option>
                        <option value="content">Содержание</option>
                        <option value="workload">Рабочая нагрузка</option>
                        <option value="satisfaction">Удовлетворенность</option>
                        <option value="environment">Рабочая среда</option>
                        <option value="development">Развитие</option>
                        <option value="balance">Баланс</option>
                        <option value="support">Поддержка</option>
                        <option value="loyalty">Лояльность</option>
                        <option value="retention">Удержание</option>
                        <option value="feedback">Обратная связь</option>
                        <option value="quality">Качество</option>
                        <option value="motivation">Мотивация</option>
                        <option value="communication">Коммуникация</option>
                        <option value="management">Управление</option>
                        <option value="resources">Ресурсы</option>
                        <option value="innovation">Инновации</option>
                        <option value="culture">Культура</option>
                        <option value="performance">Производительность</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={question.required !== false}
                        onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Обязательный
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackAdmin;
