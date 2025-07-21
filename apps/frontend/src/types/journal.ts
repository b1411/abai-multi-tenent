export interface LessonResult {
  id: number;
  studentId: number;
  lessonId: number;
  lessonScore?: number;
  lessonScoreComment?: string;
  homeworkScore?: number;
  homeworkScoreComment?: string;
  attendance?: boolean;
  absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
  absentComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  userId: number;
  groupId: number;
  user: {
    id: number;
    name: string;
    surname: string;
    middlename?: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  group: {
    id: number;
    name: string;
    courseNumber: number;
  };
}

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  classroomId?: number;
  studyPlan: {
    id: number;
    subject: string;
    description?: string;
  };
}

export interface JournalEntry {
  student: Student;
  results: {
    [lessonId: number]: LessonResult;
  };
  statistics: {
    averageGrade: number;
    attendancePercentage: number;
    totalLessons: number;
    attendedLessons: number;
  };
}

export interface GroupJournal {
  group: {
    id: number;
    name: string;
    courseNumber: number;
    students: Student[];
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  lessons: Array<{
    id: number;
    name: string;
    date: string;
    description?: string;
    studyPlan: {
      id: number;
      name: string;
      description?: string;
      teacher: {
        user: {
          id: number;
          name: string;
          surname: string;
        };
      };
    };
    LessonResult: Array<{
      id: number;
      studentId: number;
      lessonId: number;
      lessonScore?: number;
      lessonScoreComment?: string;
      homeworkScore?: number;
      homeworkScoreComment?: string;
      attendance?: boolean;
      absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
      absentComment?: string;
      Student: {
        id: number;
        userId: number;
        user: {
          id: number;
          name: string;
          surname: string;
          middlename?: string;
        };
        group: {
          id: number;
          name: string;
          courseNumber: number;
        };
      };
    }>;
  }>;
  students: Student[];
}

export interface CreateLessonResultDto {
  studentId: number;
  lessonId: number;
  lessonScore?: number;
  lessonScorecomment?: string; // Исправлено название поля
  homeworkScore?: number;
  homeworkScoreComment?: string;
  attendance?: boolean;
  absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
  absentComment?: string;
}

export interface UpdateLessonResultDto {
  lessonScore?: number;
  lessonScorecomment?: string; // Исправлено название поля
  homeworkScore?: number;
  homeworkScoreComment?: string;
  attendance?: boolean;
  absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
  absentComment?: string;
}

export interface BulkAttendanceDto {
  attendanceData: {
    studentId: number;
    attendance: boolean;
    absentReason?: 'SICK' | 'FAMILY' | 'OTHER';
    absentComment?: string;
  }[];
}

export interface AttendanceStatistics {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  attendanceRate: number;
  absentReasons: {
    SICK: number;
    FAMILY: number;
    OTHER: number;
  };
}

export interface GradeStatistics {
  averageGrade: number;
  gradeDistribution: {
    excellent: number; // 5
    good: number; // 4
    satisfactory: number; // 3
    unsatisfactory: number; // 2
    poor: number; // 1
  };
  totalGrades: number;
}

export interface JournalFilters {
  groupId?: number;
  studyPlanId?: number;
  startDate?: string;
  endDate?: string;
  studentSearch?: string;
}
