import React, { useState, useEffect } from 'react';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';

interface Question {
  id: string;
  question: string;
  type: 'RATING_1_5' | 'RATING_1_10' | 'TEXT' | 'EMOTIONAL_SCALE' | 'YES_NO';
  category: string;
  required?: boolean;
}

interface FeedbackTemplate {
  id: number;
  name: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface MandatoryFeedbackModalProps {
  isOpen: boolean;
  templates: FeedbackTemplate[];
  onComplete: () => void;
}

const MandatoryFeedbackModal: React.FC<MandatoryFeedbackModalProps> = ({
  isOpen,
  templates,
  onComplete,
}) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTemplate = templates[currentTemplateIndex];
  const isLastTemplate = currentTemplateIndex === templates.length - 1;

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      // Сбрасываем состояние при открытии
      setCurrentTemplateIndex(0);
      setAnswers({});
      setError(null);
    }
  }, [isOpen, templates]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isFormValid = () => {
    if (!currentTemplate) return false;
    
    return currentTemplate.questions.every(question => {
      if (question.required !== false) {
        const answer = answers[question.id];
        return answer !== undefined && answer !== null && answer !== '';
      }
      return true;
    });
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      setError('Пожалуйста, ответьте на все обязательные вопросы');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Отправляем ответы на сервер
      const response = await fetch('/api/feedback/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          answers: answers,
          isCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке формы');
      }

      // Переходим к следующей форме или завершаем
      if (isLastTemplate) {
        onComplete();
      } else {
        setCurrentTemplateIndex(prev => prev + 1);
        setAnswers({}); // Очищаем ответы для следующей формы
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'RATING_1_5':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, rating)}
                  className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                    value === rating
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Очень плохо</span>
              <span>Отлично</span>
            </div>
          </div>
        );

      case 'EMOTIONAL_SCALE':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="100"
              value={value || 50}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>😢 Плохо (0)</span>
              <span className="font-medium text-gray-700">{value || 50}</span>
              <span>😊 Отлично (100)</span>
            </div>
          </div>
        );

      case 'YES_NO':
        return (
          <div className="flex space-x-4">
            {['Да', 'Нет'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswerChange(question.id, option === 'Да')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  value === (option === 'Да')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'TEXT':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ваш ответ..."
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen || templates.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentTemplate?.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Форма {currentTemplateIndex + 1} из {templates.length}
              </p>
            </div>
            <div className="text-right">
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${((currentTemplateIndex + 1) / templates.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {currentTemplate?.description && (
            <p className="text-gray-600 mt-2">{currentTemplate.description}</p>
          )}
        </div>

        {/* Вопросы */}
        <div className="p-6 space-y-8">
          {error && <Alert variant="error" message={error} />}
          
          {currentTemplate?.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex-1">
                  {index + 1}. {question.question}
                  {question.required !== false && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-4">
                  {question.category}
                </span>
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {/* Кнопки */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            Обязательная форма обратной связи
          </div>
          
          <button
            onClick={handleNext}
            disabled={!isFormValid() || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Отправка...</span>
              </>
            ) : (
              isLastTemplate ? 'Завершить' : 'Далее'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MandatoryFeedbackModal;
