import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaEye, FaCheck, FaTimes, FaExclamationTriangle, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { studyPlansService, StudyPlan, StudyPlanFilter, CreateStudyPlanDto, PaginatedResponse } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const StudyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [filters, setFilters] = useState<StudyPlanFilter>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    order: 'asc',
    search: '',
    teacherId: undefined,
    groupId: undefined
  });

  // Загрузка учебных планов
  const loadStudyPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PaginatedResponse<StudyPlan> = await studyPlansService.getAll(filters);

      setPlans(response.data);
      setPagination({
        currentPage: response.meta.currentPage,
        totalPages: response.meta.totalPages,
        totalItems: response.meta.totalItems,
        itemsPerPage: response.meta.itemsPerPage
      });
    } catch (err) {
      setError('Ошибка при загрузке учебных планов');
      console.error('Error loading study plans:', err);
    } finally {
      setLoading(false);
    }
  };

  // Эффект для загрузки данных при изменении фильтров
  useEffect(() => {
    loadStudyPlans();
  }, [filters]);

  // Обработчики фильтров
  const handleSearchChange = (search: string) => {
    setFilters((prev: StudyPlanFilter) => ({
      ...prev,
      search,
      page: 1
    }));
  };

  const handleTeacherFilter = (teacherId: number | undefined) => {
    setFilters((prev: StudyPlanFilter) => ({
      ...prev,
      teacherId,
      page: 1
    }));
  };

  const handleGroupFilter = (groupId: number | undefined) => {
    setFilters((prev: StudyPlanFilter) => ({
      ...prev,
      groupId,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: StudyPlanFilter) => ({
      ...prev,
      page
    }));
  };

  // Загрузка детального плана
  const loadDetailedPlan = async (planId: number) => {
    try {
      setLoading(true);
      const detailed = await studyPlansService.getById(planId);
      setSelectedPlan(detailed);
    } catch (err) {
      setError('Ошибка при загрузке деталей учебного плана');
      console.error('Error loading detailed plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'incomplete':
        return 'Не заполнено';
      case 'critical':
        return 'Критично';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return '🟢';
      case 'incomplete':
        return '🟡';
      case 'critical':
        return '🔴';
      default:
        return '';
    }
  };

  const getCompletionIcon = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return '✅';
    if (percentage >= 50) return '⚠️';
    return '❌';
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Учебные планы</h1>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center">
          <FaDownload className="mr-2" />
          Скачать в Excel
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <select
              value={filters.groupId || ''}
              onChange={(e) => handleGroupFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Все группы</option>
              {/* Здесь будут динамически загружаться группы */}
            </select>
          </div>
          <div>
            <select
              value={filters.teacherId || ''}
              onChange={(e) => handleTeacherFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Все преподаватели</option>
              {/* Здесь будут динамически загружаться преподаватели */}
            </select>
          </div>
        </div>
      </div>

      {/* Состояние загрузки и ошибки */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Таблица учебных планов */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группы</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Преподаватель</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кол-во уроков</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Нагрузка (ч)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Обновлено</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan, index) => (
                <tr
                  key={plan.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => loadDetailedPlan(plan.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Link
                      to={`/study-plans/${plan.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {plan.name}
                    </Link>
                    {plan.description && (
                      <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.group && plan.group.length > 0 ? (
                      <div className="space-y-1">
                        {plan.group.map((group: any) => (
                          <span key={group.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {group.name} ({group.courseNumber} курс)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Не назначены</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.teacher ? (
                      <div>
                        <div className="font-medium">{plan.teacher.user.surname} {plan.teacher.user.name}</div>
                        <div className="text-xs text-gray-500">{plan.teacher.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Не назначен</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="flex items-center">
                      {plan._count?.lessons || 0} уроков
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.normativeWorkload || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(plan.updatedAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(user?.role === 'ADMIN' || (user?.role === 'TEACHER' && plan.teacher?.user.id === user.id)) ? (
                      <button 
                        className="text-green-600 hover:text-green-800 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/study-plans/${plan.id}/lessons`);
                        }}
                      >
                        <FaEdit className="mr-1" />
                        Управление уроками
                      </button>
                    ) : (
                      <span className="text-gray-400">Нет доступа</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Предыдущая
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Следующая
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Показано{' '}
                    <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>
                    {' '}из{' '}
                    <span className="font-medium">{pagination.totalItems}</span>
                    {' '}результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно детального просмотра */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Шапка модального окна */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedPlan.name}
                  </h2>
                  {selectedPlan.description && (
                    <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">Преподаватель:</span>
                      <span className="ml-2">
                        {selectedPlan.teacher ?
                          `${selectedPlan.teacher.user.surname} ${selectedPlan.teacher.user.name}` :
                          'Не назначен'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Всего уроков:</span>
                      <span className="ml-2">{selectedPlan._count?.lessons || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Обновлено:</span>
                      <span className="ml-2">{new Date(selectedPlan.updatedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Основной контент */}
            <div className="flex-1 p-6 flex gap-6 overflow-hidden">
              {/* Таблица уроков */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">№</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Тема урока</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Дата урока</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Видео</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Презентация</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Тест</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Дата добавления</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ответственный</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPlan.lessons && selectedPlan.lessons.length > 0 ? (
                        selectedPlan.lessons.map((lesson: any, index: number) => (
                          <tr key={lesson.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{lesson.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {lesson.date ? (
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                  {new Date(lesson.date).toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${lesson.materials?.videoUrl ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {lesson.materials?.videoUrl ? '✓' : '×'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${lesson.materials?.presentationUrl ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {lesson.materials?.presentationUrl ? '✓' : '×'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${lesson.materials?.quiz ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {lesson.materials?.quiz ? '✓' : '×'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(lesson.date).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {selectedPlan.teacher ?
                                `${selectedPlan.teacher.user.surname} ${selectedPlan.teacher.user.name}` :
                                '—'
                              }
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                            Уроки не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI-анализ */}
              <div className="w-80 flex-shrink-0">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">AI-анализ</h3>
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex items-center text-red-700">
                        <span className="text-lg mr-2">📉</span>
                        <p>5 уроков без видео</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center text-yellow-700">
                        <span className="text-lg mr-2">⚠️</span>
                        <p>2 темы не соответствуют базовому учебному плану</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center text-blue-700">
                        <span className="text-lg mr-2">💡</span>
                        <p>Рекомендуем назначить ответственного за заполнение урока №3</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlansPage;
