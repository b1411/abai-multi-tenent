import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaEdit, FaTimes } from 'react-icons/fa';
import { useStudyPlans, useAvailableData } from '../hooks/useStudyPlans';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils';
import { StudyPlan } from '../types/studyPlan';
import { studyPlanService } from '../services/studyPlanService';

const StudyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [, setLoading] = useState(false);

  const {
    studyPlans,
    loading: plansLoading,
    error,
    filters,
    pagination,
    updateFilters,
  } = useStudyPlans({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc'
  });

  const {
    groups,
    teachers
  } = useAvailableData();

  // Обработчики фильтров
  const handleSearchChange = (search: string) => {
    updateFilters({ search, page: 1 });
  };

  const handleTeacherFilter = (teacherId: string) => {
    updateFilters({
      teacherId: teacherId === '' ? undefined : parseInt(teacherId),
      page: 1
    });
  };

  const handleGroupFilter = (groupId: string) => {
    updateFilters({
      groupId: groupId === '' ? undefined : parseInt(groupId),
      page: 1
    });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  // Загрузка детального плана
  const loadDetailedPlan = async (planId: number) => {
    try {
      setLoading(true);
      const detailed = await studyPlanService.getStudyPlan(planId.toString());
      setSelectedPlan(detailed);
    } catch (err) {
      console.error('Error loading detailed plan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Учебные планы</h1>
        <button className="px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 flex items-center button-hover">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <select
              value={filters.groupId?.toString() || ''}
              onChange={(e) => handleGroupFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Все группы</option>
              {groups.map(group => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.teacherId?.toString() || ''}
              onChange={(e) => handleTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Все преподаватели</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id.toString()}>
                  {teacher.name} {teacher.surname}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Состояние загрузки и ошибки */}
      {plansLoading && (
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
      {!plansLoading && !error && (
        <div className="bg-white rounded-lg shadow-notion overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группы</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Преподаватель</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кол-во уроков</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Обновлено</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studyPlans.map((plan, index) => (
                <tr
                  key={plan.id}
                  className="hover:bg-gray-50 cursor-pointer animate-fadeIn"
                  onClick={() => loadDetailedPlan(plan.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lessons?studyPlanId=${plan.id}`);
                      }}
                      className="text-corporate-primary hover:text-purple-800 hover:underline font-medium text-left"
                    >
                      {plan.name}
                    </button>
                    {plan.description && (
                      <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.group && plan.group.length > 0 ? (
                      <div className="space-y-1">
                        {plan.group.map((group: any) => (
                          <span key={group.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                            {group.name}
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
                        <div className="font-medium">{plan.teacher.user.name} {plan.teacher.user.surname}</div>
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
                    {formatDate(plan.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(hasRole('ADMIN') || (hasRole('TEACHER') && plan.teacher?.user.id === user?.id)) ? (
                      <button
                        className="text-green-600 hover:text-green-800 flex items-center button-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lessons?studyPlanId=${plan.id}`);
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
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 button-hover"
                >
                  Предыдущая
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 button-hover"
                >
                  Следующая
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Показано{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}из{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium button-hover ${page === pagination.page
                            ? 'z-10 bg-purple-50 border-purple-500 text-corporate-primary'
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-fadeIn">
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
                          `${selectedPlan.teacher.user.name} ${selectedPlan.teacher.user.surname}` :
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
                      <span className="ml-2">{formatDate(selectedPlan.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors button-hover"
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Материалы</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPlan.lessons && selectedPlan.lessons.length > 0 ? (
                        selectedPlan.lessons.map((lesson: any, index: number) => (
                          <tr key={lesson.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <button
                                onClick={() => navigate(`/lessons/${lesson.id}`)}
                                className="text-corporate-primary hover:text-purple-800 hover:underline"
                              >
                                {lesson.title}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {lesson.date ? (
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                  {formatDate(lesson.date)}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${lesson.materials?.length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                  }`}>
                                  {lesson.materials?.length > 0 ? '✓' : '×'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${lesson.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  lesson.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {lesson.status === 'completed' ? 'Завершен' :
                                  lesson.status === 'in_progress' ? 'В процессе' :
                                    'Запланирован'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            Уроки не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
