// Backend API types (из Prisma схемы)
export interface Schedule {
  id: string;
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  classroomId: number | null;
  dayOfWeek: number; // 1-7: понедельник-воскресенье
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  
  // Populated fields из API
  studyPlan?: {
    id: number;
    name: string;
    description?: string;
    teacherId: number;
  };
  group?: {
    id: number;
    name: string;
    courseNumber: number;
  };
  teacher?: {
    id: number;
    userId: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  };
  classroom?: {
    id: number;
    name: string;
    building: string;
    floor: number;
    capacity: number;
    type: string;
  };
}

export interface CreateScheduleDto {
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  classroomId?: number;
  dayOfWeek: number; // 1-7
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  repeat?: 'weekly' | 'biweekly' | 'once';
}

export interface UpdateScheduleDto {
  studyPlanId?: number;
  groupId?: number;
  teacherId?: number;
  classroomId?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  repeat?: 'weekly' | 'biweekly' | 'once';
}

// Frontend display types (совместимые с legacy фронтом)
export interface ScheduleItem {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  classId: string; // group name
  subject: string; // from studyPlan name
  teacherId: string;
  teacherName: string;
  roomId: string; // classroom name
  type: 'lesson' | 'consultation' | 'extra';
  repeat: 'weekly' | 'biweekly' | 'once';
  comment?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

// Дополнительные типы для фильтрации
export interface ScheduleFilters {
  groupId?: number;
  teacherId?: number;
  classroomId?: number;
  dayOfWeek?: number;
  studyPlanId?: number;
}

// Типы для выпадающих списков
export interface GroupOption {
  id: number;
  name: string;
  courseNumber: number;
}

export interface TeacherOption {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface StudyPlanOption {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  groupId: number;
  groupName: string;
}

export interface ClassroomOption {
  id: number;
  name: string;
  building: string;
  capacity: number;
  type: string;
}

export interface ScheduleFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: 'lesson' | 'exam' | 'meeting' | 'event';
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  teacherId?: number;
  groupId?: number;
  classroomId?: number;
  studyPlanId?: number;
  dayOfWeek?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: 'date' | 'startTime' | 'title' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ScheduleListResponse {
  items: ScheduleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WeekSchedule {
  [key: string]: ScheduleItem[]; // ключ - дата в формате YYYY-MM-DD
}

export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: ScheduleItem[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface ScheduleStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  upcoming: number;
  byType: {
    lesson: number;
    exam: number;
    meeting: number;
    event: number;
  };
  byStatus: {
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
}

export type ScheduleView = 'day' | 'week' | 'month' | 'list';
export type ScheduleType = 'lesson' | 'exam' | 'meeting' | 'event';
export type ScheduleStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
