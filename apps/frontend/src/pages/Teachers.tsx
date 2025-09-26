import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaUsers,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaGraduationCap,
  FaMedal,
  FaChartLine,
  FaDollarSign,
  FaEye,
  FaCog,
  FaUserTie
} from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';
import { useTeachers } from '../hooks/useTeachers';
import { userService } from '../services/userService';
import { salaryService } from '../services/salaryService';
import TeacherSalaryRateForm from '../components/TeacherSalaryRateForm';

const Teachers: React.FC = () => {
  const navigate = useNavigate();
  const { teachers, loading, error } = useTeachers();

  // Состояния для UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSalaryRateForm, setShowSalaryRateForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [currentTeacherRate, setCurrentTeacherRate] = useState<any>(null);
  const [teacherStats, setTeacherStats] = useState<{ [key: number]: any }>({});

  // Другие сотрудники (HR / Финансисты)
  const [otherStaff, setOtherStaff] = useState<any[]>([]);
  const [loadingOtherStaff, setLoadingOtherStaff] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoadingOtherStaff(true);
        const [hrs, fins] = await Promise.all([
          userService.getUsersByRole('HR'),
          userService.getUsersByRole('FINANCIST'),
        ]);
        if (!alive) return;
        const merged = [...(hrs || []), ...(fins || [])];
        setOtherStaff(merged);
      } catch (e) {
        if (!alive) return;
        setOtherStaff([]);
      } finally {
        if (alive) setLoadingOtherStaff(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const filteredOtherStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return otherStaff.filter((u: any) =>
      !q || u?.name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q)
    );
  }, [otherStaff, searchQuery]);

  // Фильтрация преподавателей
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch =
        teacher.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.user.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = selectedDepartment === 'all' ||
        (teacher as any).department === selectedDepartment;

      const matchesCategory = selectedCategory === 'all' ||
        (teacher as any).category === selectedCategory;

      return matchesSearch && matchesDepartment && matchesCategory;
    });
  }, [teachers, searchQuery, selectedDepartment, selectedCategory]);

  // Загрузка статистики по преподавателю
  const loadTeacherStats = async (teacherId: number) => {
    try {
      const history = await salaryService.getSalaryHistory(teacherId);
      const stats = {
        totalSalaries: history.length,
        totalAmount: history.reduce((sum, s) => sum + s.totalNet, 0),
        avgSalary: history.length > 0 ? history.reduce((sum, s) => sum + s.totalNet, 0) / history.length : 0,
        lastSalary: history.length > 0 ? history[0] : null
      };

      setTeacherStats(prev => ({
        ...prev,
        [teacherId]: stats
      }));
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      // Устанавливаем пустую статистику в случае ошибки
      setTeacherStats(prev => ({
        ...prev,
        [teacherId]: {
          totalSalaries: 0,
          totalAmount: 0,
          avgSalary: 0,
          lastSalary: null
        }
      }));
    }
  };

  // Обработчики
  const handleViewProfile = (teacher: any) => {
    navigate(`/teachers/${teacher.id}`);
  };

  const handleManageRate = async (teacher: any) => {
    try {
      setSelectedTeacher(teacher);
      const rate = await salaryService.getTeacherSalaryRate(teacher.id);
      setCurrentTeacherRate(rate);
      setShowSalaryRateForm(true);
    } catch (error) {
      console.error('Ошибка при загрузке ставки:', error);
      setCurrentTeacherRate(null);
      setShowSalaryRateForm(true);
    }
  };

  const handleSubmitRate = async (rateData: any) => {
    if (!selectedTeacher) return;

    try {
      if (currentTeacherRate) {
        await salaryService.updateTeacherSalaryRate(currentTeacherRate.id, rateData);
      } else {
        await salaryService.createTeacherSalaryRate(selectedTeacher.id, rateData);
      }

      setShowSalaryRateForm(false);
      setSelectedTeacher(null);
      setCurrentTeacherRate(null);

      alert('Ставка преподавателя успешно сохранена!');
    } catch (error) {
      console.error('Ошибка при сохранении ставки:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const showOtherStaffLoading = loadingOtherStaff;

  if (error) {
    return (
      <div className="text-center text-red-500 py-12">
        <p>Ошибка при загрузке списка преподавателей: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Сотрудники</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Управление профилями и ставками преподавателей</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="mr-2" />
            Фильтры
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Всего преподавателей</div>
            <FaUsers className="text-blue-600 text-sm sm:text-base" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold">{teachers.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Активных</div>
            <FaUserTie className="text-green-600 text-sm sm:text-base" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{teachers.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Со ставками</div>
            <FaDollarSign className="text-purple-600 text-sm sm:text-base" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {Object.keys(teacherStats).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Средний стаж</div>
            <FaChartLine className="text-orange-600 text-sm sm:text-base" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {teachers.length > 0
                ? Math.round(teachers.reduce((sum, t) => sum + ((t as any).experience || 0), 0) / teachers.length)
                : 0
              } лет
            </div>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Поиск */}
          <div className="w-full">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, фамилии или email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Фильтры */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">Все отделы</option>
                <option value="Информатика">Информатика</option>
                <option value="Математика">Математика</option>
                <option value="Физика">Физика</option>
                <option value="Химия">Химия</option>
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Все категории</option>
                <option value="Высшая категория">Высшая категория</option>
                <option value="Первая категория">Первая категория</option>
                <option value="Вторая категория">Вторая категория</option>
                <option value="Без категории">Без категории</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Список преподавателей */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTeachers.map((teacher) => {
          const stats = teacherStats[teacher.id];

          return (
            <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              {/* Заголовок карточки */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {teacher.user.surname} {teacher.user.name}
                    </h3>
                    <p className="text-sm text-gray-500">{teacher.user.middlename}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProfile(teacher)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Профиль"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleManageRate(teacher)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Настроить ставку"
                  >
                    <FaCog className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Основная информация */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FaEnvelope className="text-gray-400 w-4 h-4" />
                  <span className="text-gray-600 truncate">{teacher.user.email}</span>
                </div>

                {/* Отдел преподавателя */}
                {(teacher as any).department && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaGraduationCap className="text-gray-400 w-4 h-4" />
                    <span className="text-gray-600">
                      {(teacher as any).department}
                    </span>
                  </div>
                )}

                {/* Категория преподавателя */}
                {(teacher as any).category && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaMedal className="text-gray-400 w-4 h-4" />
                    <span className="text-gray-600">
                      {(teacher as any).category}
                    </span>
                  </div>
                )}
              </div>

              {/* Статистика */}
              {stats ? (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Выплат</div>
                      <div className="font-semibold">{stats.totalSalaries}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Общая сумма</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(stats.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {stats.lastSalary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Последняя выплата</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {stats.lastSalary.month}/{stats.lastSalary.year}
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {formatCurrency(stats.lastSalary.totalNet)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4">
                  <button
                    onClick={() => loadTeacherStats(teacher.id)}
                    className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Загрузить статистику
                  </button>
                </div>
              )}

              {/* Действия */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleViewProfile(teacher)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Профиль
                </button>
                <button
                  onClick={() => handleManageRate(teacher)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ставка
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <FaUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchQuery || selectedDepartment !== 'all' || selectedCategory !== 'all'
              ? 'Сотрудники не найдены по заданным критериям'
              : 'Список преподавателей пуст'
            }
          </p>
        </div>
      )}

      {/* Форма управления ставками */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Другие сотрудники</h2>
          <span className="text-sm text-gray-500">{filteredOtherStaff.length}</span>
        </div>

        {showOtherStaffLoading && (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        )}

        {!showOtherStaffLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredOtherStaff.map((u: any) => {
              const R = (u.role || '').toUpperCase();
              const roleLabel = R === 'HR' ? 'HR' : (R === 'FINANCIST' ? 'Финансист' : R === 'ADMIN' ? 'Администратор' : u.role);
              return (
                <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{u.surname ? `${u.surname} ${u.name}` : (u.name || '')}</h3>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-2 text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          <FaUserTie className="w-3.5 h-3.5" />
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FaEnvelope className="text-gray-400 w-4 h-4" />
                      <span className="text-gray-600 truncate">{u.email}</span>
                    </div>
                    {u.department && (
                      <div className="flex items-center gap-2 text-sm">
                        <FaGraduationCap className="text-gray-400 w-4 h-4" />
                        <span className="text-gray-600">{u.department}</span>
                      </div>
                    )}
                    {u.status && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.status === 'active' ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!showOtherStaffLoading && filteredOtherStaff.length === 0 && (
          <div className="text-center py-10 text-gray-500">Нет сотрудников других ролей</div>
        )}
      </div>

      <TeacherSalaryRateForm
        isOpen={showSalaryRateForm}
        onClose={() => {
          setShowSalaryRateForm(false);
          setSelectedTeacher(null);
          setCurrentTeacherRate(null);
        }}
        onSubmit={handleSubmitRate}
        teacherId={selectedTeacher?.id || 0}
        teacherName={selectedTeacher ? `${selectedTeacher.user.surname} ${selectedTeacher.user.name}` : ''}
        currentRate={currentTeacherRate}
        isLoading={false}
      />
    </div>
  );
};

export default Teachers;
