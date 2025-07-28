import React, { useState } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaPlus, 
  FaTimes, 
  FaEnvelope, 
  FaPhone, 
  FaGraduationCap, 
  FaCalendarAlt, 
  FaIdCard, 
  FaMapMarkerAlt, 
  FaExchangeAlt,
  FaEllipsisV,
  FaChalkboardTeacher,
  FaUsers,
  FaClock,
  FaFileAlt
} from 'react-icons/fa';
import { useTeachers, useTeacherActions } from '../hooks/useTeachers';
import { PermissionGuard } from '../components/PermissionGuard';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import type { Teacher, TeacherFilters } from '../types/teacher';

const Teachers: React.FC = () => {
  const [filters, setFilters] = useState<TeacherFilters>({
    search: '',
    employmentType: 'all',
    subject: '',
    status: 'all'
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { teachers, loading, error, refreshTeachers } = useTeachers(filters);
  const { exportTeachers, deleteTeacher, changeEmploymentType, loading: actionLoading } = useTeacherActions();

  // Разделение сотрудников на штатных и совместителей
  const filteredTeachers = teachers.filter(teacher => {
    // Фильтр по поиску
    const matchesSearch = !filters.search || 
      teacher.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      teacher.user.surname.toLowerCase().includes(filters.search.toLowerCase()) ||
      teacher.user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    // Фильтр по типу занятости
    const matchesEmploymentType = filters.employmentType === 'all' || 
      teacher.employmentType === filters.employmentType;
    
    return matchesSearch && matchesEmploymentType;
  });

  const staffTeachers = filteredTeachers.filter(teacher => teacher.employmentType === 'STAFF');
  const partTimeTeachers = filteredTeachers.filter(teacher => teacher.employmentType === 'PART_TIME');

  const getEmploymentTypeColor = (type: 'STAFF' | 'PART_TIME') => {
    return type === 'STAFF' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getEmploymentTypeText = (type: 'STAFF' | 'PART_TIME') => {
    return type === 'STAFF' ? 'Штатный' : 'Совместитель';
  };

  const handleExport = async () => {
    try {
      await exportTeachers('xlsx');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить преподавателя?')) {
      try {
        await deleteTeacher(teacherId);
        refreshTeachers();
        if (selectedTeacher?.id === teacherId) {
          setSelectedTeacher(null);
        }
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  const handleChangeEmploymentType = async (teacherId: number, currentType: 'STAFF' | 'PART_TIME') => {
    const newType = currentType === 'STAFF' ? 'PART_TIME' : 'STAFF';
    const actionText = newType === 'STAFF' ? 'в штатные' : 'в совместители';
    
    if (window.confirm(`Вы уверены, что хотите перевести преподавателя ${actionText}?`)) {
      try {
        await changeEmploymentType(teacherId, newType);
        refreshTeachers();
        if (selectedTeacher?.id === teacherId) {
          setSelectedTeacher(null);
        }
      } catch (error) {
        console.error('Ошибка изменения типа занятости:', error);
      }
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayNumber] || '';
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  // Компонент таблицы преподавателей
  const TeacherTable = ({ teachers, title }: { teachers: Teacher[], title: string }) => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-medium text-gray-900">{title} ({teachers.length})</h2>
        <p className="text-xs sm:text-sm text-gray-500">Всего: {teachers.length} человек</p>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Преподаватель
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Предметы
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Нагрузка
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контакты
              </th>
              <th className="px-6 py-3 bg-gray-50"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr 
                key={teacher.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedTeacher(teacher)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {teacher.user.surname.charAt(0)}{teacher.user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {teacher.user.surname} {teacher.user.name}
                        {teacher.user.middlename && ` ${teacher.user.middlename}`}
                      </div>
                      <div className="text-sm text-gray-500">{teacher.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {teacher.studyPlans && teacher.studyPlans.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.studyPlans.slice(0, 3).map((plan) => (
                          <span 
                            key={plan.id}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {plan.name}
                          </span>
                        ))}
                        {teacher.studyPlans.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{teacher.studyPlans.length - 3} еще
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Предметы не назначены</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {teacher.studyPlans ? (
                      <>
                        <div className="flex items-center">
                          <FaUsers className="w-3 h-3 text-gray-400 mr-1" />
                          <span>{teacher.studyPlans.reduce((total, plan) => total + (plan.group?.length || 0), 0)} групп</span>
                        </div>
                        <div className="flex items-center">
                          <FaClock className="w-3 h-3 text-gray-400 mr-1" />
                          <span>{teacher.schedules?.length || 0} часов/нед</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {teacher.user.phone && (
                      <div className="flex items-center">
                        <FaPhone className="w-3 h-3 mr-1" />
                        {teacher.user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <PermissionGuard module="teachers" action="update">
                      <button 
                        className="text-gray-400 hover:text-blue-500 p-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeEmploymentType(teacher.id, teacher.employmentType);
                        }}
                        title={teacher.employmentType === 'STAFF' ? 'Перевести в совместители' : 'Перевести в штатные'}
                      >
                        <FaExchangeAlt className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="teachers" action="delete">
                      <button 
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeacher(teacher.id);
                        }}
                        title="Удалить преподавателя"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                    <button 
                      className="text-gray-400 hover:text-gray-500 p-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeacher(teacher);
                      }}
                    >
                      <FaEllipsisV className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  В этой категории нет преподавателей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {teachers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            В этой категории нет преподавателей
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <div 
                key={teacher.id}
                className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedTeacher(teacher)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium text-sm">
                        {teacher.user.surname.charAt(0)}{teacher.user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        {teacher.user.surname} {teacher.user.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{teacher.user.email}</p>
                      
                      {/* Предметы */}
                      {teacher.studyPlans && teacher.studyPlans.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {teacher.studyPlans.slice(0, 2).map((plan) => (
                            <span 
                              key={plan.id}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                            >
                              {plan.name}
                            </span>
                          ))}
                          {teacher.studyPlans.length > 2 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{teacher.studyPlans.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Нагрузка и контакты */}
                      <div className="mt-2 space-y-1">
                        {teacher.studyPlans && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <FaUsers className="w-3 h-3 mr-1" />
                              <span>{teacher.studyPlans.reduce((total, plan) => total + (plan.group?.length || 0), 0)} групп</span>
                            </div>
                            <div className="flex items-center">
                              <FaClock className="w-3 h-3 mr-1" />
                              <span>{teacher.schedules?.length || 0} ч/нед</span>
                            </div>
                          </div>
                        )}
                        {teacher.user.phone && (
                          <div className="flex items-center text-xs text-gray-500">
                            <FaPhone className="w-3 h-3 mr-1" />
                            <span>{teacher.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <PermissionGuard module="teachers" action="update">
                      <button 
                        className="text-gray-400 hover:text-blue-500 p-2 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeEmploymentType(teacher.id, teacher.employmentType);
                        }}
                        title={teacher.employmentType === 'STAFF' ? 'Перевести в совместители' : 'Перевести в штатные'}
                      >
                        <FaExchangeAlt className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="teachers" action="delete">
                      <button 
                        className="text-gray-400 hover:text-red-500 p-2 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeacher(teacher.id);
                        }}
                        title="Удалить преподавателя"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники и преподаватели</h1>
          <p className="text-sm text-gray-500">Управление кадровым составом образовательного учреждения</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <PermissionGuard module="reports" action="read">
            <button 
              className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              onClick={handleExport}
              disabled={actionLoading}
            >
              <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Экспорт</span>
              <span className="sm:hidden">Скачать</span>
            </button>
          </PermissionGuard>
          <PermissionGuard module="teachers" action="create">
            <button 
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Добавить преподавателя</span>
              <span className="sm:hidden">Добавить</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4 lg:mb-6">
          {error}
        </Alert>
      )}

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-4 mb-4 lg:mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
          <input
            type="text"
            placeholder="Поиск по преподавателям..."
            className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select
          className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={filters.employmentType}
          onChange={(e) => setFilters(prev => ({ ...prev, employmentType: e.target.value as any }))}
        >
          <option value="all">Все типы занятости</option>
          <option value="STAFF">Штатные</option>
          <option value="PART_TIME">Совместители</option>
        </select>
      </div>

      {/* Двухколоночный макет */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Колонка штатных преподавателей */}
        <TeacherTable teachers={staffTeachers} title="🟦 Штатные преподаватели" />
        
        {/* Колонка совместителей */}
        <TeacherTable teachers={partTimeTeachers} title="🟨 Совместители" />
      </div>

      {/* Модальное окно преподавателя */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Заголовок */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-medium">
                      {selectedTeacher.user.surname.charAt(0)}{selectedTeacher.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTeacher.user.surname} {selectedTeacher.user.name}
                        {selectedTeacher.user.middlename && ` ${selectedTeacher.user.middlename}`}
                      </h2>
                    </div>
                    <p className="text-gray-600">{selectedTeacher.user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEmploymentTypeColor(selectedTeacher.employmentType)}`}>
                        {getEmploymentTypeText(selectedTeacher.employmentType)}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setSelectedTeacher(null)}
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Контактная информация</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{selectedTeacher.user.email}</span>
                    </div>
                    {selectedTeacher.user.phone && (
                      <div className="flex items-center">
                        <FaPhone className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedTeacher.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Профессиональная информация</h3>
                  <div className="space-y-3">
                    {selectedTeacher.specialization && (
                      <div className="flex items-center">
                        <FaGraduationCap className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedTeacher.specialization}</span>
                      </div>
                    )}
                    {selectedTeacher.qualification && (
                      <div className="flex items-center">
                        <FaIdCard className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedTeacher.qualification}</span>
                      </div>
                    )}
                    {selectedTeacher.experience && (
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-5 h-5 text-gray-400 mr-3" />
                        <span>Опыт: {selectedTeacher.experience} лет</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Предметы */}
              {selectedTeacher.studyPlans && selectedTeacher.studyPlans.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Преподаваемые предметы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeacher.studyPlans.map((plan) => (
                      <div key={plan.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900 mb-2">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-600 mb-2">{plan.description}</div>
                        )}
                        {plan.group && plan.group.length > 0 && (
                          <div className="text-sm text-gray-500">
                            Группы: {plan.group.map(g => g.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Расписание */}
              {selectedTeacher.schedules && selectedTeacher.schedules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Расписание</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeacher.schedules.map((schedule) => (
                      <div key={schedule.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {getDayName(schedule.dayOfWeek)} {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
                            </div>
                            <div className="text-sm text-gray-600">{schedule.studyPlan.name}</div>
                            <div className="text-sm text-gray-500">Группа: {schedule.group.name}</div>
                          </div>
                          {schedule.classroom && (
                            <div className="text-sm text-gray-500">
                              {schedule.classroom.building}-{schedule.classroom.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <PermissionGuard module="teachers" action="update">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Редактировать
                    </button>
                  </PermissionGuard>
                  <PermissionGuard module="reports" action="read">
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      Скачать личное дело
                    </button>
                  </PermissionGuard>
                  <PermissionGuard module="teachers" action="update">
                    <button 
                      className="px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 flex items-center gap-2"
                      onClick={() => handleChangeEmploymentType(selectedTeacher.id, selectedTeacher.employmentType)}
                    >
                      <FaExchangeAlt className="w-4 h-4" />
                      {selectedTeacher.employmentType === 'STAFF' ? 'В совместители' : 'В штатные'}
                    </button>
                  </PermissionGuard>
                </div>
                <PermissionGuard module="teachers" action="delete">
                  <button 
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                    onClick={() => handleDeleteTeacher(selectedTeacher.id)}
                  >
                    Удалить
                  </button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления преподавателя */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Добавить преподавателя</h2>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowAddModal(false)}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="mb-4 text-gray-700">Выберите тип занятости:</p>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <h3 className="font-medium mb-2">Штатный преподаватель</h3>
                    <p className="text-sm text-gray-500">Полная занятость, официальное трудоустройство</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <h3 className="font-medium mb-2">Совместитель</h3>
                    <p className="text-sm text-gray-500">Частичная занятость, почасовая оплата</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setShowAddModal(false)}
                >
                  Отмена
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
