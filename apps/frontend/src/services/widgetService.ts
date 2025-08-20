import apiClient from './apiClient';
import { Widget, WidgetType, DashboardLayout, WidgetTemplate, getAvailableWidgetsForRole, UserRole, WIDGET_SIZES } from '../types/widget';

class WidgetService {
  // Get user's widgets
  async getUserWidgets(): Promise<Widget[]> {
    try {
      const response = await apiClient.get<Widget[]>('/dashboard/widgets');
      return response;
    } catch (error) {
      console.error('Error fetching user widgets:', error);
      // Return empty array for now, later we'll implement proper error handling
      return [];
    }
  }

  // Save widget layout
  async saveWidgetLayout(widgets: Widget[]): Promise<void> {
    try {
      await apiClient.put('/dashboard/layout', { widgets });
    } catch (error) {
      console.error('Error saving widget layout:', error);
      // For now, save to localStorage as fallback
      localStorage.setItem('widgetLayout', JSON.stringify(widgets));
    }
  }

  // Get available widgets for user role
  async getAvailableWidgets(userRole: UserRole): Promise<WidgetTemplate[]> {
    try {
      // For now, return templates based on role
      // Later this can be extended to fetch from backend with dynamic permissions
      return getAvailableWidgetsForRole(userRole);
    } catch (error) {
      console.error('Error fetching available widgets:', error);
      return [];
    }
  }

  // Add new widget
  async addWidget(widgetType: WidgetType, userId: string): Promise<Widget> {
    const widget: Widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      title: this.getDefaultTitle(widgetType),
      size: this.getDefaultSize(widgetType),
      position: { x: 0, y: 0, width: 2, height: 1 }, // Will be adjusted by grid system
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await apiClient.post<Widget>('/dashboard/widgets', widget);
      return response;
    } catch (error) {
      console.error('Error adding widget:', error);
      // Return local widget for now
      return widget;
    }
  }

  // Update widget
  async updateWidget(widget: Widget): Promise<Widget> {
    try {
      const updatedWidget = {
        ...widget,
        updatedAt: new Date().toISOString()
      };

      const response = await apiClient.put<Widget>(`/dashboard/widgets/${widget.id}`, updatedWidget);
      return response;
    } catch (error) {
      console.error('Error updating widget:', error);
      return widget;
    }
  }

  // Delete widget
  async deleteWidget(widgetId: string): Promise<void> {
    try {
      await apiClient.delete(`/dashboard/widgets/${widgetId}`);
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  }

  // Get dashboard layout
  async getDashboardLayout(userId: string): Promise<DashboardLayout | null> {
    try {
  // Backend exposes GET /dashboard/layout (without :userId). Using userId only for fallback/local mapping.
  const response = await apiClient.get<DashboardLayout>(`/dashboard/layout`);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);

      // Try to get from localStorage as fallback
      const saved = localStorage.getItem('widgetLayout');
      if (saved) {
        const widgets = JSON.parse(saved);
        return {
          userId,
          widgets,
          gridSettings: { columns: 4, gap: 4 },
          updatedAt: new Date().toISOString()
        };
      }

      return null;
    }
  }

  // Save dashboard layout
  async saveDashboardLayout(layout: DashboardLayout): Promise<void> {
    try {
      await apiClient.put('/dashboard/layout', layout);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      // Save to localStorage as fallback
      localStorage.setItem('widgetLayout', JSON.stringify(layout.widgets));
    }
  }

  // Get widget data
  async getWidgetData(widgetType: WidgetType, config?: any): Promise<any> {
    try {
      const url = config ?
        `/dashboard/widget-data/${widgetType}?${new URLSearchParams(config)}` :
        `/dashboard/widget-data/${widgetType}`;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error(`Error fetching data for widget ${widgetType}:`, error);
      // Return mock data as fallback
      return this.getMockWidgetData(widgetType);
    }
  }

  // Helper methods
  private getDefaultTitle(widgetType: WidgetType): string {
    const titles: Partial<Record<WidgetType, string>> = {
      // Student widgets
      'schedule': 'Мое расписание',
      'assignments': 'Домашние задания',
      'grades': 'Мои оценки',
      'attendance': 'Посещаемость',
      'calendar': 'Календарь',
      'news': 'Новости',
      'tasks': 'Задачи',

      // Teacher widgets
      'teacher-schedule': 'Мои уроки',
      'my-groups': 'Мои группы',
      'journal': 'Журнал',
      'homework-check': 'Проверка заданий',
      'classroom-status': 'Статус кабинетов',
      'teacher-calendar': 'Календарь учителя',
      'group-stats': 'Статистика групп',
      'materials': 'Материалы',

      // Admin widgets
      'system-stats': 'Системная статистика',
      'finance-overview': 'Финансы',
      'system-alerts': 'Системные уведомления',
      'school-attendance': 'Посещаемость школы',
      'teacher-workload': 'Нагрузка учителей',
      'classroom-usage': 'Использование кабинетов',
      'grade-analytics': 'Аналитика оценок',
      'admin-calendar': 'Календарь администратора',
      'system-monitoring': 'Мониторинг системы',

      // Parent widgets
      'child-grades': 'Оценки ребенка',
      'child-schedule': 'Расписание ребенка',
      'child-attendance': 'Посещаемость ребенка',
      'child-homework': 'Домашние задания',
      'school-events': 'Школьные события',
      'payments': 'Платежи',
      'teacher-messages': 'Сообщения от учителей',
      'parent-calendar': 'Родительский календарь',

      // Financist widgets
      'finance-summary': 'Финансовая сводка',
      'debts': 'Задолженности',
      'daily-payments': 'Платежи за день',
      'budget': 'Бюджет',
      'salaries': 'Зарплаты',
      'payment-analytics': 'Аналитика платежей',
      'bills': 'Счета к оплате',
      'finance-calendar': 'Финансовый календарь',

      // HR widgets
      'staff-overview': 'Обзор персонала',
      'vacations': 'Отпуска',
      'sick-leaves': 'Больничные',
      'teacher-load': 'Нагрузка учителей',
      'vacancies': 'Вакансии',
      'birthdays': 'Дни рождения',
      'hr-calendar': 'HR календарь',
      'hr-documents': 'HR документы'
    };

    return titles[widgetType] || 'Виджет';
  }

  private getDefaultSize(widgetType: WidgetType): 'small' | 'medium' | 'large' {
    // Define default sizes for different widget types
    const smallWidgets: WidgetType[] = ['grades', 'attendance'];
    const largeWidgets: WidgetType[] = ['journal', 'system-monitoring', 'grade-analytics'];

    if (smallWidgets.includes(widgetType)) return 'small';
    if (largeWidgets.includes(widgetType)) return 'large';
    return 'medium';
  }

  private getMockWidgetData(widgetType: WidgetType): any {
    // Mock data for development - TODO: Replace with real API data
    const mockData: Partial<Record<WidgetType, any>> = {
      // Student widgets
      'schedule': {
        lessons: [
          { id: 1, subject: 'Математика', time: '09:00-10:30', classroom: 'А-101', teacher: 'Кенесарова А.М.' },
          { id: 2, subject: 'Физика', time: '11:00-12:30', classroom: 'Б-205', teacher: 'Байжанов К.С.' }
        ]
      },
      'grades': {
        averageGrade: 4.2,
        recentGrades: [
          { subject: 'Математика', grade: 5, date: '2025-01-27', teacher: 'Кенесарова А.М.' },
          { subject: 'Физика', grade: 4, date: '2025-01-26', teacher: 'Байжанов К.С.' }
        ]
      },
      'assignments': {
        assignments: [
          { id: 1, title: 'Решение квадратных уравнений', dueDate: '2025-01-30', subject: 'Математика', teacher: 'Кенесарова А.М.' },
          { id: 2, title: 'Лабораторная работа по механике', dueDate: '2025-02-01', subject: 'Физика', teacher: 'Байжанов К.С.' }
        ]
      },
      'attendance': {
        percentage: 95,
        totalClasses: 20,
        attended: 19
      },

      // Admin widgets - Основные
      'system-stats': {
        totalStudents: 1247,
        totalTeachers: 87,
        totalGroups: 42,
        totalSubjects: 18,
        activeUsers: 956,
        systemUptime: '99.8%'
      },
      'finance-overview': {
        totalRevenue: 125000000, // тенге
        totalExpenses: 89000000,
        netProfit: 36000000,
        unpaidFees: 5600000,
        monthlyGrowth: 8.5
      },
      'system-alerts': {
        critical: 2,
        warnings: 7,
        info: 15,
        alerts: [
          { id: 1, type: 'critical', message: 'Низкое место на диске сервера БД', time: '2025-01-28 14:30' },
          { id: 2, type: 'warning', message: 'Высокая нагрузка на сервер в часы пик', time: '2025-01-28 13:45' },
          { id: 3, type: 'info', message: 'Запланировано обновление системы', time: '2025-01-28 12:00' }
        ]
      },
      'school-attendance': {
        overall: 92.3,
        trend: '+2.1%',
        trendDirection: 'up',
        byGrade: [
          { grade: '1-й класс', attendance: 94.2, students: 156 },
          { grade: '2-й класс', attendance: 93.8, students: 148 },
          { grade: '3-й класс', attendance: 91.5, students: 142 },
          { grade: '4-й класс', attendance: 90.1, students: 139 },
          { grade: '5-й класс', attendance: 89.7, students: 134 },
          { grade: '6-й класс', attendance: 88.9, students: 127 }
        ],
        today: {
          present: 1087,
          absent: 95,
          late: 23,
          total: 1205
        },
        weeklyTrend: [
          { day: 'Пн', percentage: 89.2 },
          { day: 'Вт', percentage: 91.5 },
          { day: 'Ср', percentage: 93.1 },
          { day: 'Чт', percentage: 92.7 },
          { day: 'Пт', percentage: 88.4 }
        ]
      },
      'teacher-workload': {
        averageHours: 24.5,
        totalTeachers: 87,
        overloadedTeachers: 12,
        underloadedTeachers: 8,
        teachers: [
          {
            name: 'Аманжолова Г.К.',
            hours: 28,
            subjects: ['Математика', 'Алгебра'],
            groups: 6,
            status: 'overloaded'
          },
          {
            name: 'Султанов Д.Б.',
            hours: 22,
            subjects: ['История', 'Обществознание'],
            groups: 4,
            status: 'normal'
          },
          {
            name: 'Жумабекова С.А.',
            hours: 26,
            subjects: ['Казахский язык', 'Литература'],
            groups: 5,
            status: 'optimal'
          },
          {
            name: 'Кенесарова А.М.',
            hours: 18,
            subjects: ['Физика'],
            groups: 3,
            status: 'underloaded'
          },
          {
            name: 'Байжанов К.С.',
            hours: 25,
            subjects: ['Химия', 'Биология'],
            groups: 5,
            status: 'optimal'
          },
          {
            name: 'Нурланова Т.И.',
            hours: 30,
            subjects: ['Английский язык'],
            groups: 8,
            status: 'overloaded'
          }
        ],
        distribution: {
          overloaded: 12,
          optimal: 45,
          underloaded: 30
        }
      },
      'classroom-usage': {
        totalRooms: 45,
        occupiedRooms: 32,
        freeRooms: 13,
        utilizationRate: 71.1,
        rooms: [
          {
            number: 'А-101',
            status: 'occupied',
            subject: 'Математика',
            teacher: 'Аманжолова Г.К.',
            group: '10А',
            timeLeft: '25 мин',
            nextClass: '14:00 - Физика'
          },
          {
            number: 'Б-205',
            status: 'occupied',
            subject: 'История',
            teacher: 'Султанов Д.Б.',
            group: '9Б',
            timeLeft: '15 мин',
            nextClass: '14:00 - Химия'
          },
          {
            number: 'В-301',
            status: 'free',
            nextClass: '14:00 - Английский',
            teacher: 'Нурланова Т.И.',
            group: '8А'
          },
          {
            number: 'Г-102',
            status: 'occupied',
            subject: 'Физика',
            teacher: 'Кенесарова А.М.',
            group: '11А',
            timeLeft: '35 мин',
            nextClass: '15:00 - Математика'
          },
          {
            number: 'А-203',
            status: 'free',
            nextClass: '15:00 - Литература',
            teacher: 'Жумабекова С.А.',
            group: '10Б'
          },
          {
            number: 'Б-104',
            status: 'occupied',
            subject: 'Химия',
            teacher: 'Байжанов К.С.',
            group: '9А',
            timeLeft: '45 мин',
            nextClass: '16:00 - Биология'
          }
        ],
        floors: [
          { floor: '1 этаж', total: 15, occupied: 11, utilization: 73.3 },
          { floor: '2 этаж', total: 18, occupied: 13, utilization: 72.2 },
          { floor: '3 этаж', total: 12, occupied: 8, utilization: 66.7 }
        ]
      },
      'grade-analytics': {
        averageGrade: 4.1,
        gradeDistribution: [
          { grade: '5', count: 312, percentage: 25.0 },
          { grade: '4', count: 458, percentage: 36.7 },
          { grade: '3', count: 387, percentage: 31.0 },
          { grade: '2', count: 90, percentage: 7.3 }
        ],
        topSubjects: [
          { subject: 'Физкультура', average: 4.8 },
          { subject: 'Искусство', average: 4.6 },
          { subject: 'Математика', average: 4.2 }
        ]
      },
      'admin-calendar': {
        events: [
          { id: 1, title: 'Педсовет', date: '2025-01-29', time: '15:00', type: 'meeting' },
          { id: 2, title: 'Родительское собрание 5А', date: '2025-01-30', time: '18:00', type: 'parent-meeting' },
          { id: 3, title: 'Контрольная неделя', date: '2025-02-03', time: '08:00', type: 'exam' }
        ]
      },
      'system-monitoring': {
        serverStatus: 'healthy',
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 82.1,
        networkLatency: 12,
        activeConnections: 1024,
        services: [
          { name: 'Web Server', status: 'running', uptime: '15 дней' },
          { name: 'Database', status: 'running', uptime: '30 дней' },
          { name: 'File Storage', status: 'warning', uptime: '2 дня' }
        ]
      },

      // Admin widgets - Академические
      'academic-performance': {
        overallGPA: 4.15,
        passRate: 94.2,
        excellentStudents: 187,
        atRiskStudents: 43,
        trends: {
          thisMonth: 4.15,
          lastMonth: 4.08,
          change: '+0.07'
        },
        topPerformers: [
          { name: 'Нурланова А.С.', grade: '10А', gpa: 4.93 },
          { name: 'Абишев Т.К.', grade: '11Б', gpa: 4.89 },
          { name: 'Жанатова М.Е.', grade: '9В', gpa: 4.85 }
        ]
      },
      'student-enrollment': {
        totalEnrolled: 1247,
        newStudents: 89,
        transfers: 12,
        graduates: 156,
        dropouts: 3,
        enrollmentTrend: [
          { month: 'Сентябрь', count: 1158 },
          { month: 'Октябрь', count: 1172 },
          { month: 'Ноябрь', count: 1189 },
          { month: 'Декабрь', count: 1201 },
          { month: 'Январь', count: 1247 }
        ]
      },
      'exam-results': {
        totalExams: 342,
        averageScore: 81.4,
        passRate: 92.7,
        results: [
          { subject: 'Математика', average: 85.2, passRate: 94.1 },
          { subject: 'Физика', average: 78.9, passRate: 89.3 },
          { subject: 'Химия', average: 82.1, passRate: 91.2 },
          { subject: 'История', average: 84.7, passRate: 95.8 }
        ]
      },

      // Универсальные виджеты
      'news': {
        articles: [
          { id: 1, title: 'Новые достижения наших учеников в олимпиаде', content: 'Команда школы заняла призовые места...', date: '2025-01-27', author: 'Администрация' },
          { id: 2, title: 'Объявление о родительском собрании', content: 'Уважаемые родители, приглашаем вас...', date: '2025-01-26', author: 'Классные руководители' }
        ]
      },
      'tasks': {
        tasks: [
          { id: 1, title: 'Подготовить отчет по успеваемости', completed: false, dueDate: '2025-01-30', priority: 'high' },
          { id: 2, title: 'Согласовать расписание на следующую неделю', completed: true, dueDate: '2025-01-28', priority: 'medium' }
        ]
      }
    };

    return mockData[widgetType] || { message: 'Данные загружаются...', note: 'TODO: Подключить к API' };
  }
}

export default new WidgetService();
