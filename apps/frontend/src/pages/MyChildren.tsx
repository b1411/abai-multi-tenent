import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { studentService } from '../services/studentService';
import { paymentsService } from '../services/paymentsService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

interface Child {
  id: number;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  group: {
    id: number;
    name: string;
    courseNumber: number;
  };
  createdAt: string;
  Parents?: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      phone?: string;
      email: string;
    };
  }[];
  lessonsResults?: {
    id: number;
    lessonScore?: number;
    homeworkScore?: number;
    attendance?: boolean;
    createdAt: string;
    Lesson: {
      id: number;
      name: string;
      date: string;
      studyPlan: {
        id: number;
        name: string;
      };
    };
  }[];
}

interface ChildPerformance {
  studentId: number;
  averageGrade: number;
  attendance: number;
  completedHomeworks: number;
  totalHomeworks: number;
  lastActivity: string;
}

interface ChildPayments {
  studentId: number;
  totalDue: number;
  paidAmount: number;
  overdueAmount: number;
  nextPaymentDate?: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
}

const ChildCard: React.FC<{ 
  child: Child; 
  performance?: ChildPerformance;
  payments?: ChildPayments;
}> = ({ child, performance, payments }) => {
  const navigate = useNavigate();

  const handleStudyPlansClick = () => {
    navigate('/study-plans', { 
      state: { 
        studentId: child.id,
        studentName: `${child.user.name} ${child.user.surname}`,
        groupId: child.group.id 
      } 
    });
  };

  const handlePerformanceClick = () => {
    navigate('/performance', { 
      state: { 
        studentId: child.id,
        studentName: `${child.user.name} ${child.user.surname}`,
        groupId: child.group.id 
      } 
    });
  };

  const handlePaymentsClick = () => {
    navigate('/finance/payments', { 
      state: { 
        studentId: child.id,
        studentName: `${child.user.name} ${child.user.surname}` 
      } 
    });
  };
  const getPerformanceColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 bg-green-100';
    if (grade >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'overdue':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          {child.user.avatar ? (
            <img
              src={child.user.avatar}
              alt={`${child.user.name} ${child.user.surname}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl font-semibold">
                {child.user.name[0]}{child.user.surname[0]}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {child.user.name} {child.user.surname}
            </h3>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{child.group.name}</span>
              <span className="text-gray-400">•</span>
              <span>{child.group.courseNumber} курс</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <span className="text-sm text-gray-500">Мой ребенок</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{child.user.email}</span>
        </div>
        {child.user.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{child.user.phone}</span>
          </div>
        )}
      </div>

      {/* Performance Section */}
      {performance && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Успеваемость
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(performance.averageGrade)}`}>
                {performance.averageGrade.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Средний балл</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {performance.attendance}%
              </div>
              <p className="text-xs text-gray-500">Посещаемость</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {performance.completedHomeworks}/{performance.totalHomeworks}
              </div>
              <p className="text-xs text-gray-500">Домашние задания</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date(performance.lastActivity).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <p className="text-xs text-gray-500">Последняя активность</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments Section */}
      {payments && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Оплаты
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(payments.totalDue)}
              </div>
              <p className="text-xs text-gray-500">К доплате</p>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(payments.paidAmount)}
              </div>
              <p className="text-xs text-gray-500">Оплачено</p>
            </div>
            <div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(payments.status)}`}>
                {payments.status === 'paid' && <CheckCircle className="w-4 h-4 mr-1" />}
                {payments.status === 'overdue' && <AlertCircle className="w-4 h-4 mr-1" />}
                {payments.status === 'paid' ? 'Оплачено' : 
                 payments.status === 'partial' ? 'Частично' :
                 payments.status === 'overdue' ? 'Просрочено' : 'Ожидает'}
              </div>
            </div>
          </div>
          {payments.nextPaymentDate && (
            <div className="mt-2 text-sm text-gray-600">
              Следующий платеж: {new Date(payments.nextPaymentDate).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button 
          onClick={handleStudyPlansClick}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Учебные планы</span>
        </button>
        <button 
          onClick={handlePerformanceClick}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Успеваемость</span>
        </button>
        <button 
          onClick={handlePaymentsClick}
          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
        >
          <DollarSign className="w-4 h-4" />
          <span>Оплаты</span>
        </button>
      </div>
    </div>
  );
};

const MyChildren: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [performances, setPerformances] = useState<{ [key: number]: ChildPerformance }>({});
  const [payments, setPayments] = useState<{ [key: number]: ChildPayments }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'PARENT') {
      loadChildren();
    }
  }, [user]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем детей родителя через специальный API
      const childrenResponse = await studentService.getParentChildren();
      setChildren(childrenResponse);

      // Загружаем данные о успеваемости и оплатах для каждого ребенка
      const performancePromises = childrenResponse.map((child: Child) => 
        studentService.getStudentCompleteReport(child.id).catch(() => null)
      );
      
      const paymentPromises = childrenResponse.map((child: Child) => 
        paymentsService.getStudentPaymentHistory(child.id.toString()).catch(() => null)
      );

      const [performanceResults, paymentResults] = await Promise.all([
        Promise.all(performancePromises),
        Promise.all(paymentPromises)
      ]);

      // Формируем объекты с данными
      const performanceData: { [key: number]: ChildPerformance } = {};
      const paymentData: { [key: number]: ChildPayments } = {};

      childrenResponse.forEach((child: Child, index: number) => {
        // Обрабатываем данные успеваемости
        if (performanceResults[index]) {
          const report = performanceResults[index];
          const lessonResults = child.lessonsResults || [];
          
          const totalScore = lessonResults.reduce((sum, result) => {
            return sum + (result.lessonScore || 0) + (result.homeworkScore || 0);
          }, 0);
          
          const attendanceCount = lessonResults.filter(result => result.attendance).length;
          const totalLessons = lessonResults.length;
          
          performanceData[child.id] = {
            studentId: child.id,
            averageGrade: totalLessons > 0 ? totalScore / (totalLessons * 2) : 0,
            attendance: totalLessons > 0 ? (attendanceCount / totalLessons) * 100 : 0,
            completedHomeworks: lessonResults.filter(r => r.homeworkScore && r.homeworkScore > 0).length,
            totalHomeworks: totalLessons,
            lastActivity: lessonResults.length > 0 ? lessonResults[lessonResults.length - 1].createdAt : child.createdAt
          };
        }

        // Обрабатываем данные об оплатах
        if (paymentResults[index] && Array.isArray(paymentResults[index])) {
          const payments = paymentResults[index];
          const totalDue = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
          const paidAmount = payments.reduce((sum: number, payment: any) => 
            sum + (payment.paidAmount || 0), 0
          );
          const overduePayments = payments.filter((payment: any) => 
            payment.status === 'overdue' || 
            (payment.status === 'unpaid' && new Date(payment.dueDate) < new Date())
          );
          
          paymentData[child.id] = {
            studentId: child.id,
            totalDue: totalDue - paidAmount,
            paidAmount,
            overdueAmount: overduePayments.reduce((sum: number, payment: any) => sum + payment.amount, 0),
            status: overduePayments.length > 0 ? 'overdue' : 
                   paidAmount >= totalDue ? 'paid' : 
                   paidAmount > 0 ? 'partial' : 'pending'
          };
        }
      });

      setPerformances(performanceData);
      setPayments(paymentData);

    } catch (err) {
      console.error('Error loading children:', err);
      setError('Не удалось загрузить информацию о детях');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'PARENT') {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="error" title="Доступ запрещен">
          Эта страница доступна только для родителей
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 text-red-500 mr-3" />
            Мои дети
          </h1>
          <p className="text-gray-600">
            Информация об учебе и успеваемости ваших детей
          </p>
        </div>
        
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {children.length} {children.length === 1 ? 'ребенок' : 'детей'}
            </span>
          </div>
        </div>
      </div>

      {/* Children List */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              performance={performances[child.id]}
              payments={payments[child.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Детей не найдено</h3>
          <p className="text-gray-600">
            В системе не найдено информации о ваших детях. 
            Обратитесь к администратору для добавления связи с детьми.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyChildren;
