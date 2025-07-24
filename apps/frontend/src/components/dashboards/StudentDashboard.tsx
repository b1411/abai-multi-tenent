import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Book, Calendar, FileText, Star, TrendingUp, Users, Clock } from 'lucide-react';
import dashboardService, { StudentDashboardStats } from '../../services/dashboardService';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const studentData = await dashboardService.getStudentDashboard();
        setStats(studentData);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
        
        // Fallback to mock data if API fails
        setStats({
          upcomingLessons: 5,
          pendingHomework: 3,
          averageGrade: 4.2,
          attendance: 92,
          todaySchedule: [
            { id: 1, subject: 'Математика', time: '09:00 - 10:30', classroom: 'Кабинет 201' },
            { id: 2, subject: 'Физика', time: '11:00 - 12:30', classroom: 'Кабинет 305' }
          ],
          pendingAssignments: [
            { id: 1, title: 'Решение уравнений', subject: 'Математика', dueDate: 'завтра', status: 'overdue' },
            { id: 2, title: 'Лабораторная работа №3', subject: 'Физика', dueDate: 'через 2 дня', status: 'pending' }
          ],
          subjectGrades: [
            { subject: 'Математика', averageGrade: 4.5, description: 'Отличная успеваемость' },
            { subject: 'Физика', averageGrade: 4.2, description: 'Хорошая успеваемость' },
            { subject: 'Химия', averageGrade: 3.8, description: 'Нужно подтянуть' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Добро пожаловать, {user?.name} {user?.surname}
        </h1>
        <p className="text-gray-600">Студенческий дэшборд</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Предстоящие уроки</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcomingLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Домашние задания</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingHomework}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageGrade}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Посещаемость</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.attendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Расписание на сегодня</h2>
          <div className="space-y-3">
            {stats?.todaySchedule.map((lesson) => (
              <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Book className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{lesson.subject}</p>
                  <p className="text-sm text-gray-600">{lesson.time}, {lesson.classroom}</p>
                </div>
              </div>
            ))}
            {(!stats?.todaySchedule || stats.todaySchedule.length === 0) && (
              <p className="text-gray-500 text-center py-4">Сегодня уроков нет</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Невыполненные задания</h2>
          <div className="space-y-3">
            {stats?.pendingAssignments.map((assignment) => (
              <div key={assignment.id} className={`flex items-center justify-between p-3 rounded-lg ${
                assignment.status === 'overdue' ? 'bg-red-50' : 
                assignment.status === 'pending' ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <div>
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-600">{assignment.subject} • Срок: {assignment.dueDate}</p>
                </div>
                <span className={`text-sm font-medium ${
                  assignment.status === 'overdue' ? 'text-red-600' : 
                  assignment.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {assignment.status === 'overdue' ? 'Просрочено' : 
                   assignment.status === 'pending' ? 'Скоро срок' : 'Выполнено'}
                </span>
              </div>
            ))}
            {(!stats?.pendingAssignments || stats.pendingAssignments.length === 0) && (
              <p className="text-gray-500 text-center py-4">Все задания выполнены</p>
            )}
          </div>
        </div>
      </div>

      {/* Успеваемость */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Успеваемость по предметам</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.subjectGrades.map((subject, index) => (
            <div key={index} className={`text-center p-4 rounded-lg ${
              subject.averageGrade >= 4.5 ? 'bg-green-50' :
              subject.averageGrade >= 4.0 ? 'bg-blue-50' : 'bg-yellow-50'
            }`}>
              <h3 className="font-medium text-gray-900">{subject.subject}</h3>
              <p className={`text-2xl font-bold ${
                subject.averageGrade >= 4.5 ? 'text-green-600' :
                subject.averageGrade >= 4.0 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {subject.averageGrade}
              </p>
              <p className="text-sm text-gray-600">{subject.description}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
