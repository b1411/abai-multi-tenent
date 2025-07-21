export interface StudyPlan {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teacherId: number;
  teacher: {
    id: number;
    userId: number;
    user: {
      id: number;
      name: string;
      surname: string;
      middlename?: string;
      email: string;
      phone?: string;
    };
  };
  group: Group[];
  lessons: Lesson[];
  _count: {
    lessons: number;
  };
  // Вычисляемые поля для совместимости с frontend
  teachers?: Teacher[];
  groups?: Group[];
  totalLessons?: number;
  completedLessons?: number;
  progress?: number;
}

export interface Teacher {
  id: number;
  name: string;
  surname: string;
  middlename?: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Group {
  id: number;
  name: string;
  courseNumber?: number;
  description?: string;
  studentsCount?: number;
  teachers?: Teacher[];
  createdAt?: string;
}

export interface Lesson {
  id: number;
  name: string;
  description?: string;
  date: string;
  duration?: number;
  order?: number;
  studyPlanId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudyPlanFilters {
  search?: string;
  groupId?: number;
  teacherId?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Response structure according to backend
export interface StudyPlanResponse {
  data: StudyPlan[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
