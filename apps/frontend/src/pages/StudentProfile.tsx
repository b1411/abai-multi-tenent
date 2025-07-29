import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  FaEdit,
  FaBell,
  FaGraduationCap
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useCurrentStudent } from '../hooks/useCurrentStudent';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { studentService, AttendanceData, FinanceData, EmotionalData, StudentRemarksResponse } from '../services/studentService';
import { feedbackService } from '../services/feedbackService';
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

const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { student: studentData, loading, error } = useCurrentStudent();
  const [grades, setGrades] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [emotionalData, setEmotionalData] = useState<EmotionalData | null>(null);
  const [remarksData, setRemarksData] = useState<StudentRemarksResponse | null>(null);
  const [loadingData, setLoadingData] = useState<Record<string, boolean>>({});

  // Функция для загрузки оценок
  const fetchGrades = useCallback(async () => {
    if (!studentData?.id) return;

    try {
      const data = await studentService.getStudentGrades(studentData.id);
      setGrades(data);
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error);
    }
  }, [studentData?.id]);

  // Функция для загрузки данных посещаемости
  const fetchAttendanceData = useCallback(async () => {
    if (!studentData?.id) return;

    setLoadingData(prev => ({ ...prev, attendance: true }));
    try {
      const data = await studentService.getStudentAttendance(studentData.id);
      setAttendanceData(data);
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости:', error);
    }
    setLoadingData(prev => ({ ...prev, attendance: false }));
  }, [studentData?.id]);

  // Функция для загрузки замечаний
  const fetchRemarksData = useCallback(async () => {
    if (!studentData?.id) return;

    setLoadingData(prev => ({ ...prev, remarks: true }));
    try {
      const data = await studentService.getStudentRemarks(studentData.id);
      setRemarksData(data);
    } catch (error) {
      console.error('Ошибка загрузки замечаний:', error);
    }
    setLoadingData(prev => ({ ...prev, remarks: false }));
  }, [studentData?.id]);

  // Функция для загрузки эмоциональных данных
  const fetchEmotionalData = useCallback(async () => {
    if (!studentData?.id) return;

    setLoadingData(prev => ({ ...prev, emotional: true }));
    try {
      let feedbackEmotionalData = null;
      try {
        feedbackEmotionalData = await feedbackService.getStudentEmotionalStateFromFeedbacks(studentData.id);
      } catch (feedbackError) {
        console.warn('Не удалось загрузить данные из фидбеков:', feedbackError);
      }

      let legacyEmotionalData = null;
      try {
        legacyEmotionalData = await studentService.getStudentEmotionalState(studentData.id);
      } catch (legacyError) {
        console.warn('Не удалось загрузить данные из старой системы:', legacyError);
      }

      const combinedData = combineEmotionalData(feedbackEmotionalData, legacyEmotionalData);
      setEmotionalData(combinedData);
    } catch (error) {
      console.error('Ошибка загрузки эмоциональных данных:', error);
    }
    setLoadingData(prev => ({ ...prev, emotional: false }));
  }, [studentData?.id]);

  // Функция для объединения данных из разных источников
  const combineEmotionalData = (feedbackData: any, legacyData: any) => {
    if (feedbackData && feedbackData.currentState) {
      return {
        currentState: feedbackData.currentState,
        lastUpdated: feedbackData.lastUpdated,
        trends: feedbackData.trends,
        recommendations: feedbackData.recommendations,
        source: 'feedback',
        feedbackHistory: feedbackData.trends || [],
      };
    } else if (legacyData && legacyData.currentState) {
      return {
        ...legacyData,
        source: 'legacy',
      };
    } else {
      return null;
    }
  };

  useEffect(() => {
    if (studentData && activeTab === 'grades') {
      fetchGrades();
    } else if (studentData && activeTab === 'attendance') {
      fetchAttendanceData();
    } else if (studentData && activeTab === 'remarks') {
      fetchRemarksData();
    } else if (studentData && activeTab === 'emotional') {
      fetchEmotionalData();
    }
  }, [studentData?.id, activeTab, fetchGrades, fetchAttendanceData, fetchRemarksData, fetchEmotionalData]);

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

  if (!studentData) {
    return (
      <div className="p-6">
        <Alert variant="error" message="Профиль студента не найден" />
      </div>
    );
  }

  // Проверяем, что пользователь действительно студент
  if (user?.role !== 'STUDENT') {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <FaUserGraduate className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Доступ ограничен</h2>
          <p className="text-gray-600 mb-4">
            Эта страница доступна только студентам
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: FaUserGraduate },
    { id: 'grades', label: 'Мои оценки', icon: FaChartLine },
    { id: 'attendance', label: 'Посещаемость', icon: FaClipboardList },
    { id: 'remarks', label: 'Замечания', icon: FaExclamationTriangle },
    { id: 'emotional', label: 'Мое состояние', icon: FaSmile }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Заголовок профиля */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl lg:text-3xl">
            {studentData.user.name.charAt(0)}{studentData.user.surname.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Мой профиль
                </h1>
                <p className="text-xl lg:text-2xl text-blue-100 mb-3">
                  {studentData.user.surname} {studentData.user.name}
                  {studentData.user.middlename && ` ${studentData.user.middlename}`}
                </p>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <FaUsers className="w-4 h-4" />
                    <span>{studentData.group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="w-4 h-4" />
                    <span>{studentData.group.courseNumber} курс</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>С {new Date(studentData.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 lg:mt-0">
                <button
                  onClick={() => {/* TODO: Открыть настройки профиля */}}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2 text-sm lg:text-base"
                >
                  <FaEdit className="w-4 h-4" />
                  <span className="hidden sm:inline">Настройки</span>
                </button>
                <button
                  onClick={() => {/* TODO: Открыть уведомления */}}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2 text-sm lg:text-base"
                >
                  <FaBell className="w-4 h-4" />
                  <span className="hidden sm:inline">Уведомления</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex flex-wrap gap-2 lg:gap-6 mt-6 pt-6 border-t border-blue-400">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 text-sm lg:text-base font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
                  <p className="font-medium">{studentData.group.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Курс</label>
                  <p className="font-medium">{studentData.group.courseNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{studentData.user.email}</p>
                </div>
                {studentData.user.phone && (
                  <div>
                    <label className="text-sm text-gray-500">Телефон</label>
                    <p className="font-medium">{studentData.user.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500">Дата поступления</label>
                  <p className="font-medium">
                    {new Date(studentData.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>

            {/* Последние результаты */}
            {studentData.lessonsResults && studentData.lessonsResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Последние результаты</h2>
                <div className="space-y-3">
                  {studentData.lessonsResults.slice(0, 5).map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{result.Lesson.name}</p>
                        <p className="text-sm text-gray-600">
                          {result.Lesson.studyPlan.name} • {new Date(result.Lesson.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.attendance !== null && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.attendance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.attendance ? 'Присутствовал' : 'Отсутствовал'}
                          </span>
                        )}
                        {result.lessonScore !== null && result.lessonScore !== undefined && (
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${
                            result.lessonScore >= 4
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
            {/* Быстрая статистика */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Моя статистика</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Средний балл</span>
                  <span className="text-xl font-bold text-blue-600">
                    {grades ? 
                      Object.values(grades).reduce((acc: number, subject: any) => 
                        acc + subject.statistics.averageLessonScore, 0
                      ) / Object.keys(grades).length || 0 : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Посещаемость</span>
                  <span className="text-xl font-bold text-green-600">
                    {attendanceData ? `${attendanceData.summary.attendanceRate}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Предметов изучаю</span>
                  <span className="text-xl font-bold text-purple-600">
                    {grades ? Object.keys(grades).length : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Эмоциональное состояние */}
            {studentData.EmotionalState && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Мое состояние</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Настроение</span>
                      <span className="text-sm font-medium">{studentData.EmotionalState.mood}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${studentData.EmotionalState.mood}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Концентрация</span>
                      <span className="text-sm font-medium">{studentData.EmotionalState.concentration}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${studentData.EmotionalState.concentration}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Мои оценки</h2>
          {grades ? (
            <div className="space-y-6">
              {Object.entries(grades).map(([subjectName, subjectData]: [string, any]) => (
                <div key={subjectName} className="border rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{subjectName}</h3>
                      <p className="text-sm text-gray-600">
                        Преподаватель: {subjectData.subject.teacher.user.surname} {subjectData.subject.teacher.user.name}
                      </p>
                    </div>
                    <div className="text-right mt-2 lg:mt-0">
                      <div className="text-2xl font-bold text-blue-600">
                        {subjectData.statistics.averageLessonScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Средний балл</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
                      {subjectData.grades.slice(0, 10).map((grade: any, index: number) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            grade.lessonScore && grade.lessonScore >= 4
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

      {/* Остальные вкладки используют тот же код, что и в StudentDetail */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {loadingData.attendance ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : attendanceData ? (
            <>
              {/* Статистика посещаемости */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Моя посещаемость</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <BarChart data={Object.entries(attendanceData.subjectAttendance).map(([subject, data]: [string, any]) => ({
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
                <h3 className="text-lg font-semibold mb-4">История посещений</h3>
                <div className="space-y-3">
                  {attendanceData.details.slice(0, 10).map((record: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.subject}</p>
                        <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.attendance
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

      {/* Вкладка замечаний */}
      {activeTab === 'remarks' && (
        <div className="space-y-6">
          {loadingData.remarks ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : remarksData && remarksData.remarks.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Мои замечания</h2>
              
              {/* Статистика замечаний */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

              {/* Список замечаний */}
              <div className="space-y-4">
                {remarksData.remarks.map((remark) => (
                  <div key={remark.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          remark.type === 'ACADEMIC' ? 'bg-orange-100 text-orange-800' :
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
                      <span className="text-xs text-gray-500">
                        {new Date(remark.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{remark.title}</h4>
                    <p className="text-gray-700 mb-3">{remark.content}</p>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FaUserGraduate className="w-3 h-3" />
                        <span>Преподаватель: {remark.teacher.name}</span>
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
                  У вас пока нет замечаний. Продолжайте в том же духе!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Здесь можно добавить остальные вкладки emotional аналогично */}
    </div>
  );
};

export default StudentProfile;
