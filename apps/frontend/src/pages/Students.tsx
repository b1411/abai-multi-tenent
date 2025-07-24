import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserGraduate, FaPhone, FaEnvelope, FaUsers, FaFilter, FaPlus } from 'react-icons/fa';
import { useStudents } from '../hooks/useStudents';
import { useAuth } from '../hooks/useAuth';
import { Student } from '../services/studentService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { CreateStudentForm } from '../components/CreateStudentForm';

const Students: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students, loading, error } = useStudents();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Получаем уникальные группы из списка студентов
  const groups = useMemo(() => {
    const groupsSet = new Set(students.map(student => student.group?.name).filter(Boolean));
    return Array.from(groupsSet).sort();
  }, [students]);

  // Фильтрация студентов
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchQuery || 
        `${student.user.surname} ${student.user.name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGroup = !selectedGroup || student.group?.name === selectedGroup;
      
      return matchesSearch && matchesGroup;
    });
  }, [students, searchQuery, selectedGroup]);

  const handleStudentClick = (student: Student) => {
    // Проверяем права доступа
    if (user?.role === 'STUDENT' && student.userId !== user.id) {
      setSelectedStudent(student);
      return;
    }
    
    if (user?.role === 'PARENT') {
      const isParent = student.Parents?.some(parent => parent.user.id === user.id);
      if (!isParent) {
        setSelectedStudent(student);
        return;
      }
    }
    
    navigate(`/students/${student.id}`);
  };

  const getAccessLevelInfo = (student: Student) => {
    if (!user) return null;
    
    switch (user.role) {
      case 'STUDENT':
        if (student.userId === user.id) {
          return { level: 'full', text: 'Ваш профиль' };
        }
        return { level: 'basic', text: 'Одногруппник' };
      
      case 'PARENT': {
        const isParent = student.Parents?.some(parent => parent.user.id === user.id);
        if (isParent) {
          return { level: 'full', text: 'Ваш ребенок' };
        }
        return { level: 'none', text: 'Ограниченный доступ' };
      }
      
      case 'TEACHER':
        return { level: 'full', text: 'Ученик' };
      
      case 'ADMIN':
      case 'HR':
        return { level: 'full', text: 'Полный доступ' };
      
      default:
        return null;
    }
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

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Студенты</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {user?.role === 'STUDENT' && 'Ваша группа'}
            {user?.role === 'PARENT' && 'Ваши дети'}
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'HR') && 'Управление студентами'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Кнопка создания студента для админов и учителей */}
          {user && ['ADMIN', 'TEACHER'].includes(user.role) && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
            >
              <FaPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Создать студента</span>
              <span className="sm:hidden">Создать</span>
            </button>
          )}
          
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Всего: {filteredStudents.length}</span>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {groups.length > 1 && (
            <div className="w-full lg:w-64">
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors"
                >
                  <option value="">Все группы</option>
                  {groups.map(group => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Список студентов */}
      <div className="bg-white rounded-lg shadow-md">
        {filteredStudents.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <FaUserGraduate className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">Студенты не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
            {filteredStudents.map((student) => {
              const accessInfo = getAccessLevelInfo(student);
              
              return (
                <div
                  key={student.id}
                  className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
                    accessInfo?.level === 'full' 
                      ? 'hover:shadow-lg cursor-pointer hover:border-blue-200' 
                      : accessInfo?.level === 'basic'
                      ? 'hover:shadow-md cursor-pointer hover:border-gray-300'
                      : 'opacity-75'
                  }`}
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                        {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {student.user.surname} {student.user.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {student.group?.name || 'Не указана'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      {accessInfo?.level === 'full' && student.user.phone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <FaPhone className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{student.user.phone}</span>
                        </div>
                      )}
                      
                      {accessInfo?.level === 'full' && (
                        <div className="flex items-center text-xs text-gray-600">
                          <FaEnvelope className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{student.user.email}</span>
                        </div>
                      )}

                      {/* Показываем последние результаты только для полного доступа */}
                      {accessInfo?.level === 'full' && student.lessonsResults && student.lessonsResults.length > 0 && (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Последние результаты:</p>
                          <div className="flex gap-1">
                            {student.lessonsResults.slice(0, 3).map((result, index) => (
                              <div
                                key={index}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                                  result.lessonScore && result.lessonScore >= 4 
                                    ? 'bg-green-500' 
                                    : result.lessonScore && result.lessonScore >= 3
                                    ? 'bg-yellow-500'
                                    : result.lessonScore
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}
                              >
                                {result.lessonScore || '–'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {accessInfo && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          accessInfo.level === 'full' 
                            ? 'bg-green-100 text-green-800'
                            : accessInfo.level === 'basic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {accessInfo.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модальное окно с ограниченной информацией */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {selectedStudent.user.name.charAt(0)}{selectedStudent.user.surname.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedStudent.user.surname} {selectedStudent.user.name}
                    </h2>
                    <p className="text-gray-600">Группа: {selectedStudent.group?.name || 'Не указана'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center text-gray-600">
                <FaUserGraduate className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-2">Ограниченный доступ</p>
                <p className="text-sm text-gray-500">
                  {user?.role === 'STUDENT' && 'Вы можете видеть только основную информацию о своих одногруппниках'}
                  {user?.role === 'PARENT' && 'Вы можете видеть полную информацию только о своих детях'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с формой создания студента */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CreateStudentForm
              onSuccess={() => {
                setShowCreateForm(false);
                // Обновляем список студентов
                window.location.reload(); // Простое решение для обновления списка
              }}
              onClose={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
