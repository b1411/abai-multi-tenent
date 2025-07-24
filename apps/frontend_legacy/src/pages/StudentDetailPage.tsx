import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUserGraduate,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFileAlt,
  FaUserFriends,
  FaMedkit,
  FaCalendarCheck,
  FaTrophy,
  FaSmile,
  FaBrain,
  FaUsers,
  FaBookReader,
  FaPen,
  FaComments,
  FaBriefcase,
  FaMoneyBillWave,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaHistory,
  FaTimes,
  FaDownload,
  FaAward,
  FaPuzzlePiece,
  FaChalkboardTeacher,
  FaMedal,
  FaCertificate
} from 'react-icons/fa';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type JsPDFWithPlugin = jsPDF & {
  autoTable: (options: any) => void;
};

interface Document {
  type: string;
  date: string;
  link: string;
}

interface AcademicRecord {
  subject: string;
  grade: number;
  semester: number;
  year: string;
}

interface MedicalRecord {
  date: string;
  reason: string;
  diagnosis: string;
  prescription: string;
  doctor: string;
}

interface Absence {
  date: string;
  type: string;
  reason: string;
  status: string;
  approvedBy?: string;
}

interface EmotionalState {
  category: string;
  score: number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

interface Attendance {
  date: string;
  type: 'presence' | 'absence' | 'late' | 'medical' | 'excused';
  subject?: string;
  time?: string;
  reason?: string;
  status?: string;
  approvedBy?: string;
  duration?: string;
  comment?: string;
}

interface GradeData {
  subject: string;
  currentGrade: number;
  previousGrade: number;
  averageGrade: number;
  trend: 'up' | 'down' | 'stable';
  teacherName: string;
  lastUpdate: string;
  assignments: {
    type: string;
    grade: number;
    date: string;
    topic: string;
  }[];
}

interface DevelopmentPlan {
  goal: string;
  subject: string;
  currentLevel: number;
  targetLevel: number;
  deadline: string;
  status: 'in_progress' | 'completed' | 'not_started';
  tasks: {
    title: string;
    deadline: string;
    status: 'completed' | 'in_progress' | 'not_started';
    description: string;
  }[];
  mentor: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'оплачено' | 'не оплачено' | 'просрочено';
  type: string;
  description: string;
  discount?: number;
  penalty?: number;
  paymentMethod?: string;
}

interface PaymentFormData {
  type: string;
  amount: number;
  dueDate: string;
  description: string;
  discount: number;
}

interface Lesson {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  duration: string;
  room: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam';
  homework?: string;
  materials?: string[];
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  lessons: Lesson[];
}

// Добавим новые интерфейсы для фильтрации
interface DateFilter {
  type: 'day' | 'week' | 'month' | 'quarter';
  value: string;
}

interface ExamResult {
  subject: string;
  maxScore: number;
  minScore: number;
  score: number;
  result: 'Сдано' | 'Не сдано';
  examType: string;
  date: string;
  code?: string;
  classAverageScore?: number;
  details?: {
    topics: Array<{
      name: string;
      score: number;
      maxScore: number;
      mistakes?: string[];
    }>;
    examiner: string;
    duration: string;
    location: string;
    notes?: string;
  };
}

interface ExamFilter {
  year: string;
  quarter: string;
  month: string;
  examType: string;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  type: 'competition' | 'certificate' | 'award';
  description: string;
  issuer: string;
  place?: string;
  image?: string;
}

interface ExtracurricularActivity {
  id: string;
  type: 'club' | 'organization' | 'course' | 'olympiad';
  name: string;
  description: string;
  schedule: string;
  teacher: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'planned';
  achievements?: Achievement[];
  skills: string[];
  members?: number;
  image?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    type: '',
    amount: 2500,
    dueDate: '',
    description: '',
    discount: 0
  });
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'week',
    value: 'current'
  });
  const [examFilter, setExamFilter] = useState<ExamFilter>({
    year: '2024/2025',
    quarter: 'all',
    month: 'all',
    examType: 'all'
  });
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);

  // Добавим типы оплат
  const paymentTypes = [
    { id: 'jan-month-fees', label: 'Оплата за Январь' },
    { id: 'feb-month-fees', label: 'Оплата за Февраль' },
    { id: 'mar-month-fees', label: 'Оплата за Март' },
    { id: 'apr-month-fees', label: 'Оплата за Апрель' },
    { id: 'may-month-fees', label: 'Оплата за Май' },
    { id: 'jun-month-fees', label: 'Оплата за Июнь' },
    { id: 'jul-month-fees', label: 'Оплата за Июль' },
    { id: 'aug-month-fees', label: 'Оплата за Август' },
    { id: 'sep-month-fees', label: 'Оплата за Сентябрь' },
    { id: 'oct-month-fees', label: 'Оплата за Октябрь' },
    { id: 'nov-month-fees', label: 'Оплата за Ноябрь' },
    { id: 'dec-month-fees', label: 'Оплата за Декабрь' },
    { id: 'admission-fees', label: 'Вступительный взнос' },
    { id: 'exam-fees', label: 'Оплата за экзамены' },
    { id: 'extra-curriculum', label: 'Дополнительные занятия' }
  ];

  // Пример данных для графиков
  const performanceData = [
    { month: 'Сен', Математика: 4.5, Физика: 4.0, Химия: 4.2 },
    { month: 'Окт', Математика: 4.8, Физика: 4.2, Химия: 4.5 },
    { month: 'Ноя', Математика: 4.3, Физика: 4.5, Химия: 4.1 },
    { month: 'Дек', Математика: 4.6, Физика: 4.3, Химия: 4.4 },
  ];

  const attendanceData = [
    { subject: 'Математика', attendance: 95 },
    { subject: 'Физика', attendance: 88 },
    { subject: 'Химия', attendance: 92 },
    { subject: 'Биология', attendance: 97 },
  ];

  const skillsData = [
    { subject: 'Математика', value: 90 },
    { subject: 'Физика', value: 85 },
    { subject: 'Химия', value: 88 },
    { subject: 'Биология', value: 92 },
    { subject: 'Информатика', value: 95 },
  ];

  const activityData = [
    { name: 'Домашние задания', value: 85 },
    { name: 'Участие в классе', value: 70 },
    { name: 'Проекты', value: 95 },
    { name: 'Тесты', value: 88 },
  ];

  // Пример данных студента
  const student = {
    id,
    fullName: 'Алихан Сатыбалды',
    class: 'МК24-1М',
    birthDate: '2008-05-15',
    phone: '+7 (777) 123-45-67',
    email: 'alikhan@example.com',
    address: 'ул. Абая 123, кв. 45',
    parentName: 'Сатыбалды Нурлан',
    parentPhone: '+7 (777) 765-43-21',
    photo: 'https://placekitten.com/200/200',
    enrollmentDate: '2020-09-01',
    nationality: 'Казахстан',
    iin: '080515123456',
    bloodGroup: 'II+',
    medicalInfo: 'Нет противопоказаний',
    previousSchool: 'Школа №15',
    achievements: [
      'Победитель олимпиады по математике 2022',
      'Участник научной конференции 2023'
    ],
    documents: [
      { type: 'Удостоверение личности', date: '2023-01-15', link: '#' },
      { type: 'Медицинская карта', date: '2023-02-20', link: '#' }
    ],
    academicRecords: [
      { subject: 'Математика', grade: 5, semester: 1, year: '2023-2024' },
      { subject: 'Физика', grade: 4, semester: 1, year: '2023-2024' }
    ]
  };

  // Пример данных для медпункта
  const medicalRecords: MedicalRecord[] = [
    {
      date: '2024-03-15',
      reason: 'Головная боль',
      diagnosis: 'Мигрень',
      prescription: 'Отдых, обезболивающее',
      doctor: 'Асанова А.К.'
    },
    {
      date: '2024-02-20',
      reason: 'Плановый осмотр',
      diagnosis: 'Здоров',
      prescription: '-',
      doctor: 'Асанова А.К.'
    }
  ];

  // Пример данных для отгулов
  const absences: Absence[] = [
    {
      date: '2024-03-10',
      type: 'Отгул',
      reason: 'Семейные обстоятельства',
      status: 'Одобрено',
      approvedBy: 'Классный руководитель'
    },
    {
      date: '2024-02-15',
      type: 'Больничный',
      reason: 'ОРВИ',
      status: 'Подтверждено',
      approvedBy: 'Мед. справка'
    }
  ];

  // Данные психоэмоционального состояния
  const emotionalStates: EmotionalState[] = [
    {
      category: 'Общее настроение',
      score: 85,
      description: 'Позитивное, стабильное настроение',
      trend: 'up',
      lastUpdate: '2024-03-20'
    },
    {
      category: 'Концентрация',
      score: 75,
      description: 'Хорошая фокусировка на занятиях',
      trend: 'stable',
      lastUpdate: '2024-03-20'
    },
    {
      category: 'Социализация',
      score: 90,
      description: 'Отличное взаимодействие с одноклассниками',
      trend: 'up',
      lastUpdate: '2024-03-20'
    },
    {
      category: 'Учебная мотивация',
      score: 80,
      description: 'Высокий интерес к обучению',
      trend: 'stable',
      lastUpdate: '2024-03-20'
    }
  ];

  // В секции с данными добавим куратора
  const contacts = [
    {
      relation: 'Отец',
      name: student.parentName,
      phone: student.parentPhone,
      email: 'nurlan@example.com',
      occupation: 'Инженер',
      workPlace: 'ТОО "Технопром"',
      address: student.address,
      id: 'father_1'
    },
    {
      relation: 'Мать',
      name: 'Сатыбалды Айгуль',
      phone: '+7 (777) 888-99-00',
      email: 'aigul@example.com',
      occupation: 'Врач',
      workPlace: 'Городская поликлиника №5',
      address: student.address,
      id: 'mother_1'
    },
    {
      relation: 'Куратор',
      name: 'Ахметова Динара',
      phone: '+7 (777) 999-00-11',
      email: 'akhmetova@example.com',
      occupation: 'Куратор группы МК24-1М',
      workPlace: 'Школа №1',
      address: 'ул. Абая 1',
      id: 'curator_1'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↑</span>;
      case 'down':
        return <span className="text-red-500">↓</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getStateIcon = (category: string) => {
    switch (category) {
      case 'Общее настроение':
        return <FaSmile className="w-8 h-8 text-yellow-400" />;
      case 'Концентрация':
        return <FaBrain className="w-8 h-8 text-purple-400" />;
      case 'Социализация':
        return <FaUsers className="w-8 h-8 text-blue-400" />;
      case 'Учебная мотивация':
        return <FaBookReader className="w-8 h-8 text-green-400" />;
      default:
        return null;
    }
  };

  const handleChatWithParent = (parentId: string, parentName: string) => {
    navigate('/chat', { 
      state: { 
        recipientId: parentId,
        recipientName: parentName 
      } 
    });
  };

  // Добавляем данные посещаемости
  const attendanceHistory: Attendance[] = [
    {
      date: '2024-03-15',
      type: 'medical',
      time: '10:30',
      reason: 'Головная боль',
      status: 'Подтверждено',
      approvedBy: 'Асанова А.К.',
      duration: '2 часа',
      comment: 'Отправлен домой после приема лекарств'
    },
    {
      date: '2024-03-14',
      type: 'late',
      time: '09:15',
      subject: 'Математика',
      duration: '15 минут',
      comment: 'Опоздание по причине транспортных проблем'
    },
    {
      date: '2024-03-10',
      type: 'excused',
      reason: 'Семейные обстоятельства',
      status: 'Одобрено',
      approvedBy: 'Классный руководитель',
      duration: 'Полный день',
      comment: 'Заявление от родителей предоставлено'
    },
    {
      date: '2024-02-20',
      type: 'medical',
      time: '11:45',
      reason: 'Плановый осмотр',
      status: 'Подтверждено',
      approvedBy: 'Асанова А.К.',
      duration: '1 час',
      comment: 'Профилактический осмотр пройден успешно'
    },
    {
      date: '2024-02-15',
      type: 'absence',
      reason: 'ОРВИ',
      status: 'Подтверждено',
      approvedBy: 'Мед. справка',
      duration: '5 дней',
      comment: 'Справка от врача предоставлена'
    }
  ];

  // Добавляем статистику посещаемости
  const attendanceStats = {
    total: {
      present: 85,
      absent: 8,
      late: 5,
      medical: 2
    },
    byMonth: [
      { month: 'Янв', присутствие: 95, отсутствие: 3, опоздания: 2 },
      { month: 'Фев', присутствие: 88, отсутствие: 8, опоздания: 4 },
      { month: 'Мар', присутствие: 92, отсутствие: 5, опоздания: 3 }
    ],
    bySubject: [
      { subject: 'Математика', присутствие: 95, отсутствие: 3, опоздания: 2 },
      { subject: 'Физика', присутствие: 90, отсутствие: 7, опоздания: 3 },
      { subject: 'Химия', присутствие: 88, отсутствие: 8, опоздания: 4 },
      { subject: 'Биология', присутствие: 93, отсутствие: 5, опоздания: 2 }
    ]
  };

  const getAttendanceTypeColor = (type: Attendance['type']) => {
    switch (type) {
      case 'presence':
        return 'bg-green-100 text-green-800';
      case 'absence':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'medical':
        return 'bg-blue-100 text-blue-800';
      case 'excused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceTypeText = (type: Attendance['type']) => {
    switch (type) {
      case 'presence':
        return 'Присутствие';
      case 'absence':
        return 'Отсутствие';
      case 'late':
        return 'Опоздание';
      case 'medical':
        return 'Мед. пункт';
      case 'excused':
        return 'Уважительная';
      default:
        return type;
    }
  };

  // Добавляем новые данные
  const gradesData: GradeData[] = [
    {
      subject: 'Математика',
      currentGrade: 4.8,
      previousGrade: 4.5,
      averageGrade: 4.6,
      trend: 'up',
      teacherName: 'Жумабаева А.К.',
      lastUpdate: '2024-03-20',
      assignments: [
        { type: 'Контрольная работа', grade: 5, date: '2024-03-15', topic: 'Тригонометрия' },
        { type: 'Домашняя работа', grade: 4, date: '2024-03-10', topic: 'Логарифмы' },
        { type: 'Тест', grade: 5, date: '2024-03-05', topic: 'Производные' }
      ]
    },
    {
      subject: 'Физика',
      currentGrade: 4.5,
      previousGrade: 4.2,
      averageGrade: 4.3,
      trend: 'up',
      teacherName: 'Сериков Б.М.',
      lastUpdate: '2024-03-18',
      assignments: [
        { type: 'Лабораторная работа', grade: 5, date: '2024-03-14', topic: 'Электричество' },
        { type: 'Проект', grade: 4, date: '2024-03-08', topic: 'Механика' },
        { type: 'Контрольная работа', grade: 4, date: '2024-03-01', topic: 'Оптика' }
      ]
    },
    {
      subject: 'Химия',
      currentGrade: 4.2,
      previousGrade: 4.4,
      averageGrade: 4.3,
      trend: 'down',
      teacherName: 'Алтынбекова Г.С.',
      lastUpdate: '2024-03-19',
      assignments: [
        { type: 'Практическая работа', grade: 4, date: '2024-03-16', topic: 'Кислоты и основания' },
        { type: 'Тест', grade: 4, date: '2024-03-09', topic: 'Металлы' },
        { type: 'Домашняя работа', grade: 5, date: '2024-03-02', topic: 'Органическая химия' }
      ]
    }
  ];

  const developmentPlans: DevelopmentPlan[] = [
    {
      goal: 'Улучшение навыков решения олимпиадных задач',
      subject: 'Математика',
      currentLevel: 75,
      targetLevel: 90,
      deadline: '2024-05-01',
      status: 'in_progress',
      tasks: [
        {
          title: 'Решение задач повышенной сложности',
          deadline: '2024-04-01',
          status: 'in_progress',
          description: 'Ежедневное решение 2-3 олимпиадных задач'
        },
        {
          title: 'Участие в математическом кружке',
          deadline: '2024-04-15',
          status: 'completed',
          description: 'Регулярное посещение занятий математического кружка'
        }
      ],
      mentor: 'Жумабаева А.К.'
    },
    {
      goal: 'Подготовка к республиканской олимпиаде',
      subject: 'Физика',
      currentLevel: 65,
      targetLevel: 85,
      deadline: '2024-06-01',
      status: 'in_progress',
      tasks: [
        {
          title: 'Изучение теоретического материала',
          deadline: '2024-04-20',
          status: 'in_progress',
          description: 'Изучение базовых тем и формул'
        },
        {
          title: 'Практические занятия',
          deadline: '2024-05-01',
          status: 'in_progress',
          description: 'Решение задач и подготовка к олимпиаде'
        }
      ],
      mentor: 'Сериков Б.М.'
    },
    {
      goal: 'Повышение уровня знаний по химии',
      subject: 'Химия',
      currentLevel: 70,
      targetLevel: 85,
      deadline: '2024-07-01',
      status: 'in_progress',
      tasks: [
        {
          title: 'Изучение новых тем и формул',
          deadline: '2024-05-15',
          status: 'in_progress',
          description: 'Изучение новых тем и формул'
        },
        {
          title: 'Решение задач и подготовка к экзаменам',
          deadline: '2024-06-15',
          status: 'in_progress',
          description: 'Решение задач и подготовка к экзаменам'
        }
      ],
      mentor: 'Алтынбекова Г.С.'
    }
  ];

  const getGradeTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Выполнено';
      case 'in_progress':
        return 'В процессе';
      case 'not_started':
        return 'Не начато';
      default:
        return status;
    }
  };

  // Добавим данные для финансов
  const payments: Payment[] = [
    {
      id: '#435453',
      amount: 2500,
      date: '03 Apr 2024',
      dueDate: '10 Май 2024',
      status: 'оплачено',
      type: 'apr-month-fees',
      description: 'Группа МК24-1М Общие (Плата за Апрель)',
      discount: 10,
      paymentMethod: 'Наличные'
    },
    {
      id: '#435443',
      amount: 2500,
      date: '05 Янв 2024',
      dueDate: '10 Янв 2024',
      status: 'оплачено',
      type: 'dec-month-fees',
      description: 'Группа МК24-1М Общие (Плата за Декабрь)',
      discount: 10,
      paymentMethod: 'Наличные'
    },
    {
      id: '#435449',
      amount: 2500,
      date: '01 Apr 2024',
      dueDate: '10 Apr 2024',
      status: 'оплачено',
      type: 'jul-month-fees',
      description: 'Группа МК24-1М Общие (Плата за Июль)',
      discount: 10,
      penalty: 200,
      paymentMethod: 'Наличные'
    }
  ];

  const financialSummary = {
    totalPaid: 25000,
    pendingPayments: 2500,
    totalDiscount: 2500,
    totalPenalty: 400
  };

  const paymentTrends = [
    { month: 'Янв', сумма: 2500, скидка: 250 },
    { month: 'Фев', сумма: 2500, скидка: 250 },
    { month: 'Мар', сумма: 2500, скидка: 250 },
    { month: 'Апр', сумма: 2500, скидка: 250 }
  ];

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет логика отправки данных на сервер
    console.log('Payment Form Data:', paymentFormData);
    setIsPaymentModalOpen(false);
    // Сбросим форму
    setPaymentFormData({
      type: '',
      amount: 2500,
      dueDate: '',
      description: '',
      discount: 0
    });
  };

  // Обновим данные расписания
  const schedule: DaySchedule[] = [
    {
      date: '2024-03-25',
      dayOfWeek: 'Понедельник',
      lessons: [
        {
          id: '1',
          subject: 'Математика',
          teacher: 'Жасмин Алимова',
          time: '09:00 - 09:45',
          duration: '45 мин',
          room: '204',
          type: 'lecture'
        },
        {
          id: '2',
          subject: 'Английский',
          teacher: 'Аяжан Бекмуратова',
          time: '09:45 - 10:30',
          duration: '45 мин',
          room: '305',
          type: 'practice'
        },
        {
          id: '3',
          subject: 'Компьютер',
          teacher: 'Даниял Кенжебаев',
          time: '10:45 - 11:30',
          duration: '45 мин',
          room: '401',
          type: 'lab'
        },
        {
          id: '4',
          subject: 'Испанский',
          teacher: 'Эрик Латипов',
          time: '11:30 - 12:15',
          duration: '45 мин',
          room: '302',
          type: 'practice'
        },
        {
          id: '5',
          subject: 'Наука',
          teacher: 'Мақпал Сагинтаева',
          time: '13:30 - 14:15',
          duration: '45 мин',
          room: '205',
          type: 'lecture'
        }
      ]
    },
    // ... остальные дни недели ...
  ];

  const getTypeColor = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-50 text-blue-700';
      case 'practice':
        return 'bg-green-50 text-green-700';
      case 'lab':
        return 'bg-purple-50 text-purple-700';
      case 'exam':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeText = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'Лекция';
      case 'practice':
        return 'Практика';
      case 'lab':
        return 'Лаборатория';
      case 'exam':
        return 'Экзамен';
      default:
        return type;
    }
  };

  // Добавим данные экзаменов
  const examResults: ExamResult[] = [
    {
      subject: 'Английский',
      code: '150',
      maxScore: 100,
      minScore: 35,
      score: 65,
      result: 'Сдано',
      examType: 'Ежемесячный тест (Май)',
      date: '2024/2025',
      classAverageScore: 62,
      details: {
        topics: [
          { name: 'Грамматика', score: 25, maxScore: 30, mistakes: ['Present Perfect vs Past Simple', 'Articles'] },
          { name: 'Чтение', score: 15, maxScore: 20 },
          { name: 'Аудирование', score: 15, maxScore: 25, mistakes: ['Understanding context'] },
          { name: 'Письмо', score: 10, maxScore: 25, mistakes: ['Essay structure', 'Vocabulary usage'] }
        ],
        examiner: 'Бекмуратова А.К.',
        duration: '120 минут',
        location: 'Кабинет 305',
        notes: 'Хорошее понимание грамматики, требуется улучшение письменных навыков'
      }
    },
    {
      subject: 'Математика',
      code: '214',
      maxScore: 100,
      minScore: 35,
      score: 73,
      result: 'Сдано',
      examType: 'Ежемесячный тест (Май)',
      date: '2024/2025',
      classAverageScore: 68,
      details: {
        topics: [
          { name: 'Алгебра', score: 35, maxScore: 40 },
          { name: 'Геометрия', score: 28, maxScore: 40, mistakes: ['Теорема Пифагора'] },
          { name: 'Логика', score: 10, maxScore: 20, mistakes: ['Сложные уравнения'] }
        ],
        examiner: 'Жумабаева А.К.',
        duration: '180 минут',
        location: 'Кабинет 204',
        notes: 'Сильные результаты в алгебре, требуется дополнительная работа по геометрии'
      }
    },
    {
      subject: 'Физика',
      code: '120',
      maxScore: 100,
      minScore: 35,
      score: 55,
      result: 'Сдано',
      examType: 'Ежемесячный тест (Май)',
      date: '2024/2025'
    },
    {
      subject: 'Химия',
      code: '110',
      maxScore: 100,
      minScore: 35,
      score: 90,
      result: 'Сдано',
      examType: 'Ежемесячный тест (Май)',
      date: '2024/2025'
    },
    {
      subject: 'Испанский',
      code: '140',
      maxScore: 100,
      minScore: 35,
      score: 88,
      result: 'Сдано',
      examType: 'Ежемесячный тест (Май)',
      date: '2024/2025'
    }
  ];

  const examSummary = {
    totalExams: 5,
    passed: 5,
    failed: 0,
    averageScore: 74.2,
    totalScore: 395,
    maxPossibleScore: 500,
    ranking: 30,
    percentage: 79.50
  };

  // Добавим типы экзаменов
  const examTypes = [
    { id: 'monthly', label: 'Ежемесячный тест' },
    { id: 'quarter', label: 'Четвертная контрольная' },
    { id: 'final', label: 'Итоговый экзамен' },
    { id: 'olympiad', label: 'Олимпиада' }
  ];

  const filteredExams = examResults.filter(exam => {
    if (examFilter.year !== 'all' && exam.date !== examFilter.year) return false;
    
    // Фильтрация по четверти
    if (examFilter.quarter !== 'all') {
      const examMonth = parseInt(exam.examType.split(' ')[2].replace('(', ''));
      const quarter = Math.ceil(examMonth / 3);
      if (quarter.toString() !== examFilter.quarter) return false;
    }
    
    // Фильтрация по месяцу
    if (examFilter.month !== 'all') {
      const examMonth = parseInt(exam.examType.split(' ')[2].replace('(', ''));
      if (examMonth.toString() !== examFilter.month) return false;
    }
    
    // Фильтрация по типу экзамена
    if (examFilter.examType !== 'all') {
      const examTypeMatch = examTypes.find(type => type.id === examFilter.examType);
      if (!exam.examType.includes(examTypeMatch?.label || '')) return false;
    }
    
    return true;
  });

  // Обновляем итоговую статистику на основе отфильтрованных экзаменов
  const filteredExamSummary = {
    totalExams: filteredExams.length,
    passed: filteredExams.filter(exam => exam.result === 'Сдано').length,
    failed: filteredExams.filter(exam => exam.result === 'Не сдано').length,
    averageScore: filteredExams.reduce((acc, exam) => acc + exam.score, 0) / filteredExams.length || 0,
    totalScore: filteredExams.reduce((acc, exam) => acc + exam.score, 0),
    maxPossibleScore: filteredExams.length * 100,
    ranking: examSummary.ranking, // Оставляем оригинальный рейтинг
    percentage: (filteredExams.reduce((acc, exam) => acc + exam.score, 0) / (filteredExams.length * 100)) * 100 || 0
  };

  // Функция для экспорта результатов в PDF
  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as JsPDFWithPlugin;
    
    // Заголовок
    doc.setFontSize(16);
    doc.text('Результаты экзаменов', 14, 15);
    doc.setFontSize(12);
    doc.text(`Студент: ${student.fullName}`, 14, 25);
    doc.text(`Класс: ${student.class}`, 14, 32);
    doc.text(`Учебный год: ${examFilter.year}`, 14, 39);

    // Таблица результатов
    const tableData = filteredExams.map(exam => [
      `${exam.subject} (${exam.code})`,
      exam.maxScore.toString(),
      exam.score.toString(),
      exam.classAverageScore?.toString() || '-',
      exam.result
    ]);

    doc.autoTable({
      head: [['Предмет', 'Макс. балл', 'Получено', 'Средний балл', 'Результат']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Итоговая статистика
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Общий рейтинг: ${filteredExamSummary.ranking}`, 14, finalY);
    doc.text(`Средний балл: ${filteredExamSummary.averageScore.toFixed(1)}`, 14, finalY + 7);
    doc.text(`Процент успеваемости: ${filteredExamSummary.percentage.toFixed(2)}%`, 14, finalY + 14);

    // Сохранение файла
    doc.save(`Результаты_экзаменов_${student.fullName}.pdf`);
  };

  // Данные для дополнительного образования
  const extracurricularActivities: ExtracurricularActivity[] = [
    {
      id: '1',
      type: 'club',
      name: 'Робототехника',
      description: 'Изучение основ робототехники и программирования',
      schedule: 'Понедельник и Среда 16:00-18:00',
      teacher: 'Иванов А.П.',
      location: 'Кабинет 205',
      startDate: '2024-01-15',
      status: 'active',
      skills: ['Arduino', 'Программирование', 'Электроника', '3D-моделирование'],
      members: 15,
      image: 'robotics.jpg',
      achievements: [
        {
          id: 'r1',
          title: 'Победитель городского конкурса по робототехнике',
          date: '2024-03-15',
          type: 'competition',
          description: 'Первое место в категории "Автономные роботы"',
          issuer: 'Городской центр технического творчества',
          place: '1 место'
        }
      ]
    },
    {
      id: '2',
      type: 'organization',
      name: 'Химический клуб',
      description: 'Углубленное изучение химии и проведение экспериментов',
      schedule: 'Суббота 10:00-12:00',
      teacher: 'Петрова М.С.',
      location: 'Лаборатория 302',
      startDate: '2024-02-10',
      status: 'active',
      skills: ['Химия', 'Лабораторные работы', 'Анализ данных'],
      members: 12,
      image: 'chemistry.jpg',
      achievements: [
        {
          id: 'c1',
          title: 'Диплом за научный проект',
          date: '2024-03-10',
          type: 'certificate',
          description: 'Исследование качества воды в городских водоемах',
          issuer: 'Научное общество учащихся',
          place: 'Региональный уровень'
        }
      ]
    },
    {
      id: '3',
      type: 'course',
      name: 'Web-разработка',
      description: 'Создание современных веб-приложений',
      schedule: 'Вторник и Четверг 18:00-20:00',
      teacher: 'Смирнов Д.И.',
      location: 'Online',
      startDate: '2024-03-05',
      status: 'active',
      skills: ['HTML', 'CSS', 'JavaScript', 'React'],
      members: 20,
      image: 'web-dev.jpg',
      achievements: [
        {
          id: 'w1',
          title: 'Лучший проект курса',
          date: '2024-04-15',
          type: 'award',
          description: 'Разработка социальной сети для школьников',
          issuer: 'IT-Academy',
          place: 'Топ-3'
        }
      ]
    },
    {
      id: '4',
      type: 'olympiad',
      name: 'Олимпиада по математике',
      description: 'Подготовка и участие в городской олимпиаде',
      schedule: 'Пятница 15:00-17:00',
      teacher: 'Николаева Е.В.',
      location: 'Кабинет 401',
      startDate: '2024-01-20',
      status: 'completed',
      skills: ['Алгебра', 'Геометрия', 'Логика', 'Теория чисел'],
      members: 25,
      image: 'math.jpg',
      achievements: [
        {
          id: 'm1',
          title: 'Призер городской олимпиады',
          date: '2024-02-28',
          type: 'competition',
          description: 'Второе место в личном зачете',
          issuer: 'Городской департамент образования',
          place: '2 место'
        }
      ]
    },
    {
      id: '5',
      type: 'club',
      name: 'Дебатный клуб',
      description: 'Развитие навыков публичных выступлений и аргументации',
      schedule: 'Среда 16:30-18:30',
      teacher: 'Кузнецова А.А.',
      location: 'Актовый зал',
      startDate: '2024-02-01',
      status: 'active',
      skills: ['Ораторское искусство', 'Критическое мышление', 'Аргументация'],
      members: 18,
      image: 'debate.jpg',
      achievements: [
        {
          id: 'd1',
          title: 'Победа в городском турнире',
          date: '2024-03-20',
          type: 'competition',
          description: 'Лучший спикер турнира',
          issuer: 'Ассоциация дебатных клубов',
          place: '1 место'
        }
      ]
    }
  ];

  const getActivityTypeColor = (type: ExtracurricularActivity['type']) => {
    switch (type) {
      case 'club':
        return 'bg-blue-500 text-white';
      case 'organization':
        return 'bg-green-500 text-white';
      case 'course':
        return 'bg-yellow-500 text-white';
      case 'olympiad':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getActivityTypeIcon = (type: ExtracurricularActivity['type']) => {
    switch (type) {
      case 'club':
        return <FaChalkboardTeacher className="w-6 h-6" />;
      case 'organization':
        return <FaUsers className="w-6 h-6" />;
      case 'course':
        return <FaBookReader className="w-6 h-6" />;
      case 'olympiad':
        return <FaMedal className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getActivityStatusColor = (status: ExtracurricularActivity['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'planned':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getActivityStatusText = (status: ExtracurricularActivity['status']) => {
    switch (status) {
      case 'active':
        return 'Активно';
      case 'completed':
        return 'Завершено';
      case 'planned':
        return 'Планируется';
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img
              src={student.photo}
              alt={student.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <div className="flex items-center">
                    <FaUserGraduate className="w-4 h-4 mr-2" />
                    <span>{student.class}</span>
                  </div>
                  <div className="flex items-center">
                    <FaIdCard className="w-4 h-4 mr-2" />
                    <span>{student.iin}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaComments className="w-4 h-4" />
                Написать
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-8 border-b border-gray-200">
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Обзор
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'performance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('performance')}
          >
            Успеваемость
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'attendance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('attendance')}
          >
            Посещаемость
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'finance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('finance')}
          >
            Финансы
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'schedule'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('schedule')}
          >
            Расписание
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'exams'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('exams')}
          >
            Экзамены и результаты
          </button>
          <button
            className={`pb-4 px-2 text-sm font-medium ${
              activeTab === 'extracurricular'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('extracurricular')}
          >
            Доп. образование
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Психоэмоциональное состояние */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Психоэмоциональное состояние</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {emotionalStates.map((state) => (
                <div key={state.category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStateIcon(state.category)}
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {state.category}
                      </span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: getScoreColor(state.score) }}>
                      {state.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{state.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Обновлено: {state.lastUpdate}</span>
                    <div className="flex items-center">
                      <span>Тренд:</span>
                      {getTrendIcon(state.trend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Контакты</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Отец */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaUserGraduate className="w-5 h-5 text-gray-500" />
                    <span className="ml-2 font-medium">Отец</span>
                  </div>
                  <button
                    onClick={() => handleChatWithParent('father', 'Сатыбалды Нурлан')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Написать
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{student.parentName}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaPhone className="w-4 h-4 mr-2" />
                    <span>{student.parentPhone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    <span>nurlan@example.com</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBriefcase className="w-4 h-4 mr-2" />
                    <span>Инженер<br />ТОО "Технопром"</span>
                  </div>
                </div>
              </div>

              {/* Мать */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaUserGraduate className="w-5 h-5 text-gray-500" />
                    <span className="ml-2 font-medium">Мать</span>
                  </div>
                  <button
                    onClick={() => handleChatWithParent('mother', 'Сатыбалды Айгуль')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Написать
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Сатыбалды Айгуль</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaPhone className="w-4 h-4 mr-2" />
                    <span>+7 (777) 888-99-00</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    <span>aigul@example.com</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBriefcase className="w-4 h-4 mr-2" />
                    <span>Врач<br />Городская поликлиника №5</span>
                  </div>
                </div>
              </div>

              {/* Куратор */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaUserGraduate className="w-5 h-5 text-gray-500" />
                    <span className="ml-2 font-medium">Куратор</span>
                  </div>
                  <button
                    onClick={() => handleChatWithParent('curator', 'Ахметова Динара')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Написать
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Ахметова Динара</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaPhone className="w-4 h-4 mr-2" />
                    <span>+7 (777) 999-00-11</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    <span>akhmetova@example.com</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBriefcase className="w-4 h-4 mr-2" />
                    <span>Куратор группы МК24-1М<br />Школа №1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Графики */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Динамика успеваемости */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Динамика успеваемости</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Математика" stroke="#8884d8" />
                  <Line type="monotone" dataKey="Физика" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Химия" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Посещаемость */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Посещаемость</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Текущая успеваемость */}
          <div className="bg-white rounded-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Текущая успеваемость</h2>
              <p className="text-sm text-gray-500">Оценки и прогресс по предметам</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              {gradesData.map((subject, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-100 rounded-lg hover:border-blue-100 transition-all duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-900">{subject.subject}</h3>
                        <span className={`
                          px-1.5 py-0.5 rounded text-xs font-medium
                          ${subject.trend === 'up' ? 'bg-green-50 text-green-700' : 
                            subject.trend === 'down' ? 'bg-red-50 text-red-700' : 
                            'bg-gray-50 text-gray-700'}
                        `}>
                          {subject.trend === 'up' ? '↑' : subject.trend === 'down' ? '↓' : '→'}
                          {subject.currentGrade}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      Преподаватель: {subject.teacherName}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 rounded-lg p-2">
                      <div>
                        <div className="text-xs text-gray-500">Текущая</div>
                        <div className="text-lg font-medium text-gray-900">{subject.currentGrade}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Предыдущая</div>
                        <div className="text-lg font-medium text-gray-900">{subject.previousGrade}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Средняя</div>
                        <div className="text-lg font-medium text-gray-900">{subject.averageGrade}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-2">Последние задания</div>
                      <div className="space-y-1.5">
                        {subject.assignments.map((assignment, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between py-0.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                              <span className="text-xs text-gray-900">{assignment.type}</span>
                            </div>
                            <span className={`
                              px-1.5 py-0.5 rounded text-xs font-medium
                              ${assignment.grade >= 4.5 ? 'bg-green-50 text-green-700' : 
                                assignment.grade >= 4 ? 'bg-blue-50 text-blue-700' : 
                                'bg-yellow-50 text-yellow-700'}
                            `}>
                              {assignment.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Персональный план развития */}
          <div className="bg-white rounded-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Персональный план развития</h2>
              <p className="text-sm text-gray-500">Цели и задачи для улучшения успеваемости</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              {developmentPlans.map((plan, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-100 rounded-lg hover:border-blue-100 transition-all duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-900">{plan.subject}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(plan.status)}`}>
                          {getStatusText(plan.status)}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      Ментор: {plan.mentor}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-900 mb-2">{plan.goal}</div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Прогресс к цели</span>
                        <span className="text-gray-900">{plan.currentLevel}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(plan.currentLevel / plan.targetLevel) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-2">Задачи</div>
                      <div className="space-y-1.5">
                        {plan.tasks.map((task, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between py-0.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                              <span className="text-xs text-gray-900">{task.title}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 text-right">
                        Срок: {plan.deadline}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Графики успеваемости */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-6">Динамика оценок по предметам</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis domain={[0, 5]} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Математика" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Физика" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Химия" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-6">Распределение навыков</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
                  <Radar
                    name="Текущие показатели"
                    dataKey="value"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* История посещаемости */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-1">История посещаемости</h2>
            <p className="text-sm text-gray-500 mb-6">Записи о посещаемости, медицинских визитах и пропусках</p>
            <div className="grid grid-cols-1 gap-4">
              {attendanceHistory.map((record, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg hover:border-blue-200 transition-all duration-200"
                >
                  <div className="border-b border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`
                          px-2 py-1 rounded-md text-xs font-medium
                          ${record.type === 'medical' ? 'bg-blue-50 text-blue-700' : 
                            record.type === 'late' ? 'bg-yellow-50 text-yellow-700' :
                            record.type === 'excused' ? 'bg-gray-50 text-gray-700' :
                            record.type === 'absence' ? 'bg-red-50 text-red-700' :
                            'bg-green-50 text-green-700'}
                        `}>
                          {getAttendanceTypeText(record.type)}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900">
                          {record.reason || (record.subject && `Предмет: ${record.subject}`)}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{record.date}</div>
                        {record.time && (
                          <div className="text-xs text-gray-500">{record.time}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-b-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {record.status && (
                        <div className="text-sm">
                          <span className="text-gray-500">Статус</span>
                          <p className="mt-1 text-gray-900">{record.status}</p>
                        </div>
                      )}
                      {record.approvedBy && (
                        <div className="text-sm">
                          <span className="text-gray-500">Подтверждено</span>
                          <p className="mt-1 text-gray-900">{record.approvedBy}</p>
                        </div>
                      )}
                      {record.duration && (
                        <div className="text-sm">
                          <span className="text-gray-500">Длительность</span>
                          <p className="mt-1 text-gray-900">{record.duration}</p>
                        </div>
                      )}
                      {record.comment && (
                        <div className="text-sm col-span-2">
                          <span className="text-gray-500">Комментарий</span>
                          <p className="mt-1 text-gray-900 italic">{record.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статистика посещаемости */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-1">Статистика посещаемости</h2>
            <p className="text-sm text-gray-500 mb-6">Общая статистика и показатели посещаемости</p>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-lg border border-gray-100 hover:border-green-200 transition-all duration-200">
                <div className="text-2xl font-semibold text-green-600">{attendanceStats.total.present}%</div>
                <div className="text-sm text-gray-600 mt-1">Присутствие</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 hover:border-red-200 transition-all duration-200">
                <div className="text-2xl font-semibold text-red-600">{attendanceStats.total.absent}%</div>
                <div className="text-sm text-gray-600 mt-1">Отсутствие</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 hover:border-yellow-200 transition-all duration-200">
                <div className="text-2xl font-semibold text-yellow-600">{attendanceStats.total.late}%</div>
                <div className="text-sm text-gray-600 mt-1">Опоздания</div>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-200">
                <div className="text-2xl font-semibold text-blue-600">{attendanceStats.total.medical}%</div>
                <div className="text-sm text-gray-600 mt-1">Мед. пункт</div>
              </div>
            </div>

            {/* График посещаемости по месяцам */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Динамика по месяцам</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceStats.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="присутствие" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="отсутствие" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="опоздания" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* График посещаемости по предметам */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Статистика по предметам</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceStats.bySubject} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                  <YAxis dataKey="subject" type="category" width={100} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="присутствие" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="отсутствие" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="опоздания" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-4 mb-6">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <FaFileInvoiceDollar className="w-4 h-4" />
              Назначить оплату
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              onClick={() => {/* Добавить логику */}}
            >
              <FaCreditCard className="w-4 h-4" />
              Принять оплату
            </button>
          </div>

          {isPaymentModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium text-gray-900">Назначить оплату</h2>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handlePaymentSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип оплаты
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={paymentFormData.type}
                        onChange={(e) => setPaymentFormData({
                          ...paymentFormData,
                          type: e.target.value,
                          description: paymentTypes.find(t => t.id === e.target.value)?.label || ''
                        })}
                        required
                      >
                        <option value="">Выберите тип оплаты</option>
                        {paymentTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Сумма (₸)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={paymentFormData.amount}
                        onChange={(e) => setPaymentFormData({
                          ...paymentFormData,
                          amount: Number(e.target.value)
                        })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Срок оплаты
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={paymentFormData.dueDate}
                        onChange={(e) => setPaymentFormData({
                          ...paymentFormData,
                          dueDate: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Скидка (%)
                      </label>
                      <input
                        type="number"
                        
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={paymentFormData.discount}
                        onChange={(e) => setPaymentFormData({
                          ...paymentFormData,
                          discount: Number(e.target.value)
                        })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Описание
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={paymentFormData.description}
                        onChange={(e) => setPaymentFormData({
                          ...paymentFormData,
                          description: e.target.value
                        })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => setIsPaymentModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Назначить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Финансовая сводка</h2>
              <p className="text-sm text-gray-500">Общая информация по платежам</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-green-600">
                      <FaMoneyBillWave className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {financialSummary.totalPaid.toLocaleString()} ₸
                      </div>
                      <div className="text-sm text-green-600">Всего оплачено</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-600">
                      <FaFileInvoiceDollar className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">
                        {financialSummary.pendingPayments.toLocaleString()} ₸
                      </div>
                      <div className="text-sm text-yellow-600">Ожидает оплаты</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-blue-600">
                      <FaHistory className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {financialSummary.totalDiscount.toLocaleString()} ₸
                      </div>
                      <div className="text-sm text-blue-600">Сумма скидок</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-red-600">
                      <FaMoneyBillWave className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {financialSummary.totalPenalty.toLocaleString()} ₸
                      </div>
                      <div className="text-sm text-red-600">Сумма пени</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Тренды платежей</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="сумма"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="скидка"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">История платежей</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Срок
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Скидка
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Пеня
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{payment.id}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{payment.description}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {payment.amount.toLocaleString()} ₸
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{payment.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{payment.dueDate}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              payment.status === 'оплачено'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'не оплачено'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {payment.discount ? `${payment.discount}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {payment.penalty ? `${payment.penalty} ₸` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Расписание занятий</h2>
                <p className="text-sm text-gray-500">Расписание занятий на текущую неделю</p>
              </div>
              <div className="flex gap-4">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFilter.type}
                  onChange={(e) => setDateFilter({ ...dateFilter, type: e.target.value as DateFilter['type'] })}
                >
                  <option value="day">День</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="quarter">Четверть</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFilter.value}
                  onChange={(e) => setDateFilter({ ...dateFilter, value: e.target.value })}
                >
                  {dateFilter.type === 'day' && (
                    <>
                      <option value="current">Сегодня</option>
                      <option value="next">Завтра</option>
                    </>
                  )}
                  {dateFilter.type === 'week' && (
                    <>
                      <option value="current">Текущая неделя</option>
                      <option value="next">Следующая неделя</option>
                    </>
                  )}
                  {dateFilter.type === 'month' && (
                    <>
                      <option value="current">Текущий месяц</option>
                      <option value="next">Следующий месяц</option>
                    </>
                  )}
                  {dateFilter.type === 'quarter' && (
                    <>
                      <option value="1">1-я четверть</option>
                      <option value="2">2-я четверть</option>
                      <option value="3">3-я четверть</option>
                      <option value="4">4-я четверть</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-1 space-y-4">
                <div className="text-sm font-medium text-gray-500">Понедельник</div>
                <div className="text-sm font-medium text-gray-500">Вторник</div>
                <div className="text-sm font-medium text-gray-500">Среда</div>
                <div className="text-sm font-medium text-gray-500">Четверг</div>
                <div className="text-sm font-medium text-gray-500">Пятница</div>
                <div className="text-sm font-medium text-gray-500">Saturday</div>
              </div>

              <div className="col-span-5 space-y-4">
                {schedule.map((day) => (
                  <div key={day.date} className="grid grid-cols-1 gap-2">
                    {day.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`p-3 rounded-lg ${
                          lesson.type === 'lecture' ? 'bg-pink-50' :
                          lesson.type === 'practice' ? 'bg-blue-50' :
                          lesson.type === 'lab' ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{lesson.time}</span>
                            <span className="text-xs text-gray-500">({lesson.duration})</span>
                          </div>
                          <span className="text-xs text-gray-500">Кабинет {lesson.room}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{lesson.subject}</div>
                            <div className="text-xs text-gray-500">{lesson.teacher}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            lesson.type === 'lecture' ? 'bg-pink-100 text-pink-800' :
                            lesson.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                            lesson.type === 'lab' ? 'bg-green-100 text-green-800' : ''
                          }`}>
                            {getTypeText(lesson.type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-900">Экзамены и результаты</h2>
                <div className="flex items-center gap-4">
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={examFilter.year}
                    onChange={(e) => setExamFilter({ ...examFilter, year: e.target.value })}
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2023/2024">2023/2024</option>
                  </select>

                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={examFilter.quarter}
                    onChange={(e) => setExamFilter({ ...examFilter, quarter: e.target.value })}
                  >
                    <option value="all">Все четверти</option>
                    <option value="1">1-я четверть</option>
                    <option value="2">2-я четверть</option>
                    <option value="3">3-я четверть</option>
                    <option value="4">4-я четверть</option>
                  </select>

                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={examFilter.month}
                    onChange={(e) => setExamFilter({ ...examFilter, month: e.target.value })}
                  >
                    <option value="all">Все месяцы</option>
                    <option value="1">Январь</option>
                    <option value="2">Февраль</option>
                    <option value="3">Март</option>
                    <option value="4">Апрель</option>
                    <option value="5">Май</option>
                    <option value="6">Июнь</option>
                    <option value="7">Июль</option>
                    <option value="8">Август</option>
                    <option value="9">Сентябрь</option>
                    <option value="10">Октябрь</option>
                    <option value="11">Ноябрь</option>
                    <option value="12">Декабрь</option>
                  </select>

                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={examFilter.examType}
                    onChange={(e) => setExamFilter({ ...examFilter, examType: e.target.value })}
                  >
                    <option value="all">Все типы экзаменов</option>
                    {examTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaDownload className="w-4 h-4" />
                  Скачать PDF
                </button>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Общий рейтинг</div>
                  <div className="text-2xl font-bold text-gray-900">{examSummary.ranking}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Процент</div>
                  <div className="text-2xl font-bold text-blue-600">{examSummary.percentage}%</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Результат</div>
                  <div className="text-2xl font-bold text-green-600">Сдано</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                {examFilter.examType === 'all' ? 'Все экзамены' : examTypes.find(t => t.id === examFilter.examType)?.label}
                {examFilter.quarter !== 'all' && ` - ${examFilter.quarter}-я четверть`}
                {examFilter.month !== 'all' && ` - ${new Date(2024, parseInt(examFilter.month) - 1).toLocaleString('ru', { month: 'long' })}`}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Предмет
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Макс. баллы
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Мин. баллы
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Получено баллов
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Результат
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExams.map((exam, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedExam(exam)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {exam.subject} ({exam.code})
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{exam.maxScore}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{exam.minScore}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{exam.score}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            exam.result === 'Сдано' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {exam.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Рейтинг: {filteredExamSummary.ranking}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Всего: {filteredExamSummary.maxPossibleScore}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Получено баллов: {filteredExamSummary.totalScore}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        Процент: {filteredExamSummary.percentage.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Всего экзаменов</div>
                <div className="text-2xl font-bold text-gray-900">{filteredExamSummary.totalExams}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Сдано</div>
                <div className="text-2xl font-bold text-green-600">{filteredExamSummary.passed}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Не сдано</div>
                <div className="text-2xl font-bold text-red-600">{filteredExamSummary.failed}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Средний балл</div>
                <div className="text-2xl font-bold text-blue-600">{filteredExamSummary.averageScore.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Модальное окно с деталями экзамена */}
          {selectedExam && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedExam.subject} ({selectedExam.code})
                  </h2>
                  <button
                    onClick={() => setSelectedExam(null)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Тип экзамена</div>
                      <div className="text-base font-medium">{selectedExam.examType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Дата</div>
                      <div className="text-base font-medium">{selectedExam.date}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Экзаменатор</div>
                      <div className="text-base font-medium">{selectedExam.details?.examiner}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Длительность</div>
                      <div className="text-base font-medium">{selectedExam.details?.duration}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Место проведения</div>
                      <div className="text-base font-medium">{selectedExam.details?.location}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Результат</div>
                      <div className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                        selectedExam.result === 'Сдано' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedExam.result}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-base font-medium mb-4">Результаты по разделам</h3>
                    <div className="space-y-4">
                      {selectedExam.details?.topics.map((topic, index) => (
                        <div key={index} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">{topic.name}</div>
                            <div className="text-sm">
                              {topic.score} / {topic.maxScore} баллов
                              <span className="text-xs text-gray-500 ml-2">
                                ({((topic.score / topic.maxScore) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(topic.score / topic.maxScore) * 100}%` }}
                            ></div>
                          </div>
                          {topic.mistakes && topic.mistakes.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-red-600 mb-1">Ошибки:</div>
                              <ul className="list-disc list-inside text-xs text-gray-600">
                                {topic.mistakes.map((mistake, idx) => (
                                  <li key={idx}>{mistake}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedExam.details?.notes && (
                    <div>
                      <h3 className="text-base font-medium mb-2">Примечания</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                        {selectedExam.details.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'extracurricular' && (
        <div className="space-y-6">
          {/* Секция с активными занятиями */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-1">Дополнительное образование</h2>
            <p className="text-sm text-gray-500 mb-6">Кружки, секции и другие активности</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {extracurricularActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="bg-white border border-gray-200 rounded-lg hover:border-blue-200 transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${getActivityTypeColor(activity.type)}`}>
                          {getActivityTypeIcon(activity.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                          <p className="text-sm text-gray-500">{activity.teacher}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityStatusColor(activity.status)}`}>
                        {getActivityStatusText(activity.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{activity.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Расписание</div>
                        <div className="text-sm text-gray-900">{activity.schedule}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Место</div>
                        <div className="text-sm text-gray-900">{activity.location}</div>
                      </div>
                      {activity.members && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Участников</div>
                          <div className="text-sm text-gray-900">{activity.members}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Дата начала</div>
                        <div className="text-sm text-gray-900">{activity.startDate}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Развиваемые навыки</div>
                      <div className="flex flex-wrap gap-2">
                        {activity.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {activity.achievements && activity.achievements.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Достижения</div>
                        <div className="space-y-2">
                          {activity.achievements.map((achievement) => (
                            <div 
                              key={achievement.id}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className={`p-2 rounded-lg ${
                                achievement.type === 'competition' ? 'bg-purple-100 text-purple-600' :
                                achievement.type === 'certificate' ? 'bg-green-100 text-green-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {achievement.type === 'competition' ? <FaAward className="w-4 h-4" /> :
                                 achievement.type === 'certificate' ? <FaCertificate className="w-4 h-4" /> :
                                 <FaMedal className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{achievement.title}</div>
                                <div className="text-xs text-gray-500">{achievement.description}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{achievement.date}</span>
                                  {achievement.place && (
                                    <span className="text-xs font-medium text-blue-600">
                                      {achievement.place}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статистика и графики */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Распределение активностей</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Кружки', value: extracurricularActivities.filter(a => a.type === 'club').length },
                      { name: 'Организации', value: extracurricularActivities.filter(a => a.type === 'organization').length },
                      { name: 'Курсы', value: extracurricularActivities.filter(a => a.type === 'course').length },
                      { name: 'Олимпиады', value: extracurricularActivities.filter(a => a.type === 'olympiad').length }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {extracurricularActivities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Развитие навыков</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {
                    subject: 'Технические',
                    value: 80
                  },
                  {
                    subject: 'Творческие',
                    value: 65
                  },
                  {
                    subject: 'Лидерские',
                    value: 90
                  },
                  {
                    subject: 'Академические',
                    value: 85
                  },
                  {
                    subject: 'Социальные',
                    value: 75
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Навыки" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailPage; 