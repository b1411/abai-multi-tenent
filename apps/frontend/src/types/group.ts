export interface Group {
  id: number;
  name: string;
  courseNumber: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  studentsCount?: number;
  students?: Student[];
  studyPlans?: StudyPlan[];
  schedules?: Schedule[];
}

export interface CreateGroupDto {
  name: string;
  courseNumber: number;
}

export interface UpdateGroupDto {
  name?: string;
  courseNumber?: number;
}

export interface GroupStatistics {
  totalGroups: number;
  totalStudents: number;
  averageStudentsPerGroup: number;
  groupsByCourse: {
    courseNumber: number;
    count: number;
  }[];
}

// Импорты из других типов
export interface Student {
  id: number;
  userId: number;
  groupId: number;
  user: {
    name: string;
    surname: string;
    email: string;
  };
}

export interface StudyPlan {
  id: number;
  name: string;
  description?: string;
}

export interface Schedule {
  id: string;
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  classroomId?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
