import React, { useState, useEffect } from 'react';
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
  FaComments
} from 'react-icons/fa';
import { useStudent } from '../hooks/useStudents';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { student, grades, loading, error, refetch, fetchGrades } = useStudent(Number(id));

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (student && activeTab === 'grades') {
      fetchGrades();
    }
  }, [student, activeTab, fetchGrades]);

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

      {/* Остальные вкладки для полного доступа */}
      {accessLevel === 'full' && activeTab !== 'overview' && activeTab !== 'grades' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-500">Раздел находится в разработке</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
