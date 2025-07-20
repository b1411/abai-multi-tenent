export interface Lesson {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  date: string;
  studyPlanId: number;
  description?: string | null;
  homeworkId?: number | null;
  materialsId?: number | null;
  
  // Relations
  studyPlan?: StudyPlan;
  homework?: Homework | null;
  materials?: Materials | null;
  LessonResult?: LessonResult[];
  _count?: {
    LessonResult: number;
  };
}

export interface StudyPlan {
  id: number;
  name: string;
  description?: string | null;
  teacherId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  
  // Relations
  teacher?: {
    id: number;
    user?: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  } | null;
  group?: Group[];
  lessons?: Lesson[];
  _count?: {
    lessons: number;
  };
}

export interface Teacher {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
}

export interface Homework {
  id: number;
  name: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Materials {
  id: number;
  name: string;
  type: string;
  content?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LessonResult {
  id: number;
  studentId: number;
  lessonId: number;
  homeworkId?: number | null;
  lessonScore?: number | null;
  lessonScorecomment?: string | null;
  homeworkScore?: number | null;
  homeworkScoreComment?: string | null;
  attendance?: boolean | null;
  absentReason?: string | null;
  absentComment?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateLessonRequest {
  name: string;
  date: string;
  studyPlanId: number;
  description?: string;
}

export interface UpdateLessonRequest {
  name?: string;
  date?: string;
  description?: string;
}

export interface LessonFilters {
  studyPlanId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'date' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface LessonListResponse {
  data: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
