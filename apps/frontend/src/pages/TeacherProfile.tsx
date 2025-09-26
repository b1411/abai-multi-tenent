import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendar, 
  FaGraduationCap, 
  FaCog, 
  FaDollarSign,
  FaChartLine,
  FaEdit,
  FaHistory,
  FaArrowLeft
} from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';
import { salaryService } from '../services/salaryService';
import { useTeachers } from '../hooks/useTeachers';
import TeacherSalaryRateForm from '../components/TeacherSalaryRateForm';
import TeacherProfileEditModal from '../components/TeacherProfileEditModal';

// Хук для получения текущего пользователя (заглушка)
const useAuth = () => {
  return {
    user: {
      id: 1,
      role: 'ADMIN', // ADMIN, TEACHER, HR, FINANCE
      email: 'admin@abai.kz'
    }
  };
};

interface Teacher {
  id: number;
  user: {
    name: string;
    surname: string;
    middlename?: string;
    email: string;
    phone?: string;
  };
  hireDate?: string;
  department?: string;
  position?: string;
  category?: string;
  experience?: number;
}

const TeacherProfile: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teachers, loading: teachersLoading } = useTeachers();
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [salaryRate, setSalaryRate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRateForm, setShowRateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recentSalaries, setRecentSalaries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Проверка прав доступа
  const canManageSalaries = user.role === 'ADMIN' || user.role === 'HR' || user.role === 'FINANCE';
  const canViewSalaryData = canManageSalaries || (user.role === 'TEACHER' && parseInt(teacherId!) === user.id);
  const isOwnProfile = user.role === 'TEACHER' && parseInt(teacherId!) === user.id;

  useEffect(() => {
    if (teacherId && teachers.length > 0) {
      loadTeacherData();
    }
  }, [teacherId, teachers]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Находим преподавателя в списке
      const foundTeacher = teachers.find(t => t.id === parseInt(teacherId!));
      if (!foundTeacher) {
        throw new Error('Преподаватель не найден');
      }
      setTeacher(foundTeacher as Teacher);

      // Загружаем ставку преподавателя только если есть права
      if (canManageSalaries || canViewSalaryData) {
        try {
          const rate = await salaryService.getTeacherSalaryRate(parseInt(teacherId!));
          setSalaryRate(rate);
        } catch (error) {
          console.log('Ставка не настроена');
          setSalaryRate(null);
        }
      }

      // Загружаем последние зарплаты только если есть права
      if (canViewSalaryData) {
        try {
          const history = await salaryService.getSalaryHistory(parseInt(teacherId!));
          setRecentSalaries(history.slice(0, 3)); // Последние 3 записи
        } catch (error) {
          console.log('История зарплат не найдена');
          setRecentSalaries([]);
        }
      }

    } catch (error) {
      console.error('Ошибка при загрузке данных преподавателя:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRate = async (rateData: any) => {
    try {
      if (salaryRate) {
        await salaryService.updateTeacherSalaryRate(salaryRate.id, rateData);
      } else {
        await salaryService.createTeacherSalaryRate(parseInt(teacherId!), rateData);
      }

      // Перезагружаем данные
      await loadTeacherData();
      setShowRateForm(false);

    } catch (error) {
      console.error('Ошибка при сохранении ставки:', error);
      throw error;
    }
  };

  const handleSaveProfile = async (updatedTeacher: any) => {
    setTeacher(updatedTeacher);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center text-gray-500 py-12">
        <FaUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>Преподаватель не найден</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Кнопка назад */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Назад
        </button>
      </div>

      {/* Заголовок профиля */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <FaUser className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">
                {teacher.user.surname} {teacher.user.name} {teacher.user.middlename}
              </h1>
              {/* Кнопка редактирования - только для админов, HR или самого преподавателя */}
              {(user.role === 'ADMIN' || user.role === 'HR' || isOwnProfile) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Редактировать
                </button>
              )}
            </div>
            <p className="text-blue-100 text-lg">{teacher.position}</p>
            <p className="text-blue-200">{teacher.department}</p>
            {isOwnProfile && (
              <div className="mt-2">
                <span className="bg-blue-500 text-blue-100 px-3 py-1 rounded-full text-sm">
                  Ваш профиль
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">ID: {teacher.id}</div>
            <div className="text-sm text-blue-200">Стаж: {teacher.experience} лет</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Контактная информация */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-600" />
              Контактная информация
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{teacher.user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Телефон</div>
                  <div className="font-medium">{teacher.user.phone || 'Не указан'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaCalendar className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Дата приема</div>
                  <div className="font-medium">
                    {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString('ru-RU') : 'Не указана'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaGraduationCap className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Категория</div>
                  <div className="font-medium">{teacher.category || 'Не указана'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Последние зарплаты - только для тех, кто может просматривать зарплатные данные */}
          {canViewSalaryData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaHistory className="mr-2 text-green-600" />
                {isOwnProfile ? 'Мои выплаты' : 'Последние выплаты'}
              </h2>
              {recentSalaries.length > 0 ? (
                <div className="space-y-3">
                  {recentSalaries.map((salary, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{salary.month}/{salary.year}</div>
                        <div className="text-sm text-gray-500">
                          {salary.hoursWorked || 0}ч × {formatCurrency(salary.hourlyRate || 0)}/ч
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(salary.totalNet)}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          salary.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          salary.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {salary.status === 'PAID' ? 'Выплачено' :
                           salary.status === 'APPROVED' ? 'Утверждено' : 'Черновик'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FaHistory className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>История выплат отсутствует</p>
                </div>
              )}
            </div>
          )}

          {/* Блок для обычных пользователей (не admin, не сам преподаватель) */}
          {!canViewSalaryData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaGraduationCap className="mr-2 text-blue-600" />
                Профессиональная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Отдел</div>
                  <div className="font-medium">{teacher.department}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Должность</div>
                  <div className="font-medium">{teacher.position}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Категория</div>
                  <div className="font-medium">{teacher.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Опыт работы</div>
                  <div className="font-medium">{teacher.experience} лет</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Настройка ставки - только для админов/HR */}
          {canManageSalaries && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaDollarSign className="mr-2 text-purple-600" />
                Ставка преподавателя
              </h2>
              
              {salaryRate ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">Базовая ставка</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {formatCurrency(salaryRate.baseRate)}/час
                    </div>
                  </div>
                  
                  {salaryRate.factors && salaryRate.factors.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Факторы:</div>
                      <div className="space-y-2">
                        {salaryRate.factors.map((factor: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{factor.name}</span>
                            <span className="font-medium text-green-600">
                              +{formatCurrency(factor.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Итоговая ставка:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(salaryRate.totalRate)}/час
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowRateForm(true)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <FaEdit className="mr-2" />
                    Редактировать ставку
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                    <FaCog className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Ставка не настроена</p>
                  </div>
                  <button
                    onClick={() => setShowRateForm(true)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <FaCog className="mr-2" />
                    Настроить ставку
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Статистика - только для тех, кто может просматривать зарплатные данные */}
          {canViewSalaryData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaChartLine className="mr-2 text-blue-600" />
                {isOwnProfile ? 'Моя статистика' : 'Статистика'}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Общая сумма выплат:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(recentSalaries.reduce((sum, s) => sum + s.totalNet, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Количество выплат:</span>
                  <span className="font-bold text-gray-800">{recentSalaries.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Средняя зарплата:</span>
                  <span className="font-bold text-green-600">
                    {recentSalaries.length > 0 
                      ? formatCurrency(recentSalaries.reduce((sum, s) => sum + s.totalNet, 0) / recentSalaries.length)
                      : formatCurrency(0)
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Общая информация для обычных пользователей */}
          {!canViewSalaryData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaCalendar className="mr-2 text-blue-600" />
                Общая информация
              </h2>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Дата приема на работу</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString('ru-RU') : 'Не указана'}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Стаж работы</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {teacher.experience} лет
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Форма настройки ставки */}
      <TeacherSalaryRateForm
        isOpen={showRateForm}
        onClose={() => setShowRateForm(false)}
        onSubmit={handleSubmitRate}
        teacherId={teacher.id}
        teacherName={`${teacher.user.surname} ${teacher.user.name}`}
        currentRate={salaryRate}
        isLoading={loading}
      />

      {/* Модальное окно редактирования профиля */}
      <TeacherProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        teacher={teacher}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default TeacherProfile;
