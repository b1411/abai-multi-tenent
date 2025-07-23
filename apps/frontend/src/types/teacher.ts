export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  middlename?: string;
  phone?: string;
  avatar?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudyPlan {
  id: number;
  name: string;
  description?: string;
  normativeWorkload?: number;
  group?: Group[];
  lessons?: Lesson[];
}

export interface Group {
  id: number;
  name: string;
  courseNumber: number;
  students?: Student[];
  _count?: {
    students: number;
  };
}

export interface Student {
  id: number;
  user: {
    id: number;
    name: string;
    surname: string;
    middlename?: string;
  };
}

export interface Lesson {
  id: number;
  name: string;
  date: string;
  description?: string;
  LessonResult?: LessonResult[];
}

export interface LessonResult {
  id: number;
  lessonScore?: number;
  homeworkScore?: number;
  attendance?: boolean;
  Student: {
    user: {
      name: string;
      surname: string;
    };
  };
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  studyPlan: {
    id: number;
    name: string;
  };
  group: {
    id: number;
    name: string;
    courseNumber: number;
  };
  classroom?: {
    id: number;
    name: string;
    building: string;
    floor: number;
  };
}

export interface Vacation {
  id: number;
  type: 'vacation' | 'sick_leave' | 'maternity_leave' | 'unpaid_leave' | 'business_trip';
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  comment?: string;
}

export interface Teacher {
  id: number;
  userId: number;
  employmentType: 'STAFF' | 'PART_TIME';
  createdAt: string;
  updatedAt: string;
  user: User;
  studyPlans?: StudyPlan[];
  schedules?: Schedule[];
  vacations?: Vacation[];
  specialization?: string;
  qualification?: string;
  experience?: number;
}

export interface CreateTeacherDto {
  userId: number;
  specialization?: string;
  qualification?: string;
  experience?: number;
}

export interface UpdateTeacherDto {
  specialization?: string;
  qualification?: string;
  experience?: number;
}

export interface TeacherWorkload {
  teacher: {
    id: number;
    name: string;
    surname: string;
  };
  workload: {
    totalSubjects: number;
    totalGroups: number;
    totalStudents: number;
    totalHoursPerWeek: number;
    normativeWorkload: number;
  };
  subjects: Array<{
    id: number;
    name: string;
    groups: Array<{
      id: number;
      name: string;
      studentCount: number;
    }>;
    hoursPerWeek: number;
  }>;
}

export interface TeacherStatistics {
  totalTeachers: number;
  experienceDistribution: Array<{
    experience: string;
    count: number;
  }>;
  recentTeachers: Array<{
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  }>;
  workloadSummary: Array<{
    id: number;
    name: string;
    subjectCount: number;
    groupCount: number;
    studentCount: number;
    experience?: number;
    specialization?: string;
  }>;
}

export interface TeacherFilters {
  search?: string;
  employmentType?: 'STAFF' | 'PART_TIME' | 'all';
  subject?: string;
  status?: 'active' | 'vacation' | 'all';
}
