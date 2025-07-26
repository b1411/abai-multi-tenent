import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Filter,
  Download,
  FileDown,
  Settings,
  Calendar,
  Users,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  RefreshCw,
  FileText,
  Mail,
  Eye,
  Edit,
  Lock,
  Unlock,
  ExternalLink,
  BarChart3,
  Plus,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface Student {
  id: string;
  fullName: string;
  grades: { [subject: string]: number[] };
  currentSubjectGrades?: number[];
  averageGrade: number;
  qualityPercentage: number;
  absencesExcused: number;
  absencesUnexcused: number;
  className: string;
  subjects: string[];
  homeworkCompletion: number;
  disciplinaryNotes: number;
}

interface SubjectGrades {
  subject: string;
  grades: number[];
  average: number;
  quality: number;
}

interface ReportFilters {
  period: 'day' | 'week' | 'quarter' | 'year';
  class: string;
  subject: string;
  teacher: string;
  level: string;
  reportType: 'performance' | 'activity' | 'attendance' | 'fake-positions' | 'discipline' | 'homework' | 'class-summary' | 'subject-analysis';
  search: string;
}

interface KPIMetrics {
  totalStudents: number;
  qualityPercentage: number;
  averageGrade: number;
  unexcusedAbsences: number;
}

interface ExportLog {
  id: string;
  user: string;
  reportType: string;
  format: string;
  exportedAt: string;
}

interface ChartDataPoint {
  name: string;
  averageGrade: number;
  absences: number;
  quality: number;
  homework: number;
}

interface GradeDetail {
  grade: number;
  subject: string;
  date: string;
  teacher: string;
  topic: string;
  type: 'Контрольная работа' | 'Самостоятельная работа' | 'Устный ответ' | 'Домашнее задание' | 'Тест' | 'Итоговая оценка за день' | 'Итоговая оценка за неделю' | 'Итоговая оценка за четверть' | 'Итоговая оценка за год' | 'Итоговая оценка';
}

// Constants
const reportTypes = {
  performance: 'Успеваемость',
  activity: 'Активность учителей',
  attendance: 'Посещаемость',
  'fake-positions': 'Фейк-ставки',
  discipline: 'Дисциплина',
  homework: 'Домашние задания',
  'class-summary': 'Сводка по классу',
  'subject-analysis': 'Анализ по предметам'
};

const periods = {
  day: 'День',
  week: 'Неделя',
  quarter: 'Четверть',
  year: 'Год'
};

const subjects = [
  'Математика',
  'Физика',
  'Химия',
  'Биология',
  'История',
  'География',
  'Литература',
  'Русский язык',
  'Английский язык',
  'Информатика'
];

const classes = [
  '8А', '8Б', '8В',
  '9А', '9Б', '9В',
  '10А', '10Б', '10В',
  '11А', '11Б', '11В'
];

const teachers = [
  'Назарбаева А.Е.',
  'Қасымов Б.Н.',
  'Төлегенова Г.М.',
  'Сәтбаев Д.А.',
  'Жұмабекова Ж.С.',
  'Мұратов А.К.'
];

// Generate random grade
const randomGrade = () => Math.floor(Math.random() * 3) + 3; // 3-5
const randomGrades = (count: number) => Array.from({ length: count }, () => randomGrade());

// Generate period-specific grades
const generatePeriodGrade = (subject: string, period: string): number | null => {
  // Sometimes students don't have grades for certain periods/subjects
  if (Math.random() < 0.1) return null; // 10% chance of no grade
  
  // Generate grade based on period
  switch (period) {
    case 'day':
      // Daily grades are more variable
      return Math.floor(Math.random() * 3) + 3; // 3-5
    case 'week':
      // Weekly average
      return Math.floor(Math.random() * 3) + 3; // 3-5
    case 'quarter':
      // Quarterly final grades
      return Math.floor(Math.random() * 3) + 3; // 3-5
    case 'year':
      // Yearly final grades (tend to be more stable)
      return Math.floor(Math.random() * 2) + 4; // 4-5 (year-end grades are usually better)
    default:
      return Math.floor(Math.random() * 3) + 3;
  }
};

// Generate comprehensive mock data
const generateMockStudents = (className: string, count: number, period: string): Student[] => {
  const firstNames = ['Айдар', 'Асем', 'Данияр', 'Айгүл', 'Нұрлан', 'Алия', 'Ерлан', 'Жанар', 'Баuyржан', 'Динара'];
  const lastNames = ['Назарбаев', 'Қасымов', 'Төлеген', 'Сәтбаев', 'Жұмабек', 'Мұратов', 'Әбдіқадыр', 'Қабылбек', 'Серікбай', 'Дәулетов'];
  const middleNames = ['Ержанұлы', 'Болатұлы', 'Серікұлы', 'Мұратұлы', 'Асанұлы', 'Қайратұлы', 'Ержанқызы', 'Болатқызы', 'Серікқызы', 'Мұратқызы'];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
    
    // Generate single grade per subject based on period
    const grades: { [subject: string]: number[] } = {};
    subjects.forEach(subject => {
      const periodGrade = generatePeriodGrade(subject, period);
      grades[subject] = periodGrade ? [periodGrade] : [];
    });

    // Calculate average from period grades
    const allGrades = Object.values(grades).flat();
    const averageGrade = allGrades.length > 0 
      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
      : 0;
    const qualityPercentage = allGrades.length > 0
      ? Math.round((allGrades.filter(grade => grade >= 4).length / allGrades.length) * 100)
      : 0;

    return {
      id: `${className}-${index + 1}`,
      fullName: `${lastName} ${firstName} ${middleName}`,
      grades,
      averageGrade,
      qualityPercentage,
      absencesExcused: Math.floor(Math.random() * 5),
      absencesUnexcused: Math.floor(Math.random() * 3),
      className,
      subjects,
      homeworkCompletion: Math.floor(Math.random() * 30) + 70,
      disciplinaryNotes: Math.floor(Math.random() * 3)
    };
  });
};

const EducationalReports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'quarter',
    class: '10А',
    subject: '',
    teacher: '',
    level: '',
    reportType: 'performance',
    search: ''
  });

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedGradeDetails, setSelectedGradeDetails] = useState<{
    student: Student;
    subject: string;
    grades: GradeDetail[];
  } | null>(null);

  // Generate mock data for all classes
  useEffect(() => {
    const students: Student[] = [];
    classes.forEach(className => {
      students.push(...generateMockStudents(className, Math.floor(Math.random() * 10) + 20, filters.period));
    });
    setAllStudents(students);
  }, [filters.period]);

  // Initialize export logs once
  useEffect(() => {
    setExportLogs([
      {
        id: '1',
        user: 'Администратор',
        reportType: 'Успеваемость',
        format: 'XLSX',
        exportedAt: new Date().toISOString()
      },
      {
        id: '2',
        user: 'Иванова А.П.',
        reportType: 'Посещаемость',
        format: 'PDF',
        exportedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        user: 'Директор',
        reportType: 'Сводка по классу',
        format: 'CSV',
        exportedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '4',
        user: 'Петров С.И.',
        reportType: 'Анализ по предметам',
        format: 'XLSX',
        exportedAt: new Date(Date.now() - 259200000).toISOString()
      }
    ]);
  }, []);

  // Filter students based on current filters
  const filteredStudents = useMemo(() => {
    let students = allStudents;

    if (filters.class) {
      students = students.filter(s => s.className === filters.class);
    }
    
    if (filters.search) {
      students = students.filter(s => 
        s.fullName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Set current subject grades for display
    return students.map(student => ({
      ...student,
      currentSubjectGrades: filters.subject 
        ? student.grades[filters.subject] || []
        : Object.values(student.grades).flat().slice(0, 8)
    }));
  }, [allStudents, filters]);

  // Calculate KPI metrics based on filtered data
  const kpiMetrics = useMemo((): KPIMetrics => {
    const students = filteredStudents;
    if (students.length === 0) {
      return {
        totalStudents: 0,
        qualityPercentage: 0,
        averageGrade: 0,
        unexcusedAbsences: 0
      };
    }

    const totalStudents = students.length;
    const qualityPercentage = Math.round(
      students.reduce((sum, s) => sum + s.qualityPercentage, 0) / totalStudents
    );
    const averageGrade = Math.round(
      (students.reduce((sum, s) => sum + s.averageGrade, 0) / totalStudents) * 10
    ) / 10;
    const unexcusedAbsences = students.reduce((sum, s) => sum + s.absencesUnexcused, 0);

    return {
      totalStudents,
      qualityPercentage,
      averageGrade,
      unexcusedAbsences
    };
  }, [filteredStudents]);

  // Generate dynamic chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    const months = ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май'];
    return months.map(month => {
      const baseGrade = 3.5 + Math.random() * 1.5;
      const baseAbsences = Math.floor(Math.random() * 20) + 5;
      const baseQuality = Math.floor(Math.random() * 40) + 60;
      const baseHomework = Math.floor(Math.random() * 30) + 70;
      
      return {
        name: month,
        averageGrade: Math.round(baseGrade * 10) / 10,
        absences: baseAbsences,
        quality: baseQuality,
        homework: baseHomework
      };
    });
  }, [filters.reportType, filters.class, filters.subject]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => {
      const students: Student[] = [];
      classes.forEach(className => {
        students.push(...generateMockStudents(className, Math.floor(Math.random() * 10) + 20, filters.period));
      });
      setAllStudents(students);
      setLoading(false);
    }, 1000);
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    const newLog: ExportLog = {
      id: Date.now().toString(),
      user: 'Текущий пользователь',
      reportType: reportTypes[filters.reportType],
      format: format.toUpperCase(),
      exportedAt: new Date().toISOString()
    };
    
    setExportLogs(prev => [newLog, ...prev]);
    setShowExportModal(false);
    
    // Simulate download
    console.log(`Экспортируется ${reportTypes[filters.reportType]} в формате ${format.toUpperCase()}`);
    alert(`Отчет "${reportTypes[filters.reportType]}" экспортирован в формате ${format.toUpperCase()}`);
  };

  const handleFilteredExport = (format: 'xlsx' | 'pdf') => {
    const newLog: ExportLog = {
      id: Date.now().toString(),
      user: 'Текущий пользователь',
      reportType: `${reportTypes[filters.reportType]} - Отфильтровано`,
      format: format.toUpperCase(),
      exportedAt: new Date().toISOString()
    };
    
    setExportLogs(prev => [newLog, ...prev]);
    
    // Generate filtered report info
    const filterInfo = {
      period: periods[filters.period],
      class: filters.class || 'Все классы',
      subject: filters.subject || 'Все предметы',
      studentsCount: filteredStudents.length,
      totalStudents: allStudents.length
    };

    const fileName = `Отчет_успеваемость_${filterInfo.class}_${filterInfo.period}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'xlsx') {
      exportToExcel(fileName, filterInfo);
    } else if (format === 'pdf') {
      exportToPDF(fileName, filterInfo);
    }
  };

  const exportToExcel = (fileName: string, filterInfo: any) => {
    try {
      // Prepare data for Excel
      const excelData = filteredStudents.map((student, index) => {
        const row: any = {
          '№': index + 1,
          'ФИО': student.fullName,
          'Класс': student.className,
        };

        // Add grades for each subject
        subjects.forEach(subject => {
          const grade = student.grades[subject]?.[0];
          row[subject] = grade || '—';
        });

        row['Средний балл'] = student.averageGrade;
        row['Качество'] = `${student.qualityPercentage}%`;
        row['Пропуски (У)'] = student.absencesExcused;
        row['Пропуски (Н)'] = student.absencesUnexcused;

        return row;
      });

      // Add summary row
      const summaryRow: any = {
        '№': '',
        'ФИО': 'СРЕДНИЙ БАЛЛ ПО КЛАССУ:',
        'Класс': '',
      };

      subjects.forEach(subject => {
        const allSubjectGrades = filteredStudents.flatMap(s => s.grades[subject] || []);
        const subjectClassAverage = allSubjectGrades.length > 0 
          ? Math.round((allSubjectGrades.reduce((sum, grade) => sum + grade, 0) / allSubjectGrades.length) * 10) / 10
          : 0;
        summaryRow[subject] = subjectClassAverage || '—';
      });

      summaryRow['Средний балл'] = kpiMetrics.averageGrade;
      summaryRow['Качество'] = `${kpiMetrics.qualityPercentage}%`;
      summaryRow['Пропуски (У)'] = '';
      summaryRow['Пропуски (Н)'] = kpiMetrics.unexcusedAbsences;

      excelData.push(summaryRow);

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = [
        { wch: 5 },  // №
        { wch: 25 }, // ФИО
        { wch: 8 },  // Класс
        ...subjects.map(() => ({ wch: 12 })), // Предметы
        { wch: 12 }, // Средний балл
        { wch: 10 }, // Качество
        { wch: 12 }, // Пропуски (У)
        { wch: 12 }  // Пропуски (Н)
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Успеваемость');

      // Add info sheet
      const infoData = [
        ['Параметры отчета', ''],
        ['Период', filterInfo.period],
        ['Класс', filterInfo.class],
        ['Предмет', filterInfo.subject],
        ['Количество учащихся', filterInfo.studentsCount],
        ['Дата формирования', new Date().toLocaleString('ru-RU')],
        ['', ''],
        ['Статистика', ''],
        ['Средний балл по классу', kpiMetrics.averageGrade],
        ['Качество знаний', `${kpiMetrics.qualityPercentage}%`],
        ['Всего пропусков без уважительной причины', kpiMetrics.unexcusedAbsences],
      ];

      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      infoWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, infoWs, 'Информация');

      // Download file
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      
      console.log('Excel файл успешно создан и скачан');
    } catch (error) {
      console.error('Ошибка при создании Excel файла:', error);
      alert('Произошла ошибка при создании Excel файла');
    }
  };

  const exportToPDF = (fileName: string, filterInfo: any) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Set font for Cyrillic support
      doc.setFont('helvetica');
      
      // Title
      doc.setFontSize(16);
      doc.text('Отчет по успеваемости', 20, 20);
      
      // Report info
      doc.setFontSize(10);
      doc.text(`Период: ${filterInfo.period}`, 20, 30);
      doc.text(`Класс: ${filterInfo.class}`, 20, 35);
      doc.text(`Предмет: ${filterInfo.subject}`, 20, 40);
      doc.text(`Учащихся: ${filterInfo.studentsCount} из ${filterInfo.totalStudents}`, 20, 45);
      doc.text(`Дата: ${new Date().toLocaleString('ru-RU')}`, 20, 50);

      // Prepare table data
      const tableData = filteredStudents.map((student, index) => {
        const row = [
          index + 1,
          student.fullName,
          student.className,
          ...subjects.map(subject => student.grades[subject]?.[0] || '—'),
          student.averageGrade,
          `${student.qualityPercentage}%`,
          `У:${student.absencesExcused} Н:${student.absencesUnexcused}`
        ];
        return row;
      });

      // Add summary row
      const summaryRow = [
        '',
        'СРЕДНИЙ БАЛЛ ПО КЛАССУ:',
        '',
        ...subjects.map(subject => {
          const allSubjectGrades = filteredStudents.flatMap(s => s.grades[subject] || []);
          const subjectClassAverage = allSubjectGrades.length > 0 
            ? Math.round((allSubjectGrades.reduce((sum, grade) => sum + grade, 0) / allSubjectGrades.length) * 10) / 10
            : 0;
          return subjectClassAverage || '—';
        }),
        kpiMetrics.averageGrade,
        `${kpiMetrics.qualityPercentage}%`,
        `Н:${kpiMetrics.unexcusedAbsences}`
      ];
      tableData.push(summaryRow);

      const tableHeaders = [
        '№',
        'ФИО',
        'Класс',
        ...subjects,
        'Ср. балл',
        'Качество',
        'Пропуски'
      ];

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 8 },   // №
          1: { cellWidth: 40 },  // ФИО
          2: { cellWidth: 12 },  // Класс
          [subjects.length + 3]: { cellWidth: 15 }, // Ср. балл
          [subjects.length + 4]: { cellWidth: 15 }, // Качество
          [subjects.length + 5]: { cellWidth: 20 }  // Пропуски
        },
        didDrawPage: function(data: any) {
          // Footer
          doc.setFontSize(8);
          doc.text('Система учета успеваемости', 20, doc.internal.pageSize.height - 10);
        }
      });

      // Save PDF
      doc.save(`${fileName}.pdf`);
      
      console.log('PDF файл успешно создан и скачан');
    } catch (error) {
      console.error('Ошибка при создании PDF файла:', error);
      alert('Произошла ошибка при создании PDF файла');
    }
  };

  const handleStudentView = (student: Student) => {
    setSelectedStudent(student);
    console.log('Просмотр ученика:', student.fullName);
  };

  const handleStudentEdit = (student: Student) => {
    console.log('Редактирование ученика:', student.fullName);
    alert(`Редактирование: ${student.fullName}`);
  };

  const handleAutoSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleGradeClick = (student: Student, subject: string) => {
    // Generate grade details for period-based assessment
    const gradeDetails: GradeDetail[] = (student.grades[subject] || []).map((grade, index) => {
      // Determine period-specific topic
      let periodTopic = '';
      let periodType = '';
      
      switch (filters.period) {
        case 'day':
          periodTopic = `Урок от ${new Date().toLocaleDateString('ru-RU')}`;
          periodType = 'Итоговая оценка за день';
          break;
        case 'week':
          periodTopic = `Неделя ${Math.ceil(Math.random() * 4)} месяца`;
          periodType = 'Итоговая оценка за неделю';
          break;
        case 'quarter':
          periodTopic = `${Math.ceil(Math.random() * 4)} четверть`;
          periodType = 'Итоговая оценка за четверть';
          break;
        case 'year':
          periodTopic = `${new Date().getFullYear()}-${new Date().getFullYear() + 1} учебный год`;
          periodType = 'Итоговая оценка за год';
          break;
        default:
          periodTopic = 'Оценочный период';
          periodType = 'Итоговая оценка';
      }

      return {
        grade,
        subject,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        teacher: teachers[Math.floor(Math.random() * teachers.length)],
        topic: periodTopic,
        type: periodType as GradeDetail['type']
      };
    });

    setSelectedGradeDetails({
      student,
      subject,
      grades: gradeDetails
    });
    setShowGradeModal(true);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return 'text-green-600 bg-green-50';
    if (grade >= 3.5) return 'text-blue-600 bg-blue-50';
    if (grade >= 2.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getQualityColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Pie chart data for grade distribution
  const gradeDistributionData = useMemo(() => {
    const allGrades = filteredStudents.flatMap(s => s.currentSubjectGrades || []);
    const distribution = [
      { name: 'Отлично (5)', value: allGrades.filter(g => g === 5).length, color: '#10B981' },
      { name: 'Хорошо (4)', value: allGrades.filter(g => g === 4).length, color: '#3B82F6' },
      { name: 'Удовлетворительно (3)', value: allGrades.filter(g => g === 3).length, color: '#F59E0B' },
      { name: 'Неудовлетворительно (2)', value: allGrades.filter(g => g === 2).length, color: '#EF4444' },
    ];
    return distribution.filter(d => d.value > 0);
  }, [filteredStudents]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-none mx-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Отчёты по учебному процессу</h1>
        <p className="text-sm text-gray-600">360°-панель аналитики и отчетности • {filteredStudents.length} учащихся</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              {Object.entries(periods).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.class}
              onChange={(e) => handleFilterChange('class', e.target.value)}
            >
              <option value="">Все классы</option>
              {classes.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            >
              <option value="">Все предметы</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип отчёта</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
            >
              {Object.entries(reportTypes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Учитель</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.teacher}
              onChange={(e) => handleFilterChange('teacher', e.target.value)}
            >
              <option value="">Все учителя</option>
              {teachers.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск ФИО</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Поиск учащегося..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <button 
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить данные
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего обучающихся</p>
              <p className="text-2xl font-bold text-gray-900">{kpiMetrics.totalStudents}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Качество знаний</p>
              <p className="text-2xl font-bold text-green-600">{kpiMetrics.qualityPercentage}%</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-blue-600">{kpiMetrics.averageGrade}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Пропуски без уваж. причины</p>
              <p className="text-2xl font-bold text-red-600">{kpiMetrics.unexcusedAbsences}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Динамика среднего балла</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[3, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageGrade" stroke="#3B82F6" strokeWidth={2} name="Средний балл" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Пропуски по месяцам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="absences" fill="#EF4444" name="Пропуски" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Распределение оценок</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Ведомость успеваемости по всем предметам
              {filters.class && ` • ${filters.class}`}
            </h3>
            <div className="text-sm text-gray-600">
              Показано {filteredStudents.length} учащихся
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto select-none" style={{ cursor: 'grab' }}>
          <table className="w-full border-collapse min-w-max">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b-2 border-gray-200">
                <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[250px]">
                  № / ФИО
                </th>
                {subjects.map((subject) => (
                  <th key={subject} className="border-r border-gray-200 px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-[100px]">
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-center leading-tight">{subject}</span>
                    </div>
                  </th>
                ))}
                <th className="border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-[80px]">
                  Ср. балл
                </th>
                <th className="border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-[80px]">
                  Качество
                </th>
                <th className="border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-[90px]">
                  Пропуски
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-[80px]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredStudents.map((student, index) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="border-r border-gray-200 px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {index + 1}. {student.fullName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{student.className}</div>
                  </td>
                  {subjects.map((subject) => {
                    const subjectGrades = student.grades[subject] || [];
                    const subjectAverage = subjectGrades.length > 0 
                      ? Math.round((subjectGrades.reduce((sum, grade) => sum + grade, 0) / subjectGrades.length) * 10) / 10
                      : 0;
                    
                    return (
                      <td key={subject} className="border-r border-gray-200 px-2 py-4 text-center">
                        <div className="h-16 flex flex-col justify-center items-center">
                          {subjectGrades.length > 0 ? (
                            <div 
                              className="cursor-pointer hover:opacity-75"
                              onClick={() => handleGradeClick(student, subject)}
                              title="Нажмите для просмотра деталей оценки"
                            >
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 ${getGradeColor(subjectGrades[0])} ${
                                  subjectGrades[0] >= 4 ? 'border-green-300' : subjectGrades[0] >= 3 ? 'border-blue-300' : 'border-red-300'
                                } hover:scale-110 transition-transform`}
                              >
                                {subjectGrades[0]}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">—</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border-r border-gray-200 px-3 py-4 text-center">
                    <div className={`text-lg font-bold ${getGradeColor(student.averageGrade).split(' ')[0]}`}>
                      {student.averageGrade}
                    </div>
                  </td>
                  <td className="border-r border-gray-200 px-3 py-4 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(student.qualityPercentage)}`}>
                      {student.qualityPercentage}%
                    </div>
                  </td>
                  <td className="border-r border-gray-200 px-3 py-4 text-center">
                    <div className="text-xs">
                      <div className="text-green-600 font-medium">У: {student.absencesExcused}</div>
                      <div className="text-red-600 font-medium">Н: {student.absencesUnexcused}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex justify-center space-x-1">
                      <button 
                        onClick={() => handleStudentView(student)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStudentEdit(student)}
                        className="text-gray-600 hover:text-gray-900 p-1.5 rounded hover:bg-gray-50"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Subject Averages */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
          <div className="overflow-x-auto select-none" style={{ cursor: 'grab' }}>
            <table className="w-full border-collapse min-w-max">
              <tbody>
                <tr className="font-semibold text-gray-800">
                  <td className="border-r border-gray-300 px-4 py-3 text-left w-[250px]">
                    <span className="text-sm font-bold">Средний балл по классу:</span>
                  </td>
                  {subjects.map((subject) => {
                    const allSubjectGrades = filteredStudents.flatMap(s => s.grades[subject] || []);
                    const subjectClassAverage = allSubjectGrades.length > 0 
                      ? Math.round((allSubjectGrades.reduce((sum, grade) => sum + grade, 0) / allSubjectGrades.length) * 10) / 10
                      : 0;
                    
                    return (
                      <td key={subject} className="border-r border-gray-300 px-2 py-3 text-center w-[100px]">
                        <div className={`text-lg font-bold ${getGradeColor(subjectClassAverage).split(' ')[0]}`}>
                          {subjectClassAverage || '—'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border-r border-gray-300 px-3 py-3 text-center w-[80px]">
                    <div className={`text-lg font-bold ${getGradeColor(kpiMetrics.averageGrade).split(' ')[0]}`}>
                      {kpiMetrics.averageGrade}
                    </div>
                  </td>
                  <td className="border-r border-gray-300 px-3 py-3 text-center w-[80px]">
                    <div className="text-lg font-bold text-green-600">
                      {kpiMetrics.qualityPercentage}%
                    </div>
                  </td>
                  <td className="border-r border-gray-300 px-3 py-3 text-center w-[90px]">
                    <div className="text-sm font-bold text-red-600">
                      {kpiMetrics.unexcusedAbsences}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-[80px]"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Buttons Below Table */}
      <div className="mt-6 flex justify-center items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border">
        <span className="text-sm text-gray-600 font-medium">Скачать отчет:</span>
        <button
          onClick={() => handleFilteredExport('xlsx')}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm transition-colors"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Excel (XLSX)
        </button>
        <button
          onClick={() => handleFilteredExport('pdf')}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </button>
        <div className="text-xs text-gray-500">
          {filteredStudents.length} учащихся • {filters.class || 'Все классы'} • {periods[filters.period]}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Экспорт отчёта</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Формат экспорта</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <FileDown className="w-4 h-4 mr-3" />
                      Excel (XLSX) - полная таблица с форматированием
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      CSV - данные для анализа
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      PDF - отчет с графиками
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Настройки отчетов</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-sm">Автоматическое обновление данных</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-sm">Показывать графики по умолчанию</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-sm">Уведомления о новых отчетах</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Настроить авто-рассылку</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Частота</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Еженедельно</option>
                    <option>Ежемесячно</option>
                    <option>По окончании четверти</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email для отправки</label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="admin@school.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип отчета</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    {Object.entries(reportTypes).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  alert('Авто-рассылка настроена!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Настроить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Export Log (Admin mode) */}
      {showSidebar && (
        <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border p-4 hidden xl:block z-40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Журнал экспорта</h4>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {exportLogs.map((log) => (
              <div key={log.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                <div className="font-medium">{log.user}</div>
                <div>{log.reportType} • {log.format}</div>
                <div className="text-gray-500">{new Date(log.exportedAt).toLocaleString('ru-RU')}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="text-xs font-semibold text-gray-700 mb-2">Планировщик рассылок</h5>
            <button 
              onClick={handleAutoSchedule}
              className="w-full text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
            >
              <Mail className="w-3 h-3 inline mr-1" />
              Настроить авто-рассылку
            </button>
          </div>
        </div>
      )}

      {/* Toggle Sidebar Button */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed right-4 top-20 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hidden xl:block z-40"
          title="Показать журнал экспорта"
        >
          <FileText className="w-4 h-4" />
        </button>
      )}

      {/* Grade Details Modal */}
      {showGradeModal && selectedGradeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Детали оценок: {selectedGradeDetails.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedGradeDetails.student.fullName} • {selectedGradeDetails.student.className}
                </p>
              </div>
              <button
                onClick={() => setShowGradeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {selectedGradeDetails.grades.map((gradeDetail, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span 
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 ${getGradeColor(gradeDetail.grade)} ${
                            gradeDetail.grade >= 4 ? 'border-green-300' : gradeDetail.grade >= 3 ? 'border-blue-300' : 'border-red-300'
                          }`}
                        >
                          {gradeDetail.grade}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{gradeDetail.topic}</h4>
                          <p className="text-sm text-gray-600">{gradeDetail.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{gradeDetail.date}</p>
                        <p className="text-xs text-gray-500">{gradeDetail.teacher}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Учитель: {gradeDetail.teacher}</span>
                      <span>Дата: {gradeDetail.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedGradeDetails.grades.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Нет оценок по данному предмету</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Всего оценок: {selectedGradeDetails.grades.length}
                </div>
                <div className="flex items-center space-x-4">
                  {selectedGradeDetails.grades.length > 0 && (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-600">Средний балл: </span>
                        <span className={`font-bold ${getGradeColor(
                          Math.round((selectedGradeDetails.grades.reduce((sum, g) => sum + g.grade, 0) / selectedGradeDetails.grades.length) * 10) / 10
                        ).split(' ')[0]}`}>
                          {Math.round((selectedGradeDetails.grades.reduce((sum, g) => sum + g.grade, 0) / selectedGradeDetails.grades.length) * 10) / 10}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Качество: </span>
                        <span className="font-bold text-green-600">
                          {Math.round((selectedGradeDetails.grades.filter(g => g.grade >= 4).length / selectedGradeDetails.grades.length) * 100)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalReports;
