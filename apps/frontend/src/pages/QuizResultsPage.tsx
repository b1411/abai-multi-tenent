import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { quizService, Quiz, QuizQuestion, QuizAnswer } from '../services/quizService';
import { studentService } from '../services/studentService';
import { useAuth } from '../hooks/useAuth';
import { Button, Loading } from '../components/ui';
import { BarChart, User, Calendar, Award, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Student {
    id: number;
    user: {
        name: string;
        surname: string;
    }
}

interface StudentAnswer {
    id: number;
    isCorrect: boolean;
    question: QuizQuestion;
    answer?: QuizAnswer;
    textAnswer?: string;
}

interface Attempt {
    id: number;
    startTime: string;
    score: number;
    status: string;
    quiz: Quiz;
    student?: Student;
    studentAnswers: StudentAnswer[];
}

const QuizResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizIdFromUrl = searchParams.get('quizId');
  const { user, hasRole } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(quizIdFromUrl || '');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('ADMIN');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isTeacherOrAdmin) {
          const studentRes = await studentService.getAllStudents(); 
          const quizRes = await quizService.getQuizzes({ page: 1, limit: 100 });
          setStudents(studentRes);
          setQuizzes(quizRes.data);
        } else {
          // Для студентов загружаем только их результаты
          const myAttempts = await quizService.getMyAttempts();
          setAttempts(myAttempts);
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };
    fetchData();
  }, [isTeacherOrAdmin]);

  // Автоматически загружаем результаты для теста, если передан quizId (только для учителей)
  useEffect(() => {
    if (quizIdFromUrl && isTeacherOrAdmin) {
      handleShowAllResults(quizIdFromUrl);
    }
  }, [quizIdFromUrl, isTeacherOrAdmin]);

  const handleShowAllResults = async (quizId: string) => {
    setLoading(true);
    try {
      const [allAttempts, quizDetails] = await Promise.all([
        quizService.getAllAttemptsByQuiz(quizId),
        quizService.getQuizById(parseInt(quizId))
      ]);
      setAttempts(allAttempts);
      setQuiz(quizDetails);
    } catch (error) {
      console.error("Ошибка при загрузке результатов:", error);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowResults = async () => {
    if (!selectedStudent || !selectedQuiz) {
      alert('Пожалуйста, выберите студента и тест');
      return;
    }
    setLoading(true);
    try {
      const res = await quizService.getStudentAttemptsByQuiz(selectedStudent, selectedQuiz);
      setAttempts(res);
      setQuiz(null);
    } catch (error) {
      console.error("Ошибка при загрузке результатов:", error);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllQuizResults = async () => {
    if (!selectedQuiz) {
      alert('Пожалуйста, выберите тест');
      return;
    }
    await handleShowAllResults(selectedQuiz);
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
        <Loading text="Загрузка результатов..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BarChart className="h-8 w-8 mr-3 text-blue-600" />
          Результаты тестов
        </h1>
        <p className="text-gray-600">
          {isTeacherOrAdmin 
            ? 'Просматривайте и анализируйте результаты тестов студентов' 
            : 'Ваши результаты по всем пройденным тестам'
          }
        </p>
      </div>
      
      {/* Показать заголовок теста, если загружены результаты для конкретного теста */}
      {quiz && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{quiz.name}</h2>
              <p className="text-blue-700">Все попытки студентов по этому тесту</p>
            </div>
            <div className="text-right">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Всего попыток</p>
                <p className="text-2xl font-bold text-blue-600">{attempts.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Фильтры для учителей */}
      {isTeacherOrAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Фильтры</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Студент
              </label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Все студенты</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.user.name} {student.user.surname}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BarChart className="h-4 w-4 inline mr-1" />
                Тест
              </label>
              <select 
                value={selectedQuiz} 
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Все тесты</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleShowResults}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                {loading ? 'Загрузка...' : 'Показать результаты студента'}
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleShowAllQuizResults}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                {loading ? 'Загрузка...' : 'Все результаты теста'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Результаты */}
      <div>
        {attempts.length > 0 ? (
          <div className="space-y-6">
            {/* Для учителей: группируем по студентам, если показываем все результаты теста */}
            {quiz && isTeacherOrAdmin ? (
              (() => {
                const groupedAttempts = attempts.reduce((groups, attempt) => {
                  const studentKey = `${attempt.student?.user.surname} ${attempt.student?.user.name}`;
                  if (!groups[studentKey]) {
                    groups[studentKey] = [];
                  }
                  groups[studentKey].push(attempt);
                  return groups;
                }, {} as Record<string, Attempt[]>);

                return Object.entries(groupedAttempts).map(([studentName, studentAttempts]) => (
                  <div key={studentName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <User className="h-5 w-5 mr-2 text-gray-600" />
                          {studentName}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {studentAttempts.length} {studentAttempts.length === 1 ? 'попытка' : 'попыток'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-4">
                        {studentAttempts.map(attempt => (
                          <div key={attempt.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(attempt.startTime).toLocaleString()}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                attempt.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {attempt.status === 'COMPLETED' ? 'Завершено' : 'В процессе'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Award className="h-5 w-5 mr-2 text-gray-600" />
                                <span className="font-semibold">Результат:</span>
                                <span className={`ml-2 font-bold ${getScoreColor(attempt.score, quiz.questions?.length || 0)}`}>
                                  {attempt.score} / {quiz.questions?.length || 0}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                {quiz.questions?.length && (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(attempt.score, quiz.questions.length)}`}>
                                    {Math.round((attempt.score / quiz.questions.length) * 100)}%
                                  </span>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/quiz/attempt/${attempt.id}/result`)}
                                  className="text-xs"
                                >
                                  Подробнее
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()
            ) : (
              // Показываем детальные результаты для студента или все результаты студента
              attempts.map(attempt => (
                <div key={attempt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        {isTeacherOrAdmin && attempt.student && (
                          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                            <User className="h-5 w-5 mr-2 text-gray-600" />
                            {attempt.student.user.name} {attempt.student.user.surname}
                          </h2>
                        )}
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          {attempt.quiz.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Попытка от {new Date(attempt.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold mb-2 ${getScoreColor(attempt.score, attempt.quiz.questions?.length || 0)}`}>
                          {attempt.score} / {attempt.quiz.questions?.length || 0}
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            attempt.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attempt.status === 'COMPLETED' ? 'Завершено' : 'В процессе'}
                          </span>
                          {attempt.quiz.questions?.length && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(attempt.score, attempt.quiz.questions.length)}`}>
                              {Math.round((attempt.score / attempt.quiz.questions.length) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {attempt.studentAnswers && attempt.studentAnswers.length > 0 && (
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-gray-600" />
                        Детальные ответы
                      </h4>
                      <div className="grid gap-4">
                        {attempt.studentAnswers.map((sa: StudentAnswer, index: number) => (
                          <div key={sa.id} className={`p-4 rounded-lg border-2 transition-colors ${
                            sa.isCorrect 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="font-semibold text-gray-900">
                                Вопрос {index + 1}
                              </h5>
                              <div className="flex items-center">
                                {sa.isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                )}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  sa.isCorrect 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {sa.isCorrect ? 'Правильно' : 'Неправильно'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-gray-800">
                                <strong>Вопрос:</strong> {sa.question.name}
                              </p>
                              <p className="text-gray-700">
                                <strong>Ваш ответ:</strong> 
                                <span className={sa.isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                  {sa.answer?.name || sa.textAnswer}
                                </span>
                              </p>
                              {sa.isCorrect === false && (
                                <p className="text-green-700">
                                  <strong>Правильный ответ:</strong> 
                                  <span className="font-medium">
                                    {sa.question.answers?.find(a => a.isCorrect)?.name}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
              <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет результатов</h3>
              <p className="text-gray-600">
                {quizIdFromUrl 
                  ? 'Пока нет результатов для этого теста.' 
                  : isTeacherOrAdmin
                    ? 'Выберите тест или студента для просмотра результатов.'
                    : 'У вас пока нет результатов по тестам.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResultsPage;
