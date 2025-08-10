import React, { useState } from 'react';
import { useLoyaltyAnalytics } from '../hooks/useLoyalty';
import { LoyaltyFilter } from '../types/loyalty';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import FeedbackResponsesViewer from '../components/FeedbackResponsesViewer';

const Loyalty: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'feedback'>('analytics');
  const [filter, setFilter] = useState<LoyaltyFilter>({ period: 'month' });

  const {
    analytics,
    trends,
    summary,
    loading: analyticsLoading,
    error: analyticsError,
  updateFilter: updateAnalyticsFilter,
  feedbackBased,
  } = useLoyaltyAnalytics(filter);

  const handleFilterChange = (newFilter: Partial<LoyaltyFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);

    if (activeTab === 'analytics') updateAnalyticsFilter(updatedFilter);
  };

  const handleTabChange = (tab: 'analytics' | 'feedback') => {
    setActiveTab(tab);
  };

  const renderAnalytics = () => {
    if (analyticsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      );
    }

    if (analyticsError) {
      return <Alert variant="error" message={analyticsError} />;
    }

    return (
      <div className="space-y-6">
        {/* Общая статистика */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Всего отзывов</h3>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalReviews}</p>
            </div>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Средний рейтинг</h3>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {summary.averageRating.toFixed(1)}/5
              </p>
            </div>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Активных учителей</h3>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{summary.activeTeachers}</p>
            </div>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Активных групп</h3>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{summary.activeGroups}</p>
            </div>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Повторные покупки</h3>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600">
                {summary.repeatPurchaseRate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Уровень удовлетворенности</h3>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {summary.satisfactionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Метрики из feedback-ответов */}
        {feedbackBased && (
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Лояльность на основе Feedback</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Ответов</p>
                <p className="text-lg font-semibold text-blue-600">{feedbackBased.totalResponses}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Удовлетворенность</p>
                <p className="text-lg font-semibold text-green-600">{feedbackBased.averageSatisfaction}/10</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Рекомендация курса</p>
                <p className="text-lg font-semibold text-purple-600">{feedbackBased.recommendationScore}%</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Оценок преподавателя</p>
                <p className="text-lg font-semibold text-yellow-600">{feedbackBased.teacherRatings.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Распределение рейтингов */}
        {analytics && (
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Распределение рейтингов</h3>
            <div className="space-y-2 sm:space-y-3">
              {analytics.ratingDistribution.map((item) => (
                <div key={item.rating} className="flex items-center">
                  <span className="w-8 sm:w-12 text-xs sm:text-sm text-gray-600">{item.rating} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3 mx-2 sm:mx-3">
                    <div
                      className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(item._count.rating / analytics.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 sm:w-16 text-xs sm:text-sm text-gray-600 text-right">
                    {item._count.rating} ({((item._count.rating / analytics.totalReviews) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Топ учителей */}
        {analytics && analytics.topTeachers.length > 0 && (
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Топ учителей по рейтингу</h3>
            <div className="space-y-2 sm:space-y-3">
              {analytics.topTeachers.slice(0, 10).map((teacher, index) => (
                <div key={teacher.teacherId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mr-2 sm:mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        {teacher.teacher?.user ?
                          `${teacher.teacher.user.name} ${teacher.teacher.user.surname}` :
                          'Неизвестный учитель'
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {teacher._count.rating} отзыв{teacher._count.rating > 1 ? 'а' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm sm:text-base font-semibold text-blue-600">
                      {teacher._avg.rating?.toFixed(1)}/5
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Тренды */}
        {trends && trends.length > 0 && (
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Тренды рейтингов</h3>
            <div className="space-y-1 sm:space-y-2">
              {trends.slice(-10).map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {new Date(trend.period).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {trend.review_count} отзыв{trend.review_count > 1 ? 'ов' : ''}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-blue-600">
                      {Number(trend.average_rating).toFixed(1)}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeedbackResponses = () => (
    <div className="space-y-4">
      <FeedbackResponsesViewer />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Анализ лояльности студентов</h1>
        <p className="text-sm sm:text-base text-gray-600">Мониторинг отзывов и удовлетворенности студентов</p>
      </div>

      {/* Фильтры */}
      <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
            <select
              value={filter.period || 'month'}
              onChange={(e) => handleFilterChange({ period: e.target.value as 'month' | 'quarter' | 'year' })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="month">Месяц</option>
              <option value="quarter">Квартал</option>
              <option value="year">Год</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Рейтинг</label>
            <select
              value={filter.rating || ''}
              onChange={(e) => handleFilterChange({ rating: e.target.value ? Number(e.target.value) : undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все рейтинги</option>
              <option value="5">5 звезд</option>
              <option value="4">4 звезды</option>
              <option value="3">3 звезды</option>
              <option value="2">2 звезды</option>
              <option value="1">1 звезда</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата с</label>
            <input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
            <input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="mb-4 sm:mb-6">
        {/* Мобильная версия - дропдаун */}
        <div className="sm:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value as 'analytics' | 'feedback')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="analytics">Аналитика</option>
            <option value="feedback">Feedback ответы</option>
          </select>
        </div>

        {/* Десктопная версия - табы */}
        <div className="hidden sm:block border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Аналитика
            </button>
            <button
              onClick={() => handleTabChange('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Feedback ответы
            </button>
          </nav>
        </div>
      </div>

      {/* Контент */}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'feedback' && renderFeedbackResponses()}
    </div>
  );
};

export default Loyalty;
