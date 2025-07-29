export interface Alumni {
  id: number;
  studentId: number;
  name: string;
  surname: string;
  middlename?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  graduationDate: string;
  graduationYear: number;
  groupName: string;
  status: AlumniStatus;
  // Карьерная информация
  currentJob?: string;
  currentCompany?: string;
  industry?: string;
  linkedin?: string;
  // Статистика
  gpa?: number;
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum AlumniStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface AlumniFilters {
  search?: string;
  graduationYear?: number;
  status?: AlumniStatus;
  industry?: string;
  sortBy?: 'name' | 'graduationDate' | 'company';
  sortOrder?: 'asc' | 'desc';
}

export interface AlumniStats {
  totalAlumni: number;
  byYear: { year: number; count: number }[];
  byIndustry: { industry: string; count: number }[];
  averageGpa: number;
  employmentRate: number;
}
