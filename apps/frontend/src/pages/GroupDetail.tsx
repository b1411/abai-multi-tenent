import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Mail,
  Phone,
  User,
  TrendingUp,
  Award,
  Clock,
  GraduationCap,
  Edit
} from 'lucide-react';
import { groupService } from '../services/groupService';
import { studentService } from '../services/studentService';
import { performanceService } from '../services/performanceService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { PerformanceOverview } from '../types/performance';

interface GroupDetail {
  id: number;
  name: string;
  courseNumber: number;
  description?: string;
  createdAt: string;
  studentsCount?: number;
}

interface GroupStudent {
  id: number;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  createdAt: string;
}

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [performance, setPerformance] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupResponse, studentsResponse, performanceResponse] = await Promise.all([
        groupService.getGroupById(parseInt(id!)),
        studentService.getStudentsByGroup(parseInt(id!)),
        performanceService.getStatistics({ groupId: id! }).catch(() => null) // Обрабатываем ошибку статистики отдельно
      ]);

      setGroup(groupResponse);
      setStudents(studentsResponse);
      if (performanceResponse) {
        setPerformance(performanceResponse.overview);
      }
    } catch (err) {
      console.error('Error loading group details:', err);
      setError('Не удалось загрузить информацию о группе');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  const getCourseColor = (courseNumber: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[(courseNumber - 1) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад к группам
          </button>
        </div>
        <Alert variant="error" title="Ошибка">
          {error || 'Группа не найдена'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад к группам
          </button>
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCourseColor(group.courseNumber)}`}>
                {group.courseNumber} курс
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Создана {formatDate(group.createdAt)}
            </p>
          </div>
        </div>

        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Edit className="w-4 h-4 mr-2" />
          Редактировать
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Студентов</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Курс</p>
              <p className="text-2xl font-semibold text-gray-900">{group.courseNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Средний балл</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performance ? performance.averageGrade.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Посещаемость</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performance ? `${performance.attendanceRate}%` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Список студентов ({students.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {students.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет студентов</h3>
              <p className="text-gray-600">В этой группе пока нет зачисленных студентов</p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {student.user.avatar ? (
                        <img
                          src={student.user.avatar}
                          alt={`${student.user.name} ${student.user.surname}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {getInitials(student.user.name, student.user.surname)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {student.user.name} {student.user.surname}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {student.user.email}
                        </div>
                        {student.user.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {student.user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Зачислен {formatDate(student.createdAt)}
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Group Description */}
      {group.description && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Описание группы</h3>
          <p className="text-gray-600">{group.description}</p>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
