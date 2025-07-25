import React from 'react';
import { FaChartPie, FaExclamationTriangle, FaCheckCircle, FaTimes, FaUsers, FaBook } from 'react-icons/fa';
import { AnalyticsData } from '../../types/fakePositions';

interface AnalyticsPanelProps {
  analytics: AnalyticsData;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics }) => {
  const getStatusColor = (status: 'confirmed' | 'mismatch' | 'absent') => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'mismatch':
        return 'text-yellow-600 bg-yellow-100';
      case 'absent':
        return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: 'confirmed' | 'mismatch' | 'absent') => {
    switch (status) {
      case 'confirmed':
        return <FaCheckCircle className="w-6 h-6" />;
      case 'mismatch':
        return <FaExclamationTriangle className="w-6 h-6" />;
      case 'absent':
        return <FaTimes className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <FaChartPie className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Аналитика посещаемости
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Confirmed */}
          <div className={`rounded-lg p-4 border ${getStatusColor('confirmed')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Подтверждено</p>
                <p className="text-2xl font-bold text-green-900">{analytics.confirmedPercentage}%</p>
                <p className="text-xs text-green-700">{analytics.confirmed} из {analytics.totalRecords}</p>
              </div>
              <div className="text-green-600">
                {getStatusIcon('confirmed')}
              </div>
            </div>
          </div>

          {/* Mismatch */}
          <div className={`rounded-lg p-4 border ${getStatusColor('mismatch')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Несовпадение</p>
                <p className="text-2xl font-bold text-yellow-900">{analytics.mismatchPercentage}%</p>
                <p className="text-xs text-yellow-700">{analytics.mismatch} из {analytics.totalRecords}</p>
              </div>
              <div className="text-yellow-600">
                {getStatusIcon('mismatch')}
              </div>
            </div>
          </div>

          {/* Absent */}
          <div className={`rounded-lg p-4 border ${getStatusColor('absent')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Неявка</p>
                <p className="text-2xl font-bold text-red-900">{analytics.absentPercentage}%</p>
                <p className="text-xs text-red-700">{analytics.absent} из {analytics.totalRecords}</p>
              </div>
              <div className="text-red-600">
                {getStatusIcon('absent')}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Общая статистика</span>
            <span>{analytics.totalRecords} записей</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${analytics.confirmedPercentage}%` }}
              />
              <div 
                className="bg-yellow-500 transition-all duration-500"
                style={{ width: `${analytics.mismatchPercentage}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${analytics.absentPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Violators */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaUsers className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Преподаватели с нарушениями
            </h3>
          </div>

          {analytics.topViolators.length > 0 ? (
            <div className="space-y-3">
              {analytics.topViolators.map((violator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{violator.teacherName}</p>
                    <p className="text-sm text-gray-600">
                      {violator.violations} нарушени{violator.violations === 1 ? 'е' : violator.violations < 5 ? 'я' : 'й'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      violator.violations >= 5 
                        ? 'bg-red-100 text-red-800' 
                        : violator.violations >= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {violator.violations >= 5 ? 'Критично' : violator.violations >= 3 ? 'Внимание' : 'Контроль'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FaCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">Нарушений не найдено</p>
            </div>
          )}
        </div>

        {/* Subject Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaBook className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Статистика по предметам
            </h3>
          </div>

          {analytics.subjectStats.length > 0 ? (
            <div className="space-y-3">
              {analytics.subjectStats.slice(0, 5).map((subject, index) => {
                const violationPercentage = subject.total > 0 
                  ? Math.round((subject.violations / subject.total) * 100) 
                  : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {subject.subject}
                      </span>
                      <span className="text-xs text-gray-500">
                        {subject.violations}/{subject.total} ({violationPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="flex h-full rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500"
                          style={{ width: `${100 - violationPercentage}%` }}
                        />
                        <div 
                          className="bg-red-500"
                          style={{ width: `${violationPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <FaBook className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Данные по предметам отсутствуют</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary & Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Сводка и рекомендации
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Общее состояние:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Уровень подтверждений: {analytics.confirmedPercentage}% 
                {analytics.confirmedPercentage >= 80 ? ' (отлично)' : 
                 analytics.confirmedPercentage >= 60 ? ' (хорошо)' : ' (требует внимания)'}
              </li>
              <li>
                • Общее количество нарушений: {analytics.mismatch + analytics.absent} 
                ({analytics.mismatchPercentage + analytics.absentPercentage}%)
              </li>
              <li>
                • Проблемных преподавателей: {analytics.topViolators.length}
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Рекомендации:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {analytics.confirmedPercentage < 60 && (
                <li>• Провести обучение по использованию системы отметок</li>
              )}
              {analytics.topViolators.length > 0 && (
                <li>• Индивидуальная работа с преподавателями-нарушителями</li>
              )}
              {analytics.mismatchPercentage > 20 && (
                <li>• Проверить техническое состояние QR/Face ID систем</li>
              )}
              <li>• Регулярный мониторинг посещаемости</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Данные обновлены: {new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
