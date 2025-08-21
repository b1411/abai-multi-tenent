import apiClient from './apiClient';

// Расширенный список периодов синхронизирован с backend ReportPeriod enum
export type ReportPeriodKey =
  | 'day'
  | 'week'
  | 'quarter'
  | 'semester'
  | 'year'
  | 'school_quarter_1'
  | 'school_quarter_2'
  | 'school_quarter_3'
  | 'school_quarter_4'
  | 'calendar_q1'
  | 'calendar_q2'
  | 'calendar_q3'
  | 'calendar_q4'
  | 'fall_semester'
  | 'spring_semester'
  | 'trimester_1'
  | 'trimester_2'
  | 'trimester_3'
  | 'custom';

export interface EducationalReportFilters {
  period?: ReportPeriodKey;
  classId?: number;
  className?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface StudentReportFilters {
  period?: ReportPeriodKey;
  subjectId?: number;
  startDate?: string;
  endDate?: string;
}

export interface Student {
  id: number;
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

export interface GradeDetail {
  id: number;
  grade: number;
  date: string;
  topic: string;
  gradeType: string;
  teacherName: string;
  comment?: string;
}

export interface SubjectGrades {
  subjectId: number;
  subjectName: string;
  grades: GradeDetail[];
  averageGrade: number;
  qualityPercentage: number;
  gradesCount: number;
  teacherName: string;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  isPresent: boolean;
  absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
  absentComment?: string;
  subjectName: string;
  lessonTopic: string;
}

export interface QualityStatistics {
  totalStudents: number;
  averageGrade: number;
  qualityPercentage: number;
  attendancePercentage: number;
  studentsAbove4: number;
  studentsBelow3: number;
}

export interface PeriodGrade {
  subjectId: number;
  subjectName: string;
  periodGrade: number;
  averageGrade: number;
  qualityPercentage: number;
  gradesCount: number;
}

class EducationalReportsApi {
  /**
   * Получить список студентов для отчетов
   * Доступ зависит от роли пользователя
   */
  async getStudents(filters: EducationalReportFilters = {}): Promise<Student[]> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.classId) params.append('classId', filters.classId.toString());
    if (filters.className) params.append('className', filters.className);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `/educational-reports/students?${queryString}` : '/educational-reports/students';
    
    return await apiClient.get<Student[]>(url);
  }

  /**
   * Получить оценки студента по периодам
   * Согласно приказу 125
   */
  async getStudentGrades(studentId: number, filters: StudentReportFilters = {}): Promise<SubjectGrades[]> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString 
      ? `/educational-reports/students/${studentId}/grades?${queryString}` 
      : `/educational-reports/students/${studentId}/grades`;
    
    return await apiClient.get<SubjectGrades[]>(url);
  }

  /**
   * Получить данные о посещаемости студента
   */
  async getStudentAttendance(studentId: number, filters: StudentReportFilters = {}): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString 
      ? `/educational-reports/students/${studentId}/attendance?${queryString}` 
      : `/educational-reports/students/${studentId}/attendance`;
    
    return await apiClient.get<AttendanceRecord[]>(url);
  }

  /**
   * Рассчитать итоговые оценки согласно приказу 125
   */
  async calculatePeriodGrades(studentId: number, filters: StudentReportFilters = {}): Promise<PeriodGrade[]> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString 
      ? `/educational-reports/students/${studentId}/period-grades?${queryString}` 
      : `/educational-reports/students/${studentId}/period-grades`;
    
    return await apiClient.get<PeriodGrade[]>(url);
  }

  /**
   * Получить статистику качества знаний
   */
  async getQualityStatistics(filters: EducationalReportFilters = {}): Promise<QualityStatistics> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.classId) params.append('classId', filters.classId.toString());
    if (filters.className) params.append('className', filters.className);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `/educational-reports/quality-statistics?${queryString}` : '/educational-reports/quality-statistics';
    
    return await apiClient.get<QualityStatistics>(url);
  }

  /**
   * Утилита для расчета качества знаний (приказ 125)
   */
  calculateQualityPercentage(grades: number[]): number {
    if (grades.length === 0) return 0;
    const qualityGrades = grades.filter(grade => grade >= 4).length;
    return Math.round((qualityGrades / grades.length) * 100);
  }

  /**
   * Утилита для расчета среднего балла
   */
  calculateAverageGrade(grades: number[]): number {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  }

  /**
   * Получить список предметов (StudyPlan)
   */
  async getSubjects(): Promise<{ id: number; name: string; description?: string; teacherName?: string }[]> {
    return await apiClient.get<{ id: number; name: string; description?: string; teacher?: { user: { name: string; surname: string; middlename?: string } } }[]>('/educational-reports/subjects')
      .then(subjects => subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        teacherName: subject.teacher ? 
          `${subject.teacher.user.surname} ${subject.teacher.user.name} ${subject.teacher.user.middlename || ''}`.trim() : 
          undefined
      })));
  }

  /**
   * Получить список классов
   */
  async getClasses(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ name: string }[]>('/educational-reports/classes');
      return response.map(c => c.name);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Fallback to default classes
      return [
        '8А', '8Б', '8В',
        '9А', '9Б', '9В',
        '10А', '10Б', '10В',
        '11А', '11Б', '11В'
      ];
    }
  }

  /**
   * Получить список учителей
   */
  async getTeachers(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ id: number; name: string }[]>('/educational-reports/teachers');
      return response.map(t => t.name);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // Fallback to default teachers
      return [
        'Назарбаева А.Е.',
        'Қасымов Б.Н.',
        'Төлегенова Г.М.',
        'Сәтбаев Д.А.',
        'Жұмабекова Ж.С.',
        'Мұратов А.К.'
      ];
    }
  }

  /**
   * Форматирование имени студента
   */
  formatStudentName(user: { name: string; surname: string; middlename?: string }): string {
    const name = user.name || '';
    const surname = user.surname || '';
    const middlename = user.middlename || '';
    return `${surname} ${name} ${middlename}`.trim();
  }
}

export const educationalReportsApi = new EducationalReportsApi();
export default educationalReportsApi;
