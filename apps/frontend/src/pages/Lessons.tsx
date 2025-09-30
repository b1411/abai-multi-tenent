import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Button, Input, Select, Table, Modal, Loading, Autocomplete } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { Lesson, StudyPlan, LessonType } from '../types/lesson';

type LessonFiltersExt = {
  studyPlanId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: string;
};
import { useTenantConfig } from '../hooks/useTenantConfig';
import { lessonService } from '../services/lessonService';
import { studyPlanService } from '../services/studyPlanService';
import { getLessonTypeLabel, getLessonTypeColor, getLessonTypeOptions } from '../utils/lessonTypeUtils';

const LessonsPage: React.FC = () => {
  // Prevent page-wide horizontal scroll while Lessons page is mounted
  React.useEffect(() => {
    const prevHtml = document.documentElement.style.overflowX;
    const prevBody = document.body.style.overflowX;
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.documentElement.style.overflowX = prevHtml;
      document.body.style.overflowX = prevBody;
    };
  }, []);
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

  const { config: tenantConfig } = useTenantConfig();

  const [filters, setFilters] = useState<LessonFiltersExt>({
    studyPlanId: searchParams.get('studyPlanId') ? parseInt(searchParams.get('studyPlanId')!) : undefined,
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'date',
    order: 'desc',
    period: ''
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
      let response;
      if (hasRole('STUDENT')) {
        response = await lessonService.getMyLessons(filters);
      } else if (hasRole('TEACHER')) {
        response = await lessonService.getLessons({ ...filters, teacherId: user?.id });
      } else {
        response = await lessonService.getLessons(filters);
      }
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

  const updateFilters = (newFilters: Partial<LessonFiltersExt>) => {
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
                className="text-blue-600 hover:text-blue-800 hover:underline text-left break-words break-all"
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
          {(Array.isArray(materials) ? materials.length > 0 : Boolean(materials)) ? (
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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-[200px] truncate">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/lessons/${record.id}`)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-100 w-10 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Просмотр"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </button>
          {(hasRole('ADMIN') || (hasRole('TEACHER') && record.studyPlan?.teacher?.user?.id === user?.id)) && (
            <button
              type="button"
              onClick={() => handleEdit(record)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-100 w-10 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Редактировать"
            >
              <Edit className="w-4 h-4 text-gray-700" />
            </button>
          )}
          {hasRole('ADMIN') && (
            <button
              type="button"
              onClick={() => setDeletingLesson(record)}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 hover:bg-red-100 w-10 h-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              aria-label="Удалить"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
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
    <div className="p-3 sm:p-4 lg:p-6 min-h-screen bg-gray-50 w-full overflow-x-hidden" style={{ fontSize: '16px' }}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate leading-tight">
              Уроки
            </h1>
            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg leading-relaxed">
              Управление уроками и расписанием
            </p>
          </div>

          {(hasRole('ADMIN') || hasRole('TEACHER')) && (
            <div className="flex-shrink-0 mt-2 sm:mt-0">
              <Button
                variant="primary"
                onClick={() => setIsCreating(true)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base font-medium shadow-sm px-4 sm:px-6 py-2.5 sm:py-3 touch-manipulation"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="truncate">Создать урок</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Поиск по названию..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              icon={<Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
              className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3"
            />
          </div>

          {/* Filters Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              placeholder="Порядок"
              value={filters.order === "asc" || filters.order === "desc" ? filters.order : "desc"}
              onChange={(value) => updateFilters({ order: value === "asc" || value === "desc" ? value : undefined })}
              options={[
                { value: 'asc', label: 'По возрастанию' },
                { value: 'desc', label: 'По убыванию' }
              ]}
              className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            />

            <Select
              placeholder="Учебный план"
              value={filters.studyPlanId?.toString() || 'all'}
              onChange={(value) => updateFilters({ studyPlanId: value === 'all' ? undefined : parseInt(value) })}
              options={[
                { value: 'all', label: 'Все планы' },
                ...studyPlans.map(plan => ({
                  value: plan.id.toString(),
                  label: window.innerWidth < 640 && plan.name.length > 25 ?
                    `${plan.name.substring(0, 25)}...` :
                    plan.name.length > 35 ? `${plan.name.substring(0, 35)}...` : plan.name
                }))
              ]}
              className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            />
          </div>

          {/* Filters Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Период"
              value={filters.period || ''}
              onChange={(value) => {
                let dateFrom = '';
                let dateTo = '';
                const year = new Date().getFullYear();
                if (tenantConfig?.periodType === 'semester') {
                  if (value === 'half_year_1') {
                    dateFrom = `${year}-09-01`;
                    dateTo = `${year}-12-31`;
                  } else if (value === 'half_year_2') {
                    dateFrom = `${year}-01-01`;
                    dateTo = `${year}-05-31`;
                  } else if (value === 'year') {
                    dateFrom = `${year}-09-01`;
                    dateTo = `${year + 1}-05-31`;
                  }
                } else {
                  if (value === 'quarter1') {
                    dateFrom = `${year}-09-02`;
                    dateTo = `${year}-10-26`;
                  } else if (value === 'quarter2') {
                    dateFrom = `${year}-11-03`;
                    dateTo = `${year}-12-28`;
                  } else if (value === 'quarter3') {
                    dateFrom = `${year + 1}-01-08`;
                    dateTo = `${year + 1}-03-18`;
                  } else if (value === 'quarter4') {
                    dateFrom = `${year + 1}-03-30`;
                    dateTo = `${year + 1}-05-25`;
                  } else if (value === 'year') {
                    dateFrom = `${year}-09-02`;
                    dateTo = `${year + 1}-05-25`;
                  }
                }
                updateFilters({
                  period: value,
                  dateFrom,
                  dateTo
                });
              }}
              options={
                tenantConfig?.periodType === 'semester'
                  ? [
                    { value: '', label: 'Выберите период' },
                    { value: 'half_year_1', label: '1 семестр' },
                    { value: 'half_year_2', label: '2 семестр' },
                    { value: 'year', label: 'Учебный год' },
                    { value: 'custom', label: 'Произвольный' }
                  ]
                  : [
                    { value: '', label: 'Выберите период' },
                    { value: 'quarter1', label: '1 четверть' },
                    { value: 'quarter2', label: '2 четверть' },
                    { value: 'quarter3', label: '3 четверть' },
                    { value: 'quarter4', label: '4 четверть' },
                    { value: 'year', label: 'Учебный год' },
                    { value: 'custom', label: 'Произвольный' }
                  ]
              }
            />
            {filters.period === 'custom' && (
              <>
                <Input
                  type="date"
                  placeholder="Дата от"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3"
                />
                <Input
                  type="date"
                  placeholder="Дата до"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3"
                />
              </>
            )}
          </div>

          {/* Sort and Stats */}
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3 sm:space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <Select
                placeholder="Сортировка"
                value={filters.sortBy || 'date'}
                onChange={(value) => updateFilters({ sortBy: value as any })}
                options={sortOptions}
                className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
              />

              <Select
                placeholder="Порядок"
                value={filters.order === "asc" || filters.order === "desc" ? filters.order : "desc"}
                onChange={(value) => updateFilters({ order: value === "asc" || value === "desc" ? value : undefined })}
                options={[
                  { value: 'asc', label: 'По возрастанию' },
                  { value: 'desc', label: 'По убыванию' }
                ]}
                className="text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
              />
            </div>

            <div className="text-sm sm:text-base text-gray-500 text-center lg:text-right px-3 py-2 rounded bg-gray-50 order-first lg:order-last">
              <span className="font-medium">{pagination.total}</span>
              <span className="hidden sm:inline"> найдено уроков</span>
              <span className="sm:hidden"> уроков</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table/Cards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto overflow-y-hidden">
        {/* Desktop Table View - Only show on very large screens */}
        <div className="hidden xl:block overflow-x-auto">
          <div className="[&_table]:table-fixed [&_table]:w-full [&_table]:min-w-[960px] [&_th]:!whitespace-normal [&_td]:!whitespace-normal [&_th]:break-all [&_td]:break-all [&_*]:min-w-0 [&_th]:align-top [&_td]:align-top">
            <Table
              columns={columns}
              data={lessons}
              loading={lessonsLoading}
              sortBy={filters.sortBy}
              sortDirection={filters.order === "asc" || filters.order === "desc" ? filters.order : undefined}
              onSort={(key, direction) => updateFilters({ sortBy: key as any, order: direction })}
            />
          </div>
        </div>

        {/* Mobile Card View - Show on all screens up to xl */}
        <div className="xl:hidden">
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <Loading text="Загрузка уроков..." />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 sm:mb-3">
                Уроки не найдены
              </h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto">
                Попробуйте изменить фильтры поиска
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-150" style={{ minHeight: '100px' }}>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-base sm:text-lg leading-tight block w-full text-left min-h-[44px] sm:min-h-[48px] flex items-center transition-colors duration-150 pr-2"
                        >
                          <span className="truncate">{lesson.name}</span>
                        </button>

                        <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">{formatDate(lesson.date)}</span>
                          <span className="mx-1.5 sm:mx-2">•</span>
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatDateTime(lesson.date).split(' ')[1]}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-2 sm:p-3 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center touch-manipulation"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {(hasRole('ADMIN') || (hasRole('TEACHER') && lesson.studyPlan?.teacher?.user?.id === user?.id)) && (
                          <button
                            onClick={() => handleEdit(lesson)}
                            className="text-gray-600 hover:text-gray-800 p-2 sm:p-3 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center touch-manipulation"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}

                        {hasRole('ADMIN') && (
                          <button
                            onClick={() => setDeletingLesson(lesson)}
                            className="text-red-600 hover:text-red-800 p-2 sm:p-3 rounded-lg transition-colors bg-red-50 hover:bg-red-100 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center touch-manipulation"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {lesson.description && (
                      <div className="px-1">
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                          {lesson.description}
                        </p>
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate font-medium">{lesson.studyPlan?.name || 'Не указан'}</span>
                      </div>

                      {lesson.studyPlan?.teacher?.user && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 ml-5 sm:ml-7">
                          <span className="truncate">
                            {lesson.studyPlan.teacher.user.name} {lesson.studyPlan.teacher.user.surname}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getLessonTypeColor(lesson.type)}`}>
                        {getLessonTypeLabel(lesson.type)}
                      </span>

                      <div className="flex items-center space-x-1 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600">{lesson._count?.LessonResult || 0}</span>
                      </div>

                      {lesson.materials && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-700">
                          <span className="hidden sm:inline">Материалы</span>
                          <span className="sm:hidden">Мат-лы</span>
                        </span>
                      )}

                      {lesson.homework && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
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
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="text-xs sm:text-sm text-gray-500 text-center md:text-left order-2 md:order-1">
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                <span className="hidden sm:inline"> из </span>
                <span className="sm:hidden">/</span>
                <span className="font-medium">{pagination.total}</span>
                <span className="hidden sm:inline"> записей</span>
              </div>

              <div className="flex items-center justify-center space-x-2 sm:space-x-3 order-1 md:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => changePage(pagination.page - 1)}
                  className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 min-h-[40px] sm:min-h-[44px] touch-manipulation flex-shrink-0"
                >
                  <span className="hidden sm:inline">Назад</span>
                  <span className="sm:hidden">←</span>
                </Button>

                <div className="text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-md min-h-[40px] sm:min-h-[44px] flex items-center whitespace-nowrap">
                  <span className="hidden sm:inline">{pagination.page} из {pagination.totalPages}</span>
                  <span className="sm:hidden">{pagination.page}/{pagination.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => changePage(pagination.page + 1)}
                  className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 min-h-[40px] sm:min-h-[44px] touch-manipulation flex-shrink-0"
                >
                  <span className="hidden sm:inline">Далее</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(!!editingLesson || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-slide-up sm:animate-none">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 pr-8 sm:pr-4">
                  {editingLesson ? 'Редактировать урок' : 'Создать урок'}
                </h3>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setIsCreating(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center touch-manipulation flex-shrink-0 transition-colors"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
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

  const [selectedStudyPlan, setSelectedStudyPlan] = useState<{ id: string | number; label: string; value: string | number } | null>(null);
  const [studyPlanOptions, setStudyPlanOptions] = useState<{ id: string | number; label: string; value: string | number }[]>([]);
  const [studyPlanSearchLoading, setStudyPlanSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (lesson) {
      const plan = studyPlans.find(p => p.id === lesson.studyPlanId);
      setFormData({
        name: lesson.name || '',
        type: lesson.type || LessonType.REGULAR,
        date: lesson.date ? new Date(lesson.date).toISOString().slice(0, 16) : '',
        studyPlanId: lesson.studyPlanId?.toString() || '',
        description: lesson.description || ''
      });
      setSelectedStudyPlan(plan ? {
        id: plan.id,
        label: `${plan.name}${plan.group && plan.group.length > 0 ? ` (${plan.group.map(g => g.name).join(', ')})` : ''}`,
        value: plan.id
      } : null);
    } else {
      // При создании нового урока используем studyPlanId из URL (если есть)
      const urlParams = new URLSearchParams(window.location.search);
      const studyPlanIdFromUrl = urlParams.get('studyPlanId');

      const plan = studyPlanIdFromUrl ? studyPlans.find(p => p.id === parseInt(studyPlanIdFromUrl)) : null;
      setFormData({
        name: '',
        type: LessonType.REGULAR,
        date: '',
        studyPlanId: studyPlanIdFromUrl || '',
        description: ''
      });
      setSelectedStudyPlan(plan ? {
        id: plan.id,
        label: `${plan.name}${plan.group && plan.group.length > 0 ? ` (${plan.group.map(g => g.name).join(', ')})` : ''}`,
        value: plan.id
      } : null);
    }
  }, [lesson, studyPlans]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Инициализация опций при первой загрузке
  useEffect(() => {
    if (studyPlans.length > 0) {
      const options = studyPlans.map(plan => ({
        id: plan.id,
        label: `${plan.name}${plan.group && plan.group.length > 0 ? ` (${plan.group.map(g => g.name).join(', ')})` : ''}`,
        value: plan.id
      }));
      setStudyPlanOptions(options);
    }
  }, [studyPlans]);

  // Восстановление фокуса после завершения поиска
  useEffect(() => {
    if (!studyPlanSearchLoading && autocompleteInputRef.current) {
      // Небольшая задержка, чтобы DOM обновился
      setTimeout(() => {
        if (autocompleteInputRef.current) {
          autocompleteInputRef.current.focus();
        }
      }, 0);
    }
  }, [studyPlanSearchLoading]);

  // Функция поиска учебных планов с дебоунсом
  const searchStudyPlans = useCallback(async (query: string) => {
    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Если запрос пустой, показываем все доступные планы
    if (!query.trim()) {
      const options = studyPlans.map(plan => ({
        id: plan.id,
        label: `${plan.name}${plan.group && plan.group.length > 0 ? ` (${plan.group.map(g => g.name).join(', ')})` : ''}`,
        value: plan.id
      }));
      setStudyPlanOptions(options);
      return;
    }

    // Устанавливаем новый таймер для дебоунса
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setStudyPlanSearchLoading(true);
        const response = await studyPlanService.getStudyPlans({
          search: query,
          limit: 50 // Больше лимит для autocomplete
        });
        
        const options = response.data.map(plan => ({
          id: plan.id,
          label: `${plan.name}${plan.group && plan.group.length > 0 ? ` (${plan.group.map(g => g.name).join(', ')})` : ''}`,
          value: plan.id
        }));
        
        setStudyPlanOptions(options);
      } catch (error) {
        console.error('Ошибка поиска учебных планов:', error);
        setStudyPlanOptions([]);
      } finally {
        setStudyPlanSearchLoading(false);
      }
    }, 300); // 300ms дебоунс
  }, [studyPlans]);

  // Обработчик изменения выбранного учебного плана
  const handleStudyPlanChange = (option: { id: string | number; label: string; value: string | number } | null) => {
    setSelectedStudyPlan(option);
    setFormData(prev => ({
      ...prev,
      studyPlanId: option ? option.id.toString() : ''
    }));
  };

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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
          Название <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Введите название урока"
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] transition-all duration-200 bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
          Тип урока
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as LessonType })}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] transition-all duration-200 bg-white"
        >
          {getLessonTypeOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
          Дата и время <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] transition-all duration-200 bg-white"
          required
        />
      </div>

      <div>
        <Autocomplete
          label="Учебный план"
          placeholder="Поиск учебного плана..."
          value={selectedStudyPlan}
          options={studyPlanOptions}
          onChange={handleStudyPlanChange}
          onSearch={searchStudyPlans}
          isLoading={studyPlanSearchLoading}
          required
          inputRef={autocompleteInputRef}
          className="text-sm sm:text-base min-h-[40px] sm:min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Введите описание урока"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-3 sm:pb-0 sm:static sm:border-0 mx-0 px-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[40px] sm:min-h-[44px] font-medium transition-all duration-200 touch-manipulation"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!formData.name || !formData.date || !formData.studyPlanId || loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[40px] sm:min-h-[44px] font-medium transition-all duration-200 touch-manipulation shadow-sm hover:shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Сохранение...
            </span>
          ) : (
            lesson ? 'Сохранить' : 'Создать'
          )}
        </button>
      </div>
    </form>
  );
};

export default LessonsPage;
