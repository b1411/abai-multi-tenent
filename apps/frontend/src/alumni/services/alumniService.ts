import { Alumni, AlumniFilters, AlumniStats, AlumniStatus, WorldMapData, CountryData } from '../types/alumni';

// Mock данные выпускников школы
const mockAlumniData: Alumni[] = [
  {
    id: 1,
    studentId: 1,
    name: 'Алия',
    surname: 'Нурланова',
    middlename: 'Ержановна',
    email: 'aliya.nurlanova@example.com',
    phone: '+7 707 123 4567',
    graduationDate: '2023-06-15',
    graduationYear: 2023,
    graduationClass: '11А',
    track: 'IB',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'Harvard University',
    currentCountry: 'США',
    currentCity: 'Cambridge',
    degree: 'Бакалавр',
    major: 'Computer Science',
    linkedin: 'linkedin.com/in/aliya-nurlanova',
    schoolAchievements: ['Отличник учебы', 'Президент школьного совета', 'Победитель олимпиады по математике'],
    coordinates: { lat: 42.3736, lng: -71.1097 },
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    studentId: 2,
    name: 'Данияр',
    surname: 'Тулеуов',
    middlename: 'Асылханович',
    email: 'daniyar.tuleuov@example.com',
    phone: '+7 701 987 6543',
    graduationDate: '2022-06-20',
    graduationYear: 2022,
    graduationClass: '11Б',
    track: 'НИШ',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'University of Oxford',
    currentCountry: 'Великобритания',
    currentCity: 'Oxford',
    degree: 'Магистр',
    major: 'Economics',
    linkedin: 'linkedin.com/in/daniyar-tuleuov',
    schoolAchievements: ['Стипендиат школы', 'Капитан команды дебатов'],
    coordinates: { lat: 51.7520, lng: -1.2577 },
    createdAt: '2022-06-20T10:00:00Z',
    updatedAt: '2023-12-10T10:00:00Z'
  },
  {
    id: 3,
    studentId: 3,
    name: 'Айсулу',
    surname: 'Карибаева',
    middlename: 'Болатовна',
    email: 'aisulu.karibaeva@example.com',
    graduationDate: '2021-06-18',
    graduationYear: 2021,
    graduationClass: '11В',
    track: 'IB',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'University of Toronto',
    currentCountry: 'Канада',
    currentCity: 'Toronto',
    degree: 'Бакалавр',
    major: 'Business Administration',
    schoolAchievements: ['Активист года', 'Волонтер школы'],
    coordinates: { lat: 43.6532, lng: -79.3832 },
    createdAt: '2021-06-18T10:00:00Z',
    updatedAt: '2023-11-20T10:00:00Z'
  },
  {
    id: 4,
    studentId: 4,
    name: 'Ерлан',
    surname: 'Жакипов',
    middlename: 'Мухтарович',
    email: 'erlan.zhakipov@example.com',
    phone: '+7 705 555 1234',
    graduationDate: '2024-06-14',
    graduationYear: 2024,
    graduationClass: '11А',
    track: 'Общее',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'Назарбаев Университет',
    currentCountry: 'Казахстан',
    currentCity: 'Нур-Султан',
    degree: 'Бакалавр',
    major: 'Engineering',
    schoolAchievements: ['Лучший выпускник 2024'],
    coordinates: { lat: 51.1694, lng: 71.4491 },
    createdAt: '2024-06-14T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: 5,
    studentId: 5,
    name: 'Гульнар',
    surname: 'Серикова',
    graduationDate: '2020-06-25',
    graduationYear: 2020,
    graduationClass: '11Г',
    track: 'НИШ',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'Technical University of Munich',
    currentCountry: 'Германия',
    currentCity: 'Munich',
    degree: 'Бакалавр',
    major: 'Mechanical Engineering',
    coordinates: { lat: 48.1351, lng: 11.5820 },
    createdAt: '2020-06-25T10:00:00Z',
    updatedAt: '2020-06-25T10:00:00Z'
  },
  {
    id: 6,
    studentId: 6,
    name: 'Амир',
    surname: 'Касымов',
    email: 'amir.kasymov@example.com',
    graduationDate: '2023-06-15',
    graduationYear: 2023,
    graduationClass: '11Б',
    track: 'IB',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'University of Melbourne',
    currentCountry: 'Австралия',
    currentCity: 'Melbourne',
    degree: 'Бакалавр',
    major: 'Medicine',
    schoolAchievements: ['Золотая медаль', 'Победитель научной ярмарки'],
    coordinates: { lat: -37.8136, lng: 144.9631 },
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 7,
    studentId: 7,
    name: 'Диана',
    surname: 'Абдрахманова',
    email: 'diana.abdrakhmanova@example.com',
    graduationDate: '2022-06-20',
    graduationYear: 2022,
    graduationClass: '11В',
    track: 'НИШ',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'Seoul National University',
    currentCountry: 'Южная Корея',
    currentCity: 'Seoul',
    degree: 'Бакалавр',
    major: 'International Relations',
    schoolAchievements: ['Лидер класса', 'Участник Model UN'],
    coordinates: { lat: 37.5665, lng: 126.9780 },
    createdAt: '2022-06-20T10:00:00Z',
    updatedAt: '2023-12-10T10:00:00Z'
  },
  {
    id: 8,
    studentId: 8,
    name: 'Нуржан',
    surname: 'Алматов',
    email: 'nurzhan.almatov@example.com',
    graduationDate: '2021-06-18',
    graduationYear: 2021,
    graduationClass: '11А',
    track: 'IB',
    status: AlumniStatus.ACTIVE,
    currentUniversity: 'National University of Singapore',
    currentCountry: 'Сингапур',
    currentCity: 'Singapore',
    degree: 'Магистр',
    major: 'Finance',
    schoolAchievements: ['Стипендиат', 'Капитан футбольной команды'],
    coordinates: { lat: 1.3521, lng: 103.8198 },
    createdAt: '2021-06-18T10:00:00Z',
    updatedAt: '2023-11-20T10:00:00Z'
  }
];

// Данные для карты мира
const mockWorldMapData: WorldMapData = {
  countries: [
    {
      code: 'US',
      name: 'США',
      count: 1,
      universities: [{ name: 'Harvard University', count: 1, city: 'Cambridge' }],
      coordinates: { lat: 39.8283, lng: -98.5795 }
    },
    {
      code: 'GB',
      name: 'Великобритания',
      count: 1,
      universities: [{ name: 'University of Oxford', count: 1, city: 'Oxford' }],
      coordinates: { lat: 55.3781, lng: -3.4360 }
    },
    {
      code: 'CA',
      name: 'Канада',
      count: 1,
      universities: [{ name: 'University of Toronto', count: 1, city: 'Toronto' }],
      coordinates: { lat: 56.1304, lng: -106.3468 }
    },
    {
      code: 'KZ',
      name: 'Казахстан',
      count: 1,
      universities: [{ name: 'Назарбаев Университет', count: 1, city: 'Нур-Султан' }],
      coordinates: { lat: 48.0196, lng: 66.9237 }
    },
    {
      code: 'DE',
      name: 'Германия',
      count: 1,
      universities: [{ name: 'Technical University of Munich', count: 1, city: 'Munich' }],
      coordinates: { lat: 51.1657, lng: 10.4515 }
    },
    {
      code: 'AU',
      name: 'Австралия',
      count: 1,
      universities: [{ name: 'University of Melbourne', count: 1, city: 'Melbourne' }],
      coordinates: { lat: -25.2744, lng: 133.7751 }
    },
    {
      code: 'KR',
      name: 'Южная Корея',
      count: 1,
      universities: [{ name: 'Seoul National University', count: 1, city: 'Seoul' }],
      coordinates: { lat: 35.9078, lng: 127.7669 }
    },
    {
      code: 'SG',
      name: 'Сингапур',
      count: 1,
      universities: [{ name: 'National University of Singapore', count: 1, city: 'Singapore' }],
      coordinates: { lat: 1.3521, lng: 103.8198 }
    }
  ]
};

class AlumniService {
  private alumni: Alumni[] = mockAlumniData;

  // Получить всех выпускников с фильтрацией
  async getAlumni(filters?: AlumniFilters): Promise<Alumni[]> {
    let filteredAlumni = [...this.alumni];

    if (filters) {
      // Поиск по имени
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.name.toLowerCase().includes(searchLower) ||
          alumni.surname.toLowerCase().includes(searchLower) ||
          alumni.graduationClass.toLowerCase().includes(searchLower) ||
          alumni.currentUniversity?.toLowerCase().includes(searchLower) ||
          alumni.currentCountry?.toLowerCase().includes(searchLower)
        );
      }

      // Фильтр по году выпуска
      if (filters.graduationYear) {
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.graduationYear === filters.graduationYear
        );
      }

      // Фильтр по статусу
      if (filters.status) {
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.status === filters.status
        );
      }

      // Фильтр по стране
      if (filters.country) {
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.currentCountry === filters.country
        );
      }

      // Фильтр по направлению
      if (filters.track) {
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.track === filters.track
        );
      }

      // Сортировка
      if (filters.sortBy) {
        filteredAlumni.sort((a, b) => {
          let aValue: string | number = '';
          let bValue: string | number = '';

          switch (filters.sortBy) {
            case 'name':
              aValue = `${a.surname} ${a.name}`;
              bValue = `${b.surname} ${b.name}`;
              break;
            case 'graduationDate':
              aValue = new Date(a.graduationDate).getTime();
              bValue = new Date(b.graduationDate).getTime();
              break;
            case 'university':
              aValue = a.currentUniversity || '';
              bValue = b.currentUniversity || '';
              break;
            case 'country':
              aValue = a.currentCountry || '';
              bValue = b.currentCountry || '';
              break;
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.sortOrder === 'desc' 
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          } else {
            return filters.sortOrder === 'desc' 
              ? (bValue as number) - (aValue as number)
              : (aValue as number) - (bValue as number);
          }
        });
      }
    }

    return filteredAlumni;
  }

  // Получить выпускника по ID
  async getAlumniById(id: number): Promise<Alumni | null> {
    return this.alumni.find(alumni => alumni.id === id) || null;
  }

  // Получить статистику
  async getAlumniStats(): Promise<AlumniStats> {
    const totalAlumni = this.alumni.length;
    
    // Статистика по годам
    const yearCounts = this.alumni.reduce((acc, alumni) => {
      acc[alumni.graduationYear] = (acc[alumni.graduationYear] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const byYear = Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);

    // Статистика по странам
    const countryCounts = this.alumni.reduce((acc, alumni) => {
      if (alumni.currentCountry) {
        acc[alumni.currentCountry] = (acc[alumni.currentCountry] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const byCountry = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Статистика по направлениям
    const trackCounts = this.alumni.reduce((acc, alumni) => {
      if (alumni.track) {
        acc[alumni.track] = (acc[alumni.track] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const byTrack = Object.entries(trackCounts)
      .map(([track, count]) => ({ track, count }))
      .sort((a, b) => b.count - a.count);

    // Статистика учебы за рубежом
    const studyingAbroad = this.alumni.filter(alumni => 
      alumni.currentCountry && alumni.currentCountry !== 'Казахстан'
    ).length;
    
    const studyingInKazakhstan = this.alumni.filter(alumni => 
      alumni.currentCountry === 'Казахстан'
    ).length;

    return {
      totalAlumni,
      byYear,
      byCountry,
      byTrack,
      studyingAbroad,
      studyingInKazakhstan
    };
  }

  // Получить уникальные годы выпуска
  async getGraduationYears(): Promise<number[]> {
    const years = [...new Set(this.alumni.map(alumni => alumni.graduationYear))];
    return years.sort((a, b) => b - a);
  }

  // Получить уникальные страны
  async getCountries(): Promise<string[]> {
    const countries = [...new Set(this.alumni
      .map(alumni => alumni.currentCountry)
      .filter(Boolean))] as string[];
    return countries.sort();
  }

  // Получить уникальные направления
  async getTracks(): Promise<string[]> {
    const tracks = [...new Set(this.alumni
      .map(alumni => alumni.track)
      .filter(Boolean))] as string[];
    return tracks.sort();
  }

  // Получить данные для карты мира
  async getWorldMapData(): Promise<WorldMapData> {
    return mockWorldMapData;
  }

  // Обновить данные выпускника
  async updateAlumni(id: number, updates: Partial<Alumni>): Promise<Alumni | null> {
    const index = this.alumni.findIndex(alumni => alumni.id === id);
    if (index === -1) return null;

    this.alumni[index] = {
      ...this.alumni[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.alumni[index];
  }
}

export const alumniService = new AlumniService();
