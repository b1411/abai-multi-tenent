import apiClient from './apiClient';
import { Widget, WidgetType, DashboardLayout, WidgetTemplate, getAvailableWidgetsForRole, UserRole, WIDGET_SIZES, WidgetDimensions } from '../types/widget';

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
      throw error; // Re-throw error instead of returning mock data
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

  private getDefaultSize(widgetType: WidgetType): WidgetDimensions {
    // Get template for this widget type to use its defaultSize
    const templates = getAvailableWidgetsForRole('ADMIN'); // Use admin to get all templates
    const template = templates.find(t => t.type === widgetType);

    if (template) {
      return template.defaultSize;
    }

    // Fallback for widgets without templates
    return { width: 'medium', height: 'medium' };
  }
}

export default new WidgetService();
