import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUserGraduate,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaCreditCard,
  FaUsers,
  FaBook,
  FaSmile,
  FaBrain,
  FaComments,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaDownload,
  FaEye,
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { useStudent } from '../hooks/useStudents';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { studentService, AttendanceData, FinanceData, EmotionalData, StudentRemarksResponse, CreateRemarkData, UpdateRemarkData, StudentRemark, StudentCommentsResponse, CreateCommentData, UpdateCommentData, StudentComment } from '../services/studentService';
import { feedbackService } from '../services/feedbackService';
import RemarkModal from '../components/RemarkModal';
import DeleteRemarkModal from '../components/DeleteRemarkModal';
import { CommentModal } from '../components/CommentModal';
import { DeleteCommentModal } from '../components/DeleteCommentModal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { student, grades, loading, error, refetch, fetchGrades } = useStudent(Number(id));

  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [emotionalData, setEmotionalData] = useState<EmotionalData | null>(null);
  const [remarksData, setRemarksData] = useState<StudentRemarksResponse | null>(null);
  const [commentsData, setCommentsData] = useState<StudentCommentsResponse | null>(null);
  const [loadingData, setLoadingData] = useState<Record<string, boolean>>({});

  // Состояние для модальных окон замечаний
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [deleteRemarkModalOpen, setDeleteRemarkModalOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState<StudentRemark | null>(null);
  const [deletingRemark, setDeletingRemark] = useState<StudentRemark | null>(null);

  // Состояние для модальных окон комментариев
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<StudentComment | null>(null);
  const [deletingComment, setDeletingComment] = useState<StudentComment | null>(null);

  // Функция для загрузки данных посещаемости
  const fetchAttendanceData = useCallback(async () => {
    if (!id) return;

    setLoadingData(prev => ({ ...prev, attendance: true }));
    try {
      const data = await studentService.getStudentAttendance(Number(id));
      setAttendanceData(data);
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости:', error);
    }
    setLoadingData(prev => ({ ...prev, attendance: false }));
  }, [id]);

  // Функция для загрузки финансовых данных
  const fetchFinanceData = useCallback(async () => {
    if (!id) return;

    setLoadingData(prev => ({ ...prev, finance: true }));
    try {
      const data = await studentService.getStudentFinances(Number(id));
      setFinanceData(data);
    } catch (error) {
      console.error('Ошибка загрузки финансовых данных:', error);
    }
    setLoadingData(prev => ({ ...prev, finance: false }));
  }, [id]);

  // Функция для загрузки эмоциональных данных
  const fetchEmotionalData = useCallback(async () => {
    if (!id) return;

    setLoadingData(prev => ({ ...prev, emotional: true }));
    try {
      // Используем обновленный метод из studentService, который автоматически
      // пытается получить данные из feedback системы, а затем из legacy
      const emotionalData = await studentService.getStudentEmotionalState(Number(id));
      setEmotionalData(emotionalData);
    } catch (error) {
      console.error('Ошибка загрузки эмоциональных данных:', error);
      setEmotionalData(null);
    }
    setLoadingData(prev => ({ ...prev, emotional: false }));
  }, [id]);

  // Функция для загрузки замечаний
  const fetchRemarksData = useCallback(async () => {
    if (!id) return;

    setLoadingData(prev => ({ ...prev, remarks: true }));
    try {
      const data = await studentService.getStudentRemarks(Number(id));
      setRemarksData(data);
    } catch (error) {
      console.error('Ошибка загрузки замечаний:', error);
    }
    setLoadingData(prev => ({ ...prev, remarks: false }));
  }, [id]);

  // Функция для загрузки комментариев
  const fetchCommentsData = useCallback(async () => {
    if (!id) return;

    setLoadingData(prev => ({ ...prev, comments: true }));
    try {
      const data = await studentService.getStudentComments(Number(id));
      setCommentsData(data);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
    setLoadingData(prev => ({ ...prev, comments: false }));
  }, [id]);

  // Функция для объединения данных из разных источников
  const combineEmotionalData = (feedbackData: any, legacyData: any) => {
    // Сначала проверяем данные из фидбеков
    if (feedbackData && feedbackData.currentState) {
      // Используем данные из фидбеков если они есть
      return {
        currentState: feedbackData.currentState,
        lastUpdated: feedbackData.lastUpdated,
        trends: feedbackData.trends,
        recommendations: feedbackData.recommendations,
        source: 'feedback',
        feedbackHistory: feedbackData.trends || [],
      };
    } else if (legacyData && legacyData.currentState) {
      // Используем данные из старой системы как fallback
      return {
        ...legacyData,
        source: 'legacy',
      };
    } else {
      // Возвращаем null если нет реальных данных - не показываем моки
      return null;
    }
  };

  useEffect(() => {
    if (student && activeTab === 'grades') {
      fetchGrades();
    } else if (student && activeTab === 'attendance') {
      fetchAttendanceData();
    } else if (student && activeTab === 'finance') {
      fetchFinanceData();
    } else if (student && activeTab === 'emotional') {
      fetchEmotionalData();
    } else if (student && activeTab === 'remarks') {
      fetchRemarksData();
    } else if (student && activeTab === 'comments') {
      fetchCommentsData();
    }
  }, [student?.id, activeTab]); // Убираем все функции из зависимостей - они мемоизированы

  const getAccessLevel = () => {
    if (!user || !student) return 'none';

    switch (user.role) {
      case 'STUDENT':
        return student.userId === user.id ? 'full' : 'basic';
      case 'PARENT':
        return student.Parents?.some(parent => parent.user.id === user.id) ? 'full' : 'none';
      case 'TEACHER':
      case 'ADMIN':
      case 'HR':
        return 'full';
      default:
        return 'none';
    }
  };

  const accessLevel = getAccessLevel();

  // Функции для работы с замечаниями
  const handleAddRemark = () => {
    setEditingRemark(null);
    setRemarkModalOpen(true);
  };

  const handleEditRemark = (remark: StudentRemark) => {
    setEditingRemark(remark);
    setRemarkModalOpen(true);
  };

  const handleDeleteRemark = (remark: StudentRemark) => {
    setDeletingRemark(remark);
    setDeleteRemarkModalOpen(true);
  };

  const handleRemarkSubmit = async (remarkData: CreateRemarkData | UpdateRemarkData) => {
    if (!id) return;

    try {
      if (editingRemark) {
        // Редактирование существующего замечания
        await studentService.updateStudentRemark(editingRemark.id, remarkData);
      } else {
        // Добавление нового замечания
        await studentService.addStudentRemark(Number(id), remarkData as CreateRemarkData);
      }

      // Перезагружаем данные замечаний
      await fetchRemarksData();
    } catch (error) {
      console.error('Ошибка при сохранении замечания:', error);
      throw error;
    }
  };

  const handleRemarkDelete = async () => {
    if (!deletingRemark) return;

    try {
      await studentService.deleteStudentRemark(deletingRemark.id);
      // Перезагружаем данные замечаний
      await fetchRemarksData();
    } catch (error) {
      console.error('Ошибка при удалении замечания:', error);
      throw error;
    }
  };

  const closeRemarkModal = () => {
    setRemarkModalOpen(false);
    setEditingRemark(null);
  };

  const closeDeleteModal = () => {
    setDeleteRemarkModalOpen(false);
    setDeletingRemark(null);
  };

  // Функции для работы с комментариями
  const handleAddComment = () => {
    setEditingComment(null);
    setCommentModalOpen(true);
  };

  const handleEditComment = (comment: StudentComment) => {
    setEditingComment(comment);
    setCommentModalOpen(true);
  };

  const handleDeleteComment = (comment: StudentComment) => {
    setDeletingComment(comment);
    setDeleteCommentModalOpen(true);
  };

  const handleCommentSubmit = async (commentData: CreateCommentData | UpdateCommentData) => {
    if (!id) return;

    try {
      if (editingComment) {
        // Редактирование существующего комментария
        await studentService.updateStudentComment(editingComment.id, commentData);
      } else {
        // Добавление нового комментария
        await studentService.addStudentComment(Number(id), commentData as CreateCommentData);
      }

      // Перезагружаем данные комментариев
      await fetchCommentsData();
    } catch (error) {
      console.error('Ошибка при сохранении комментария:', error);
      throw error;
    }
  };

  const handleCommentDelete = async () => {
    if (!deletingComment) return;

    try {
      await studentService.deleteStudentComment(deletingComment.id);
      // Перезагружаем данные комментариев
      await fetchCommentsData();
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      throw error;
    }
  };

  const closeCommentModal = () => {
    setCommentModalOpen(false);
    setEditingComment(null);
  };

  const closeDeleteCommentModal = () => {
    setDeleteCommentModalOpen(false);
    setDeletingComment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" message={error} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <Alert variant="error" message="Студент не найден" />
      </div>
    );
  }

  if (accessLevel === 'none') {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <FaUserGraduate className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ограниченный доступ</h2>
          <p className="text-gray-600 mb-4">
            У вас нет прав для просмотра информации об этом студенте
          </p>
          <button
            onClick={() => navigate('/students')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: FaUserGraduate },
    ...(accessLevel === 'full' && user?.role !== 'STUDENT' ? [
      { id: 'grades', label: 'Успеваемость', icon: FaChartLine },
      { id: 'attendance', label: 'Посещаемость', icon: FaClipboardList },
      { id: 'finance', label: 'Финансы', icon: FaCreditCard },
      { id: 'emotional', label: 'Эмоциональное состояние', icon: FaSmile },
      ...(user?.role === 'TEACHER' || user?.role === 'ADMIN' ? [
        { id: 'remarks', label: 'Замечания', icon: FaExclamationTriangle },
      ] : []),
      ...(user?.role === 'ADMIN' ? [
        { id: 'comments', label: 'Комментарии админам', icon: FaComments },
      ] : [])
    ] : [])
  ];

  return (
    <div className="p-6">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Студенты
        </button>
        <span>/</span>
        <span className="text-gray-900">{student.user.surname} {student.user.name}</span>
      </div>

      {/* Заголовок с информацией о студенте */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
            {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.user.surname} {student.user.name}
                  {student.user.middlename && ` ${student.user.middlename}`}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaUsers className="w-4 h-4" />
                    <span>{student.group.name}</span>
                  </div>
                  {accessLevel === 'full' && student.user.phone && (
                    <div className="flex items-center gap-1">
                      <FaPhone className="w-4 h-4" />
                      <span>{student.user.phone}</span>
                    </div>
                  )}
                  {accessLevel === 'full' && (
                    <div className="flex items-center gap-1">
                      <FaEnvelope className="w-4 h-4" />
                      <span>{student.user.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {accessLevel === 'full' && (
                <button
                  onClick={() => {/* TODO: Открыть чат */ }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaComments className="w-4 h-4" />
                  Написать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-6 mt-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`pb-4 px-2 text-sm font-medium flex items-center gap-2 ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Группа</label>
                  <p className="font-medium">{student.group.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Курс</label>
                  <p className="font-medium">{student.group.courseNumber}</p>
                </div>
                {accessLevel === 'full' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{student.user.email}</p>
                    </div>
                    {student.user.phone && (
                      <div>
                        <label className="text-sm text-gray-500">Телефон</label>
                        <p className="font-medium">{student.user.phone}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-500">Дата регистрации</label>
                      <p className="font-medium">
                        {new Date(student.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Последние результаты */}
            {accessLevel === 'full' && student.lessonsResults && student.lessonsResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Последние результаты</h2>
                <div className="space-y-3">
                  {student.lessonsResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{result.Lesson.name}</p>
                        <p className="text-sm text-gray-600">
                          {result.Lesson.studyPlan.name} • {new Date(result.Lesson.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.attendance !== null && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.attendance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {result.attendance ? 'Присутствовал' : 'Отсутствовал'}
                          </span>
                        )}
                        {result.lessonScore !== null && result.lessonScore !== undefined && (
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${result.lessonScore >= 4
                            ? 'bg-green-500'
                            : result.lessonScore >= 3
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}>
                            {result.lessonScore}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Родители/Кураторы */}
            {accessLevel === 'full' && student.Parents && student.Parents.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Родители</h3>
                <div className="space-y-3">
                  {student.Parents.map((parent) => (
                    <div key={parent.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {parent.user.surname} {parent.user.name}
                        </p>
                        {parent.user.phone && (
                          <p className="text-sm text-gray-600">{parent.user.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {/* TODO: Открыть чат с родителем */ }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FaComments className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Эмоциональное состояние */}
            {accessLevel === 'full' && student.EmotionalState && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Эмоциональное состояние</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Настроение</span>
                      <span className="text-sm font-medium">{student.EmotionalState.mood}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${student.EmotionalState.mood}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{student.EmotionalState.moodDesc}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Концентрация</span>
                      <span className="text-sm font-medium">{student.EmotionalState.concentration}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${student.EmotionalState.concentration}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{student.EmotionalState.concentrationDesc}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'grades' && accessLevel === 'full' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Успеваемость</h2>
          {grades ? (
            <div className="space-y-6">
              {Object.entries(grades).map(([subjectName, subjectData]) => (
                <div key={subjectName} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{subjectName}</h3>
                      <p className="text-sm text-gray-600">
                        Преподаватель: {subjectData.subject.teacher.user.surname} {subjectData.subject.teacher.user.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {subjectData.statistics.averageLessonScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Средний балл</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold">{subjectData.statistics.totalLessons}</div>
                      <div className="text-sm text-gray-600">Занятий</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">
                        {subjectData.statistics.averageHomeworkScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Ср. за ДЗ</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">
                        {subjectData.statistics.attendanceRate}%
                      </div>
                      <div className="text-sm text-gray-600">Посещаемость</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Последние оценки:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {subjectData.grades.slice(0, 10).map((grade, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${grade.lessonScore && grade.lessonScore >= 4
                            ? 'bg-green-500'
                            : grade.lessonScore && grade.lessonScore >= 3
                              ? 'bg-yellow-500'
                              : grade.lessonScore
                                ? 'bg-red-500'
                                : 'bg-gray-400'
                            }`}
                          title={`${grade.Lesson.name} - ${new Date(grade.Lesson.date).toLocaleDateString('ru-RU')}`}
                        >
                          {grade.lessonScore || '–'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaBook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Оценки загружаются...</p>
            </div>
          )}
        </div>
      )}

      {/* Вкладка посещаемости */}
      {activeTab === 'attendance' && accessLevel === 'full' && (
        <div className="space-y-6">
          {loadingData.attendance ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : attendanceData ? (
            <>
              {/* Статистика посещаемости */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Статистика посещаемости</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <FaCheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceData.summary.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600">Посещаемость</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <FaCalendarCheck className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {attendanceData.summary.attendedLessons}
                    </div>
                    <div className="text-sm text-gray-600">Присутствовал</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceData.summary.missedLessons}
                    </div>
                    <div className="text-sm text-gray-600">Пропустил</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <FaCalendarAlt className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-600">
                      {attendanceData.summary.totalLessons}
                    </div>
                    <div className="text-sm text-gray-600">Всего занятий</div>
                  </div>
                </div>

                {/* График посещаемости по предметам */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Посещаемость по предметам</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(attendanceData.subjectAttendance).map(([subject, data]) => ({
                      subject,
                      ...data
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attended" fill="#10B981" name="Присутствовал" />
                      <Bar dataKey="missed" fill="#EF4444" name="Пропустил" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Детальная история */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">История посещаемости</h3>
                <div className="space-y-3">
                  {attendanceData.details.slice(0, 10).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.subject}</p>
                        <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.attendance
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {record.attendance ? 'Присутствовал' : 'Отсутствовал'}
                        </span>
                        {record.absentReason && (
                          <span className="text-xs text-gray-500">{record.absentReason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center py-8">
                <FaClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Нет данных о посещаемости</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка финансов */}
      {activeTab === 'finance' && accessLevel === 'full' && (
        <div className="space-y-6">
          {loadingData.finance ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : financeData ? (
            <>
              {/* Финансовая сводка */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Финансовая сводка</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <FaCheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {financeData.summary.paidAmount.toLocaleString()} ₸
                    </div>
                    <div className="text-sm text-gray-600">Оплачено</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <FaFileInvoiceDollar className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {financeData.summary.pendingAmount.toLocaleString()} ₸
                    </div>
                    <div className="text-sm text-gray-600">К оплате</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold text-red-600">
                      {financeData.summary.overdueAmount.toLocaleString()} ₸
                    </div>
                    <div className="text-sm text-gray-600">Просрочено</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <FaMoneyBillWave className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {financeData.summary.paymentCount}
                    </div>
                    <div className="text-sm text-gray-600">Всего платежей</div>
                  </div>
                </div>

                {/* График платежей по типам */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Платежи по типам</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(financeData.paymentsByType).map(([type, data]) => ({
                          name: type,
                          value: data.total,
                          count: data.count
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {Object.entries(financeData.paymentsByType).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Последние платежи */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Последние платежи</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financeData.recentPayments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount.toLocaleString()} ₸
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {payment.status === 'paid' ? 'Оплачено' :
                                payment.status === 'overdue' ? 'Просрочено' : 'К оплате'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.dueDate).toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center py-8">
                <FaCreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Нет финансовых данных</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка эмоционального состояния */}
      {activeTab === 'emotional' && accessLevel === 'full' && (
        <div className="space-y-6">
          {loadingData.emotional ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : emotionalData ? (
            <>
              {/* Текущее состояние */}
              {emotionalData.currentState && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Текущее эмоциональное состояние</h2>
                    <div className="flex items-center gap-3">
                      {/* Индикатор источника данных */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${emotionalData.source === 'feedback' ? 'bg-green-100 text-green-800' :
                        emotionalData.source === 'legacy' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {emotionalData.source === 'feedback' ? '📊 Из фидбеков' :
                          emotionalData.source === 'legacy' ? '💾 Старая система' :
                            '⚠️ Нет данных'}
                      </div>

                      {/* Кнопка создания шаблонов если данных нет */}
                      {emotionalData.source === 'no_data' && user?.role === 'ADMIN' && (
                        <button
                          onClick={async () => {
                            try {
                              await feedbackService.createDefaultTemplates();
                              // Перезагружаем данные
                              fetchEmotionalData();
                            } catch (error) {
                              console.error('Ошибка создания шаблонов:', error);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Создать шаблоны фидбеков
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <FaSmile className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <div className="text-2xl font-bold text-yellow-600">
                        {emotionalData.currentState.mood.value}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Настроение</div>
                      <div className="flex items-center justify-center gap-1">
                        {emotionalData.currentState.mood.trend === 'up' && <FaArrowUp className="w-3 h-3 text-green-500" />}
                        {emotionalData.currentState.mood.trend === 'down' && <FaArrowDown className="w-3 h-3 text-red-500" />}
                        <span className="text-xs text-gray-500">{emotionalData.currentState.mood.description}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <FaBrain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold text-purple-600">
                        {emotionalData.currentState.concentration.value}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Концентрация</div>
                      <div className="flex items-center justify-center gap-1">
                        {emotionalData.currentState.concentration.trend === 'up' && <FaArrowUp className="w-3 h-3 text-green-500" />}
                        {emotionalData.currentState.concentration.trend === 'down' && <FaArrowDown className="w-3 h-3 text-red-500" />}
                        <span className="text-xs text-gray-500">{emotionalData.currentState.concentration.description}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <FaUsers className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold text-blue-600">
                        {emotionalData.currentState.socialization.value}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Социализация</div>
                      <div className="flex items-center justify-center gap-1">
                        {emotionalData.currentState.socialization.trend === 'up' && <FaArrowUp className="w-3 h-3 text-green-500" />}
                        {emotionalData.currentState.socialization.trend === 'down' && <FaArrowDown className="w-3 h-3 text-red-500" />}
                        <span className="text-xs text-gray-500">{emotionalData.currentState.socialization.description}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <FaBook className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold text-green-600">
                        {emotionalData.currentState.motivation.value}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Мотивация</div>
                      <div className="flex items-center justify-center gap-1">
                        {emotionalData.currentState.motivation.trend === 'up' && <FaArrowUp className="w-3 h-3 text-green-500" />}
                        {emotionalData.currentState.motivation.trend === 'down' && <FaArrowDown className="w-3 h-3 text-red-500" />}
                        <span className="text-xs text-gray-500">{emotionalData.currentState.motivation.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Радарная диаграмма */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Общий профиль</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={[
                        { subject: 'Настроение', value: emotionalData.currentState.mood.value },
                        { subject: 'Концентрация', value: emotionalData.currentState.concentration.value },
                        { subject: 'Социализация', value: emotionalData.currentState.socialization.value },
                        { subject: 'Мотивация', value: emotionalData.currentState.motivation.value },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Текущее состояние"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Рекомендации */}
              {emotionalData.recommendations && emotionalData.recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Рекомендации</h3>
                  <div className="space-y-3">
                    {emotionalData.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${rec.priority === 'high' ? 'bg-red-100' :
                            rec.priority === 'medium' ? 'bg-yellow-100' :
                              'bg-blue-100'
                            }`}>
                            {rec.priority === 'high' ? <FaExclamationTriangle className="w-4 h-4 text-red-600" /> :
                              rec.priority === 'medium' ? <FaExclamationTriangle className="w-4 h-4 text-yellow-600" /> :
                                <FaCheckCircle className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{rec.type}</p>
                            <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Оценки преподавателей */}
              {emotionalData.teacherRatings && emotionalData.teacherRatings.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Оценки преподавателей из фидбеков</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {emotionalData.teacherRatings
                      .reduce((acc: any[], rating: any) => {
                        const existing = acc.find(r => r.teacherId === rating.teacherId);
                        if (existing) {
                          existing.ratings.push(rating);
                          existing.averageRating = existing.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / existing.ratings.length;
                        } else {
                          acc.push({
                            teacherId: rating.teacherId,
                            ratings: [rating],
                            averageRating: rating.rating,
                            lastDate: rating.date
                          });
                        }
                        return acc;
                      }, [])
                      .map((teacher: any) => (
                        <div key={teacher.teacherId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">Преподаватель ID: {teacher.teacherId}</h4>
                              <p className="text-sm text-gray-600">
                                Последняя оценка: {new Date(teacher.lastDate).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${teacher.averageRating >= 4 ? 'text-green-600' :
                                teacher.averageRating >= 3 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {teacher.averageRating.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.ratings.length} оценок
                              </div>
                            </div>
                          </div>

                          {/* Звездочки для визуализации */}
                          <div className="flex justify-center">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={`text-lg ${star <= Math.round(teacher.averageRating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                                  }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* История изменений */}
              {emotionalData.feedbackHistory && emotionalData.feedbackHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">История изменений</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={emotionalData.feedbackHistory.map(item => ({
                      date: new Date(item.date).toLocaleDateString('ru-RU'),
                      настроение: item.mood,
                      концентрация: item.concentration,
                      социализация: item.socialization,
                      мотивация: item.motivation
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="настроение" stroke="#F59E0B" />
                      <Line type="monotone" dataKey="концентрация" stroke="#8B5CF6" />
                      <Line type="monotone" dataKey="социализация" stroke="#3B82F6" />
                      <Line type="monotone" dataKey="мотивация" stroke="#10B981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center py-8">
                <FaSmile className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Нет данных об эмоциональном состоянии</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка замечаний */}
      {activeTab === 'remarks' && accessLevel === 'full' && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <div className="space-y-6">
          {loadingData.remarks ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Заголовок с кнопкой добавления */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Замечания студента</h2>
                  <button
                    onClick={handleAddRemark}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                    Добавить замечание
                  </button>
                </div>

                {/* Статистика замечаний */}
                {remarksData && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {remarksData.totalRemarks}
                      </div>
                      <div className="text-sm text-gray-600">Всего замечаний</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <FaBook className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">
                        {remarksData.remarks.filter(r => r.type === 'ACADEMIC').length}
                      </div>
                      <div className="text-sm text-gray-600">Учебные</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <FaUsers className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">
                        {remarksData.remarks.filter(r => r.type === 'BEHAVIOR').length}
                      </div>
                      <div className="text-sm text-gray-600">Поведение</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <FaCalendarAlt className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {remarksData.remarks.filter(r => r.type === 'ATTENDANCE').length}
                      </div>
                      <div className="text-sm text-gray-600">Посещаемость</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Список замечаний */}
              {remarksData && remarksData.remarks.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">История замечаний</h3>
                  <div className="space-y-4">
                    {remarksData.remarks.map((remark) => (
                      <div key={remark.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${remark.type === 'ACADEMIC' ? 'bg-orange-100 text-orange-800' :
                              remark.type === 'BEHAVIOR' ? 'bg-purple-100 text-purple-800' :
                                remark.type === 'ATTENDANCE' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {remark.type === 'ACADEMIC' ? 'Учебное' :
                                remark.type === 'BEHAVIOR' ? 'Поведение' :
                                  remark.type === 'ATTENDANCE' ? 'Посещаемость' :
                                    'Общее'}
                            </span>
                            {remark.isPrivate && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Приватное
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRemark(remark)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Редактировать"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRemark(remark)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Удалить"
                            >
                              <FaExclamationTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2">{remark.title}</h4>
                        <p className="text-gray-700 mb-3">{remark.content}</p>

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaUserGraduate className="w-3 h-3" />
                            <span>Преподаватель: {remark.teacher.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="w-3 h-3" />
                            <span>{new Date(remark.createdAt).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-center py-8">
                    <FaCheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Замечаний нет</h3>
                    <p className="text-gray-500 mb-4">
                      У этого студента пока нет замечаний. Это хорошо!
                    </p>
                    <button
                      onClick={handleAddRemark}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Добавить первое замечание
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Вкладка комментариев для админов */}
      {activeTab === 'comments' && accessLevel === 'full' && user?.role === 'ADMIN' && (
        <div className="space-y-6">
          {loadingData.comments ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Заголовок с кнопкой добавления */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Комментарии администрации</h2>
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaComments className="w-4 h-4" />
                    Добавить комментарий
                  </button>
                </div>

                {/* Информация о комментариях */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <FaComments className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Внутренние комментарии</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Эти комментарии видны только администраторам и используются для внутренних заметок о студенте.
                        Студенты и родители не имеют доступа к этой информации.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Статистика комментариев */}
                {commentsData && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <FaComments className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {commentsData.totalComments}
                      </div>
                      <div className="text-sm text-gray-600">Всего комментариев</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <FaUserGraduate className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {commentsData.comments.filter(c => c.type === 'ACADEMIC').length}
                      </div>
                      <div className="text-sm text-gray-600">Учебные</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <FaUsers className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">
                        {commentsData.comments.filter(c => c.type === 'GENERAL').length}
                      </div>
                      <div className="text-sm text-gray-600">Общие</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Список комментариев */}
              {commentsData && commentsData.comments.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">История комментариев</h3>
                  <div className="space-y-4">
                    {commentsData.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${comment.type === 'ACADEMIC' ? 'bg-green-100 text-green-800' :
                              comment.type === 'GENERAL' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {comment.type === 'ACADEMIC' ? 'Учебный' :
                                comment.type === 'GENERAL' ? 'Общий' :
                                  'Другое'}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Конфиденциально
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Редактировать"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Удалить"
                            >
                              <FaExclamationTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2">{comment.title}</h4>
                        <p className="text-gray-700 mb-3">{comment.content}</p>

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaUserGraduate className="w-3 h-3" />
                            <span>Автор: {comment.author.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="w-3 h-3" />
                            <span>{new Date(comment.createdAt).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="text-center py-8">
                    <FaComments className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Комментариев нет</h3>
                    <p className="text-gray-500 mb-4">
                      У этого студента пока нет внутренних комментариев администрации.
                    </p>
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Добавить первый комментарий
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Модальные окна */}
      {/* Модал для добавления/редактирования замечания */}
      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={closeRemarkModal}
        onSubmit={handleRemarkSubmit}
        remark={editingRemark}
        studentName={`${student?.user.surname} ${student?.user.name}`}
      />

      {/* Модал для подтверждения удаления замечания */}
      <DeleteRemarkModal
        isOpen={deleteRemarkModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleRemarkDelete}
        remarkTitle={deletingRemark?.title || ''}
        studentName={`${student?.user.surname} ${student?.user.name}`}
      />

      {/* Модал для добавления/редактирования комментария */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={closeCommentModal}
        onSubmit={handleCommentSubmit}
        comment={editingComment!}
        studentName={`${student?.user.surname} ${student?.user.name}`}
        title={editingComment ? 'Редактировать комментарий' : 'Добавить комментарий'}
      />

      {/* Модал для подтверждения удаления комментария */}
      <DeleteCommentModal
        isOpen={deleteCommentModalOpen}
        onClose={closeDeleteCommentModal}
        onConfirm={handleCommentDelete}
        comment={deletingComment}
        studentName={`${student?.user.surname} ${student?.user.name}`}
      />
    </div>
  );
};

export default StudentDetail;
