import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FaEye,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaAngleRight,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useStudent } from '../hooks/useStudents';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import {
  studentService,
  AttendanceData,
  FinanceData,
  EmotionalData,
  StudentRemarksResponse,
  CreateRemarkData,
  UpdateRemarkData,
  StudentRemark,
  StudentCommentsResponse,
  CreateCommentData,
  UpdateCommentData,
  StudentComment,
  PdpPlan,
  PdpGoal,
  CreatePdpPlanInput,
  UpdatePdpPlanInput,
  ExtraActivity,
  ExtraCategory,
  ExtraStatus,
  ExtraAchievementLevel,
  CreateExtraEducationInput,
  UpdateExtraEducationInput,
  ExtraSchedule
} from '../services/studentService';
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
import { EMO_TREND_THRESHOLD } from '../constants/emotional';
import { lessonService } from '../services/lessonService';
import lessonResultService, { AbsentReason } from '../services/lessonResultService';

const monthLabelsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

interface StudentExamItem {
  id: number;
  name: string;
  date: string;
  type: string;
  studyPlan?: { id: number; name: string };
  result?: {
    lessonScore?: number;
    homeworkScore?: number;
    attendance?: boolean;
    absentReason?: string;
  } | null;
}

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

  // Exams optimized endpoint state
  const [examsData, setExamsData] = useState<{
    data: StudentExamItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } | null>(null);
  const [examPage, setExamPage] = useState(1);
  const examLimit = 20;
  const [loadingExams, setLoadingExams] = useState<boolean>(false);
  // Exams deterministic mock (explicit user request override: deterministic mocks allowed for Exams)
  const [examFilterYear, setExamFilterYear] = useState(() => {
    const now = new Date();
    const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}/${start + 1}`;
  });
  const [examFilterQuarter, setExamFilterQuarter] = useState('Все четверти');
  const [examFilterMonth, setExamFilterMonth] = useState('Все месяцы');
  const [examFilterType, setExamFilterType] = useState('Все типы экзаменов');

  const schoolYearOptions = useMemo(() => {
    const now = new Date();
    const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const years = [start - 1, start, start + 1];
    return years.map(y => `${y}/${y + 1}`);
  }, []);

  const quarterOptions = useMemo(() => ([
    'Все четверти',
    '1 четверть (сент–окт)',
    '2 четверть (нояб–дек)',
    '3 четверть (янв–март)',
    '4 четверть (апр–май)'
  ]), []);

  const monthOptions = useMemo(() => ([
    'Все месяцы',
    'Сентябрь','Октябрь','Ноябрь','Декабрь',
    'Январь','Февраль','Март','Апрель','Май'
  ]), []);

  const monthNameToNumber = useCallback((name: string): number | undefined => {
    switch (name) {
      case 'Январь': return 1;
      case 'Февраль': return 2;
      case 'Март': return 3;
      case 'Апрель': return 4;
      case 'Май': return 5;
      case 'Июнь': return 6;
      case 'Июль': return 7;
      case 'Август': return 8;
      case 'Сентябрь': return 9;
      case 'Октябрь': return 10;
      case 'Ноябрь': return 11;
      case 'Декабрь': return 12;
      default: return undefined;
    }
  }, []);

  // Deterministic pseudo-random generator placeholder (for future scaling)
  const seededRandom = useCallback((seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  // Fixed deterministic dataset per specification (values match provided sample)

  // (future) exam type toggle if needed. Currently default CONTROL_WORK
  // const [examType, setExamType] = useState<'CONTROL_WORK' | 'EXAM'>('CONTROL_WORK');

  const [loadingData, setLoadingData] = useState<Record<string, boolean>>({});

  // Доп образование (реальные данные с бэкенда; серверные моки допустимы)
  const [extraEducationPrograms, setExtraEducationPrograms] = useState<ExtraActivity[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraCreateOpen, setExtraCreateOpen] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);
  const [extraForm, setExtraForm] = useState<{
    name: string;
    category: ExtraCategory;
    organization: string;
    status: ExtraStatus;
    progress: number;
    startDate: string;
    endDate: string;
    mentor: string;
    mentorTitle?: string;
    description?: string;
    location: string;
    participants: number;
    skillsCsv: string;
    schedule: ExtraSchedule[];
    achievements: Array<{ title: string; description?: string; date: string; level: ExtraAchievementLevel }>;
  }>({
    name: '',
    category: 'Курсы',
    organization: '',
    status: 'PLANNED',
    progress: 0,
    startDate: '',
    endDate: '',
    mentor: '',
    mentorTitle: '',
    description: '',
    location: '',
    participants: 0,
    skillsCsv: '',
    schedule: [{ day: '', time: '' }],
    achievements: []
  });

  const [extraEditOpen, setExtraEditOpen] = useState(false);
  const [savingExtraEdit, setSavingExtraEdit] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ExtraActivity | null>(null);
  const [extraEditForm, setExtraEditForm] = useState<{
    name: string;
    category: ExtraCategory;
    organization: string;
    status: ExtraStatus;
    progress: number;
    startDate: string;
    endDate: string;
    mentor: string;
    mentorTitle?: string;
    description?: string;
    location: string;
    participants: number;
    skillsCsv: string;
    schedule: ExtraSchedule[];
    achievements: Array<{ title: string; description?: string; date: string; level: ExtraAchievementLevel }>;
  }>({
    name: '',
    category: 'Курсы',
    organization: '',
    status: 'PLANNED',
    progress: 0,
    startDate: '',
    endDate: '',
    mentor: '',
    mentorTitle: '',
    description: '',
    location: '',
    participants: 0,
    skillsCsv: '',
    schedule: [{ day: '', time: '' }],
    achievements: []
  });

  const fetchExtraEducation = useCallback(async () => {
    if (!student) return;
    setLoadingExtra(true);
    try {
      const data = await studentService.getStudentExtraEducation(student.id);
      setExtraEducationPrograms(data || []);
    } catch (e) {
      console.error('Ошибка загрузки доп. образования:', e);
      setExtraEducationPrograms([]);
    } finally {
      setLoadingExtra(false);
    }
  }, [student?.id]);

  const resetExtraForm = () => {
    setExtraForm({
      name: '',
      category: 'Курсы',
      organization: '',
      status: 'PLANNED',
      progress: 0,
      startDate: '',
      endDate: '',
      mentor: '',
      mentorTitle: '',
      description: '',
      location: '',
      participants: 0,
      skillsCsv: '',
      schedule: [{ day: '', time: '' }],
      achievements: []
    });
  };

  const handleCreateExtra = async () => {
    if (!student) return;
    try {
      setSavingExtra(true);
      const payload: CreateExtraEducationInput = {
        name: extraForm.name.trim(),
        category: extraForm.category,
        organization: extraForm.organization.trim(),
        progress: Number(extraForm.progress) || 0,
        status: extraForm.status,
        startDate: extraForm.startDate,
        endDate: extraForm.endDate || undefined,
        mentor: extraForm.mentor.trim(),
        mentorTitle: extraForm.mentorTitle?.trim() || undefined,
        description: extraForm.description?.trim() || undefined,
        location: extraForm.location.trim(),
        participants: Number(extraForm.participants) || 0,
        skills: extraForm.skillsCsv.split(',').map(s => s.trim()).filter(Boolean),
        schedule: (extraForm.schedule || []).filter(s => s.day && s.time),
        achievements: (extraForm.achievements || []).filter(a => a.title && a.date && a.level).map(a => ({ title: a.title.trim(), description: (a.description ?? '').trim(), date: a.date, level: a.level }))
      };
      await studentService.createStudentExtraEducation(student.id, payload);
      setExtraCreateOpen(false);
      resetExtraForm();
      await fetchExtraEducation();
    } catch (e) {
      console.error('Ошибка создания активности:', e);
    } finally {
      setSavingExtra(false);
    }
  };

  const openEditExtra = (p: ExtraActivity) => {
    setEditingExtra(p);
    setExtraEditForm({
      name: p.name,
      category: p.category as ExtraCategory,
      organization: p.organization,
      status: p.status as ExtraStatus,
      progress: p.progress,
      startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '',
      mentor: p.mentor,
      mentorTitle: p.mentorTitle || '',
      description: p.description || '',
      location: p.location,
      participants: p.participants,
      skillsCsv: (p.skills || []).join(', '),
      schedule: (p.schedule || []).map(s => ({ day: s.day, time: s.time })),
      achievements: (p.achievements || []).map(a => ({
        title: a.title,
        description: a.description || '',
        date: a.date ? new Date(a.date).toISOString().slice(0, 10) : '',
        level: a.level as ExtraAchievementLevel
      }))
    });
    setExtraEditOpen(true);
  };

  const handleUpdateExtra = async () => {
    if (!editingExtra) return;
    try {
      setSavingExtraEdit(true);
      const payload: UpdateExtraEducationInput = {
        name: extraEditForm.name.trim(),
        category: extraEditForm.category,
        organization: extraEditForm.organization.trim(),
        progress: Number(extraEditForm.progress) || 0,
        status: extraEditForm.status,
        startDate: extraEditForm.startDate || undefined,
        endDate: extraEditForm.endDate || undefined,
        mentor: extraEditForm.mentor.trim(),
        mentorTitle: extraEditForm.mentorTitle?.trim() || undefined,
        description: extraEditForm.description?.trim() || undefined,
        location: extraEditForm.location.trim(),
        participants: Number(extraEditForm.participants) || 0,
        skills: extraEditForm.skillsCsv.split(',').map(s => s.trim()).filter(Boolean),
        schedule: (extraEditForm.schedule || []).filter(s => s.day && s.time),
        achievements: (extraEditForm.achievements || [])
          .filter(a => a.title && a.date && a.level)
          .map(a => ({ title: a.title.trim(), description: (a.description ?? '').trim(), date: a.date, level: a.level }))
      };
      await studentService.updateStudentExtraEducation(editingExtra.id, payload);
      setExtraEditOpen(false);
      setEditingExtra(null);
      await fetchExtraEducation();
    } catch (e) {
      console.error('Ошибка обновления активности:', e);
    } finally {
      setSavingExtraEdit(false);
    }
  };

  const handleDeleteExtra = async (p: ExtraActivity) => {
    if (!p?.id) return;
    const ok = window.confirm('Удалить активность?');
    if (!ok) return;
    try {
      await studentService.deleteStudentExtraEducation(p.id);
      await fetchExtraEducation();
    } catch (e) {
      console.error('Ошибка удаления активности:', e);
    }
  };

  /* Legacy local mocks (disabled):
  // Доп образование (разрешены моки, расширенный формат)
  interface ExtraActivity {
    id: string;
    name: string;
    category: 'Кружки' | 'Организации' | 'Курсы' | 'Олимпиады';
    organization: string;
    progress: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'PLANNED';
    startDate: string;
    endDate?: string;
    mentor: string;
    mentorTitle?: string;
    description: string;
    schedule: { day: string; time: string }[];
    location: string;
    participants: number;
    skills: string[];
    achievements: {
      id: string;
      title: string;
      description: string;
      date: string;
      level: 'WIN' | 'PARTICIPANT' | 'PROJECT' | 'CERT';
    }[];
  }

  const [extraEducationPrograms] = useState<ExtraActivity[]>([
    {
      id: 'extra-1',
      name: 'Курс по алгоритмам',
      category: 'Курсы',
      organization: 'IT Academy',
      progress: 70,
      status: 'IN_PROGRESS',
      startDate: '2025-06-01',
      mentor: 'Иванов Сергей',
      mentorTitle: 'Senior Engineer',
      description: 'Продвинутые структуры данных и алгоритмы оптимизации.',
      schedule: [
        { day: 'Вт', time: '17:00-18:30' },
        { day: 'Чт', time: '17:00-18:30' }
      ],
      location: 'Кампус А, ауд. 204',
      participants: 18,
      skills: ['Алгоритмы', 'Структуры данных', 'Оптимизация', 'Командная работа'],
      achievements: [
        {
          id: 'ach-1',
          title: 'Проект: Поиск пути',
          description: 'Реализация A* и сравнение с Dijkstra',
          date: '2025-07-10',
          level: 'PROJECT'
        }
      ]
    },
    {
      id: 'extra-2',
      name: 'Академия лидерства',
      category: 'Организации',
      organization: 'EduLead',
      progress: 100,
      status: 'COMPLETED',
      startDate: '2024-09-01',
      endDate: '2025-02-01',
      mentor: 'Петрова Анна',
      mentorTitle: 'HR Coach',
      description: 'Развитие навыков публичных выступлений и лидерства.',
      schedule: [
        { day: 'Ср', time: '16:00-17:30' }
      ],
      location: 'Онлайн',
      participants: 25,
      skills: ['Лидерство', 'Коммуникации', 'Публичные выступления'],
      achievements: [
        {
          id: 'ach-2',
          title: 'Финальная презентация',
          description: 'Командный питч социального проекта',
          date: '2025-02-01',
          level: 'PROJECT'
        }
      ]
    },
    {
      id: 'extra-3',
      name: 'Разговорный английский',
      category: 'Кружки',
      organization: 'Lingua Center',
      progress: 10,
      status: 'PLANNED',
      startDate: '2025-09-10',
      mentor: 'Johnson Emily',
      mentorTitle: 'Native Speaker',
      description: 'Практика разговорного английского в малых группах.',
      schedule: [
        { day: 'Пн', time: '18:00-19:00' },
        { day: 'Пт', time: '18:00-19:00' }
      ],
      location: 'Кампус B, ауд. 12',
      participants: 12,
      skills: ['Английский', 'Коммуникации', 'Слушание'],
      achievements: []
    },
    {
      id: 'extra-4',
      name: 'Олимпиада по математике',
      category: 'Олимпиады',
      organization: 'STEM League',
      progress: 55,
      status: 'IN_PROGRESS',
      startDate: '2025-05-15',
      mentor: 'Сидоров Алексей',
      mentorTitle: 'Math Coach',
      description: 'Подготовка к региональному этапу олимпиады.',
      schedule: [
        { day: 'Сб', time: '11:00-13:00' }
      ],
      location: 'Кампус A, ауд. 310',
      participants: 8,
      skills: ['Математика', 'Аналитика', 'Проблем-солвинг'],
      achievements: [
        {
          id: 'ach-3',
          title: 'Отборочный тур',
          description: 'Прошел в топ-10 списка',
          date: '2025-06-20',
          level: 'PARTICIPANT'
        }
      ]
    }
  ]);
  */
  
  // Агрегации по распределению и навыкам
  const extraDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Кружки': 0,
      'Организации': 0,
      'Курсы': 0,
      'Олимпиады': 0
    };
    extraEducationPrograms.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [extraEducationPrograms]);

  const extraSkillStats = useMemo(() => {
    const categories = {
      Технические: new Set<string>(),
      Творческие: new Set<string>(),
      Лидерские: new Set<string>()
    };
    const technicalKeywords = ['Алгорит', 'Структур', 'Оптимиз', 'Матем', 'Аналит', 'Problem', 'Английский'];
    const leadershipKeywords = ['Лидер', 'Коммуник', 'Публич', 'Команд', 'организац'];
    extraEducationPrograms.forEach(p => {
      p.skills.forEach(skill => {
        if (technicalKeywords.some(k => skill.toLowerCase().includes(k.toLowerCase()))) {
          categories.Технические.add(skill);
        } else if (leadershipKeywords.some(k => skill.toLowerCase().includes(k.toLowerCase()))) {
          categories.Лидерские.add(skill);
        } else {
          categories.Творческие.add(skill);
        }
      });
    });
    return {
      technical: Array.from(categories.Технические),
      creative: Array.from(categories.Творческие),
      leadership: Array.from(categories.Лидерские)
    };
  }, [extraEducationPrograms]);

  // Data for charts (pie + radar)
  const distributionData = useMemo(
    () => Object.entries(extraDistribution).map(([name, value]) => ({ name, value })),
    [extraDistribution]
  );

  const skillsRadarData = useMemo(() => ([
    { category: 'Технические', value: extraSkillStats.technical.length },
    { category: 'Лидерские', value: extraSkillStats.leadership.length },
    { category: 'Творческие', value: extraSkillStats.creative.length }
  ]), [extraSkillStats]);

  const skillsMaxValue = useMemo(
    () => Math.max(
      1,
      extraSkillStats.technical.length,
      extraSkillStats.leadership.length,
      extraSkillStats.creative.length
    ),
    [extraSkillStats]
  );

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
  const [pdpCreateOpen, setPdpCreateOpen] = useState(false);
  const [savingPdp, setSavingPdp] = useState(false);

  const canManageAttendance = useMemo(() => user?.role === 'TEACHER' || user?.role === 'ADMIN', [user?.role]);
  const canManageExtra = useMemo(() => user?.role === 'TEACHER' || user?.role === 'ADMIN', [user?.role]);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attForm, setAttForm] = useState<{
    date: string;
    lessonId: number | null;
    attendance: boolean;
    absentReason?: AbsentReason | '';
    absentComment?: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    lessonId: null,
    attendance: false,
    absentReason: '',
    absentComment: ''
  });
  const [lessonsForDate, setLessonsForDate] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);

  const loadLessonsByDate = useCallback(async (dateStr: string) => {
    try {
      setLoadingLessons(true);
      const dateFrom = `${dateStr}T00:00:00.000Z`;
      const dateTo = `${dateStr}T23:59:59.999Z`;
      const res = await lessonService.getLessons({ dateFrom, dateTo, limit: 50, sortBy: 'date', order: 'asc' });
      setLessonsForDate(res.data);
    } catch (e) {
      console.error('Ошибка загрузки уроков на дату:', e);
      setLessonsForDate([]);
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => {
    if (attendanceModalOpen) {
      void loadLessonsByDate(attForm.date);
    }
  }, [attendanceModalOpen, attForm.date, loadLessonsByDate]);

  const openAttendanceModal = () => {
    setEditingResult(null);
    setAttForm({
      date: new Date().toISOString().slice(0, 10),
      lessonId: null,
      attendance: false,
      absentReason: '',
      absentComment: ''
    });
    setAttendanceModalOpen(true);
  };
  const closeAttendanceModal = () => { setAttendanceModalOpen(false); setEditingResult(null); };
  const openEditAttendance = (d: any) => {
    setEditingResult(d);
    setAttForm({
      date: d?.date ? new Date(d.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      lessonId: (d as any)?.lessonId ?? null,
      attendance: !!d?.attendance,
      absentReason: d?.attendance ? '' : (d?.absentReason ?? ''),
      absentComment: d?.attendance ? '' : (d?.absentComment ?? '')
    });
    setAttendanceModalOpen(true);
  };

  const submitAttendance = async () => {
    if (!student) return;
    try {
      setSavingAttendance(true);
      if (editingResult?.id) {
        await lessonResultService.updateLessonResult(editingResult.id, {
          attendance: attForm.attendance,
          absentReason: attForm.attendance ? undefined : (attForm.absentReason as AbsentReason | undefined),
          absentComment: attForm.attendance ? undefined : (attForm.absentComment || undefined)
        });
      } else {
        if (!attForm.lessonId) return;
        await lessonResultService.createLessonResult({
          studentId: student.id,
          lessonId: attForm.lessonId,
          attendance: attForm.attendance,
          absentReason: attForm.attendance ? undefined : (attForm.absentReason as AbsentReason | undefined),
          absentComment: attForm.attendance ? undefined : (attForm.absentComment || undefined)
        });
      }
      closeAttendanceModal();
      await fetchAttendanceData();
    } catch (e) {
      console.error('Ошибка сохранения посещаемости:', e);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Посещаемость
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

  // Финансы
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

  // Эмоциональные данные
  const fetchEmotionalData = useCallback(async () => {
    if (!id) return;
    setLoadingData(prev => ({ ...prev, emotional: true }));
    try {
      const emotionalData = await studentService.getStudentEmotionalState(Number(id));
      setEmotionalData(emotionalData);
    } catch (error) {
      console.error('Ошибка загрузки эмоциональных данных:', error);
      setEmotionalData(null);
    }
    setLoadingData(prev => ({ ...prev, emotional: false }));
  }, [id]);

  // Замечания
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

  // Комментарии
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

  // Экзамены (оптимизированный endpoint)
  const fetchExamsData = useCallback(async () => {
    if (!student) return;
    setLoadingExams(true);
    try {
      const typeParam = examFilterType === 'Экзамен'
        ? 'EXAM'
        : examFilterType === 'Контрольная'
          ? 'CONTROL_WORK'
          : undefined;

      const qNumber = (() => {
        const m = examFilterQuarter.match(/^\d/);
        return m ? Number(m[0]) : undefined;
      })();

      const mNumber = (() => {
        const n = monthNameToNumber(examFilterMonth);
        return examFilterMonth !== 'Все месяцы' ? n : undefined;
      })();

      const resp = await studentService.getStudentExams(student.id, {
        page: examPage,
        limit: examLimit,
        ...(typeParam ? { type: typeParam as 'CONTROL_WORK' | 'EXAM' } : {}),
        schoolYear: examFilterYear,
        ...(qNumber ? { quarter: qNumber } : {}),
        ...(mNumber ? { month: mNumber } : {})
      });
      setExamsData(resp);
    } catch (e) {
      console.error('Ошибка загрузки экзаменов:', e);
      setExamsData({
        data: [],
        pagination: { page: examPage, limit: examLimit, total: 0, totalPages: 0 }
      });
    }
    setLoadingExams(false);
  }, [student, examPage, examFilterType, examFilterYear, examFilterQuarter, examFilterMonth, monthNameToNumber]);

  // Сброс страницы при переключении студента
  useEffect(() => {
    setExamPage(1);
    setExamsData(null);
  }, [student?.id]);

  // Основной effect для большинства табов (без экзаменов, чтобы избежать лишних перезапусков)
  useEffect(() => {
    if (!student) return;
    if (activeTab === 'grades') {
      fetchGrades();
    } else if (activeTab === 'attendance') {
      fetchAttendanceData();
    } else if (activeTab === 'finance') {
      fetchFinanceData();
    } else if (activeTab === 'remarks') {
      fetchRemarksData();
    } else if (activeTab === 'comments') {
      fetchCommentsData();
    } else if (activeTab === 'extra') {
      fetchExtraEducation();
    } else if (activeTab === 'overview') {
      if (!emotionalData) fetchEmotionalData();
      if (!attendanceData) fetchAttendanceData();
    }
  }, [student?.id, activeTab]); // избегаем включения функций и состояний, чтобы не создавать бесконечные циклы

  // Отдельный effect для экзаменов с зависимостью от страницы и типа
  useEffect(() => {
    if (!student) return;
    if (activeTab === 'exams') {
      fetchExamsData();
    }
  }, [student?.id, activeTab, examPage, examFilterType, examFilterYear, examFilterQuarter, examFilterMonth]); // триггерим по странице/типу/фильтрам

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

  // Агрегация динамики успеваемости
  const performanceChartData = useMemo(() => {
    if (!student?.lessonsResults || student.lessonsResults.length === 0) return [];
    const map: Record<string, { month: string;[subject: string]: number | string }> = {};
    const counts: Record<string, Record<string, number>> = {};
    student.lessonsResults.forEach(r => {
      if (r.lessonScore == null || r.lessonScore === undefined || !r.Lesson) return;
      const d = new Date(r.Lesson.date);
      const keyMonth = `${d.getFullYear()}-${d.getMonth()}`;
      const label = monthLabelsRu[d.getMonth()];
      const subject = r.Lesson.studyPlan?.name || r.Lesson.name;
      if (!map[keyMonth]) {
        map[keyMonth] = { month: label };
        counts[keyMonth] = {};
      }
      if (!map[keyMonth][subject]) {
        map[keyMonth][subject] = 0;
        counts[keyMonth][subject] = 0;
      }
      map[keyMonth][subject] = (map[keyMonth][subject] as number) + (r.lessonScore || 0);
      counts[keyMonth][subject] += 1;
    });
    Object.keys(map).forEach(k => {
      Object.keys(counts[k]).forEach(subject => {
        map[k][subject] = (map[k][subject] as number) / counts[k][subject];
      });
    });
    const rows = Object.entries(map)
      .sort((a, b) => {
        const [ay, am] = a[0].split('-').map(Number);
        const [by, bm] = b[0].split('-').map(Number);
        if (ay === by) return am - bm;
        return ay - by;
      })
      .map(e => e[1]);
    return rows.slice(-6);
  }, [student?.lessonsResults]);

  const performanceSubjects = useMemo(() => {
    if (performanceChartData.length === 0) return [];
    const subjectsSet = new Set<string>();
    performanceChartData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== 'month') subjectsSet.add(k);
      });
    });
    return Array.from(subjectsSet).slice(0, 5);
  }, [performanceChartData]);

  // ===== Redesigned Grades tab data (moved above early returns to satisfy hooks rules) =====
  const gradeSubjectsMetrics = useMemo(() => {
    if (!grades) return [];
    return Object.entries(grades).map(([subjectName, subjectData]: any) => {
      const gArr = subjectData.grades || [];
      const currentScore = gArr[0]?.lessonScore ?? null;
      const previousScore = gArr[1]?.lessonScore ?? null;
      const averageScore = subjectData.statistics?.averageLessonScore ?? null;
      let trend: 'up' | 'down' | 'stable' | null = null;
      if (currentScore != null && previousScore != null) {
        if (currentScore > previousScore) trend = 'up';
        else if (currentScore < previousScore) trend = 'down';
        else trend = 'stable';
      }
      return {
        subjectName,
        currentScore,
        previousScore,
        averageScore,
        trend,
        teacher: subjectData.subject?.teacher?.user
          ? `${subjectData.subject.teacher.user.surname} ${subjectData.subject.teacher.user.name}`
          : null
      };
    });
  }, [grades]);

  const lastAssignments = useMemo(() => {
    if (!grades) return [];
    const all: any[] = [];
    Object.entries(grades).forEach(([subjectName, subjectData]: any) => {
      (subjectData.grades || []).slice(0, 8).forEach((g: any) => {
        if (g.lessonScore == null) return;
        all.push({
          subject: subjectName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          title: g.Lesson?.name || 'Задание',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          date: new Date(g.Lesson?.date),
          score: g.lessonScore
        });
      });
    });
    return all
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3)
      .map(item => ({
        ...item,
        dateStr: item.date.toLocaleDateString('ru-RU')
      }));
  }, [grades]);

  // PDP (real API)
  const [pdpPlans, setPdpPlans] = useState<PdpPlan[] | null>(null);
  const [loadingPdp, setLoadingPdp] = useState(false);

  const canEditPdp = useMemo(() => {
    if (!user || !student) return false;
    if (user.role === 'STUDENT') return student.userId === user.id;
    if (user.role === 'TEACHER' || user.role === 'ADMIN') return true;
    return false;
  }, [user?.role, user?.id, student?.userId]);

  const loadPdp = useCallback(async () => {
    if (!student) return;
    setLoadingPdp(true);
    try {
      const data = await studentService.getStudentPdp(student.id);
      setPdpPlans(data);
    } catch (e) {
      console.error('Ошибка загрузки PDP:', e);
      setPdpPlans([]);
    }
    setLoadingPdp(false);
  }, [student?.id]);

  useEffect(() => {
    if (activeTab === 'grades') {
      void loadPdp();
    }
  }, [activeTab, loadPdp]);

  const [newPlan, setNewPlan] = useState<{ subject: string; mentor?: string; description?: string; skills: string }>({
    subject: '',
    skills: ''
  });
  const [newGoalByPlan, setNewGoalByPlan] = useState<Record<number, { title: string; deadline?: string }>>({});

  const handleCreatePlan = useCallback(async () => {
    if (!student || !newPlan.subject.trim()) return;
    try {
      const payload: CreatePdpPlanInput = {
        subject: newPlan.subject.trim(),
        mentor: newPlan.mentor,
        description: newPlan.description,
        skills: newPlan.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      await studentService.createStudentPdp(student.id, payload);
      setNewPlan({ subject: '', skills: '' });
      await loadPdp();
    } catch (e) {
      console.error('Ошибка создания плана:', e);
    }
  }, [student?.id, newPlan, loadPdp]);

  const handleUpdatePlan = useCallback(async (planId: number, patch: Partial<UpdatePdpPlanInput>) => {
    try {
      await studentService.updatePdpPlan(planId, patch);
      await loadPdp();
    } catch (e) {
      console.error('Ошибка обновления плана:', e);
    }
  }, [loadPdp]);

  const handleDeletePlan = useCallback(async (planId: number) => {
    try {
      await studentService.deletePdpPlan(planId);
      await loadPdp();
    } catch (e) {
      console.error('Ошибка удаления плана:', e);
    }
  }, [loadPdp]);

  const handleAddGoal = useCallback(async (planId: number) => {
    const form = newGoalByPlan[planId];
    if (!form?.title?.trim()) return;
    try {
      await studentService.addPdpGoal(planId, { title: form.title.trim(), deadline: form.deadline });
      setNewGoalByPlan(prev => ({ ...prev, [planId]: { title: '' } }));
      await loadPdp();
    } catch (e) {
      console.error('Ошибка добавления цели:', e);
    }
  }, [newGoalByPlan, loadPdp]);

  const cycleStatus = (s: 'PENDING' | 'IN_PROGRESS' | 'DONE'): 'PENDING' | 'IN_PROGRESS' | 'DONE' =>
    s === 'PENDING' ? 'IN_PROGRESS' : s === 'IN_PROGRESS' ? 'DONE' : 'PENDING';

  const handleToggleGoalStatus = useCallback(async (goalId: number, current: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await studentService.updatePdpGoal(goalId, { status: cycleStatus(current) });
      await loadPdp();
    } catch (e) {
      console.error('Ошибка изменения статуса цели:', e);
    }
  }, [loadPdp]);

  const handleDeleteGoal = useCallback(async (goalId: number) => {
    try {
      await studentService.deletePdpGoal(goalId);
      await loadPdp();
    } catch (e) {
      console.error('Ошибка удаления цели:', e);
    }
  }, [loadPdp]);

  const skillsDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    (pdpPlans ?? []).forEach(p => {
      (p.skills || []).forEach((s: string) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([skill, value]) => ({ skill, value }));
  }, [pdpPlans]);

  // История посещаемости берется из backend: attendanceData.details

  // Remark handlers
  const handleAddRemark = () => { setEditingRemark(null); setRemarkModalOpen(true); };
  const handleEditRemark = (remark: StudentRemark) => { setEditingRemark(remark); setRemarkModalOpen(true); };
  const handleDeleteRemark = (remark: StudentRemark) => { setDeletingRemark(remark); setDeleteRemarkModalOpen(true); };
  const handleRemarkSubmit = async (remarkData: CreateRemarkData | UpdateRemarkData) => {
    if (!id) return;
    try {
      if (editingRemark) {
        await studentService.updateStudentRemark(editingRemark.id, remarkData);
      } else {
        await studentService.addStudentRemark(Number(id), remarkData as CreateRemarkData);
      }
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
      await fetchRemarksData();
    } catch (error) {
      console.error('Ошибка при удалении замечания:', error);
      throw error;
    }
  };
  const closeRemarkModal = () => { setRemarkModalOpen(false); setEditingRemark(null); };
  const closeDeleteModal = () => { setDeleteRemarkModalOpen(false); setDeletingRemark(null); };

  // Comment handlers
  const handleAddComment = () => { setEditingComment(null); setCommentModalOpen(true); };
  const handleEditComment = (comment: StudentComment) => { setEditingComment(comment); setCommentModalOpen(true); };
  const handleDeleteComment = (comment: StudentComment) => { setDeletingComment(comment); setDeleteCommentModalOpen(true); };
  const handleCommentSubmit = async (commentData: CreateCommentData | UpdateCommentData) => {
    if (!id) return;
    try {
      if (editingComment) {
        await studentService.updateStudentComment(editingComment.id, commentData);
      } else {
        await studentService.addStudentComment(Number(id), commentData as CreateCommentData);
      }
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
      await fetchCommentsData();
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      throw error;
    }
  };
  const closeCommentModal = () => { setCommentModalOpen(false); setEditingComment(null); };
  const closeDeleteCommentModal = () => { setDeleteCommentModalOpen(false); setDeletingComment(null); };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 max-w-7xl mx-auto w-full overflow-x-hidden break-words min-w-0">
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
      { id: 'exams', label: 'Экзамены', icon: FaBook },
      { id: 'attendance', label: 'Посещаемость', icon: FaClipboardList },
      { id: 'finance', label: 'Финансы', icon: FaCreditCard },
      { id: 'extra', label: 'Доп образование', icon: FaSmile },
      ...(user?.role === 'TEACHER' || user?.role === 'ADMIN' ? [
        { id: 'remarks', label: 'Замечания', icon: FaExclamationTriangle },
      ] : []),
      ...(user?.role === 'ADMIN' ? [
        { id: 'comments', label: 'Комментарии админам', icon: FaComments },
      ] : [])
    ] : []),
    ...(accessLevel === 'full' && user?.role === 'STUDENT' ? [
      { id: 'extra', label: 'Доп образование', icon: FaSmile },
    ] : [])
  ];

  const renderTrendIcon = (trend?: string) => {
    if (trend === 'up') return <FaArrowUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <FaArrowDown className="w-4 h-4 text-red-500" />;
    return <FaArrowRight className="w-4 h-4 text-gray-400" />;
  };

  // Реальные данные (feedback -> legacy EmotionalState -> no_data)
  const effectiveEmotional: EmotionalData =
    emotionalData?.currentState
      ? emotionalData
      : student.EmotionalState
        ? {
            student: student.id,
            currentState: {
              mood: {
                value: student.EmotionalState.mood,
                description: student.EmotionalState.moodDesc,
                trend: student.EmotionalState.moodTrend
              },
              concentration: {
                value: student.EmotionalState.concentration,
                description: student.EmotionalState.concentrationDesc,
                trend: student.EmotionalState.concentrationTrend
              },
              socialization: {
                value: student.EmotionalState.socialization,
                description: student.EmotionalState.socializationDesc,
                trend: student.EmotionalState.socializationTrend
              },
              motivation: {
                value: student.EmotionalState.motivation,
                description: student.EmotionalState.motivationDesc,
                trend: student.EmotionalState.motivationTrend
              },
              lastUpdated: student.EmotionalState.updatedAt
            },
            feedbackHistory: [],
            trends: {},
            recommendations: [],
            source: 'legacy'
          }
        : {
            student: student.id,
            currentState: null,
            feedbackHistory: [],
            trends: {},
            recommendations: [],
            source: 'no_data'
          };

  const emotionalCurrent = effectiveEmotional.currentState;
  const emotionalUpdatedAt = emotionalCurrent?.lastUpdated
    ? new Date(emotionalCurrent.lastUpdated).toLocaleDateString('ru-RU')
    : student.EmotionalState
      ? new Date(student.EmotionalState.updatedAt).toLocaleDateString('ru-RU')
      : null;

  const legacyEmotion = student.EmotionalState;

  // Тренды по истории эмоционального состояния (без хуков после early return)
  const emotionalHistory = effectiveEmotional.feedbackHistory || [];

  const computeTrendDiff = (key: string) => {
    if (emotionalHistory.length < 2) return { trend: 'neutral' as const, diff: null as number | null };
    const prev = emotionalHistory[emotionalHistory.length - 2]?.[key];
    const curr = emotionalHistory[emotionalHistory.length - 1]?.[key];
    if (prev == null || curr == null || typeof prev !== 'number' || typeof curr !== 'number') {
      return { trend: 'neutral' as const, diff: null as number | null };
    }
    const delta = curr - prev;
    if (delta > EMO_TREND_THRESHOLD) return { trend: 'up' as const, diff: delta };
    if (delta < -EMO_TREND_THRESHOLD) return { trend: 'down' as const, diff: delta };
    return { trend: 'neutral' as const, diff: delta };
  };

  // Derived metrics calculators
  const stressCalc = (e: any) => {
    if (typeof e?.mood === 'number' && typeof e?.motivation === 'number') {
      return 100 - ((e.mood + e.motivation) / 2);
    }
    return undefined;
  };
  const engagementCalc = (e: any) => {
    if (typeof e?.socialization === 'number' && typeof e?.motivation === 'number') {
      return (e.socialization + e.motivation) / 2;
    }
    return undefined;
  };

  const computeDerivedTrend = (calc: (e:any)=>number|undefined) => {
    if (emotionalHistory.length < 2) return { trend: 'neutral' as const, diff: null as number | null };
    const prev = calc(emotionalHistory[emotionalHistory.length - 2]);
    const curr = calc(emotionalHistory[emotionalHistory.length - 1]);
    if (prev == null || curr == null) return { trend: 'neutral' as const, diff: null as number | null };
    const delta = curr - prev;
    if (delta > EMO_TREND_THRESHOLD) return { trend: 'up' as const, diff: delta };
    if (delta < -EMO_TREND_THRESHOLD) return { trend: 'down' as const, diff: delta };
    return { trend: 'neutral' as const, diff: delta };
  };

  const { trend: moodTrend, diff: moodDiff } = computeTrendDiff('mood');
  const { trend: concentrationTrend, diff: concentrationDiff } = computeTrendDiff('concentration');
  const { trend: socializationTrend, diff: socializationDiff } = computeTrendDiff('socialization');
  const { trend: motivationTrend, diff: motivationDiff } = computeTrendDiff('motivation');
  const { trend: stressTrend, diff: stressDiff } = computeDerivedTrend(stressCalc);
  const { trend: engagementTrend, diff: engagementDiff } = computeDerivedTrend(engagementCalc);

  // Current derived metrics
  const derivedStress = emotionalCurrent?.mood?.value != null && emotionalCurrent?.motivation?.value != null
    ? 100 - ((emotionalCurrent.mood.value + emotionalCurrent.motivation.value) / 2)
    : undefined;
  const derivedEngagement = emotionalCurrent?.socialization?.value != null && emotionalCurrent?.motivation?.value != null
    ? (emotionalCurrent.socialization.value + emotionalCurrent.motivation.value) / 2
    : undefined;

  const showTrends = emotionalHistory.length >= 2;

  // (hooks block moved above early returns)

  return (
    <div className="px-4 py-6 md:px-6 max-w-7xl mx-auto w-full overflow-x-hidden break-words min-w-0">
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

      {/* Заголовок */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 min-w-0">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl shrink-0">
            {student.user.name.charAt(0)}{student.user.surname.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between gap-4 min-w-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.user.surname} {student.user.name}{student.user.middlename && ` ${student.user.middlename}`}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600 text-sm">
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
                  onClick={() => { }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 self-start"
                >
                  <FaComments className="w-4 h-4" />
                  Написать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-4 mt-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
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

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Психоэмоциональное состояние */}
          {accessLevel === 'full' && (emotionalCurrent || legacyEmotion) && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Психоэмоциональное состояние</h2>
                  {emotionalUpdatedAt && (
                    <p className="text-xs text-gray-500 mt-1">Обновлено: {emotionalUpdatedAt}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {effectiveEmotional?.source === 'feedback' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Из фидбеков
                    </span>
                  )}
                  {loadingData.emotional && <Spinner size="sm" />}
                </div>
              </div>
              {showTrends && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <TrendBadge label="Настроение" trend={moodTrend} diff={moodDiff} />
                  <TrendBadge label="Концентрация" trend={concentrationTrend} diff={concentrationDiff} />
                  <TrendBadge label="Социализация" trend={socializationTrend} diff={socializationDiff} />
                  <TrendBadge label="Вовлеченность" trend={engagementTrend} diff={engagementDiff} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <EmotionMetricCard
                  title="Общее настроение"
                  icon={<FaSmile className="w-6 h-6 drop-shadow" />}
                  colorRing="from-yellow-400 to-yellow-600"
                  value={emotionalCurrent?.mood.value ?? legacyEmotion?.mood}
                  description={emotionalCurrent?.mood.description ?? legacyEmotion?.moodDesc}
                  trend={moodTrend}
                />
                <EmotionMetricCard
                  title="Концентрация"
                  icon={<FaBrain className="w-6 h-6 drop-shadow" />}
                  colorRing="from-purple-400 to-purple-600"
                  value={emotionalCurrent?.concentration.value ?? legacyEmotion?.concentration}
                  description={emotionalCurrent?.concentration.description ?? legacyEmotion?.concentrationDesc}
                  trend={concentrationTrend}
                />
                <EmotionMetricCard
                  title="Социализация"
                  icon={<FaUsers className="w-6 h-6 drop-shadow" />}
                  colorRing="from-blue-400 to-blue-600"
                  value={emotionalCurrent?.socialization.value}
                  description={emotionalCurrent?.socialization.description}
                  trend={socializationTrend}
                />
                
                <EmotionMetricCard
                  title="Вовлеченность"
                  icon={<FaChartLine className="w-6 h-6 drop-shadow" />}
                  colorRing="from-indigo-400 to-indigo-600"
                  value={derivedEngagement != null ? Math.round(derivedEngagement) : undefined}
                  description="Производная: avg(социализация, мотивация)"
                  trend={engagementTrend}
                />
              </div>

              {(effectiveEmotional?.feedbackHistory?.length ?? 0) > 1 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FaChartLine className="w-4 h-4 text-blue-500" />
                    История изменений
                  </h3>
                  <div style={{ height: 220 }} className="max-w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(effectiveEmotional?.feedbackHistory ?? []).slice(-10).map(item => {
                          const stressVal = stressCalc(item);
                          const engagementVal = engagementCalc(item);
                          return {
                            date: new Date(item.date).toLocaleDateString('ru-RU'),
                            настроение: item.mood,
                            концентрация: item.concentration,
                            социализация: item.socialization,
                            мотивация: item.motivation,
                            стресс: stressVal,
                            вовлеченность: engagementVal
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="настроение" stroke="#F59E0B" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="концентрация" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="социализация" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="вовлеченность" stroke="#9333EA" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Контакты */}
          {accessLevel === 'full' && (student.Parents?.length || true) && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Контакты</h3>
              <div className="space-y-4">
                {student.Parents?.map(parent => (
                  <div key={parent.id} className="flex items-start justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {parent.user.surname} {parent.user.name}
                      </p>
                      {parent.user.phone && (
                        <p className="text-xs text-gray-600">{parent.user.phone}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{parent.user.email}</p>
                    </div>
                    <button
                      onClick={() => { }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaComments className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {student.group?.curator?.user && (
                  <div className="flex items-start justify-between border-t pt-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium">
                        Куратор: {student.group.curator.user.surname} {student.group.curator.user.name}
                      </p>
                      {student.group.curator.user.phone && (
                        <p className="text-xs text-gray-600">{student.group.curator.user.phone}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{student.group.curator.user.email}</p>
                    </div>
                    <button
                      onClick={() => { }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaComments className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Графики */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
            {accessLevel === 'full' && performanceChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Динамика успеваемости</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    Средние оценки по месяцам
                    {loadingData.grades && <Spinner size="sm" />}
                  </div>
                </div>
                <div className="w-full h-72 max-w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      {performanceSubjects.map((s, idx) => {
                        const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                        return (
                          <Line
                            key={s}
                            type="monotone"
                            dataKey={s}
                            stroke={palette[idx % palette.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {accessLevel === 'full' && attendanceData && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Посещаемость</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <FaCheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
                    <div className="text-lg font-bold text-green-600">
                      {attendanceData.summary.attendanceRate}%
                    </div>
                    <div className="text-xs text-gray-600">Посещаемость</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <FaExclamationTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                    <div className="text-lg font-bold text-red-600">
                      {attendanceData.summary.missedLessons}
                    </div>
                    <div className="text-xs text-gray-600">Пропущено</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto pr-1">
                  {Object.entries(attendanceData.subjectAttendance)
                    .slice(0, 6)
                    .map(([subject, data]) => {
                      const total = (data as any).attended + (data as any).missed;
                      const rate = total ? Math.round(((data as any).attended / total) * 100) : 0;
                      return (
                        <div key={subject}>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span className="truncate">{subject}</span>
                            <span>{rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded">
                            <div
                              className="h-1.5 rounded bg-green-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Детали <FaAngleRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Последние результаты */}
          {accessLevel === 'full' && student.lessonsResults && student.lessonsResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Последние результаты</h2>
              <div className="space-y-3">
                {student.lessonsResults.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{result.Lesson.name}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {result.Lesson.studyPlan?.name} •{' '}
                        {new Date(result.Lesson.date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.attendance !== null && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${result.attendance
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {result.attendance ? 'Присутствовал' : 'Отсутствовал'}
                        </span>
                      )}
                      {result.lessonScore !== null &&
                        result.lessonScore !== undefined && (
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${result.lessonScore >= 4
                                ? 'bg-green-500'
                                : result.lessonScore >= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                          >
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
      )}

      {/* GRADES */}
      {activeTab === 'grades' && accessLevel === 'full' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">Успеваемость</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                Персональный план
              </span>
              {grades && (
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  Предметов: {gradeSubjectsMetrics.length}
                </span>
              )}
            </div>
          </div>

          {/* Subject cards */}
          {grades ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {gradeSubjectsMetrics.map(m => {
                  const trendIcon =
                    m.trend === 'up'
                      ? <FaArrowUp className="w-4 h-4 text-green-500" />
                      : m.trend === 'down'
                        ? <FaArrowDown className="w-4 h-4 text-red-500" />
                        : <FaArrowRight className="w-4 h-4 text-gray-400" />;
                  return (
                    <div
                      key={m.subjectName}
                      className="border rounded-xl p-5 flex flex-col gap-4 bg-gradient-to-b from-white to-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 leading-snug truncate">
                            {m.subjectName}
                          </h3>
                          {m.teacher && (
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                              Преподаватель: {m.teacher}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {trendIcon}
                          <span className="text-[11px] text-gray-500">
                            {m.trend === 'up'
                              ? 'Рост'
                              : m.trend === 'down'
                                ? 'Снижение'
                                : 'Стабильно'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-end gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                              {m.currentScore != null ? m.currentScore.toFixed ? m.currentScore.toFixed(1) : m.currentScore : '—'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                            {m.previousScore != null && (
                              <span className="mr-2">
                                Предыдущая:{' '}
                                <span className="font-medium text-gray-700">
                                  {m.previousScore.toFixed ? m.previousScore.toFixed(1) : m.previousScore}
                                </span>
                              </span>
                            )}
                            {m.averageScore != null && (
                              <span>
                                Средняя:{' '}
                                <span className="font-medium text-gray-700">
                                  {m.averageScore.toFixed ? m.averageScore.toFixed(1) : m.averageScore}
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Last assignments + Personal plan */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Last assignments */}
                <div className="border rounded-xl p-5 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaClipboardList className="w-4 h-4 text-blue-500" />
                    Последние задания
                  </h3>
                  {lastAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {lastAssignments.map((a, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">
                              {a.title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {a.subject} • {a.dateStr}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-md text-sm font-semibold text-white ${
                              a.score >= 4
                                ? 'bg-green-500'
                                : a.score >= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                          >
                            {a.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Нет оценок</div>
                  )}
                </div>

                {/* Personal development plan (real API) */}
                <div className="border rounded-xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <FaChartLine className="w-4 h-4 text-green-600" />
                      Персональный план развития
                    </h3>
                    {loadingPdp && <Spinner size="sm" />}
                  </div>

                  {canEditPdp && (
                    <div className="mb-4">
                      <button
                        onClick={() => setPdpCreateOpen(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Создать план
                      </button>
                    </div>
                  )}

                  <div className="space-y-5 max-h-[420px] overflow-auto pr-1">
                    {(pdpPlans ?? []).map((plan) => {
                      const statusBadge =
                        plan.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : plan.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : plan.status === 'ON_HOLD'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800';
                      return (
                        <div key={plan.id} className="p-4 rounded-lg border bg-white flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{plan.subject}</p>
                              {plan.mentor && (
                                <p className="text-[11px] text-gray-500 mt-0.5">Ментор: {plan.mentor}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusBadge}`}>
                                {plan.status === 'COMPLETED'
                                  ? 'Завершено'
                                  : plan.status === 'IN_PROGRESS'
                                    ? 'В процессе'
                                    : plan.status === 'ON_HOLD'
                                      ? 'Пауза'
                                      : 'Черновик'}
                              </span>
                              {canEditPdp && (
                                <select
                                  value={plan.status}
                                  onChange={e => handleUpdatePlan(plan.id, { status: e.target.value as any })}
                                  className="border rounded px-2 py-1 text-[11px]"
                                >
                                  <option value="DRAFT">Черновик</option>
                                  <option value="IN_PROGRESS">В процессе</option>
                                  <option value="COMPLETED">Завершено</option>
                                  <option value="ON_HOLD">Пауза</option>
                                </select>
                              )}
                              {canEditPdp && (
                                <button
                                  onClick={() => handleDeletePlan(plan.id)}
                                  className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded"
                                  title="Удалить план"
                                >
                                  Удалить
                                </button>
                              )}
                            </div>
                          </div>

                          <textarea
                            defaultValue={plan.description ?? ''}
                            onBlur={e => canEditPdp && handleUpdatePlan(plan.id, { description: e.target.value })}
                            disabled={!canEditPdp}
                            placeholder="Описание"
                            className="border rounded-lg px-2 py-1 text-sm"
                            rows={2}
                          />

                          <div>
                            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                              <span>Прогресс</span>
                              <span>{plan.progress}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              defaultValue={plan.progress}
                              disabled={!canEditPdp}
                              onChange={e => canEditPdp && handleUpdatePlan(plan.id, { progress: Number(e.target.value) })}
                              className="w-full"
                            />
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {(plan.skills || []).map((s) => (
                              <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="space-y-2">
                            {plan.goals.map((g: PdpGoal) => {
                              const badge =
                                g.status === 'DONE'
                                  ? 'bg-green-100 text-green-800'
                                  : g.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800';
                              const label =
                                g.status === 'DONE' ? 'Готово' : g.status === 'IN_PROGRESS' ? 'В работе' : 'Запланировано';
                              return (
                                <div key={g.id} className="flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      disabled={!canEditPdp}
                                      onClick={() => handleToggleGoalStatus(g.id, g.status)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge} disabled:opacity-60`}
                                      title="Сменить статус"
                                    >
                                      {label}
                                    </button>
                                    <span className="truncate">{g.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-gray-400">
                                      {g.deadline ? new Date(g.deadline).toLocaleDateString('ru-RU') : ''}
                                    </span>
                                    {canEditPdp && (
                                      <button
                                        onClick={() => handleDeleteGoal(g.id)}
                                        className="text-red-600 hover:bg-red-50 px-2 py-0.5 rounded"
                                        title="Удалить цель"
                                      >
                                        Удалить
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {canEditPdp && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
                              <input
                                value={newGoalByPlan[plan.id]?.title || ''}
                                onChange={e =>
                                  setNewGoalByPlan(prev => ({ ...prev, [plan.id]: { ...(prev[plan.id] || {}), title: e.target.value } }))
                                }
                                placeholder="Новая цель"
                                className="border rounded-lg px-2 py-1 text-sm sm:col-span-2"
                              />
                              <input
                                type="date"
                                value={newGoalByPlan[plan.id]?.deadline || ''}
                                onChange={e =>
                                  setNewGoalByPlan(prev => ({ ...prev, [plan.id]: { ...(prev[plan.id] || {}), deadline: e.target.value } }))
                                }
                                className="border rounded-lg px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() => handleAddGoal(plan.id)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:col-span-2"
                              >
                                Добавить цель
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(!pdpPlans || pdpPlans.length === 0) && !loadingPdp && (
                      <div className="text-sm text-gray-500">Нет планов</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartLine className="w-4 h-4 text-blue-500" />
                    Динамика оценок по предметам
                  </h3>
                  {performanceChartData.length > 0 ? (
                    <div style={{ height: 280 }} className="w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Legend />
                          {performanceSubjects.map((s, idx) => {
                            const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                            return (
                              <Line
                                key={s}
                                type="monotone"
                                dataKey={s}
                                stroke={palette[idx % palette.length]}
                                strokeWidth={2}
                                dot={false}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Недостаточно данных</p>
                  )}
                </div>

                <div className="border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaBrain className="w-4 h-4 text-purple-500" />
                    Распределение навыков
                  </h3>
                  {skillsDistributionData.length > 0 ? (
                    <div style={{ height: 280 }} className="w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={skillsDistributionData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="skill" />
                          <PolarRadiusAxis />
                          <Radar
                            name="Навык"
                            dataKey="value"
                            stroke="#6366F1"
                            fill="#6366F1"
                            fillOpacity={0.5}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Нет данных по навыкам</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaBook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Оценки загружаются...</p>
            </div>
          )}
        </div>
      )}

      {/* EXAMS */}
      {activeTab === 'exams' && accessLevel === 'full' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold">Экзамены и результаты</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">                <button
                onClick={() => { }}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Скачать PDF
              </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Учебный год
                </label>
                <select
                  value={examFilterYear}
                  onChange={e => { setExamFilterYear(e.target.value); setExamPage(1); }}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {schoolYearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Четверть
                </label>
                <select
                  value={examFilterQuarter}
                  onChange={e => { setExamFilterQuarter(e.target.value); setExamFilterMonth('Все месяцы'); setExamPage(1); }}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {quarterOptions.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Месяц
                </label>
                <select
                  value={examFilterMonth}
                  onChange={e => { setExamFilterMonth(e.target.value); setExamFilterQuarter('Все четверти'); setExamPage(1); }}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {monthOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Тип экзамена
                </label>
                <select
                  value={examFilterType}
                  onChange={e => { setExamFilterType(e.target.value); setExamPage(1); }}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  <option>Все типы экзаменов</option>
                  <option>Контрольная</option>
                  <option>Экзамен</option>
                </select>
              </div>
              <div className="hidden md:flex flex-col">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Статус
                </label>
                <select disabled className="border rounded-lg px-2 py-1 text-sm bg-gray-50 text-gray-400 cursor-not-allowed">
                  <option>Все</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary + Table */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Overall result card */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="border rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 h-full flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего записей</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {examsData?.pagination?.total ?? examsData?.data?.length ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Средний балл (урок)</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(() => {
                      const arr = (examsData?.data ?? [])
                        .map(x => x.result?.lessonScore)
                        .filter(v => typeof v === 'number') as number[];
                      return arr.length ? (arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1) : '—';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Присутствий</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    {(examsData?.data ?? []).filter(x => x.result?.attendance === true).length}
                  </span>
                </div>
                {loadingExams && (
                  <div className="mt-auto">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaBook className="w-4 h-4 text-blue-500" />
                Все экзамены
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Дата</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Предмет</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Название</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Тип</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Оценка</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Дом. работа</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide text-xs">Посещаемость</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(examsData?.data ?? []).map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap">
                          {row.studyPlan?.name || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {row.name}
                        </td>
                        <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                          {row.type === 'EXAM' ? 'Экзамен' : 'Контрольная'}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-semibold">
                          {row.result?.lessonScore ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {row.result?.homeworkScore ?? '—'}
                        </td>
                        <td className="px-4 py-2">
                          {row.result?.attendance != null ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.result.attendance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {row.result.attendance ? 'Присутствовал' : 'Отсутствовал'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loadingExams && (examsData?.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                          Нет записей
                        </td>
                      </tr>
                    )}
                    {loadingExams && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center">
                          <Spinner size="sm" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-600">
                  Стр. {examsData?.pagination?.page ?? 1} из {examsData?.pagination?.totalPages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExamPage(p => Math.max(1, p - 1))}
                    disabled={loadingExams || (examsData?.pagination?.page ?? 1) <= 1}
                    className="px-3 py-1.5 rounded border text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setExamPage(p => {
                      const max = examsData?.pagination?.totalPages ?? p + 1;
                      return Math.min(max, p + 1);
                    })}
                    disabled={loadingExams || !examsData || (examsData?.pagination?.page ?? 1) >= (examsData?.pagination?.totalPages ?? 1)}
                    className="px-3 py-1.5 rounded border text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>

              {/* Bottom stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <FaClipboardList className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-lg font-bold text-blue-600">
                    {examsData?.pagination?.total ?? examsData?.data?.length ?? 0}
                  </div>
                  <div className="text-xs text-gray-600">Всего экзаменов</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <FaCheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-bold text-green-600">
                    {(examsData?.data ?? []).filter(x => x.result?.attendance === true).length}
                  </div>
                  <div className="text-xs text-gray-600">Присутствий</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <FaExclamationTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                  <div className="text-lg font-bold text-red-600">
                    {(examsData?.data ?? []).filter(x => x.result?.attendance === false).length}
                  </div>
                  <div className="text-xs text-gray-600">Отсутствий</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <FaChartLine className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
                  <div className="text-lg font-bold text-yellow-600">
                    {(() => {
                      const arr = (examsData?.data ?? [])
                        .map(x => x.result?.lessonScore)
                        .filter(v => typeof v === 'number') as number[];
                      return arr.length ? (arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1) : '—';
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">Средний балл</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && accessLevel === 'full' && (
        <div className="space-y-6">
          {loadingData.attendance ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : attendanceData ? (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Статистика посещаемости</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                <div className="mb-6 overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-4">Посещаемость по предметам</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(attendanceData.subjectAttendance).map(([subject, data]) => ({
                        subject,
                        ...(data as any)
                      }))}
                    >
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

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">История посещаемости</h3>
                  {canManageAttendance && (
                    <button
                      onClick={openAttendanceModal}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Добавить запись
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4">Данные из журнала занятий</p>
                <div className="space-y-4">
                  {attendanceData.details.length > 0 ? (
                    attendanceData.details.map((d: any) => {
                      const present = d.attendance === true;
                      const reasonLabel =
                        d.absentReason === 'SICK'
                          ? 'Болезнь'
                          : d.absentReason === 'FAMILY'
                            ? 'Семейные обстоятельства'
                            : d.absentReason === 'OTHER'
                              ? 'Другое'
                              : null;
                      return (
                        <div
                          key={d.id}
                          className="border rounded-lg p-4 bg-white flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {present ? 'Присутствовал' : 'Отсутствовал'}
                              </span>
                              {!present && reasonLabel && (
                                <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                                  {reasonLabel}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span>{new Date(d.date).toLocaleDateString('ru-RU')}</span>
                              {canManageAttendance && (
                                <button
                                  onClick={() => openEditAttendance(d)}
                                  className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-50"
                                >
                                  Редактировать
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-800">
                                Предмет: {d.subject || '—'}
                              </p>
                              {d.teacher && (
                                <p className="text-gray-700">
                                  Преподаватель: {d.teacher}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              {d.lessonScore != null && (
                                <p className="text-gray-700">Оценка за урок: {d.lessonScore}</p>
                              )}
                              {d.homeworkScore != null && (
                                <p className="text-gray-700">Домашняя работа: {d.homeworkScore}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              {d.absentComment && (
                                <p className="text-gray-700">
                                  <span className="font-medium text-gray-600 block">Комментарий</span>
                                  <span className="block">{d.absentComment}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">Нет записей</div>
                  )}
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

      {/* FINANCE */}
      {activeTab === 'finance' && accessLevel === 'full' && (
        <div className="space-y-6">
          {loadingData.finance ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : financeData ? (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Финансовая сводка</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                <div className="mb-6 overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-4">Платежи по типам</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(financeData.paymentsByType).map(([type, data]) => ({
                          name: type,
                          value: (data as any).total,
                          count: (data as any).count
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {Object.entries(financeData.paymentsByType).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Последние платежи</h3>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financeData.recentPayments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 font-medium text-gray-900 break-words">
                            {payment.serviceName}
                          </td>
                          <td className="px-6 py-4 text-gray-900 break-words">
                            {payment.amount.toLocaleString()} ₸
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                              {payment.status === 'paid'
                                ? 'Оплачено'
                                : payment.status === 'overdue'
                                  ? 'Просрочено'
                                  : 'К оплате'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
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

      {/* EXTRA EDUCATION */}
      {activeTab === 'extra' && accessLevel === 'full' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">Дополнительное образование</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">
                Активностей: {extraEducationPrograms.length}
              </span>
              {canManageExtra && (
                <button
                  onClick={() => setExtraCreateOpen(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Добавить активность
                </button>
              )}
            </div>
          </div>

          {loadingExtra ? (
            <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
          ) : extraEducationPrograms.length > 0 ? (
            <div className="space-y-10">
              {/* Сетка активностей */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {extraEducationPrograms.map(p => {
                  const statusBadge = p.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : p.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800';
                  const statusLabel = p.status === 'COMPLETED'
                    ? 'Завершено'
                    : p.status === 'IN_PROGRESS'
                      ? 'В процессе'
                      : 'Запланировано';

                  return (
                    <div
                      key={p.id}
                      className="border rounded-xl p-5 flex flex-col gap-4 hover:shadow transition bg-gradient-to-b from-white to-slate-50 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <br/>
<h3 className="font-semibold text-gray-900 text-base leading-snug break-normal text-pretty">{p.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">{p.organization}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusBadge} whitespace-nowrap`}>
                            {statusLabel}
                          </span>
                          {canManageExtra && (
                            <>
                              <button
                                onClick={() => openEditExtra(p)}
                                className="px-2 py-1 text-[11px] rounded border text-gray-700 hover:bg-gray-50"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleDeleteExtra(p)}
                                className="px-2 py-1 text-[11px] text-red-600 rounded hover:bg-red-50"
                              >
                                Удалить
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                        <span className="px-2 py-0.5 rounded bg-gray-100">{p.category}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100">Участников: {p.participants}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100">
                          Старт: {new Date(p.startDate).toLocaleDateString('ru-RU')}
                        </span>
                        {p.endDate && (
                          <span className="px-2 py-0.5 rounded bg-gray-100">
                            Конец: {new Date(p.endDate).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                        {p.description}
                      </p>

                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <FaUsers className="w-3 h-3 text-blue-500" />
                          <span className="font-medium text-gray-700">
                            Ментор: {p.mentor}{p.mentorTitle && ` • ${p.mentorTitle}`}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaCalendarAlt className="w-3 h-3 text-green-600 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {p.schedule.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px]"
                              >
                                {s.day} {s.time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-3 h-3 text-purple-500" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      </div>

                      {/* Навыки */}
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                          Навыки
                        </h4>
                        <div className="flex flex-wrap -m-0.5">
                          {p.skills.map(skill => (
                            <span
                              key={skill}
                              className="m-0.5 inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] leading-4 whitespace-normal break-words max-w-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Достижения */}
                      {p.achievements.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                            Достижения
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-auto pr-1">
                            {p.achievements.map(a => {
                              const badge =
                                a.level === 'WIN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : a.level === 'PROJECT'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : a.level === 'CERT'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-700';
                              const label =
                                a.level === 'WIN'
                                  ? 'Победа'
                                  : a.level === 'PROJECT'
                                    ? 'Проект'
                                    : a.level === 'CERT'
                                      ? 'Сертификат'
                                      : 'Участник';
                              return (
                                <div key={a.id} className="border rounded-lg p-2 bg-white">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-xs font-medium text-gray-800 truncate">
                                      {a.title}
                                    </p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge} shrink-0`}>
                                      {label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 line-clamp-2 mb-1">
                                    {a.description}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {new Date(a.date).toLocaleDateString('ru-RU')}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Прогресс */}
                      <div className="mt-auto">
                        <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                          <span>Прогресс</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded">
                          <div
                            className={`h-2 rounded ${p.progress >= 100
                                ? 'bg-green-500'
                                : p.progress >= 60
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                              }`}
                            style={{ width: `${Math.min(100, p.progress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Распределение активностей */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartLine className="w-4 h-4 text-blue-500" />
                    Распределение активностей
                  </h3>
                  <div style={{ height: 260 }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={90}
                          paddingAngle={3}
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {distributionData.map((_, idx) => (
                            <Cell
                              key={`dist-cell-${idx}`}
                              fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][idx % 4]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any) => [`${value}`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Развитие навыков */}
                <div className="border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaBrain className="w-4 h-4 text-purple-500" />
                    Развитие навыков
                  </h3>
                  <div className="space-y-6">
                    <div style={{ height: 300 }} className="w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={skillsRadarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="category" />
                          <PolarRadiusAxis domain={[0, skillsMaxValue]} />
                          <Radar
                            name="Навыки"
                            dataKey="value"
                            stroke="#6366F1"
                            fill="#6366F1"
                            fillOpacity={0.5}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                          Технические ({extraSkillStats.technical.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {extraSkillStats.technical.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                          Лидерские ({extraSkillStats.leadership.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {extraSkillStats.leadership.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                          Творческие ({extraSkillStats.creative.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {extraSkillStats.creative.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaSmile className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Нет данных</p>
            </div>
          )}
        </div>
      )}

      {/* REMARKS */}
      {activeTab === 'remarks' && accessLevel === 'full' && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <div className="space-y-6">
          {loadingData.remarks ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">Замечания студента</h2>
                  <button
                    onClick={handleAddRemark}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                    Добавить замечание
                  </button>
                </div>
                {remarksData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {remarksData.totalRemarks}
                      </div>
                      <div className="text-sm text-gray-600">Всего</div>
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
              {remarksData && remarksData.remarks.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">История замечаний</h3>
                  <div className="space-y-4">
                    {remarksData.remarks.map(remark => (
                      <div
                        key={remark.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${remark.type === 'ACADEMIC'
                                  ? 'bg-orange-100 text-orange-800'
                                  : remark.type === 'BEHAVIOR'
                                    ? 'bg-purple-100 text-purple-800'
                                    : remark.type === 'ATTENDANCE'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {remark.type === 'ACADEMIC'
                                ? 'Учебное'
                                : remark.type === 'BEHAVIOR'
                                  ? 'Поведение'
                                  : remark.type === 'ATTENDANCE'
                                    ? 'Посещаемость'
                                    : 'Общее'}
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
                              title="Просмотр / редактирование"
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 gap-2">
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

      {/* COMMENTS */}
      {activeTab === 'comments' && accessLevel === 'full' && user?.role === 'ADMIN' && (
        <div className="space-y-6">
          {loadingData.comments ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">Комментарии администрации</h2>
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaComments className="w-4 h-4" />
                    Добавить комментарий
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <FaComments className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Внутренние комментарии</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Видны только администраторам. Студенты и родители не видят эти записи.
                      </p>
                    </div>
                  </div>
                </div>
                {commentsData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <FaComments className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {commentsData.totalComments}
                      </div>
                      <div className="text-sm text-gray-600">Всего</div>
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
              {commentsData && commentsData.comments.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">История комментариев</h3>
                  <div className="space-y-4">
                    {commentsData.comments.map(comment => (
                      <div
                        key={comment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${comment.type === 'ACADEMIC'
                                  ? 'bg-green-100 text-green-800'
                                  : comment.type === 'GENERAL'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {comment.type === 'ACADEMIC'
                                ? 'Учебный'
                                : comment.type === 'GENERAL'
                                  ? 'Общий'
                                  : 'Другое'}
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 gap-2">
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

      {extraCreateOpen && canManageExtra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setExtraCreateOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Добавить активность</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-auto pr-1">
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Название</label>
                <input
                  value={extraForm.name}
                  onChange={e => setExtraForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Напр. Курс по алгоритмам"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Категория</label>
                <select
                  value={extraForm.category}
                  onChange={e => setExtraForm(f => ({ ...f, category: e.target.value as ExtraCategory }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="Кружки">Кружки</option>
                  <option value="Организации">Организации</option>
                  <option value="Курсы">Курсы</option>
                  <option value="Олимпиады">Олимпиады</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Организация</label>
                <input
                  value={extraForm.organization}
                  onChange={e => setExtraForm(f => ({ ...f, organization: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Организация"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Статус</label>
                <select
                  value={extraForm.status}
                  onChange={e => setExtraForm(f => ({ ...f, status: e.target.value as ExtraStatus }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="PLANNED">Запланировано</option>
                  <option value="IN_PROGRESS">В процессе</option>
                  <option value="COMPLETED">Завершено</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Прогресс (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={extraForm.progress}
                  onChange={e => setExtraForm(f => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Дата начала</label>
                <input
                  type="date"
                  value={extraForm.startDate}
                  onChange={e => setExtraForm(f => ({ ...f, startDate: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Дата окончания</label>
                <input
                  type="date"
                  value={extraForm.endDate}
                  onChange={e => setExtraForm(f => ({ ...f, endDate: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Ментор</label>
                <input
                  value={extraForm.mentor}
                  onChange={e => setExtraForm(f => ({ ...f, mentor: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Ментор"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Должность ментора</label>
                <input
                  value={extraForm.mentorTitle || ''}
                  onChange={e => setExtraForm(f => ({ ...f, mentorTitle: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Опционально"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Описание</label>
                <textarea
                  value={extraForm.description || ''}
                  onChange={e => setExtraForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  rows={3}
                  placeholder="Краткое описание"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Локация</label>
                <input
                  value={extraForm.location}
                  onChange={e => setExtraForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Место проведения"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Участников</label>
                <input
                  type="number"
                  min={0}
                  value={extraForm.participants}
                  onChange={e => setExtraForm(f => ({ ...f, participants: Math.max(0, Number(e.target.value) || 0) }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Навыки (через запятую)</label>
                <input
                  value={extraForm.skillsCsv}
                  onChange={e => setExtraForm(f => ({ ...f, skillsCsv: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Напр. Алгоритмы, Коммуникации"
                />
              </div>

              <div className="md:col-span-2 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Расписание</h4>
                  <button
                    type="button"
                    onClick={() => setExtraForm(f => ({ ...f, schedule: [...(f.schedule || []), { day: '', time: '' }] }))}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {(extraForm.schedule || []).map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        value={row.day}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraForm(f => {
                            const arr = [...(f.schedule || [])];
                            arr[idx] = { ...arr[idx], day: v };
                            return { ...f, schedule: arr };
                          });
                        }}
                        className="col-span-5 border rounded-lg px-2 py-1 text-sm"
                        placeholder="День (Пн/Вт/...)"
                      />
                      <input
                        value={row.time}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraForm(f => {
                            const arr = [...(f.schedule || [])];
                            arr[idx] = { ...arr[idx], time: v };
                            return { ...f, schedule: arr };
                          });
                        }}
                        className="col-span-5 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Время (17:00-18:30)"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraForm(f => ({ ...f, schedule: (f.schedule || []).filter((_, i) => i !== idx) }))}
                        className="col-span-2 text-red-600 text-sm hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Достижения</h4>
                  <button
                    type="button"
                    onClick={() => setExtraForm(f => ({ ...f, achievements: [...(f.achievements || []), { title: '', description: '', date: '', level: 'PROJECT' as ExtraAchievementLevel }] }))}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {(extraForm.achievements || []).map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        value={row.title}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], title: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-4 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Название"
                      />
                      <input
                        value={row.description || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], description: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-4 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Описание"
                      />
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], date: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-2 border rounded-lg px-2 py-1 text-sm"
                      />
                      <select
                        value={row.level}
                        onChange={e => {
                          const v = e.target.value as ExtraAchievementLevel;
                          setExtraForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], level: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-2 border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="PROJECT">Проект</option>
                        <option value="WIN">Победа</option>
                        <option value="PARTICIPANT">Участник</option>
                        <option value="CERT">Сертификат</option>
                      </select>
                      <div className="col-span-12">
                        <button
                          type="button"
                          onClick={() => setExtraForm(f => ({ ...f, achievements: (f.achievements || []).filter((_, i) => i !== idx) }))}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Удалить достижение
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setExtraCreateOpen(false)} className="px-3 py-2 rounded-lg border text-sm">Отмена</button>
              <button
                onClick={handleCreateExtra}
                disabled={savingExtra || !extraForm.name.trim() || !extraForm.organization.trim() || !extraForm.startDate || !extraForm.mentor.trim() || !extraForm.location.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
              >
                {savingExtra ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
      {extraEditOpen && canManageExtra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setExtraEditOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Редактировать активность</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-auto pr-1">
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Название</label>
                <input
                  value={extraEditForm.name}
                  onChange={e => setExtraEditForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Напр. Курс по алгоритмам"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Категория</label>
                <select
                  value={extraEditForm.category}
                  onChange={e => setExtraEditForm(f => ({ ...f, category: e.target.value as ExtraCategory }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="Кружки">Кружки</option>
                  <option value="Организации">Организации</option>
                  <option value="Курсы">Курсы</option>
                  <option value="Олимпиады">Олимпиады</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Организация</label>
                <input
                  value={extraEditForm.organization}
                  onChange={e => setExtraEditForm(f => ({ ...f, organization: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Организация"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Статус</label>
                <select
                  value={extraEditForm.status}
                  onChange={e => setExtraEditForm(f => ({ ...f, status: e.target.value as ExtraStatus }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="PLANNED">Запланировано</option>
                  <option value="IN_PROGRESS">В процессе</option>
                  <option value="COMPLETED">Завершено</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Прогресс (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={extraEditForm.progress}
                  onChange={e => setExtraEditForm(f => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Дата начала</label>
                <input
                  type="date"
                  value={extraEditForm.startDate}
                  onChange={e => setExtraEditForm(f => ({ ...f, startDate: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Дата окончания</label>
                <input
                  type="date"
                  value={extraEditForm.endDate}
                  onChange={e => setExtraEditForm(f => ({ ...f, endDate: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Ментор</label>
                <input
                  value={extraEditForm.mentor}
                  onChange={e => setExtraEditForm(f => ({ ...f, mentor: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Ментор"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Должность ментора</label>
                <input
                  value={extraEditForm.mentorTitle || ''}
                  onChange={e => setExtraEditForm(f => ({ ...f, mentorTitle: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Опционально"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Описание</label>
                <textarea
                  value={extraEditForm.description || ''}
                  onChange={e => setExtraEditForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  rows={3}
                  placeholder="Краткое описание"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Локация</label>
                <input
                  value={extraEditForm.location}
                  onChange={e => setExtraEditForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Место проведения"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Участников</label>
                <input
                  type="number"
                  min={0}
                  value={extraEditForm.participants}
                  onChange={e => setExtraEditForm(f => ({ ...f, participants: Math.max(0, Number(e.target.value) || 0) }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Навыки (через запятую)</label>
                <input
                  value={extraEditForm.skillsCsv}
                  onChange={e => setExtraEditForm(f => ({ ...f, skillsCsv: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  placeholder="Напр. Алгоритмы, Коммуникации"
                />
              </div>

              <div className="md:col-span-2 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Расписание</h4>
                  <button
                    type="button"
                    onClick={() => setExtraEditForm(f => ({ ...f, schedule: [...(f.schedule || []), { day: '', time: '' }] }))}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {(extraEditForm.schedule || []).map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        value={row.day}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraEditForm(f => {
                            const arr = [...(f.schedule || [])];
                            arr[idx] = { ...arr[idx], day: v };
                            return { ...f, schedule: arr };
                          });
                        }}
                        className="col-span-5 border rounded-lg px-2 py-1 text-sm"
                        placeholder="День (Пн/Вт/...)"
                      />
                      <input
                        value={row.time}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraEditForm(f => {
                            const arr = [...(f.schedule || [])];
                            arr[idx] = { ...arr[idx], time: v };
                            return { ...f, schedule: arr };
                          });
                        }}
                        className="col-span-5 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Время (17:00-18:30)"
                      />
                      <button
                        type="button"
                        onClick={() => setExtraEditForm(f => ({ ...f, schedule: (f.schedule || []).filter((_, i) => i !== idx) }))}
                        className="col-span-2 text-red-600 text-sm hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Достижения</h4>
                  <button
                    type="button"
                    onClick={() => setExtraEditForm(f => ({ ...f, achievements: [...(f.achievements || []), { title: '', description: '', date: '', level: 'PROJECT' as ExtraAchievementLevel }] }))}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {(extraEditForm.achievements || []).map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        value={row.title}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraEditForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], title: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-4 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Название"
                      />
                      <input
                        value={row.description || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraEditForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], description: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-4 border rounded-lg px-2 py-1 text-sm"
                        placeholder="Описание"
                      />
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => {
                          const v = e.target.value;
                          setExtraEditForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], date: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-2 border rounded-lg px-2 py-1 text-sm"
                      />
                      <select
                        value={row.level}
                        onChange={e => {
                          const v = e.target.value as ExtraAchievementLevel;
                          setExtraEditForm(f => {
                            const arr = [...(f.achievements || [])];
                            arr[idx] = { ...arr[idx], level: v };
                            return { ...f, achievements: arr };
                          });
                        }}
                        className="col-span-2 border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="PROJECT">Проект</option>
                        <option value="WIN">Победа</option>
                        <option value="PARTICIPANT">Участник</option>
                        <option value="CERT">Сертификат</option>
                      </select>
                      <div className="col-span-12">
                        <button
                          type="button"
                          onClick={() => setExtraEditForm(f => ({ ...f, achievements: (f.achievements || []).filter((_, i) => i !== idx) }))}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Удалить достижение
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setExtraEditOpen(false)} className="px-3 py-2 rounded-lg border text-sm">Отмена</button>
              <button
                onClick={handleUpdateExtra}
                disabled={savingExtraEdit || !extraEditForm.name.trim() || !extraEditForm.organization.trim() || !extraEditForm.startDate || !extraEditForm.mentor.trim() || !extraEditForm.location.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
              >
                {savingExtraEdit ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модалы */}
      {attendanceModalOpen && canManageAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAttendanceModal}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-4">{editingResult ? 'Редактировать запись посещаемости' : 'Добавить запись посещаемости'}</h3>
            <div className="space-y-3">
              {editingResult ? (
                <div className="p-2 rounded bg-gray-50 text-xs text-gray-600">
                  Запись от {new Date(editingResult.date).toLocaleDateString('ru-RU')} • {editingResult.subject || '—'}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Дата</label>
                    <input
                      type="date"
                      value={attForm.date}
                      onChange={e => setAttForm(f => ({ ...f, date: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Урок</label>
                    <div className="mt-1">
                      {loadingLessons ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500"><Spinner size="sm" /> Загрузка уроков...</div>
                      ) : (
                        <select
                          value={attForm.lessonId ?? ''}
                          onChange={e => setAttForm(f => ({ ...f, lessonId: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="">Выберите урок</option>
                          {lessonsForDate.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {new Date(l.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} • {l.studyPlan?.name || l.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Статус</label>
                <select
                  value={attForm.attendance ? 'present' : 'absent'}
                  onChange={e => {
                    const present = e.target.value === 'present';
                    setAttForm(f => ({
                      ...f,
                      attendance: present,
                      absentReason: present ? '' : f.absentReason,
                      absentComment: present ? '' : f.absentComment
                    }));
                  }}
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="present">Присутствовал</option>
                  <option value="absent">Отсутствовал</option>
                </select>
              </div>
              {!attForm.attendance && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Причина отсутствия</label>
                    <select
                      value={attForm.absentReason || ''}
                      onChange={e => setAttForm(f => ({ ...f, absentReason: e.target.value as AbsentReason }))}
                      className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="">Не выбрано</option>
                      <option value="SICK">Болезнь</option>
                      <option value="FAMILY">Семейные обстоятельства</option>
                      <option value="OTHER">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Комментарий</label>
                    <textarea
                      value={attForm.absentComment || ''}
                      onChange={e => setAttForm(f => ({ ...f, absentComment: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                      placeholder="Опционально"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={closeAttendanceModal} className="px-3 py-2 rounded-lg border text-sm">Отмена</button>
              <button
                onClick={submitAttendance}
                disabled={savingAttendance || (!editingResult && !attForm.lessonId)}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
              >
                {savingAttendance ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
      {pdpCreateOpen && canEditPdp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPdpCreateOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-4">Создать план развития</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Предмет</label>
                <input
                  value={newPlan.subject}
                  onChange={e => setNewPlan(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Предмет"
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Ментор</label>
                <input
                  value={newPlan.mentor || ''}
                  onChange={e => setNewPlan(p => ({ ...p, mentor: e.target.value }))}
                  placeholder="Ментор"
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Навыки</label>
                <input
                  value={newPlan.skills}
                  onChange={e => setNewPlan(p => ({ ...p, skills: e.target.value }))}
                  placeholder="Навыки (через запятую)"
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Описание</label>
                <textarea
                  value={newPlan.description || ''}
                  onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))}
                  placeholder="Описание"
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setPdpCreateOpen(false)} className="px-3 py-2 rounded-lg border text-sm">Отмена</button>
              <button
                onClick={async () => {
                  try {
                    setSavingPdp(true);
                    await handleCreatePlan();
                    setPdpCreateOpen(false);
                  } finally {
                    setSavingPdp(false);
                  }
                }}
                disabled={savingPdp || !newPlan.subject.trim()}
                className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm disabled:opacity-60"
              >
                {savingPdp ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={closeRemarkModal}
        onSubmit={handleRemarkSubmit}
        remark={editingRemark}
        studentName={`${student?.user.surname} ${student?.user.name}`}
      />
      <DeleteRemarkModal
        isOpen={deleteRemarkModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleRemarkDelete}
        remarkTitle={deletingRemark?.title || ''}
        studentName={`${student?.user.surname} ${student?.user.name}`}
      />
      <CommentModal
        isOpen={commentModalOpen}
        onClose={closeCommentModal}
        onSubmit={handleCommentSubmit}
        comment={editingComment!}
        studentName={`${student?.user.surname} ${student?.user.name}`}
        title={editingComment ? 'Редактировать комментарий' : 'Добавить комментарий'}
      />
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

const TrendBadge: React.FC<{label:string;trend:'up'|'down'|'neutral';diff:number|null}> = ({label, trend, diff}) => {
  const color =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-600';
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs">
      <span className="font-medium">{label}</span>
      <span className={`font-semibold ${color}`}>{arrow}{diff != null ? Math.round(diff) : ''}</span>
    </span>
  );
};

const EmotionMetricCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  colorRing: string;
  value?: number;
  description?: string;
  trend?: string;
}> = ({ title, icon, colorRing, value, description, trend }) => {
  return (
    <div className="p-4 rounded-lg border bg-gradient-to-b from-white to-slate-50">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorRing} flex items-center justify-center text-white ring-2 ring-black/10 shadow-md`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-lg font-bold text-gray-900">
            {value !== undefined && value !== null ? `${value}/100` : '—'}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Тренд:</span>
        {trend === 'up' && <FaArrowUp className="w-3 h-3 text-green-500" />}
        {trend === 'down' && <FaArrowDown className="w-3 h-3 text-red-500" />}
        {!trend && <FaArrowRight className="w-3 h-3 text-gray-400" />}
        <span className="capitalize">
          {trend === 'up'
            ? 'рост'
            : trend === 'down'
              ? 'снижение'
              : 'стабильно'}
        </span>
      </div>
    </div>
  );
};

export default StudentDetail;
