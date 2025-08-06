import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';
import { feedbackService, FeedbackTemplate, Question } from '../services/feedbackService';
import { studentService } from '../services/studentService';

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
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentTemplate = templates[currentTemplateIndex];
  const isLastTemplate = currentTemplateIndex === templates.length - 1;

  // Автосохранение черновиков
  const saveDraft = useCallback(async (templateId: number, currentAnswers: Record<string, any>) => {
    if (Object.keys(currentAnswers).length === 0) return;

    setAutoSaving(true);
    try {
      await feedbackService.submitResponse({
        templateId,
        answers: currentAnswers,
        isCompleted: false,
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setAutoSaving(false);
    }
  }, []);

  // Загрузка сохраненного черновика
  useEffect(() => {
    if (isOpen && templates.length > 0 && currentTemplateIndex === 0) {
      const loadDraft = async () => {
        try {
          // Попытка загрузить черновик для текущего шаблона
          const template = templates[currentTemplateIndex];
          if (template) {
            // Здесь можно добавить API для получения черновика
            // const draft = await feedbackService.getDraft(template.id);
            // if (draft && !draft.isCompleted) {
            //   setAnswers(draft.answers);
            // }
          }
        } catch (err) {
          console.error('Error loading draft:', err);
        }
      };

      setCurrentTemplateIndex(0);
      setAnswers({});
      setError(null);
      loadDraft();
    }
  }, [isOpen, templates]);

  // Автосохранение при изменении ответов
  useEffect(() => {
    if (currentTemplate && Object.keys(answers).length > 0) {
      const timeoutId = setTimeout(() => {
        saveDraft(currentTemplate.id, answers);
      }, 2000); // Сохраняем через 2 секунды после последнего изменения

      return () => clearTimeout(timeoutId);
    }
  }, [answers, currentTemplate, saveDraft]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isFormValid = () => {
    if (!currentTemplate) {
      console.log('Form invalid: no current template');
      return false;
    }

    const validation = currentTemplate.questions.map(question => {
      if (question.required !== false) {
        const answer = answers[question.id];
        const isValid = answer !== undefined && answer !== null && answer !== '';
        
        if (!isValid) {
          console.log(`Question "${question.question}" (ID: ${question.id}) is required but not answered. Answer:`, answer);
        }
        
        return { questionId: question.id, question: question.question, isValid, answer };
      }
      return { questionId: question.id, question: question.question, isValid: true, answer: answers[question.id] };
    });

    const allValid = validation.every(v => v.isValid);
    console.log('Form validation:', { allValid, validation, answers });
    
    return allValid;
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      setError('Пожалуйста, ответьте на все обязательные вопросы');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Проверяем, есть ли в шаблоне вопросы с оценкой преподавателей
      const hasTeacherRating = currentTemplate.questions.some(q => q.type === 'TEACHER_RATING');
      
      if (hasTeacherRating) {
        // Если есть оценки преподавателей, отправляем отдельный фидбек для каждого преподавателя
        const teacherRatingQuestions = currentTemplate.questions.filter(q => q.type === 'TEACHER_RATING');
        
        for (const question of teacherRatingQuestions) {
          const teacherRatings = answers[question.id];
          if (teacherRatings && typeof teacherRatings === 'object') {
            // Для каждого оцененного преподавателя создаем отдельный фидбек
            for (const [teacherId, rating] of Object.entries(teacherRatings)) {
              if (rating !== undefined && rating !== null) {
                await feedbackService.submitResponse({
                  templateId: currentTemplate.id,
                  answers: {
                    ...answers,
                    [question.id]: rating // Сохраняем только оценку конкретного преподавателя
                  },
                  isCompleted: true,
                  aboutTeacherId: parseInt(teacherId) // Указываем конкретного преподавателя
                });
              }
            }
          }
        }
      } else {
        // Обычный фидбек без привязки к преподавателю
        await feedbackService.submitResponse({
          templateId: currentTemplate.id,
          answers: answers,
          isCompleted: true,
        });
      }

      // Переходим к следующей форме или завершаем
      if (isLastTemplate) {
        onComplete();
      } else {
        const nextIndex = currentTemplateIndex + 1;
        setCurrentTemplateIndex(nextIndex);
        setAnswers({}); // Очищаем ответы для следующей формы
        setError(null); // Очищаем ошибки
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
                  className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${value === rating
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

      case 'RATING_1_10':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, rating)}
                  className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all text-sm ${value === rating
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 - Очень плохо</span>
              <span>10 - Превосходно</span>
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
                className={`px-6 py-3 rounded-lg font-medium transition-all ${value === (option === 'Да')
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

      case 'TEACHER_RATING':
        return <TeacherRatingComponent question={question} value={value} onChange={(v) => handleAnswerChange(question.id, v)} />;

      default:
        // Для неизвестных типов или типов общего назначения используем базовый рейтинг 1-5
        if (question.category === 'general' || !question.type) {
          return (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleAnswerChange(question.id, rating)}
                    className={`w-12 h-12 rounded-full border-2 font-semibold transition-all ${value === rating
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Совсем не удовлетворен</span>
                <span>Полностью удовлетворен</span>
              </div>
            </div>
          );
        }
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
              {/* Индикатор автосохранения */}
              <div className="flex items-center mt-1 text-xs">
                {autoSaving ? (
                  <span className="text-blue-600 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Сохранение...
                  </span>
                ) : lastSaved ? (
                  <span className="text-green-600">
                    Сохранено {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
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

// Компонент для оценки преподавателей
interface TeacherRatingComponentProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

const TeacherRatingComponent: React.FC<TeacherRatingComponentProps> = ({ question, value, onChange }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем список преподавателей студента
    const loadTeachers = async () => {
      try {
        setLoading(true);
        
        // Получаем ID текущего пользователя из localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role === 'STUDENT' && user.studentData?.id) {
          // Если у вопроса есть конкретные ID преподавателей, используем их
          if (question.teacherIds && question.teacherIds.length > 0) {
            // Загружаем конкретных преподавателей по ID
            const allTeachers = await studentService.getStudentTeachers(user.studentData.id);
            const filteredTeachers = allTeachers.filter(teacher => 
              question.teacherIds!.includes(teacher.id)
            );
            setTeachers(filteredTeachers.map(teacher => ({
              id: teacher.id,
              name: `${teacher.name} ${teacher.surname}`,
              subject: teacher.subject
            })));
          } else {
            // Загружаем всех преподавателей текущего студента
            const teachersData = await studentService.getStudentTeachers(user.studentData.id);
            setTeachers(teachersData.map(teacher => ({
              id: teacher.id,
              name: `${teacher.name} ${teacher.surname}`,
              subject: teacher.subject
            })));
          }
        } else {
          console.warn('Пользователь не является студентом или данные студента недоступны');
          setTeachers([]);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, [question.teacherIds]);

  const handleTeacherRating = (teacherId: number, rating: number) => {
    const currentRatings = value || {};
    onChange({
      ...currentRatings,
      [teacherId]: rating
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
        <span className="ml-2 text-gray-600">Загрузка преподавателей...</span>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="text-gray-500 py-4">
        Преподаватели не найдены
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
        <div key={teacher.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{teacher.name}</h4>
              <p className="text-sm text-gray-600">{teacher.subject}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-700">Оцените преподавателя:</p>
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleTeacherRating(teacher.id, rating)}
                  className={`w-10 h-10 rounded-full border-2 font-semibold transition-all ${
                    value?.[teacher.id] === rating
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 - Неудовлетворительно</span>
              <span>2 - Удовлетворительно</span>
              <span>3 - Хорошо</span>
              <span>4 - Очень хорошо</span>
              <span>5 - Отлично</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MandatoryFeedbackModal;
