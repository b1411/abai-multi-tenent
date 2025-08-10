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
import { educationalReportsApi, type Student as ApiStudent, type SubjectGrades as ApiSubjectGrades, type QualityStatistics } from '../services/educationalReportsApi';
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
import { useBranding } from '../hooks/useSystem';
import type { BrandingSettings } from '../types/system';

// Types
interface Student {
  id: number;
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
  userId: number;
  groupId: number;
  user: {
    id: number;
    name: string;
    surname: string;
    middlename: string;
    email: string;
  };
  group: {
    id: number;
    name: string;
  };
}

interface ReportFilters {
  class: string;
  subject: string;
  teacher: string;
  level: string;
  search: string;
}

interface KPIMetrics {
  totalStudents: number;
  qualityPercentage: number;
  averageGrade: number;
  unexcusedAbsences: number;
  attendancePercentage: number;
  studentsAbove4: number;
  studentsBelow3: number;
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

const periods = {
  day: 'День',
  week: 'Неделя',
  quarter: 'Четверть',
  year: 'Год'
};

const EducationalReports: React.FC = () => {
  // Branding (logo, school name, colors)
  const { settings: branding } = useBranding();

  const [filters, setFilters] = useState<ReportFilters>({
    class: '10А',
    subject: '',
    teacher: '',
    level: '',
    search: ''
  });

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);
  const [studentGradesMap, setStudentGradesMap] = useState<Map<number, ApiSubjectGrades[]>>(new Map());
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [subjectsData, classesData, teachersData] = await Promise.all([
          educationalReportsApi.getSubjects(),
          educationalReportsApi.getClasses(),
          educationalReportsApi.getTeachers()
        ]);

        setSubjects(subjectsData.map(s => s.name));
        setClasses(classesData);
        setTeachers(teachersData);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load students data
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const filtersForApi = {
          className: filters.class || undefined,
          search: filters.search || undefined
        };

        const apiStudentsData = await educationalReportsApi.getStudents(filtersForApi);
        setApiStudents(apiStudentsData);

        // Load grades for all students
        const gradesMap = new Map<number, ApiSubjectGrades[]>();

        for (const student of apiStudentsData) {
          try {
            const grades = await educationalReportsApi.getStudentGrades(student.id, {
              period: 'quarter' // Используем четверть по умолчанию
            });
            gradesMap.set(student.id, grades);
          } catch (err) {
            console.error(`Error loading grades for student ${student.id}:`, err);
          }
        }

        setStudentGradesMap(gradesMap);

        // Transform API data to component format
        const transformedStudents: Student[] = apiStudentsData.map(apiStudent => {
          const studentGrades = gradesMap.get(apiStudent.id) || [];

          // Convert grades to component format
          const grades: { [subject: string]: number[] } = {};
          studentGrades.forEach(subjectGrade => {
            grades[subjectGrade.subjectName] = subjectGrade.grades.map(gradeDetail => gradeDetail.grade);
          });

          // Calculate averages
          const allGrades = Object.values(grades).flat();
          const averageGrade = allGrades.length > 0
            ? educationalReportsApi.calculateAverageGrade(allGrades)
            : 0;
          const qualityPercentage = allGrades.length > 0
            ? educationalReportsApi.calculateQualityPercentage(allGrades)
            : 0;

          return {
            id: apiStudent.id,
            userId: apiStudent.userId,
            groupId: apiStudent.groupId,
            user: apiStudent.user,
            group: apiStudent.group,
            fullName: educationalReportsApi.formatStudentName(apiStudent.user),
            grades,
            averageGrade,
            qualityPercentage,
            absencesExcused: 0, // TODO: Load from attendance API
            absencesUnexcused: 0, // TODO: Load from attendance API
            className: apiStudent.group.name,
            subjects: subjects,
            homeworkCompletion: 85, // TODO: Load from homework API
            disciplinaryNotes: 0 // TODO: Load from discipline API
          };
        });

        setAllStudents(transformedStudents);
      } catch (err) {
        console.error('Error loading students:', err);
        setError('Ошибка загрузки данных студентов');
      } finally {
        setLoading(false);
      }
    };

    if (subjects.length > 0) {
      loadStudents();
    }
  }, [filters.class, filters.search, subjects]);

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
        unexcusedAbsences: 0,
        attendancePercentage: 0,
        studentsAbove4: 0,
        studentsBelow3: 0
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
    const studentsAbove4 = students.filter(s => s.averageGrade >= 4).length;
    const studentsBelow3 = students.filter(s => s.averageGrade < 3).length;

    return {
      totalStudents,
      qualityPercentage,
      averageGrade,
      unexcusedAbsences,
      attendancePercentage: 85, // TODO: Calculate from attendance data
      studentsAbove4,
      studentsBelow3
    };
  }, [filteredStudents]);

  // Generate dynamic chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    // tie to filters to intentionally re-seed mock data without direct usage
    const _deps = `${filters.class}|${filters.subject}`;
    void _deps;
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
  }, [filters.class, filters.subject]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const filtersForApi = {
        className: filters.class || undefined,
        search: filters.search || undefined
      };

      const apiStudentsData = await educationalReportsApi.getStudents(filtersForApi);
      setApiStudents(apiStudentsData);

      // Reload grades for all students
      const gradesMap = new Map<number, ApiSubjectGrades[]>();

      for (const student of apiStudentsData) {
        try {
          const grades = await educationalReportsApi.getStudentGrades(student.id, {
            period: 'quarter' // Используем четверть по умолчанию
          });
          gradesMap.set(student.id, grades);
        } catch (err) {
          console.error(`Error loading grades for student ${student.id}:`, err);
        }
      }

      setStudentGradesMap(gradesMap);

      // Transform data
      const transformedStudents: Student[] = apiStudentsData.map(apiStudent => {
        const studentGrades = gradesMap.get(apiStudent.id) || [];

        const grades: { [subject: string]: number[] } = {};
        studentGrades.forEach(subjectGrade => {
          grades[subjectGrade.subjectName] = subjectGrade.grades.map(gradeDetail => gradeDetail.grade);
        });

        const allGrades = Object.values(grades).flat();
        const averageGrade = allGrades.length > 0
          ? educationalReportsApi.calculateAverageGrade(allGrades)
          : 0;
        const qualityPercentage = allGrades.length > 0
          ? educationalReportsApi.calculateQualityPercentage(allGrades)
          : 0;

        return {
          id: apiStudent.id,
          userId: apiStudent.userId,
          groupId: apiStudent.groupId,
          user: apiStudent.user,
          group: apiStudent.group,
          fullName: educationalReportsApi.formatStudentName(apiStudent.user),
          grades,
          averageGrade,
          qualityPercentage,
          absencesExcused: 0,
          absencesUnexcused: 0,
          className: apiStudent.group.name,
          subjects: subjects,
          homeworkCompletion: 85,
          disciplinaryNotes: 0
        };
      });

      setAllStudents(transformedStudents);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Ошибка обновления данных');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const newLog: ExportLog = {
      id: Date.now().toString(),
      user: 'Текущий пользователь',
      reportType: 'Успеваемость',
      format: format.toUpperCase(),
      exportedAt: new Date().toISOString()
    };

    setExportLogs(prev => [newLog, ...prev]);
    setShowExportModal(false);

    // Собираем инфо для экспорта аналогично handleFilteredExport
    const filterInfo: ExportFilterInfo = {
      period: 'Текущий период',
      class: filters.class || 'Все классы',
      subject: filters.subject || 'Все предметы',
      studentsCount: filteredStudents.length,
      totalStudents: allStudents.length
    };
    const fileName = `Отчет_успеваемость_${filterInfo.class}_${filterInfo.period}_${new Date().toISOString().split('T')[0]}`;

    try {
      if (format === 'xlsx') {
        exportToExcel(fileName, filterInfo);
      } else if (format === 'pdf') {
        await exportToPDF(fileName, filterInfo, branding);
      } else if (format === 'csv') {
        exportToCSV(fileName, filterInfo);
      }
    } catch (e) {
      console.error('Ошибка экспорта:', e);
      alert('Произошла ошибка при экспорте');
    }
  };

  type ExportFilterInfo = {
    period: string;
    class: string;
    subject: string;
    studentsCount: number;
    totalStudents: number;
  };

  const handleFilteredExport = async (format: 'xlsx' | 'pdf') => {
    const newLog: ExportLog = {
      id: Date.now().toString(),
      user: 'Текущий пользователь',
      reportType: 'Успеваемость - Отфильтровано',
      format: format.toUpperCase(),
      exportedAt: new Date().toISOString()
    };

    setExportLogs(prev => [newLog, ...prev]);

    // Generate filtered report info
    const filterInfo: ExportFilterInfo = {
      period: 'Текущий период',
      class: filters.class || 'Все классы',
      subject: filters.subject || 'Все предметы',
      studentsCount: filteredStudents.length,
      totalStudents: allStudents.length
    };

    const fileName = `Отчет_успеваемость_${filterInfo.class}_${filterInfo.period}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'xlsx') {
      exportToExcel(fileName, filterInfo);
    } else if (format === 'pdf') {
      await exportToPDF(fileName, filterInfo, branding);
    }
  };

  const exportToExcel = (fileName: string, filterInfo: ExportFilterInfo) => {
    try {
      // Prepare data for Excel
      type ExcelRow = Record<string, string | number>;
      const excelData: ExcelRow[] = filteredStudents.map((student, index) => {
        const row: ExcelRow = {
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
      const summaryRow: ExcelRow = {
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

      // Workbook properties (metadata)
      const wbWithProps = wb as unknown as { Props?: { Title?: string; Subject?: string; Author?: string; CreatedDate?: Date } };
      wbWithProps.Props = {
        Title: 'Отчет по успеваемости',
        Subject: `${filterInfo.class} • ${filterInfo.period}`,
        Author: branding?.schoolName || 'Школа',
        CreatedDate: new Date()
      };

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

      // Enable AutoFilter on header row
      if (ws['!ref']) {
        (ws as unknown as { ['!autofilter']?: { ref: string } })['!autofilter'] = { ref: ws['!ref'] as string };
      }

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

  // Экспорт CSV на основе тех же данных
  const exportToCSV = (fileName: string, filterInfo: ExportFilterInfo) => {
    try {
      type Row = Record<string, string | number>;
      const rows: Row[] = filteredStudents.map((student, index) => {
        const r: Row = { '№': index + 1, 'ФИО': student.fullName, 'Класс': student.className };
        subjects.forEach(subject => {
          const grade = student.grades[subject]?.[0];
          r[subject] = typeof grade === 'number' ? grade : '—';
        });
        r['Средний балл'] = student.averageGrade;
        r['Качество'] = `${student.qualityPercentage}%`;
        r['Пропуски (У)'] = student.absencesExcused;
        r['Пропуски (Н)'] = student.absencesUnexcused;
        return r;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', RS: '\n' });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при создании CSV файла:', error);
      alert('Произошла ошибка при создании CSV файла');
    }
  };

  const exportToPDF = async (fileName: string, filterInfo: ExportFilterInfo, brandingSettings?: Partial<BrandingSettings> | null) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Ensure Cyrillic-capable font is embedded (fallback to helvetica if not available)
  const FONT_NAME = 'UnicodeFont';
  const ensureUnicodeFont = async () => {
        // Helpers
        const toBase64 = (buf: ArrayBuffer) => {
          let binary = '';
          const bytes = new Uint8Array(buf);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
          // btoa may choke on large strings in some browsers; slice in chunks if needed
          // but in modern browsers it should be okay for typical TTF sizes (< 1MB)
          return btoa(binary);
        };
        const isLikelyTTF = (buf: ArrayBuffer) => {
          try {
            const v = new DataView(buf);
            const tag = v.getUint32(0, false); // big-endian
            // 0x00010000 or 'OTTO' or 'true' or 'ttcf'
            return (
              tag === 0x00010000 ||
              tag === 0x4f54544f || // 'OTTO'
              tag === 0x74727565 || // 'true'
              tag === 0x74746366    // 'ttcf'
            );
          } catch {
            return false;
          }
        };
        const fetchFont = async (url: string) => {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) {
            console.warn(`[PDF] Font fetch failed`, url, res.status);
            return undefined;
          }
          const buf = await res.arrayBuffer();
          const ct = res.headers.get('content-type') || '';
          if (!isLikelyTTF(buf) || ct.includes('text/html')) {
            console.warn(`[PDF] Fetched file is not a valid TTF`, url, ct, buf.byteLength);
            return undefined;
          }
          return toBase64(buf);
        };

        // Candidate sources: prefer local public assets, then remote mirrors
        // Prefer DejaVuSans (известно стабильно работает с jsPDF), затем Noto/Roboto
        const localRegular = [
          '/fonts/DejaVuSans.ttf',
          '/fonts/NotoSans-Regular.ttf',
          '/fonts/Roboto-Regular.ttf'
        ];
        const localBold = [
          '/fonts/DejaVuSans-Bold.ttf',
          '/fonts/NotoSans-Bold.ttf',
          '/fonts/Roboto-Bold.ttf'
        ];
        const remoteRegular = [
          'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/version_2_37/ttf/DejaVuSans.ttf',
          'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
          'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf'
        ];
        const remoteBold = [
          'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/version_2_37/ttf/DejaVuSans-Bold.ttf',
          'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
          'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf'
        ];

        let loaded = false;
        let loadedBold = false;
        // Small validator to ensure font actually works with Cyrillic
        const validateFont = () => {
          try {
            doc.setFont(FONT_NAME, 'normal');
            const w = doc.getTextWidth('Проверка шрифта');
            return typeof w === 'number' && isFinite(w) && w > 0;
          } catch {
            return false;
          }
        };

        // Try locals
    for (const url of localRegular) {
          try {
      const b64 = await fetchFont(url);
      if (!b64) continue;
            doc.addFileToVFS('UnicodeFont-Regular.ttf', b64);
            doc.addFont('UnicodeFont-Regular.ttf', FONT_NAME, 'normal');
            if (validateFont()) { loaded = true; break; }
          } catch { /* try next */ }
        }
    for (const url of localBold) {
          if (loadedBold) break;
          try {
      const b64 = await fetchFont(url);
      if (!b64) continue;
            doc.addFileToVFS('UnicodeFont-Bold.ttf', b64);
            doc.addFont('UnicodeFont-Bold.ttf', FONT_NAME, 'bold');
            loadedBold = true;
          } catch { /* try next */ }
        }
        // Try remotes
        if (!loaded) {
      for (const url of remoteRegular) {
            try {
        const b64 = await fetchFont(url);
        if (!b64) continue;
              doc.addFileToVFS('UnicodeFont-Regular.ttf', b64);
              doc.addFont('UnicodeFont-Regular.ttf', FONT_NAME, 'normal');
              if (validateFont()) { loaded = true; break; }
            } catch { /* try next */ }
          }
        }
        if (!loadedBold) {
      for (const url of remoteBold) {
            try {
        const b64 = await fetchFont(url);
        if (!b64) continue;
              doc.addFileToVFS('UnicodeFont-Bold.ttf', b64);
              doc.addFont('UnicodeFont-Bold.ttf', FONT_NAME, 'bold');
              loadedBold = true;
              break;
            } catch { /* try next */ }
          }
        }

        if (loaded) {
          doc.setFont(FONT_NAME, 'normal');
        } else {
          // fallback to core font (may break Cyrillic, but avoids crash)
          doc.setFont('helvetica', 'normal');
          console.warn('Unicode TTF font was not loaded, falling back to core font. Cyrillic may render incorrectly.');
        }
        return { loaded, loadedBold };
      };

      // Set document metadata
      doc.setProperties({
        title: 'Отчёт по успеваемости',
        subject: `${filterInfo.class} • ${filterInfo.period}`,
        author: brandingSettings?.schoolName || 'Школа',
        creator: 'abai-multi-tenant'
      });

  // Load and set Unicode font
  const { loaded: fontOk, loadedBold: fontBoldOk } = await ensureUnicodeFont();

  // Header helper
  const drawHeader = (logoDataUrl?: string) => {
        const margin = 15;
        let x = margin;
        const y = 12;
        if (logoDataUrl) {
          try {
            // best-effort detect format
            const fmt = ((brandingSettings?.logo || '').toLowerCase().endsWith('.jpg') || (brandingSettings?.logo || '').toLowerCase().endsWith('.jpeg') ? 'JPEG' : 'PNG') as 'JPEG' | 'PNG';
            doc.addImage(logoDataUrl, fmt, x, y - 5, 20, 20);
            x += 24;
          } catch (e) { /* ignore image draw errors */ }
        }
  doc.setFont(fontOk ? FONT_NAME : 'helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(brandingSettings?.schoolName || 'Образовательная организация', x, y);
        doc.setFontSize(10);
        doc.text(`Отчет: Успеваемость`, x, y + 6);
        doc.text(`Класс: ${filterInfo.class} • Предмет: ${filterInfo.subject}`, x, y + 11);
        doc.text(`Период: ${filterInfo.period} • Уч-ся: ${filterInfo.studentsCount} из ${filterInfo.totalStudents}`, x, y + 16);
        // top line
        doc.setDrawColor(200);
        doc.line(margin, y + 19, doc.internal.pageSize.width - margin, y + 19);
      };

      // Footer helper
      const drawFooter = (page: number, total: number) => {
        const margin = 15;
        const y = doc.internal.pageSize.height - 12;
  doc.setFont(fontOk ? FONT_NAME : 'helvetica', 'normal');
  doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Система учета успеваемости • ${new Date().toLocaleString('ru-RU')}`, margin, y);
        const pageStr = `Стр. ${page} / ${total}`;
        const txtW = doc.getTextWidth(pageStr);
        doc.text(pageStr, doc.internal.pageSize.width - margin - txtW, y);
      };

      const getPageCount = (d: jsPDF) => (d as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();

      // Load logo (if available)
      const loadImageAsDataURL = async (url?: string): Promise<string | undefined> => {
        try {
          if (!url) return undefined;
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          return undefined;
        }
      };

      const logoUrl = brandingSettings?.logo || '/logo rfm.png';
      const logoData = await loadImageAsDataURL(logoUrl);

      // Draw header on first page
      drawHeader(logoData);

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
        startY: 38,
        margin: { top: 38, bottom: 30, left: 15, right: 15 },
        styles: {
      font: fontOk ? FONT_NAME : 'helvetica',
      fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
      font: fontOk ? FONT_NAME : 'helvetica',
      fontStyle: fontBoldOk && fontOk ? 'bold' : 'normal'
        },
        columnStyles: {
          0: { cellWidth: 8 },   // №
          1: { cellWidth: 40 },  // ФИО
          2: { cellWidth: 12 },  // Класс
          [subjects.length + 3]: { cellWidth: 15 }, // Ср. балл
          [subjects.length + 4]: { cellWidth: 15 }, // Качество
          [subjects.length + 5]: { cellWidth: 20 }  // Пропуски
        },
        didDrawPage: function (data: { pageNumber: number }) {
          // Header/Footer per page
          const current = data.pageNumber;
          drawHeader(logoData);
          drawFooter(current, getPageCount(doc));
        }
      });

      // Draw signature block on last page
      const totalPages = getPageCount(doc);
      doc.setPage(totalPages);
      const sigY = doc.internal.pageSize.height - 22;
  doc.setFont(FONT_NAME, 'normal');
  doc.setFontSize(9);
      doc.setTextColor(50);
      doc.text('Подписи:', 15, sigY - 6);
      // Director
      doc.text('Директор __________________ / __________________', 15, sigY);
      // Class teacher
      doc.text('Классный руководитель __________________ / __________________', 120, sigY);

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
    // Get grade details from API data
    const studentGrades = studentGradesMap.get(student.id) || [];
    const subjectGrades = studentGrades.find(sg => sg.subjectName === subject);

    if (!subjectGrades) {
      setSelectedGradeDetails({
        student,
        subject,
        grades: []
      });
      setShowGradeModal(true);
      return;
    }

    const gradeDetails: GradeDetail[] = subjectGrades.grades.map(gradeDetail => ({
      grade: gradeDetail.grade,
      subject,
      date: new Date(gradeDetail.date).toLocaleDateString('ru-RU'),
      teacher: gradeDetail.teacherName,
      topic: gradeDetail.topic,
      type: gradeDetail.gradeType as GradeDetail['type']
    }));

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
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-none mx-auto min-h-screen bg-gray-50">
      {/* Error Message */}
      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 sm:mb-2 leading-tight">
          Отчёты по учебному процессу
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          360°-панель аналитики и отчетности • {filteredStudents.length} учащихся
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1">Класс</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] transition-colors"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1">Предмет</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] transition-colors"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1">Учитель</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] transition-colors"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1">Поиск ФИО</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] transition-colors"
              placeholder="Поиск учащегося..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-3 sm:space-y-0">
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 rounded-md hover:bg-gray-50 transition-colors min-h-[40px] touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Обновить данные</span>
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              <Download className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Экспорт</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Настройки</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Всего обучающихся</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{kpiMetrics.totalStudents}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Качество знаний</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{kpiMetrics.qualityPercentage}%</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Средний балл</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{kpiMetrics.averageGrade}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Пропуски без уваж. причины</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{kpiMetrics.unexcusedAbsences}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            Динамика среднего балла
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[3, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageGrade" stroke="#3B82F6" strokeWidth={2} name="Средний балл" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            Пропуски по месяцам
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="absences" fill="#EF4444" name="Пропуски" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            Распределение оценок
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
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
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">
              Ведомость успеваемости по всем предметам
              {filters.class && ` • ${filters.class}`}
            </h3>
            <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
              Показано {filteredStudents.length} учащихся
            </div>
          </div>
        </div>

        {/* Mobile Card View - Show on screens smaller than xl */}
        <div className="xl:hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Студенты не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student, index) => (
                <div key={student.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-3">
                    {/* Student Info Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                          {index + 1}. {student.fullName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{student.className}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleStudentView(student)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] touch-manipulation"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStudentEdit(student)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] touch-manipulation"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Main Stats */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className={`text-lg sm:text-xl font-bold ${getGradeColor(student.averageGrade).split(' ')[0]}`}>
                          {student.averageGrade}
                        </div>
                        <div className="text-xs text-gray-600">Ср. балл</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className={`text-sm font-medium px-2 py-1 rounded ${getQualityColor(student.qualityPercentage)}`}>
                          {student.qualityPercentage}%
                        </div>
                        <div className="text-xs text-gray-600">Качество</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs space-y-0.5">
                          <div className="text-green-600 font-medium">У: {student.absencesExcused}</div>
                          <div className="text-red-600 font-medium">Н: {student.absencesUnexcused}</div>
                        </div>
                        <div className="text-xs text-gray-600">Пропуски</div>
                      </div>
                    </div>

                    {/* Subject Grades */}
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Оценки по предметам:</div>
                      <div className="flex flex-wrap gap-1">
                        {subjects.slice(0, 6).map(subject => {
                          const subjectGrades = student.grades[subject] || [];
                          const latestGrade = subjectGrades[0];

                          return (
                            <button
                              key={subject}
                              onClick={() => handleGradeClick(student, subject)}
                              className="flex flex-col items-center p-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow min-h-[48px] touch-manipulation"
                            >
                              <div className="text-xs text-gray-600 truncate w-full text-center mb-1" style={{ fontSize: '10px' }}>
                                {subject.length > 8 ? `${subject.substring(0, 8)}...` : subject}
                              </div>
                              {latestGrade ? (
                                <div className={`text-sm font-bold ${getGradeColor(latestGrade).split(' ')[0]}`}>
                                  {latestGrade}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">—</div>
                              )}
                            </button>
                          );
                        })}

                        {subjects.length > 6 && (
                          <div className="flex items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[48px]">
                            <span className="text-xs text-gray-500">+{subjects.length - 6}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View - Only show on xl screens */}
        <div className="hidden xl:block">
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
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 ${getGradeColor(subjectGrades[0])} ${subjectGrades[0] >= 4 ? 'border-green-300' : subjectGrades[0] >= 3 ? 'border-blue-300' : 'border-red-300'
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
      <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm border p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="text-center sm:text-left">
            <span className="text-sm sm:text-base text-gray-600 font-medium">Скачать отчет:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={() => handleFilteredExport('xlsx')}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base font-medium transition-colors min-h-[48px] touch-manipulation shadow-sm hover:shadow-md"
            >
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span>Excel (XLSX)</span>
            </button>

            <button
              onClick={() => handleFilteredExport('pdf')}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:text-base font-medium transition-colors min-h-[48px] touch-manipulation shadow-sm hover:shadow-md"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span>PDF</span>
            </button>
          </div>

          <div className="text-center sm:text-left pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              <span className="font-medium">{filteredStudents.length}</span> учащихся
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">{filters.class || 'Все классы'}</span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline text-gray-400">Текущий период</span>
            </div>
          </div>
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
                    <option value="performance">Успеваемость</option>
                    <option value="attendance">Посещаемость</option>
                    <option value="class-summary">Сводка по классу</option>
                    <option value="subject-analysis">Анализ по предметам</option>
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
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 ${getGradeColor(gradeDetail.grade)} ${gradeDetail.grade >= 4 ? 'border-green-300' : gradeDetail.grade >= 3 ? 'border-blue-300' : 'border-red-300'
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
