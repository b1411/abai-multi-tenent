import React, { useState } from 'react';
import { useLoyaltyAnalytics, useReviews } from '../hooks/useLoyalty';
import { LoyaltyFilter } from '../types/loyalty';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import ReviewForm from '../components/ReviewForm';

const Loyalty: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reviews' | 'add-review'>('analytics');
  const [filter, setFilter] = useState<LoyaltyFilter>({ period: 'month' });

  const {
    analytics,
    trends,
    summary,
    loading: analyticsLoading,
    error: analyticsError,
    updateFilter: updateAnalyticsFilter,
  } = useLoyaltyAnalytics(filter);

  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
    updateFilter: updateReviewsFilter,
  } = useReviews();

  const handleFilterChange = (newFilter: Partial<LoyaltyFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    
    if (activeTab === 'analytics') {
      updateAnalyticsFilter(updatedFilter);
    } else {
      updateReviewsFilter(updatedFilter);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Всего отзывов</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalReviews}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Средний рейтинг</h3>
              <p className="text-2xl font-bold text-blue-600">
                {summary.averageRating.toFixed(1)}/5
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Активных учителей</h3>
              <p className="text-2xl font-bold text-green-600">{summary.activeTeachers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Активных групп</h3>
              <p className="text-2xl font-bold text-purple-600">{summary.activeGroups}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Повторные покупки</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {summary.repeatPurchaseRate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Уровень удовлетворенности</h3>
              <p className="text-2xl font-bold text-orange-600">
                {summary.satisfactionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Распределение рейтингов */}
        {analytics && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Распределение рейтингов</h3>
            <div className="space-y-3">
              {analytics.ratingDistribution.map((item) => (
                <div key={item.rating} className="flex items-center">
                  <span className="w-12 text-sm text-gray-600">{item.rating} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(item._count.rating / analytics.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-600 text-right">
                    {item._count.rating} ({((item._count.rating / analytics.totalReviews) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Топ учителей */}
        {analytics && analytics.topTeachers.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Топ учителей по рейтингу</h3>
            <div className="space-y-3">
              {analytics.topTeachers.slice(0, 10).map((teacher, index) => (
                <div key={teacher.teacherId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {teacher.teacher?.user ? 
                          `${teacher.teacher.user.name} ${teacher.teacher.user.surname}` : 
                          'Неизвестный учитель'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {teacher._count.rating} отзыв{teacher._count.rating > 1 ? 'а' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Тренды рейтингов</h3>
            <div className="space-y-2">
              {trends.slice(-10).map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">
                    {new Date(trend.period).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {trend.review_count} отзыв{trend.review_count > 1 ? 'ов' : ''}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
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

  const renderReviews = () => {
    if (reviewsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      );
    }

    if (reviewsError) {
      return <Alert variant="error" message={reviewsError} />;
    }

    if (!reviews || reviews.data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Отзывы не найдены</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reviews.data.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {review.teacher?.user ? 
                    `${review.teacher.user.name} ${review.teacher.user.surname}` : 
                    'Неизвестный учитель'
                  }
                </h4>
                <p className="text-sm text-gray-500">Группа: {review.group?.name}</p>
              </div>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>👍 {review.likes}</span>
                <span>💡 {review.helpful}</span>
              </div>
              <span>
                {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Пагинация */}
        {reviews.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {Array.from({ length: reviews.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handleFilterChange({ page })}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === reviews.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Анализ лояльности студентов</h1>
        <p className="text-gray-600">Мониторинг отзывов и удовлетворенности студентов</p>
      </div>

      {/* Фильтры */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
            <select
              value={filter.period || 'month'}
              onChange={(e) => handleFilterChange({ period: e.target.value as any })}
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
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Аналитика
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Отзывы
            </button>
            <button
              onClick={() => setActiveTab('add-review')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Добавить отзыв
            </button>
          </nav>
        </div>
      </div>

      {/* Контент */}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'reviews' && renderReviews()}
      {activeTab === 'add-review' && (
        <ReviewForm 
          onSubmit={() => {
            // Переключаемся на вкладку с отзывами после успешного добавления
            setActiveTab('reviews');
            // Обновляем данные
            updateReviewsFilter(filter);
          }}
        />
      )}
    </div>
  );
};

export default Loyalty;
