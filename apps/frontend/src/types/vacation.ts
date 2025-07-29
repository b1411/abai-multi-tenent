export enum VacationType {
  vacation = 'vacation',
  sick_leave = 'sick_leave',
  maternity_leave = 'maternity_leave',
  unpaid_leave = 'unpaid_leave',
  business_trip = 'business_trip'
}

export enum VacationStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  completed = 'completed'
}

export interface VacationDocument {
  id: number;
  vacationId: number;
  fileId: number;
  type: string;
  createdAt: string;
  file: {
    id: number;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
  };
}

export interface Vacation {
  id: number;
  type: VacationType;
  startDate: string;
  endDate: string;
  days: number;
  status: VacationStatus;
  comment?: string;
  lectureTopics?: string;
  teacherId: number;
  substituteId?: number;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
      phone?: string;
    };
  };
  substitute?: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  };
  affectedLessons?: {
    id: number;
    name: string;
    date: string;
    studyPlan: {
      id: number;
      name: string;
    };
    group?: {
      id: number;
      name: string;
    };
  }[];
  documents: VacationDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVacationRequest {
  type: VacationType;
  startDate: string;
  endDate: string;
  days: number;
  substituteId?: number;
  comment?: string;
  lectureTopics?: string;
  lessonIds?: number[];
}

export interface UpdateVacationRequest {
  type?: VacationType;
  startDate?: string;
  endDate?: string;
  days?: number;
  substituteId?: number;
  comment?: string;
  lectureTopics?: string;
  affectedLessons?: number[];
  lessonIds?: number[];
}

export interface UpdateVacationStatusRequest {
  status: VacationStatus;
  comment?: string;
  notifyEmployee?: boolean;
}

export interface VacationFilterParams {
  search?: string;
  type?: VacationType;
  status?: VacationStatus;
  period?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  substituteId?: string;
  page?: number;
  limit?: number;
}

export interface VacationSummary {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  currentMonth: {
    onVacation: number;
    onSickLeave: number;
    planned: number;
  };
}

export interface TeacherVacationSummary {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  sickLeaveDays: number;
}

export interface VacationSubstitution {
  vacationId: number;
  originalEmployee: {
    id: number;
    name: string;
    subjects: string[];
  };
  substituteEmployee: {
    id: number;
    name: string;
    subjects: string[];
  };
  period: {
    start: string;
    end: string;
  };
  topics: string[];
  status: VacationStatus;
}

export interface VacationListResponse {
  vacations: Vacation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: VacationSummary;
}

export interface SubstitutionsResponse {
  substitutions: VacationSubstitution[];
}

export const VACATION_TYPE_LABELS: Record<VacationType, string> = {
  [VacationType.vacation]: 'Отпуск',
  [VacationType.sick_leave]: 'Больничный',
  [VacationType.maternity_leave]: 'Декретный отпуск',
  [VacationType.unpaid_leave]: 'Отпуск без содержания',
  [VacationType.business_trip]: 'Командировка'
};

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
  [VacationStatus.pending]: 'На рассмотрении',
  [VacationStatus.approved]: 'Одобрено',
  [VacationStatus.rejected]: 'Отклонено',
  [VacationStatus.completed]: 'Завершено'
};

export const VACATION_STATUS_COLORS: Record<VacationStatus, string> = {
  [VacationStatus.pending]: 'bg-yellow-100 text-yellow-800',
  [VacationStatus.approved]: 'bg-green-100 text-green-800',
  [VacationStatus.rejected]: 'bg-red-100 text-red-800',
  [VacationStatus.completed]: 'bg-gray-100 text-gray-800'
};
