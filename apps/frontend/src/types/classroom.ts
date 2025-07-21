export interface Classroom {
  id: number;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: ClassroomType;
  equipment: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
}

export enum ClassroomType {
  LECTURE = 'LECTURE',
  PRACTICE = 'PRACTICE',
  COMPUTER = 'COMPUTER',
  LABORATORY = 'LABORATORY',
  OTHER = 'OTHER'
}

export interface CreateClassroomDto {
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: ClassroomType;
  equipment: string[];
  description?: string;
}

export type UpdateClassroomDto = Partial<CreateClassroomDto>;

export interface ClassroomFilter {
  building?: string;
  type?: ClassroomType;
  minCapacity?: number;
  maxCapacity?: number;
  equipment?: string[];
}

export interface ClassroomStatistics {
  totalClassrooms: number;
  byType: Record<ClassroomType, number>;
  byBuilding: Record<string, number>;
  averageCapacity: number;
  totalCapacity: number;
  utilizationRate: number;
}

// Schedule interface для использования в расписании аудиторий
interface Schedule {
  id: string;
  studyPlan: {
    id: number;
    name: string;
  };
  group: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    user: {
      name: string;
      surname: string;
    };
  };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
