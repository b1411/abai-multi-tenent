import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUserGraduate, 
  FaUsers, 
  FaGraduationCap, 
  FaChartLine,
  FaCalendarCheck,
  FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useCurrentStudent } from '../hooks/useCurrentStudent';

interface StudentProfileWidgetProps {
  variant?: 'header' | 'sidebar' | 'compact';
  className?: string;
}

const StudentProfileWidget: React.FC<StudentProfileWidgetProps> = ({ 
  variant = 'header', 
  className = '' 
}) => {
  const { user } = useAuth();
  
  // Получаем данные текущего студента
  const { student, loading } = useCurrentStudent();

  // Не показываем виджет если пользователь не студент
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-1">
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const renderHeader = () => (
    <Link 
      to="/app/profile" 
      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group ${className}`}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {student.user.surname} {student.user.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaUsers className="w-3 h-3" />
          <span>{student.group.name}</span>
          <span>•</span>
          <FaGraduationCap className="w-3 h-3" />
          <span>{student.group.courseNumber} курс</span>
        </div>
      </div>
      <FaArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </Link>
  );

  const renderSidebar = () => (
    <Link 
      to="/app/profile" 
      className={`block p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors group ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Мой профиль
          </p>
          <p className="text-xs text-blue-600 truncate">
            {student.user.surname} {student.user.name}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <FaUsers className="w-3 h-3" />
            <span>Группа</span>
          </div>
          <span className="font-medium text-gray-900">{student.group.name}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <FaGraduationCap className="w-3 h-3" />
            <span>Курс</span>
          </div>
          <span className="font-medium text-gray-900">{student.group.courseNumber}</span>
        </div>

        {/* Показываем статистику если есть данные */}
        {student.lessonsResults && student.lessonsResults.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                <FaChartLine className="w-3 h-3" />
                <span>Последняя оценка</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                student.lessonsResults[0]?.lessonScore && student.lessonsResults[0].lessonScore >= 4 
                  ? 'bg-green-100 text-green-800'
                  : student.lessonsResults[0]?.lessonScore && student.lessonsResults[0].lessonScore >= 3
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {student.lessonsResults[0]?.lessonScore || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                <FaCalendarCheck className="w-3 h-3" />
                <span>Посещение</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                student.lessonsResults[0]?.attendance 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.lessonsResults[0]?.attendance ? 'Был' : 'Не был'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-blue-600 group-hover:text-blue-700">
          <span>Перейти к профилю</span>
          <FaArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );

  const renderCompact = () => (
    <Link 
      to="/app/profile" 
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group ${className}`}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
        {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">
          Мой профиль
        </p>
        <p className="text-xs text-gray-500 truncate">
          {student.group.name}
        </p>
      </div>
      <FaUserGraduate className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </Link>
  );

  switch (variant) {
    case 'header':
      return renderHeader();
    case 'sidebar':
      return renderSidebar();
    case 'compact':
      return renderCompact();
    default:
      return renderHeader();
  }
};

export default StudentProfileWidget;
