import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart, CheckCircle, XCircle, Clock, User, Award } from 'lucide-react';
import { Button, Loading } from '../components/ui';
import { quizService } from '../services/quizService';
import { useAuth } from '../hooks/useAuth';

interface AttemptResult {
  id: number;
  startTime: string;
  endTime?: string;
  score: number;
  status: string;
  quiz: {
    id: number;
    name: string;
    maxScore?: number;
    questions: any[];
  };
  student?: {
    user: {
      name: string;
      surname: string;
    };
  };
  studentAnswers: Array<{
    id: number;
    isCorrect: boolean;
    question: {
      id: number;
      name: string;
      type?: string;
      createdAt?: string;
      answers: Array<{
        id: number;
        name: string;
        isCorrect: boolean;
      }>;
    };
    answer?: {
      id: number;
      name: string;
    };
    textAnswer?: string;
  }>;
}

const QuizAttemptResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [attempt, setAttempt] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attemptId) {
      loadAttemptResult();
    }
  }, [attemptId]);

  const loadAttemptResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await quizService.getAttemptResult(parseInt(attemptId!));
      setAttempt(result);
    } catch (error: any) {
      console.error('Ошибка при загрузке результата:', error);
      setError(error.message || 'Не удалось загрузить результат попытки');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка результата..." />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Ошибка</h3>
          <p className="text-red-800">{error || 'Результат не найден'}</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  const totalQuestions = attempt.quiz.questions?.length || attempt.studentAnswers.length;
  const percentage = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Результат теста</h1>
            <p className="text-gray-500 mt-1">{attempt.quiz.name}</p>
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            {hasRole('TEACHER') || hasRole('ADMIN') ? (
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                {attempt.student?.user.name} {attempt.student?.user.surname}
              </h2>
            ) : (
              <h2 className="text-xl font-bold text-gray-900 mb-1">Ваш результат</h2>
            )}
            <h3 className="text-lg font-semibold text-blue-900 mb-2">{attempt.quiz.name}</h3>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Завершен: {new Date(attempt.startTime).toLocaleString()}
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Статус: {attempt.status === 'COMPLETED' ? 'Завершено' : 'В процессе'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold mb-2 ${getScoreColor(attempt.score, totalQuestions)}`}>
              {attempt.score} / {totalQuestions}
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${getScoreBadgeColor(attempt.score, totalQuestions)}`}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      {attempt.studentAnswers && attempt.studentAnswers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-gray-600" />
            Детальные результаты
          </h4>
          
          <div className="space-y-6">
            {attempt.studentAnswers.map((studentAnswer, index) => (
              <div
                key={studentAnswer.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  studentAnswer.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">
                    Вопрос {index + 1}
                  </h5>
                  <div className="flex items-center">
                    {studentAnswer.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      studentAnswer.isCorrect 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {studentAnswer.isCorrect ? 'Правильно' : 'Неправильно'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-gray-800">
                    <strong>Вопрос:</strong> {studentAnswer.question.name}
                  </p>
                  
                  {/* Ответ студента */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      <strong>{hasRole('TEACHER') || hasRole('ADMIN') ? 'Ответ студента:' : 'Ваш ответ:'}</strong>
                    </p>
                    <div className={`p-2 rounded border-2 ${
                      studentAnswer.isCorrect 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-red-300 bg-red-50'
                    }`}>
                      <span className={`font-medium ${
                        studentAnswer.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {studentAnswer.answer?.name || studentAnswer.textAnswer || 'Не отвечено'}
                      </span>
                    </div>
                  </div>

                  {/* Показываем все варианты ответов для учителя */}
                  {(hasRole('TEACHER') || hasRole('ADMIN')) && studentAnswer.question.answers && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-700 mb-2">
                        <strong>Все варианты ответов:</strong>
                      </p>
                      <div className="space-y-1">
                        {studentAnswer.question.answers.map((answer, idx) => (
                          <div 
                            key={answer.id} 
                            className={`p-2 rounded text-sm flex items-center justify-between ${
                              answer.isCorrect 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span>{answer.name}</span>
                            <div className="flex items-center space-x-2">
                              {answer.isCorrect && (
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">
                                  ✓ Правильный
                                </span>
                              )}
                              {studentAnswer.answer?.id === answer.id && (
                                <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                                  Выбран студентом
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Правильный ответ для студента (только если неправильно) */}
                  {!studentAnswer.isCorrect && !hasRole('TEACHER') && !hasRole('ADMIN') && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-700">
                        <strong>Правильный ответ:</strong> 
                        <span className="ml-1 font-medium">
                          {studentAnswer.question.answers?.find(a => a.isCorrect)?.name || 'Не определен'}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Дополнительная информация для учителя */}
                  {(hasRole('TEACHER') || hasRole('ADMIN')) && (
                    <div className="bg-gray-50 p-3 rounded-lg border-t-2 border-gray-300">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Время ответа:</strong> {new Date(studentAnswer.question.createdAt || '').toLocaleString()}</p>
                        <p><strong>Тип вопроса:</strong> {
                          studentAnswer.question.type === 'SINGLE_CHOICE' ? 'Одиночный выбор' :
                          studentAnswer.question.type === 'MULTIPLE_CHOICE' ? 'Множественный выбор' :
                          studentAnswer.question.type === 'TEXT' ? 'Текстовый ответ' : 'Неизвестно'
                        }</p>
                        {studentAnswer.textAnswer && (
                          <div className="mt-2">
                            <p><strong>Текстовый ответ:</strong></p>
                            <div className="bg-white p-2 rounded border mt-1">
                              <span className="text-gray-800">{studentAnswer.textAnswer}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {attempt.studentAnswers.filter(sa => sa.isCorrect).length}
                </div>
                <div className="text-sm text-green-800">Правильных ответов</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {attempt.studentAnswers.filter(sa => !sa.isCorrect).length}
                </div>
                <div className="text-sm text-red-800">Неправильных ответов</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
                <div className="text-sm text-blue-800">Общий результат</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/quiz/results')}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Все результаты
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>
    </div>
  );
};

export default QuizAttemptResultPage;
