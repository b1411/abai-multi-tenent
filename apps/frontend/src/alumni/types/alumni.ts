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
  graduationClass: string; // Класс выпуска (например, "11А", "11Б")
  track?: string; // Направление обучения (например, "IB", "НИШ", "Общее")
  status: AlumniStatus;
  // Образование
  currentUniversity?: string;
  currentCountry?: string;
  currentCity?: string;
  degree?: string; // Степень обучения (Бакалавр, Магистр, и т.д.)
  major?: string; // Специальность
  linkedin?: string;
  // Достижения в школе
  schoolAchievements?: string[];
  // Координаты для карты (если есть точные данные)
  coordinates?: {
    lat: number;
    lng: number;
  };
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
  country?: string;
  track?: string;
  sortBy?: 'name' | 'graduationDate' | 'university' | 'country';
  sortOrder?: 'asc' | 'desc';
}

export interface AlumniStats {
  totalAlumni: number;
  byYear: { year: number; count: number }[];
  byCountry: { country: string; count: number }[];
  byTrack: { track: string; count: number }[];
  studyingAbroad: number;
  studyingInKazakhstan: number;
}

// Новый интерфейс для данных карты
export interface WorldMapData {
  countries: CountryData[];
}

export interface CountryData {
  code: string; // ISO код страны
  name: string;
  count: number; // Количество студентов
  universities: UniversityData[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface UniversityData {
  name: string;
  count: number;
  city?: string;
}
