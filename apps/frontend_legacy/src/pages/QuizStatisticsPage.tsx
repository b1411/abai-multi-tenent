import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaChartBar, FaUsers, FaTrophy, FaPercentage,
  FaEye, FaDownload, FaClock, FaQuestionCircle
} from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';
import { 
  quizService,
  QuizResponse,
  QuizStatistics,
  QuizSubmissionResponse
} from '../api';
import { motion } from 'framer-motion';

interface StudentResult {
  studentId: number;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  duration: string;
  answers: any;
}

const QuizStatisticsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmissionResponse[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'questions'>('overview');

  useEffect(() => {
    if (quizId) {
      loadQuizData();
    }
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем данные квиза
      const quizData = await quizService.getQuiz(parseInt(quizId!));
      setQuiz(quizData);

      // Загружаем статистику
      const statsData = await quizService.getStatistics(parseInt(quizId!));
      setStatistics(statsData);

      // Загружаем результаты студентов
      const submissionsData = await quizService.getSubmissions(parseInt(quizId!));
      setSubmissions(submissionsData);

      // Преобразуем результаты для отображения
      const results: StudentResult[] = submissionsData.map(submission => ({
        studentId: submission.studentId,
        studentName: `Студент ${submission.studentId}`, // TODO: загрузить имена студентов
        score: submission.score || 0,
        maxScore: quizData.maxScore || 100,
        percentage: Math.round(((submission.score || 0) / (quizData.maxScore || 100)) * 100),
        submittedAt: new Date(submission.submittedAt).toLocaleString('ru-RU'),
        duration: 'N/A', // TODO: вычислить продолжительность
        answers: JSON.parse(submission.answers || '{}'),
      }));

      setStudentResults(results);

    } catch (err) {
      setError('Ошибка при загрузке данных квиза');
      console.error('Error loading quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    // TODO: Реализовать экспорт в CSV/Excel
    const csvContent = [
      ['Студент', 'Баллы', 'Процент', 'Время сдачи'],
      ...studentResults.map(result => [
        result.studentName,
        `${result.score}/${result.maxScore}`,
        `${result.percentage}%`,
        result.submittedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-${quiz?.name}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 75) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Статистика теста</h1>
            {quiz && (
              <p className="text-gray-600 mt-1">
                {quiz.name} • {quiz.questions.length} вопросов • {quiz.duration} мин
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={exportResults}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
        >
          <FaDownload className="mr-2" />
          Экспорт результатов
        </button>
      </div>

      {/* Карточки с общей статистикой */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего попыток</p>
                <p className="text-2xl font-bold">{statistics.totalSubmissions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaChartBar className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Средний балл</p>
                <p className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaPercentage className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Процент успешности</p>
                <p className="text-2xl font-bold">{statistics.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaTrophy className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Лучший результат</p>
                <p className="text-2xl font-bold">
                  {Math.max(...studentResults.map(r => r.percentage), 0)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Табы */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaUsers className="inline mr-2" />
            Результаты студентов ({studentResults.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaQuestionCircle className="inline mr-2" />
            Анализ вопросов
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Распределение оценок</h3>
            <div className="grid grid-cols-4 gap-4">
              {['A (90-100%)', 'B (75-89%)', 'C (60-74%)', 'D (<60%)'].map((grade, index) => {
                const ranges = [[90, 100], [75, 89], [60, 74], [0, 59]];
                const count = studentResults.filter(r => 
                  r.percentage >= ranges[index][0] && r.percentage <= ranges[index][1]
                ).length;
                const percentage = studentResults.length > 0 ? (count / studentResults.length) * 100 : 0;
                
                return (
                  <div key={grade} className="text-center">
                    <div className="text-2xl font-bold mb-1">{count}</div>
                    <div className="text-sm text-gray-600 mb-2">{grade}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {quiz && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Информация о тесте</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Статус</p>
                  <p className={`font-medium ${quiz.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {quiz.isActive ? 'Активен' : 'Неактивен'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Время на выполнение</p>
                  <p className="font-medium flex items-center">
                    <FaClock className="mr-1" />
                    {quiz.duration} мин
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Количество вопросов</p>
                  <p className="font-medium">{quiz.questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Максимальный балл</p>
                  <p className="font-medium">{quiz.maxScore}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Результаты студентов</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Студент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Баллы
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Процент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Оценка
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время сдачи
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentResults.map((result, index) => (
                  <tr key={result.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.studentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.score} / {result.maxScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {result.percentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.percentage)}`}>
                        {getGradeLetter(result.percentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.submittedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center">
                        <FaEye className="mr-1" />
                        Посмотреть ответы
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {studentResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaUsers className="mx-auto text-4xl mb-4" />
                <p>Студенты еще не проходили этот тест</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questions' && statistics && (
        <div className="space-y-4">
          {statistics.questionStatistics.map((questionStat, index) => (
            <div key={questionStat.questionId} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-lg mb-2">
                    Вопрос {index + 1}
                  </h4>
                  <p className="text-gray-700 mb-3">{questionStat.questionText}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    questionStat.successRate >= 75 ? 'text-green-600' :
                    questionStat.successRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {questionStat.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">успешность</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Правильных ответов: {questionStat.correctAnswers} из {questionStat.totalAnswers}
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      questionStat.successRate >= 75 ? 'bg-green-500' :
                      questionStat.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${questionStat.successRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {statistics.questionStatistics.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
              <FaQuestionCircle className="mx-auto text-4xl mb-4" />
              <p>Нет данных для анализа вопросов</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizStatisticsPage;
