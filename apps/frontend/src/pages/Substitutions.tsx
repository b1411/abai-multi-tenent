import React, { useState } from 'react';
import { 
  Calendar,
  Clock,
  User,
  Users,
  Filter,
  Search,
  RefreshCw,
  ArrowRightLeft,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { useSubstitutions } from '../hooks/useVacations';
import { vacationService } from '../services/vacationService';
import { useTeachers } from '../hooks/useTeachers';
import { VacationSubstitution } from '../types/vacation';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const SubstitutionCard: React.FC<{ substitution: VacationSubstitution }> = ({ substitution }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Замещение</h3>
            <p className="text-sm text-gray-600">ID заявки: {substitution.vacationId}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(substitution.status)}`}>
          {substitution.status === 'approved' ? 'Активно' : 
           substitution.status === 'pending' ? 'Ожидает' : 
           substitution.status === 'completed' ? 'Завершено' : 'Отклонено'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Отсутствующий:</span>
          </div>
          <div className="pl-6">
            <p className="font-medium text-gray-900">{substitution.originalEmployee.name}</p>
            {substitution.originalEmployee.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {substitution.originalEmployee.subjects.map((subject, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Замещающий:</span>
          </div>
          <div className="pl-6">
            {substitution.substituteEmployee.name ? (
              <>
                <p className="font-medium text-gray-900">{substitution.substituteEmployee.name}</p>
                {substitution.substituteEmployee.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {substitution.substituteEmployee.subjects.map((subject, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">Не назначен</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {vacationService.formatPeriod(substitution.period.start, substitution.period.end)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {vacationService.calculateDays(substitution.period.start, substitution.period.end)} дней
          </span>
        </div>
      </div>

      {substitution.topics.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Темы для изучения:</span>
          </div>
          <div className="pl-6">
            <ul className="list-disc list-inside space-y-1">
              {substitution.topics.map((topic, index) => (
                <li key={index} className="text-sm text-gray-600">{topic}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const Substitutions: React.FC = () => {
  const { teachers } = useTeachers();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    substitutions,
    loading,
    error,
    loadSubstitutions
  } = useSubstitutions({
    date: selectedDate,
    substituteId: selectedSubstitute || undefined
  });

  const handleRefresh = () => {
    loadSubstitutions({
      date: selectedDate,
      substituteId: selectedSubstitute || undefined
    });
  };

  const handleFiltersChange = () => {
    loadSubstitutions({
      date: selectedDate,
      substituteId: selectedSubstitute || undefined
    });
  };

  const filteredSubstitutions = substitutions.filter(substitution => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        substitution.originalEmployee.name.toLowerCase().includes(searchLower) ||
        (substitution.substituteEmployee.name && 
         substitution.substituteEmployee.name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Статистика
  const stats = {
    total: substitutions.length,
    active: substitutions.filter(s => s.status === 'approved').length,
    pending: substitutions.filter(s => s.status === 'pending').length,
    unassigned: substitutions.filter(s => !s.substituteEmployee.name).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление замещениями</h1>
          <p className="text-gray-600">Отслеживание и управление замещениями преподавателей</p>
        </div>
        <PermissionGuard module="vacations" action="read">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Обновить</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Всего замещений</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ожидают</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Без замещения</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Замещающий преподаватель
            </label>
            <select
              value={selectedSubstitute}
              onChange={(e) => setSelectedSubstitute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все преподаватели</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id.toString()}>
                  {teacher.user.name} {teacher.user.surname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFiltersChange}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Применить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      )}

      {/* Substitutions List */}
      <div className="space-y-4">
        {filteredSubstitutions.length > 0 ? (
          filteredSubstitutions.map((substitution, index) => (
            <SubstitutionCard key={`${substitution.vacationId}-${index}`} substitution={substitution} />
          ))
        ) : (
          <div className="text-center py-12">
            <ArrowRightLeft className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Замещения не найдены</h3>
            <p className="text-gray-600">
              {searchTerm || selectedSubstitute || selectedDate !== new Date().toISOString().split('T')[0]
                ? 'Попробуйте изменить параметры поиска'
                : 'На выбранную дату замещений не запланировано'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Substitutions;
