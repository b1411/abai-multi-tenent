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
import { Lesson, LessonFilters, StudyPlan, LessonType } from '../types/lesson';
import { lessonService } from '../services/lessonService';
import { studyPlanService } from '../services/studyPlanService';
import { getLessonTypeLabel, getLessonTypeColor, getLessonTypeOptions } from '../utils/lessonTypeUtils';

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
      // Используем разные методы в зависимости от роли
      const response = hasRole('STUDENT')
        ? await studyPlanService.getMyStudyPlans()
        : await studyPlanService.getStudyPlans();
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
          type: (lesson as any).type || LessonType.REGULAR,
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
      // Используем разные методы в зависимости от роли
      const response = hasRole('STUDENT')
        ? await lessonService.getMyLessons(filters)
        : await lessonService.getLessons(filters);
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
      key: 'type',
      title: 'Тип урока',
      render: (type: LessonType) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLessonTypeColor(type)}`}>
          {getLessonTypeLabel(type)}
        </span>
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
    <div className="p-4 min-h-screen bg-gray-50" style={{fontSize: '16px'}}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Уроки</h1>
            <p className="text-gray-500 mt-2 text-base md:text-lg">
              Управление уроками и расписанием
            </p>
          </div>

          {(hasRole('ADMIN') || hasRole('TEACHER')) && (
            <div className="flex-shrink-0">
              <Button
                variant="primary"
                onClick={() => setIsCreating(true)}
                className="w-full md:w-auto min-h-[48px] text-base font-medium shadow-sm px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Создать урок</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Поиск по названию..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              icon={<Search className="h-5 w-5" />}
              className="text-base min-h-[48px] px-4 py-3"
            />
          </div>

          {/* Filters Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              placeholder="Тип урока"
              value={filters.type || 'all'}
              onChange={(value) => updateFilters({ type: value === 'all' ? undefined : value as LessonType })}
              options={[
                { value: 'all', label: 'Все типы' },
                ...getLessonTypeOptions()
              ]}
              className="text-base min-h-[48px]"
            />

            <Select
              placeholder="Учебный план"
              value={filters.studyPlanId?.toString() || 'all'}
              onChange={(value) => updateFilters({ studyPlanId: value === 'all' ? undefined : parseInt(value) })}
              options={[
                { value: 'all', label: 'Все планы' },
                ...studyPlans.map(plan => ({
                  value: plan.id.toString(),
                  label: plan.name.length > 30 ? `${plan.name.substring(0, 30)}...` : plan.name
                }))
              ]}
              className="text-base min-h-[48px]"
            />
          </div>

          {/* Filters Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              placeholder="Дата от"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
              className="text-base min-h-[48px] px-4 py-3"
            />

            <Input
              type="date"
              placeholder="Дата до"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
              className="text-base min-h-[48px] px-4 py-3"
            />
          </div>

          {/* Sort and Stats */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pt-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <Select
                placeholder="Сортировка"
                value={filters.sortBy || 'date'}
                onChange={(value) => updateFilters({ sortBy: value as any })}
                options={sortOptions}
                className="text-base min-h-[48px]"
              />

              <Select
                placeholder="Порядок"
                value={filters.order || 'desc'}
                onChange={(value) => updateFilters({ order: value as any })}
                options={[
                  { value: 'asc', label: 'По возрастанию' },
                  { value: 'desc', label: 'По убыванию' }
                ]}
                className="text-base min-h-[48px]"
              />
            </div>

            <div className="text-base text-gray-500 text-center md:text-right px-3 py-2 rounded bg-gray-50">
              Найдено: <span className="font-medium">{pagination.total}</span> уроков
            </div>
          </div>
        </div>
      </div>

      {/* Table/Cards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Desktop Table View - Only show on very large screens */}
        <div className="hidden xl:block">
          <Table
            columns={columns}
            data={lessons}
            loading={lessonsLoading}
            sortBy={filters.sortBy}
            sortDirection={filters.order}
            onSort={(key, direction) => updateFilters({ sortBy: key as any, order: direction })}
          />
        </div>

        {/* Mobile Card View - Show on all screens up to xl */}
        <div className="xl:hidden">
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Загрузка уроков..." />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">Уроки не найдены</h3>
              <p className="text-base text-gray-500">Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-4 hover:bg-gray-50 transition-colors duration-150" style={{minHeight: '120px'}}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-lg leading-tight block w-full text-left min-h-[48px] flex items-center transition-colors duration-150"
                          style={{fontSize: '18px', lineHeight: '1.4'}}
                        >
                          <span className="truncate">{lesson.name}</span>
                        </button>
                        
                        <div className="flex items-center mt-2 text-sm text-gray-500" style={{fontSize: '14px'}}>
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{formatDate(lesson.date)}</span>
                          <span className="mx-2">•</span>
                          <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>{formatDateTime(lesson.date).split(' ')[1]}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-3">
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-3 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {(hasRole('ADMIN') || (hasRole('TEACHER') && lesson.studyPlan?.teacher?.user?.id === user?.id)) && (
                          <button
                            onClick={() => handleEdit(lesson)}
                            className="text-gray-600 hover:text-gray-800 p-3 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}

                        {hasRole('ADMIN') && (
                          <button
                            onClick={() => setDeletingLesson(lesson)}
                            className="text-red-600 hover:text-red-800 p-3 rounded-lg transition-colors bg-red-50 hover:bg-red-100 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {lesson.description && (
                      <p className="text-sm text-gray-600 leading-relaxed px-1" style={{fontSize: '14px', lineHeight: '1.5'}}>{lesson.description}</p>
                    )}

                    {/* Info */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600" style={{fontSize: '14px'}}>
                        <BookOpen className="w-4 h-4 mr-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate font-medium">{lesson.studyPlan?.name || 'Не указан'}</span>
                      </div>

                      {lesson.studyPlan?.teacher?.user && (
                        <div className="flex items-center text-sm text-gray-500 ml-7" style={{fontSize: '14px'}}>
                          <span className="truncate">
                            {lesson.studyPlan.teacher.user.name} {lesson.studyPlan.teacher.user.surname}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLessonTypeColor(lesson.type)}`} style={{fontSize: '13px'}}>
                        {getLessonTypeLabel(lesson.type)}
                      </span>

                      <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600" style={{fontSize: '13px'}}>{lesson._count?.LessonResult || 0}</span>
                      </div>

                      {lesson.materials && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700" style={{fontSize: '13px'}}>
                          Материалы
                        </span>
                      )}

                      {lesson.homework && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700" style={{fontSize: '13px'}}>
                          ДЗ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="text-sm text-gray-500 text-center md:text-left order-2 md:order-1" style={{fontSize: '14px'}}>
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                <span> из </span>
                <span className="font-medium">{pagination.total}</span>
                <span> записей</span>
              </div>

              <div className="flex items-center justify-center space-x-3 order-1 md:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => changePage(pagination.page - 1)}
                  className="text-base px-4 py-3 min-h-[48px] touch-manipulation"
                >
                  Назад
                </Button>

                <span className="text-base font-medium px-4 py-3 bg-white border border-gray-300 rounded-md min-h-[48px] flex items-center" style={{fontSize: '16px'}}>
                  {pagination.page} из {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => changePage(pagination.page + 1)}
                  className="text-base px-4 py-3 min-h-[48px] touch-manipulation"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-slide-up sm:animate-none">
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {editingLesson ? 'Редактировать урок' : 'Создать урок'}
                </h3>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setIsCreating(false);
                  }}
                  className="sm:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
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
    type: LessonType.REGULAR,
    date: '',
    studyPlanId: '',
    description: ''
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        name: lesson.name || '',
        type: lesson.type || LessonType.REGULAR,
        date: lesson.date ? new Date(lesson.date).toISOString().slice(0, 16) : '',
        studyPlanId: lesson.studyPlanId?.toString() || '',
        description: lesson.description || ''
      });
    } else {
      // При создании нового урока используем studyPlanId из URL (если есть)
      const urlParams = new URLSearchParams(window.location.search);
      const studyPlanIdFromUrl = urlParams.get('studyPlanId');

      setFormData({
        name: '',
        type: LessonType.REGULAR,
        date: '',
        studyPlanId: studyPlanIdFromUrl || '',
        description: ''
      });
    }
  }, [lesson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.studyPlanId) return;

    onSave({
      name: formData.name,
      type: formData.type,
      date: new Date(formData.date).toISOString(),
      studyPlanId: parseInt(formData.studyPlanId),
      description: formData.description
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Название <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Введите название урока"
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Тип урока
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as LessonType })}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
        >
          {getLessonTypeOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Дата и время <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Учебный план <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.studyPlanId}
          onChange={(e) => setFormData({ ...formData, studyPlanId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] transition-colors"
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
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Введите описание урока"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-4 sm:pb-0 sm:static sm:border-0">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] font-medium transition-colors touch-manipulation"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!formData.name || !formData.date || !formData.studyPlanId || loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] font-medium transition-colors touch-manipulation"
        >
          {loading ? 'Сохранение...' : (lesson ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </form>
  );
};

export default LessonsPage;
