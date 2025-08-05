import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaEdit, FaTimes, FaPlus } from 'react-icons/fa';
import { useStudyPlans, useAvailableData } from '../hooks/useStudyPlans';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils';
import { StudyPlan } from '../types/studyPlan';
import { studyPlanService } from '../services/studyPlanService';
import StudyPlanForm, { StudyPlanFormData } from '../components/StudyPlanForm';
import KtpTreeView from '../components/KtpTreeView';
import { ktpService } from '../services/ktpService';

const StudyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [, setLoading] = useState(false);
  const [showKtpModal, setShowKtpModal] = useState(false);
  const [ktpData, setKtpData] = useState<any>(null);
  const [ktpLoading, setKtpLoading] = useState(false);
  const [isLoadingKtp, setIsLoadingKtp] = useState(false);

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
  }, hasRole('STUDENT'), hasRole('PARENT')); // Передаем флаги для студентов и родителей

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

  // Обработчик создания учебного плана
  const handleCreateStudyPlan = async (formData: StudyPlanFormData) => {
    try {
      setFormLoading(true);
      await studyPlanService.createStudyPlan({
        name: formData.name,
        description: formData.description,
        teacherId: formData.teacherId!,
        groups: formData.groupIds.map((id: number) => ({ id })),
        normativeWorkload: formData.normativeWorkload,
      });

      // Перезагружаем список учебных планов
      updateFilters({ ...filters, page: 1 });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating study plan:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Обработчик редактирования учебного плана
  const handleUpdateStudyPlan = async (formData: StudyPlanFormData) => {
    if (!editingPlan) return;

    try {
      setFormLoading(true);
      await studyPlanService.updateStudyPlan(editingPlan.id.toString(), {
        name: formData.name,
        description: formData.description,
        teacherId: formData.teacherId!,
        groups: formData.groupIds.map((id: number) => ({ id })),
        normativeWorkload: formData.normativeWorkload,
      });

      // Перезагружаем список учебных планов
      updateFilters({ ...filters });
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating study plan:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Закрытие форм
  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCloseEditForm = () => {
    setEditingPlan(null);
  };

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto">
      {/* Header - мобильная адаптация */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold">
          {hasRole('PARENT') ? 'Учебные планы моих детей' : 'Учебные планы'}
        </h1>

        {/* Мобильные кнопки */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {(hasRole('ADMIN') || hasRole('TEACHER')) && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-3 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center button-hover text-sm md:text-base"
            >
              <FaPlus className="mr-2 text-xs md:text-sm" />
              <span className="hidden sm:inline">Создать учебный план</span>
              <span className="sm:hidden">Создать план</span>
            </button>
          )}
          <button className="w-full sm:w-auto px-3 md:px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-purple-700 flex items-center justify-center button-hover text-sm md:text-base">
            <FaDownload className="mr-2 text-xs md:text-sm" />
            <span className="hidden sm:inline">Скачать в Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>
      </div>

      {/* Фильтры - адаптивная сетка */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="col-span-1 md:col-span-1">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="col-span-1 md:col-span-1">
            <select
              value={filters.groupId?.toString() || ''}
              onChange={(e) => handleGroupFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Все группы</option>
              {groups.map(group => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 md:col-span-1">
            <select
              value={filters.teacherId?.toString() || ''}
              onChange={(e) => handleTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Таблица учебных планов - Desktop версия */}
      {!plansLoading && !error && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-notion overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группы</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Преподаватель</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Уроков</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Обновлено</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studyPlans.map((plan, index) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-gray-50 cursor-pointer animate-fadeIn"
                      onClick={() => loadDetailedPlan(plan.id)}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-900">
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
                          <div className="text-xs text-gray-500 mt-1 hidden lg:block">{plan.description}</div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-900">
                        {plan.group && plan.group.length > 0 ? (
                          <div className="space-y-1">
                            {plan.group.map((group: any) => (
                              <span key={group.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                {group.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-900">
                        {plan.teacher ? (
                          <div>
                            <div className="font-medium">{plan.teacher.user.name} {plan.teacher.user.surname}</div>
                            <div className="text-xs text-gray-500 hidden lg:block">{plan.teacher.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan._count?.lessons || 0}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        {formatDate(plan.updatedAt)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(hasRole('ADMIN') || (hasRole('TEACHER') && plan.teacher?.user.id === user?.id)) ? (
                          <div className="flex flex-col lg:flex-row space-y-1 lg:space-y-0 lg:space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 flex items-center button-hover text-xs lg:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPlan(plan);
                              }}
                            >
                              <FaEdit className="mr-1" />
                              <span className="hidden lg:inline">Редактировать</span>
                              <span className="lg:hidden">Ред.</span>
                            </button>
                            <button
                              className="text-green-600 hover:text-green-800 flex items-center button-hover text-xs lg:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/lessons?studyPlanId=${plan.id}`);
                              }}
                            >
                              <FaEdit className="mr-1" />
                              Уроки
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-800 flex items-center button-hover text-xs lg:text-sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setIsLoadingKtp(true);
                                setKtpLoading(true);
                                try {
                                  const ktpList = await ktpService.getKtpList({ studyPlanId: plan.id });
                                  if (ktpList.data.length > 0) {
                                    const ktp = await ktpService.getKtpById(ktpList.data[0].id);
                                    setKtpData(ktp);
                                  } else {
                                    setKtpData(null);
                                  }
                                  setSelectedPlan(plan);
                                } catch (err) {
                                  console.error('Error loading KTP:', err);
                                  setKtpData(null);
                                  setSelectedPlan(plan);
                                } finally {
                                  setKtpLoading(false);
                                  setShowKtpModal(true);
                                  setIsLoadingKtp(false);
                                }
                              }}
                            >
                              <FaPlus className="mr-1" />
                              КТП
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Нет доступа</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {studyPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-fadeIn"
                onClick={() => loadDetailedPlan(plan.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        #{(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(plan.updatedAt)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lessons?studyPlanId=${plan.id}`);
                      }}
                      className="text-corporate-primary hover:text-purple-800 font-medium text-left text-base mb-2 block"
                    >
                      {plan.name}
                    </button>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {/* Группы */}
                  <div className="flex flex-wrap items-center">
                    <span className="text-xs text-gray-500 font-medium mr-2 min-w-0">Группы:</span>
                    <div className="flex flex-wrap gap-1">
                      {plan.group && plan.group.length > 0 ? (
                        plan.group.map((group: any) => (
                          <span key={group.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {group.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Не назначены</span>
                      )}
                    </div>
                  </div>

                  {/* Преподаватель */}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium mr-2">Преподаватель:</span>
                    {plan.teacher ? (
                      <span className="text-sm text-gray-900">
                        {plan.teacher.user.name} {plan.teacher.user.surname}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Не назначен</span>
                    )}
                  </div>

                  {/* Количество уроков */}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium mr-2">Уроков:</span>
                    <span className="text-sm text-gray-900">{plan._count?.lessons || 0}</span>
                  </div>
                </div>

                {/* Действия */}
                {(hasRole('ADMIN') || (hasRole('TEACHER') && plan.teacher?.user.id === user?.id)) && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <button
                      className="flex-1 min-w-[80px] px-3 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center button-hover text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlan(plan);
                      }}
                    >
                      <FaEdit className="mr-1" />
                      Изменить
                    </button>
                    <button
                      className="flex-1 min-w-[80px] px-3 py-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-md flex items-center justify-center button-hover text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lessons?studyPlanId=${plan.id}`);
                      }}
                    >
                      <FaEdit className="mr-1" />
                      Уроки
                    </button>
                    <button
                      className="flex-1 min-w-[80px] px-3 py-2 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-md flex items-center justify-center button-hover text-xs"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsLoadingKtp(true);
                        setKtpLoading(true);
                        try {
                          const ktpList = await ktpService.getKtpList({ studyPlanId: plan.id });
                          if (ktpList.data.length > 0) {
                            const ktp = await ktpService.getKtpById(ktpList.data[0].id);
                            setKtpData(ktp);
                          } else {
                            setKtpData(null);
                          }
                          setSelectedPlan(plan);
                        } catch (err) {
                          console.error('Error loading KTP:', err);
                          setKtpData(null);
                          setSelectedPlan(plan);
                        } finally {
                          setKtpLoading(false);
                          setShowKtpModal(true);
                          setIsLoadingKtp(false);
                        }
                      }}
                    >
                      <FaPlus className="mr-1" />
                      КТП
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-4 rounded-b-lg">
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
        </>
      )}

      {/* Модальное окно КТП */}
      {showKtpModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Календарно-тематическое планирование</h2>
              <button
                onClick={() => {
                  setShowKtpModal(false);
                  setSelectedPlan(null);
                  setKtpData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors button-hover"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {ktpLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Загрузка КТП...</div>
                </div>
              ) : ktpData ? (
                <KtpTreeView ktpData={ktpData} canEdit={hasRole('ADMIN') || (hasRole('TEACHER') && selectedPlan?.teacher?.user.id === user?.id)} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-gray-500 mb-4">КТП для данного учебного плана не найден</div>
                  {(hasRole('ADMIN') || (hasRole('TEACHER') && selectedPlan?.teacher?.user.id === user?.id)) && (
                    <button
                      onClick={async () => {
                        try {
                          setKtpLoading(true);
                          const generated = await ktpService.generateFromStudyPlan(selectedPlan!.id);
                          setKtpData(generated.ktp);
                        } catch (err) {
                          console.error('Error generating KTP:', err);
                          alert('Ошибка при создании КТП');
                        } finally {
                          setKtpLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Создать КТП
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно детального просмотра */}
      {selectedPlan && !showKtpModal && !isLoadingKtp && (
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
                                {lesson.name}
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

      {/* Форма создания учебного плана */}
      {showCreateForm && (
        <StudyPlanForm
          onClose={handleCloseCreateForm}
          onSubmit={handleCreateStudyPlan}
          loading={formLoading}
        />
      )}

      {/* Форма редактирования учебного плана */}
      {editingPlan && (
        <StudyPlanForm
          studyPlan={editingPlan}
          onClose={handleCloseEditForm}
          onSubmit={handleUpdateStudyPlan}
          loading={formLoading}
        />
      )}
    </div>
  );
};

export default StudyPlansPage;
