import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  FileText,
  Download
} from 'lucide-react';
import { Button, Input, Select, Table, Modal, Loading } from '../components/ui';
import HomeworkForm from '../components/HomeworkForm';
import HomeworkDetailModal from '../components/HomeworkDetailModal';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils';
import { Homework, HomeworkFilters, HomeworkStatus } from '../types/homework';
import { homeworkService } from '../services/homeworkService';
import { fileService } from '../services/fileService';

const HomeworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<Homework | null>(null);
  const [viewingHomework, setViewingHomework] = useState<Homework | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [homeworksLoading, setHomeworksLoading] = useState(true);
  const homeworkRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const [filters, setFilters] = useState<HomeworkFilters>({
    lessonId: searchParams.get('lessonId') ? parseInt(searchParams.get('lessonId')!) : undefined,
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'deadline',
    order: 'asc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0
  });

  useEffect(() => {
    loadHomeworks();
  }, [filters]);

  useEffect(() => {
    if (homeworks.length > 0 || !homeworksLoading) {
      loadStats();
    }
  }, [homeworks, homeworksLoading]);

  // Обработка якорных ссылок
  useEffect(() => {
    const homeworkId = searchParams.get('id');
    if (homeworkId && homeworks.length > 0) {
      const homework = homeworks.find(h => h.id === parseInt(homeworkId));
      if (homework) {
        // Прокрутка к элементу
        const element = homeworkRefs.current[homework.id];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Подсветка элемента
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }
    }
  }, [homeworks, searchParams]);

  const loadHomeworks = async () => {
    try {
      setHomeworksLoading(true);
      // Используем разные методы в зависимости от роли
      let response;
      if (hasRole('STUDENT')) {
        response = await homeworkService.getMyHomeworks(filters);
      } else if (hasRole('TEACHER')) {
        response = await homeworkService.getHomeworks({ ...filters, teacherId: user?.id });
      } else {
        response = await homeworkService.getHomeworks(filters);
      }
      setHomeworks(response.data);
      setPagination({
        page: response.meta.currentPage,
        limit: response.meta.itemsPerPage,
        total: response.meta.totalItems,
        totalPages: response.meta.totalPages
      });
    } catch (error) {
      console.error('Ошибка загрузки домашних заданий:', error);
    } finally {
      setHomeworksLoading(false);
    }
  };

  const loadStats = () => {
    const now = new Date();
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let overdue = 0;

    homeworks.forEach(homework => {
      const status = getHomeworkStatus(homework);
      
      switch (status) {
        case 'pending':
          pending++;
          break;
        case 'submitted':
          submitted++;
          break;
        case 'graded':
          graded++;
          break;
        case 'overdue':
          overdue++;
          break;
      }
    });

    setStats({
      total: homeworks.length,
      pending,
      submitted,
      graded,
      overdue
    });
  };

  const getHomeworkStatus = (homework: Homework): HomeworkStatus => {
    const now = new Date();
    const deadline = new Date(homework.deadline);
    
    // Проверяем, есть ли отправки для текущего пользователя
    // Используем student.userId для сопоставления
    const userSubmission = homework.studentsSubmissions?.find(
      submission => submission.student?.userId === user?.id
    );

    if (userSubmission) {
      // Используем статус отправки для определения состояния
      if (userSubmission.status === 'CHECKED') {
        return 'graded';
      }
      return 'submitted';
    }

    if (now > deadline) {
      return 'overdue';
    }

    return 'pending';
  };

  const StatusBadge: React.FC<{ status: HomeworkStatus }> = ({ status }) => {
    const getStatusStyle = () => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'submitted':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'graded':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'overdue':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'pending':
          return <Clock className="h-3 w-3 mr-1" />;
        case 'submitted':
          return <CheckCircle className="h-3 w-3 mr-1" />;
        case 'graded':
          return <CheckCircle className="h-3 w-3 mr-1" />;
        case 'overdue':
          return <XCircle className="h-3 w-3 mr-1" />;
        default:
          return <AlertCircle className="h-3 w-3 mr-1" />;
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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle()}`}>
        {getStatusIcon()}
        {getStatusText()}
      </span>
    );
  };

  const handleEdit = (homework: Homework) => {
    setEditingHomework(homework);
  };

  const handleDelete = async () => {
    if (!deletingHomework) return;

    try {
      setLoading(true);
      await homeworkService.deleteHomework(deletingHomework.id);
      setDeletingHomework(null);
      loadHomeworks();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      setLoading(true);

      if (editingHomework) {
        await homeworkService.updateHomework(editingHomework.id, formData);
        setEditingHomework(null);
      } else if (isCreating) {
        await homeworkService.createHomework(formData);
        setIsCreating(false);
      }

      loadHomeworks();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<HomeworkFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Срок истек';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  const columns = [
    {
      key: 'name',
      title: 'Название',
      sortable: true,
      render: (value: string, record: Homework) => (
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
          <div>
            <div className="font-medium text-gray-900">
              <button
                onClick={() => navigate(`/homework/${record.id}`)}
                className="text-blue-600 hover:text-blue-800 hover:underline text-left"
              >
                {value}
              </button>
            </div>
            {record.lesson && (
              <div className="text-sm text-gray-500">
                Урок: {record.lesson.name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'deadline',
      title: 'Срок сдачи',
      sortable: true,
      render: (deadline: string, record: Homework) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
            {formatDate(deadline)}
          </div>
          <div className="text-gray-500 flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            {formatDateTime(deadline)}
          </div>
          <div className={`text-xs mt-1 ${new Date(deadline) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
            {getTimeRemaining(deadline)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Статус',
      render: (_: any, record: Homework) => (
        <StatusBadge status={getHomeworkStatus(record)} />
      )
    },
    {
      key: 'lesson',
      title: 'Урок',
      render: (lesson: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {lesson?.name || 'Не указан'}
          </div>
          {lesson?.studyPlan?.teacher?.user && (
            <div className="text-gray-500">
              {lesson.studyPlan.teacher.user.name} {lesson.studyPlan.teacher.user.surname}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'materials',
      title: 'Материалы',
      render: (materials: any, record: Homework) => (
        <div className="text-sm">
          {materials || record.additionalFiles?.length ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FileText className="h-3 w-3 mr-1" />
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
      key: 'submissions',
      title: 'Отправки',
      render: (_: any, record: Homework) => {
        const submissionCount = record.studentsSubmissions?.length || 0;
        return (
          <div className="text-sm">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <User className="h-3 w-3 mr-1" />
              {submissionCount}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Действия',
      render: (_: any, record: Homework) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/homework/${record.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {(hasRole('ADMIN') || (hasRole('TEACHER') && record.lesson?.studyPlan?.teacher?.user?.id === user?.id)) && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(record)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeletingHomework(record)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'pending', label: 'Ожидает выполнения' },
    { value: 'submitted', label: 'На проверке' },
    { value: 'graded', label: 'Проверено' },
    { value: 'overdue', label: 'Просрочено' }
  ];

  const sortOptions = [
    { value: 'name', label: 'По названию' },
    { value: 'deadline', label: 'По сроку сдачи' },
    { value: 'createdAt', label: 'По дате создания' }
  ];

  if (homeworksLoading && !homeworks.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка домашних заданий..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Домашние задания</h1>
          <p className="text-gray-500 mt-1">
            {hasRole('STUDENT') ? 'Ваши домашние задания' :
             hasRole('TEACHER') ? 'Управление домашними заданиями' :
             'Все домашние задания'}
          </p>
        </div>

        {(hasRole('ADMIN') || hasRole('TEACHER')) && (
          <Button
            variant="primary"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать задание
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Всего</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Ожидают</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-500">На проверке</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
          <div className="text-sm text-gray-500">Проверено</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-500">Просрочено</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="lg:col-span-1">
            <Input
              placeholder="Поиск по названию..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <Select
            placeholder="Статус"
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as HomeworkStatus })}
            options={statusOptions}
          />

          <Select
            placeholder="Сортировка"
            value={filters.sortBy || 'deadline'}
            onChange={(value) => updateFilters({ sortBy: value as any })}
            options={sortOptions}
          />

          <Select
            placeholder="Порядок"
            value={filters.order || 'asc'}
            onChange={(value) => updateFilters({ order: value as any })}
            options={[
              { value: 'asc', label: 'По возрастанию' },
              { value: 'desc', label: 'По убыванию' }
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Найдено: {pagination.total} заданий
          </div>
        </div>
      </div>

      {/* Homework Cards */}
      <div className="space-y-4">
        {homeworksLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading text="Загрузка домашних заданий..." />
          </div>
        ) : homeworks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет домашних заданий</h3>
            <p className="mt-1 text-sm text-gray-500">Начните с создания первого домашнего задания.</p>
          </div>
        ) : (
          homeworks.map((homework) => (
            <div
              key={homework.id}
              ref={el => homeworkRefs.current[homework.id] = el}
              id={`homework-${homework.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 break-words">{homework.name}</h3>
                    <StatusBadge status={getHomeworkStatus(homework)} />
                  </div>

                  {homework.lesson && (
                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-medium">Урок:</span> {homework.lesson.name}
                      {homework.lesson.studyPlan?.teacher?.user && (
                        <span className="ml-2">
                          • {homework.lesson.studyPlan.teacher.user.name} {homework.lesson.studyPlan.teacher.user.surname}
                        </span>
                      )}
                    </div>
                  )}

                  {homework.materials?.lecture && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {homework.materials.lecture}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(homework.deadline)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDateTime(homework.deadline)}
                    </div>
                    <div className={`${new Date(homework.deadline) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                      {getTimeRemaining(homework.deadline)}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {homework.studentsSubmissions?.length || 0} отправок
                    </div>
                  </div>
                </div>

                <div className="flex w-full md:w-auto items-center gap-2 md:ml-4 justify-start md:justify-end flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingHomework(homework)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Открыть
                  </Button>
                  {(hasRole('ADMIN') || (hasRole('TEACHER') && homework.lesson?.studyPlan?.teacher?.user?.id === user?.id)) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(homework)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingHomework(homework)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Homework Detail Modal */}
          {viewingHomework && (
            <HomeworkDetailModal
              homework={viewingHomework}
              onClose={() => setViewingHomework(null)}
              onSubmit={hasRole('STUDENT') ? async (files: File[], comment?: string) => {
                try {
                  setLoading(true);
                  
                  // Сначала загружаем файлы
                  const uploadedFiles = await Promise.all(
                    files.map(file => fileService.uploadFile(file, 'homework'))
                  );
                  
                  // Основной файл - первый загруженный
                  const mainFileId = uploadedFiles[0].id;
                  // Дополнительные файлы - остальные
                  const additionalFileIds = uploadedFiles.slice(1).map(f => f.id);
                  
                  // Всегда используем submitHomework - бэкенд сам определит, нужно ли обновить существующую отправку
                  await homeworkService.submitHomework(viewingHomework.id, {
                    fileId: mainFileId,
                    additionalFileIds: additionalFileIds.length > 0 ? additionalFileIds : undefined,
                    comment
                  });
                  
                  alert('Работа успешно отправлена!');
                  
                  // Перезагружаем данные
                  await loadHomeworks();
                  setViewingHomework(null);
                  
                } catch (error) {
                  console.error('Ошибка отправки работы:', error);
                  alert('Ошибка при отправке работы. Попробуйте еще раз.');
                } finally {
                  setLoading(false);
                }
              } : undefined}
              onViewSubmissions={() => {
                navigate(`/homework/${viewingHomework.id}/submissions`);
                setViewingHomework(null);
              }}
              loading={loading}
            />
          )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingHomework}
        onClose={() => setDeletingHomework(null)}
        title="Подтверждение удаления"
        size="sm"
      >
        {deletingHomework && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Вы уверены, что хотите удалить домашнее задание "{deletingHomework.name}"?
            </p>
            <p className="text-sm text-gray-500">
              Это действие нельзя отменить. Все отправки студентов также будут удалены.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeletingHomework(null)}
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

      {/* Create/Edit Form */}
      {(isCreating || editingHomework) && (
        <HomeworkForm
          homework={editingHomework || undefined}
          onSave={handleSave}
          onClose={() => {
            setIsCreating(false);
            setEditingHomework(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default HomeworkPage;
