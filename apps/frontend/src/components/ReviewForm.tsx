import React, { useState } from 'react';
import { loyaltyService } from '../services/loyaltyService';
import { Spinner } from './ui/Spinner';
import { Alert } from './ui/Alert';

interface ReviewFormProps {
  teacherId?: number;
  groupId?: number;
  onSubmit?: (review: any) => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  teacherId,
  groupId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    teacherId: teacherId || 0,
    groupId: groupId || 0,
    rating: 5,
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacherId || !formData.groupId || !formData.comment.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Sending review data:', formData);
      const review = await loyaltyService.createReview(formData);
      console.log('Review created successfully:', review);
      setSuccess(true);
      
      // Вызываем callback для обновления данных
      if (onSubmit) {
        console.log('Calling onSubmit callback');
        onSubmit(review);
      }
      
      // Очищаем форму
      setFormData({
        teacherId: teacherId || 0,
        groupId: groupId || 0,
        rating: 5,
        comment: '',
      });
    } catch (err: any) {
      console.error('Error creating review:', err);
      setError(err.message || 'Ошибка при отправке отзыва');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Оставить отзыв о преподавателе</h3>
      
      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message="Отзыв успешно отправлен!" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Выбор преподавателя (если не задан) */}
        {!teacherId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Преподавателя
            </label>
            <input
              type="number"
              value={formData.teacherId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                teacherId: parseInt(e.target.value) || 0 
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите ID преподавателя"
            />
          </div>
        )}

        {/* Выбор группы (если не задана) */}
        {!groupId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Группы
            </label>
            <input
              type="number"
              value={formData.groupId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                groupId: parseInt(e.target.value) || 0 
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите ID группы"
            />
          </div>
        )}

        {/* Рейтинг */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оценка преподавателя
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-2xl transition-colors ${
                  star <= formData.rating 
                    ? 'text-yellow-400 hover:text-yellow-500' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Выбрано: {formData.rating} из 5 звезд
          </p>
        </div>

        {/* Комментарий */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ваш отзыв о преподавателе
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Расскажите о своем опыте обучения с этим преподавателем..."
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.comment.length}/500 символов
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Spinner size="sm" />
                <span className="ml-2">Отправка...</span>
              </div>
            ) : (
              'Отправить отзыв'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
