import { Alumni, AlumniFilters, AlumniStats, AlumniStatus } from '../types/alumni';

// Mock данные для демонстрации
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
    groupName: 'ИС-20-1',
    status: AlumniStatus.ACTIVE,
    currentJob: 'Software Developer',
    currentCompany: 'Tech Solutions KZ',
    industry: 'IT',
    linkedin: 'linkedin.com/in/aliya-nurlanova',
    gpa: 3.8,
    achievements: ['Красный диплом', 'Лучший студент года 2023'],
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
    groupName: 'ФМ-19-2',
    status: AlumniStatus.ACTIVE,
    currentJob: 'Data Analyst',
    currentCompany: 'Analytics Pro',
    industry: 'Finance',
    linkedin: 'linkedin.com/in/daniyar-tuleuov',
    gpa: 3.6,
    achievements: ['Стипендиат президента'],
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
    groupName: 'БИ-18-1',
    status: AlumniStatus.ACTIVE,
    currentJob: 'Business Analyst',
    currentCompany: 'Consulting Group',
    industry: 'Consulting',
    gpa: 3.9,
    achievements: ['Отличник учебы', 'Активист года'],
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
    groupName: 'ИС-21-3',
    status: AlumniStatus.ACTIVE,
    currentJob: 'Junior Developer',
    currentCompany: 'StartUp Hub',
    industry: 'IT',
    gpa: 3.7,
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
    groupName: 'ЭК-17-2',
    status: AlumniStatus.INACTIVE,
    gpa: 3.5,
    createdAt: '2020-06-25T10:00:00Z',
    updatedAt: '2020-06-25T10:00:00Z'
  }
];

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
          alumni.groupName.toLowerCase().includes(searchLower) ||
          alumni.currentCompany?.toLowerCase().includes(searchLower)
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

      // Фильтр по индустрии
      if (filters.industry) {
        filteredAlumni = filteredAlumni.filter(alumni =>
          alumni.industry === filters.industry
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
            case 'company':
              aValue = a.currentCompany || '';
              bValue = b.currentCompany || '';
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

    // Статистика по индустриям
    const industryCounts = this.alumni.reduce((acc, alumni) => {
      if (alumni.industry) {
        acc[alumni.industry] = (acc[alumni.industry] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const byIndustry = Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count);

    // Средний GPA
    const gpaSum = this.alumni
      .filter(alumni => alumni.gpa)
      .reduce((sum, alumni) => sum + (alumni.gpa || 0), 0);
    const averageGpa = gpaSum / this.alumni.filter(alumni => alumni.gpa).length;

    // Процент трудоустройства
    const employedCount = this.alumni.filter(alumni => alumni.currentCompany).length;
    const employmentRate = (employedCount / totalAlumni) * 100;

    return {
      totalAlumni,
      byYear,
      byIndustry,
      averageGpa: Math.round(averageGpa * 100) / 100,
      employmentRate: Math.round(employmentRate)
    };
  }

  // Получить уникальные годы выпуска
  async getGraduationYears(): Promise<number[]> {
    const years = [...new Set(this.alumni.map(alumni => alumni.graduationYear))];
    return years.sort((a, b) => b - a);
  }

  // Получить уникальные индустрии
  async getIndustries(): Promise<string[]> {
    const industries = [...new Set(this.alumni
      .map(alumni => alumni.industry)
      .filter(Boolean))] as string[];
    return industries.sort();
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
