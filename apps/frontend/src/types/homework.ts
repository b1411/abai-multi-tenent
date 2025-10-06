export interface Homework {
  id: number;
  name: string;
  description?: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  materialsId?: number;
  materials?: HomeworkMaterials;
  lesson?: HomeworkLesson;
  additionalFiles?: HomeworkFile[];
  studentsSubmissions?: HomeworkSubmission[];
}

export interface HomeworkMaterials {
  id: number;
  lecture?: string;
  videoUrl?: string;
  presentationUrl?: string;
  additionalFiles?: HomeworkFile[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkLesson {
  id: number;
  name: string;
  date: string;
  studyPlan?: {
    id: number;
    name: string;
    teacher?: {
      user?: {
        id: number;
        name: string;
        surname: string;
      };
    };
  };
}

export interface HomeworkFile {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  mime: string;
  createdAt: string;
}

export interface HomeworkSubmission {
  id: number;
  studentId: number;
  homeworkId: number;
  comment?: string;
  status: 'PENDING' | 'CHECKED';
  submittedAt: string;
  fileUrl?: HomeworkFile;
  student?: {
    id: number;
    userId: number;
    user?: {
      id: number;
      name: string;
      surname: string;
    };
    group: {
      id: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      name: string;
      courseNumber: number;
      curatorTeacherId: number | null;
    };
  };
  lessonResult?: {
    homeworkScore?: number;
    homeworkScoreComment?: string;
  };
}

export interface CreateHomeworkRequest {
  name: string;
  description?: string;
  deadline: string;
  lessonId?: number;
  additionalFileIds?: number[];
}

export interface UpdateHomeworkRequest {
  name?: string;
  deadline?: string;
  description?: string;
  lessonId?: number;
  additionalFileIds?: number[];
}

export interface HomeworkFilters {
  search?: string;
  status?: 'pending' | 'submitted' | 'graded' | 'overdue';
  lessonId?: number;
  studentId?: number;
  teacherId?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'deadline' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface HomeworkSubmitRequest {
  comment?: string;
  fileId: number;
  additionalFileIds?: number[];
}

export type HomeworkStatus = 'pending' | 'submitted' | 'graded' | 'overdue';
