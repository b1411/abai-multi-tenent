import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaTrophy, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaBook,
  FaCalendarAlt,
  FaUser,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSpinner
} from 'react-icons/fa';
import { ktpService, KtpCompletionKpiResponse, KtpStatistics, KtpFilters } from '../services/ktpService';

interface KtpCompletionKpiProps {
  filters?: KtpFilters;
  className?: string;
}

const KtpCompletionKpi: React.FC<KtpCompletionKpiProps> = ({ filters = {}, className = '' }) => {
  const [kpiData, setKpiData] = useState<KtpCompletionKpiResponse | null>(null);
  const [statistics, setStatistics] = useState<KtpStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [kpiResponse, statsResponse] = await Promise.all([
        ktpService.getCompletionKpi(filters),
        ktpService.getStatistics(filters)
      ]);
      
      setKpiData(kpiResponse);
      setStatistics(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 85) return 'text-green-600 bg-green-100 border-green-200';
    if (rate >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <FaArrowUp className="w-3 h-3 text-green-500" />;
    if (trend < 0) return <FaArrowDown className="w-3 h-3 text-red-500" />;
    return <FaMinus className="w-3 h-3 text-gray-400" />;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">2</div>;
      case 3:
        return <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold">3</div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{rank}</div>;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Загрузка КПИ по КТП...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Ошибка загрузки: {error}</span>
        </div>
      </div>
    );
  }

  if (!kpiData || !statistics) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <span className="text-gray-600">Нет данных для отображения</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaBook className="w-6 h-6 mr-3 text-blue-600" />
          КПИ по заполнению КТП
        </h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Общий прогресс</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.averageCompletion}%</p>
            </div>
            <FaChartLine className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Лидеры (≥85%)</p>
              <p className="text-3xl font-bold text-green-600">{kpiData.statistics.topPerformers}</p>
            </div>
            <FaTrophy className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">На треке (60-84%)</p>
              <p className="text-3xl font-bold text-orange-600">{kpiData.statistics.onTrack}</p>
            </div>
            <FaCheckCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Требуют внимания</p>
              <p className="text-3xl font-bold text-red-600">{kpiData.statistics.needsImprovement}</p>
            </div>
            <FaExclamationTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{statistics.totalKtp}</p>
            <p className="text-sm text-gray-600">Всего КТП</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{statistics.totalLessons}</p>
            <p className="text-sm text-gray-600">Всего уроков</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.completedLessons}</p>
            <p className="text-sm text-gray-600">Завершено уроков</p>
          </div>
        </div>
      </div>

      {/* Рейтинг преподавателей */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaUser className="w-5 h-5 mr-2" />
            Рейтинг преподавателей
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {kpiData.teachers.map((teacher) => (
              <div key={teacher.teacherId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  {getRankIcon(teacher.rank)}
                  <div>
                    <p className="font-semibold text-gray-900">{teacher.teacherName}</p>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <FaBook className="w-3 h-3 mr-1" />
                        {teacher.ktpCount} КТП
                      </span>
                      <span className="flex items-center">
                        <FaCalendarAlt className="w-3 h-3 mr-1" />
                        {teacher.completedLessons}/{teacher.totalLessons} уроков
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCompletionColor(teacher.completionRate)}`}>
                      {teacher.completionRate}%
                    </div>
                    <div className="flex items-center justify-end mt-1 text-xs">
                      {getTrendIcon(teacher.trend)}
                      <span className={`ml-1 ${
                        teacher.trend > 0 ? 'text-green-600' : 
                        teacher.trend < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {teacher.trend > 0 ? '+' : ''}{teacher.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {kpiData.teachers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FaUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Нет данных о преподавателях</p>
            </div>
          )}
        </div>
      </div>

      {/* Прогресс-бар общего выполнения */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Общий прогресс выполнения КТП</h3>
          <span className="text-lg font-bold text-gray-900">{statistics.averageCompletion}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600 transition-all duration-500"
            style={{ width: `${statistics.averageCompletion}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default KtpCompletionKpi;
