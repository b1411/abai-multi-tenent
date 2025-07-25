import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { Button, Input, Select, Table, Modal, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { Lesson, LessonFilters, StudyPlan } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { studyPlanService } from '../services/studyPlanService';

const LessonsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  const [filters, setFilters] = useState<LessonFilters>({
    studyPlanId: searchParams.get('studyPlanId') ? parseInt(searchParams.get('studyPlanId')!) : undefined,
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'date',
    order: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadStudyPlans();
  }, []);

  useEffect(() => {
    loadLessons();
  }, [filters]);

  const loadStudyPlans = async () => {
    try {
      const response = await studyPlanService.getStudyPlans();
      // Преобразуем StudyPlan из studyPlan.ts в StudyPlan из lesson.ts
      const convertedPlans: StudyPlan[] = response.data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        teacherId: plan.teacherId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        teacher: plan.teacher,
        group: plan.group,
        lessons: plan.lessons?.map(lesson => ({
          id: lesson.id,
          name: lesson.name,
          date: lesson.date,
          studyPlanId: lesson.studyPlanId || 0,
          createdAt: lesson.createdAt || '',
          updatedAt: lesson.updatedAt || '',
          description: lesson.description
        })),
        _count: plan._count
      }));
      setStudyPlans(convertedPlans);
    } catch (error) {
      console.error('Ошибка загрузки учебных планов:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setLessonsLoading(true);
      const response = await lessonService.getLessons(filters);
      setLessons(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Ошибка загрузки уроков:', error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;

    try {
      setLoading(true);
      await lessonService.deleteLesson(deletingLesson.id);
      setDeletingLesson(null);
      loadLessons();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      setLoading(true);

      if (editingLesson) {
        await lessonService.updateLesson(editingLesson.id, formData);
        setEditingLesson(null);
      } else if (isCreating) {
        await lessonService.createLesson(formData);
        setIsCreating(false);
      }

      loadLessons();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<LessonFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const columns = [
    {
      key: 'name',
      title: 'Название',
      sortable: true,
      render: (value: string, record: Lesson) => (
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
          <div>
            <div className="font-medium text-gray-900">
              <button
                onClick={() => navigate(`/lessons/${record.id}`)}
                className="text-blue-600 hover:text-blue-800 hover:underline text-left"
              >
                {value}
              </button>
            </div>
            {record.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {record.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'studyPlan',
      title: 'Учебный план',
      render: (studyPlan: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {studyPlan?.name || 'Не указан'}
          </div>
          {studyPlan?.teacher?.user && (
            <div className="text-gray-500">
              {studyPlan.teacher.user.name} {studyPlan.teacher.user.surname}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'date',
      title: 'Дата и время',
      sortable: true,
      render: (date: string) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900">
              {formatDate(date)}
            </div>
            <div className="text-gray-500">
              {formatDateTime(date)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: '_count',
      title: 'Результаты',
      render: (count: any) => (
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          <span>{count?.LessonResult || 0}</span>
        </div>
      )
    },
    {
      key: 'materials',
      title: 'Материалы',
      render: (materials: any) => (
        <div className="text-sm">
          {materials ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Есть
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Нет
            </span>
          )}
        </div>
      )
    },
    {
      key: 'homework',
      title: 'Домашнее задание',
      render: (homework: any) => (
        <div className="text-sm">
          {homework ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {homework.name}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Нет
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Действия',
      render: (_: any, record: Lesson) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/lessons/${record.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {(hasRole('ADMIN') || (hasRole('TEACHER') && record.studyPlan?.teacher?.user?.id === user?.id)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(record)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {hasRole('ADMIN') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeletingLesson(record)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const sortOptions = [
    { value: 'name', label: 'По названию' },
    { value: 'date', label: 'По дате' },
    { value: 'createdAt', label: 'По дате создания' },
    { value: 'updatedAt', label: 'По дате изменения' }
  ];

  if (lessonsLoading && !lessons.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка уроков..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уроки</h1>
          <p className="text-gray-500 mt-1">
            Управление уроками и расписанием
          </p>
        </div>

        {(hasRole('ADMIN') || hasRole('TEACHER')) && (
          <Button
            variant="primary"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать урок
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <Input
              placeholder="Поиск по названию..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <Select
            placeholder="Учебный план"
            value={filters.studyPlanId?.toString() || 'all'}
            onChange={(value) => updateFilters({ studyPlanId: value === 'all' ? undefined : parseInt(value) })}
            options={[
              { value: 'all', label: 'Все планы' },
              ...studyPlans.map(plan => ({
                value: plan.id.toString(),
                label: plan.name
              }))
            ]}
          />

          <Input
            type="date"
            placeholder="Дата от"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
          />

          <Input
            type="date"
            placeholder="Дата до"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Select
              placeholder="Сортировка"
              value={filters.sortBy || 'date'}
              onChange={(value) => updateFilters({ sortBy: value as any })}
              options={sortOptions}
            />

            <Select
              placeholder="Порядок"
              value={filters.order || 'desc'}
              onChange={(value) => updateFilters({ order: value as any })}
              options={[
                { value: 'asc', label: 'По возрастанию' },
                { value: 'desc', label: 'По убыванию' }
              ]}
            />
          </div>

          <div className="text-sm text-gray-500">
            Найдено: {pagination.total} уроков
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table
          columns={columns}
          data={lessons}
          loading={lessonsLoading}
          sortBy={filters.sortBy}
          sortDirection={filters.order}
          onSort={(key, direction) => updateFilters({ sortBy: key as any, order: direction })}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Показано {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => changePage(pagination.page - 1)}
                >
                  Назад
                </Button>

                <span className="text-sm">
                  Страница {pagination.page} из {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => changePage(pagination.page + 1)}
                >
                  Далее
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(!!editingLesson || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingLesson ? 'Редактировать урок' : 'Создать урок'}
              </h3>
              
              <LessonForm
                isOpen={!!editingLesson || isCreating}
                onClose={() => {
                  setEditingLesson(null);
                  setIsCreating(false);
                }}
                onSave={handleSave}
                lesson={editingLesson}
                studyPlans={studyPlans}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        title="Подтверждение удаления"
        size="sm"
      >
        {deletingLesson && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Вы уверены, что хотите удалить урок "{deletingLesson.name}"?
            </p>
            <p className="text-sm text-gray-500">
              Это действие нельзя отменить.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeletingLesson(null)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={loading}
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Form Component
const LessonForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  lesson?: Lesson | null;
  studyPlans: StudyPlan[];
  loading: boolean;
}> = ({ onClose, onSave, lesson, studyPlans, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    studyPlanId: '',
    description: ''
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        name: lesson.name || '',
        date: lesson.date ? new Date(lesson.date).toISOString().slice(0, 16) : '',
        studyPlanId: lesson.studyPlanId?.toString() || '',
        description: lesson.description || ''
      });
    } else {
      setFormData({
        name: '',
        date: '',
        studyPlanId: '',
        description: ''
      });
    }
  }, [lesson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.studyPlanId) return;

    onSave({
      name: formData.name,
      date: new Date(formData.date).toISOString(),
      studyPlanId: parseInt(formData.studyPlanId),
      description: formData.description
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Введите название урока"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Дата и время *
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Учебный план *
        </label>
        <select
          value={formData.studyPlanId}
          onChange={(e) => setFormData({ ...formData, studyPlanId: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Выберите учебный план</option>
          {studyPlans.map(plan => (
            <option key={plan.id} value={plan.id.toString()}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Введите описание урока"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!formData.name || !formData.date || !formData.studyPlanId || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : (lesson ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </form>
  );
};

export default LessonsPage;
