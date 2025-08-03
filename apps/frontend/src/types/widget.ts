export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT' | 'FINANCIST' | 'HR';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: Position;
  data?: any;
  config?: WidgetConfig;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType = 
  // Student widgets
  | 'schedule' 
  | 'assignments' 
  | 'grades' 
  | 'attendance' 
  | 'calendar' 
  | 'news' 
  | 'tasks'
  // Teacher widgets
  | 'teacher-schedule'
  | 'my-groups'
  | 'journal'
  | 'homework-check'
  | 'classroom-status'
  | 'teacher-calendar'
  | 'group-stats'
  | 'materials'
  // Admin widgets - Основные
  | 'system-stats'
  | 'finance-overview'
  | 'system-alerts'
  | 'school-attendance'
  | 'teacher-workload'
  | 'classroom-usage'
  | 'grade-analytics'
  | 'admin-calendar'
  | 'system-monitoring'
  // Admin widgets - Академические
  | 'academic-performance'
  | 'student-enrollment'
  | 'class-schedules'
  | 'exam-results'
  | 'homework-completion'
  | 'lesson-analytics'
  | 'curriculum-progress'
  | 'subject-statistics'
  // Admin widgets - Персонал
  | 'staff-overview'
  | 'teacher-performance'
  | 'staff-attendance'
  | 'payroll-summary'
  | 'recruitment-status'
  | 'staff-training'
  | 'performance-reviews'
  | 'substitution-requests'
  // Admin widgets - Финансы
  | 'budget-overview'
  | 'revenue-tracking'
  | 'expense-analysis'
  | 'payment-status'
  | 'financial-forecasts'
  | 'invoice-management'
  | 'fund-allocation'
  | 'cost-per-student'
  // Admin widgets - Инфраструктура
  | 'facility-utilization'
  | 'equipment-status'
  | 'maintenance-alerts'
  | 'resource-allocation'
  | 'inventory-levels'
  | 'supply-requests'
  | 'energy-consumption'
  | 'safety-incidents'
  // Admin widgets - Коммуникации
  | 'parent-engagement'
  | 'communication-stats'
  | 'feedback-summary'
  | 'announcement-reach'
  | 'support-tickets'
  | 'chat-activity'
  | 'notification-delivery'
  | 'community-events'
  // Admin widgets - Технологии
  | 'system-performance'
  | 'user-activity'
  | 'security-logs'
  | 'backup-status'
  | 'integration-health'
  | 'ai-assistant-usage'
  | 'neuro-abai-stats'
  | 'digital-adoption'
  // Admin widgets - Аналитика
  | 'kpi-dashboard'
  | 'trend-analysis'
  | 'comparative-reports'
  | 'predictive-insights'
  | 'performance-metrics'
  | 'benchmark-comparison'
  | 'goal-tracking'
  | 'success-indicators'
  // Admin widgets - Безопасность
  | 'security-overview'
  | 'access-control'
  | 'incident-reports'
  | 'compliance-status'
  | 'emergency-alerts'
  | 'visitor-tracking'
  | 'biometric-logs'
  | 'surveillance-status'
  // Admin widgets - Специальные
  | 'loyalty-program'
  | 'branding-metrics'
  | 'document-workflow'
  | 'activity-monitoring'
  | 'fake-positions'
  | 'jas-life-engagement'
  | 'news-management'
  | 'vacation-calendar'
  // Parent widgets
  | 'child-grades'
  | 'child-schedule'
  | 'child-attendance'
  | 'child-homework'
  | 'school-events'
  | 'payments'
  | 'teacher-messages'
  | 'parent-calendar'
  // Financist widgets
  | 'finance-summary'
  | 'debts'
  | 'daily-payments'
  | 'budget'
  | 'salaries'
  | 'payment-analytics'
  | 'bills'
  | 'finance-calendar'
  // HR widgets
  | 'staff-overview'
  | 'vacations'
  | 'sick-leaves'
  | 'teacher-load'
  | 'vacancies'
  | 'birthdays'
  | 'hr-calendar'
  | 'hr-documents'
  // Universal/utility widgets
  | 'weather';

export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetCategory = 'education' | 'management' | 'finance' | 'family' | 'system' | 'personal';

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetConfig {
  refreshInterval?: number;
  showHeader?: boolean;
  theme?: 'light' | 'dark';
  customSettings?: Record<string, any>;
}

export interface WidgetTemplate {
  type: WidgetType;
  title: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  defaultSize: WidgetSize;
  availableRoles: UserRole[];
  preview?: string;
}

export interface DashboardLayout {
  userId: string;
  widgets: Widget[];
  gridSettings: {
    columns: number;
    gap: number;
  };
  updatedAt: string;
}

// Widget configurations by role - matching backend RBAC
export const ROLE_WIDGETS: Record<UserRole, WidgetType[]> = {
  STUDENT: [
    'schedule', 
    'assignments', 
    'grades', 
    'attendance', 
    'tasks',
    'news',
    'weather'
  ],
  TEACHER: [
    'teacher-schedule', 
    'teacher-workload',
    'school-attendance',
    'grade-analytics',
    'classroom-usage',
    // All student widgets
    'schedule', 
    'assignments', 
    'grades', 
    'attendance', 
    'tasks',
    'news',
    'weather'
  ],
  ADMIN: [
    // Admin exclusive
    'system-stats', 
    'system-alerts', 
    'system-monitoring',
    'finance-overview',
    'activity-monitoring',
    'birthdays',
    // Shared with teachers
    'school-attendance', 
    'teacher-workload', 
    'classroom-usage', 
    'grade-analytics',
    // Universal
    'news',
    'tasks',
    'weather'
  ],
  PARENT: [
    'child-grades', 
    'child-schedule', 
    'child-attendance', 
    'child-homework',
    'news',
    'weather'
  ],
  FINANCIST: [
    'finance-overview',
    'news',
    'weather'
  ],
  HR: [
    'activity-monitoring',
    'teacher-workload',
    'birthdays',
    'news',
    'weather'
  ]
};

// Widget templates with metadata
export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // Student widgets
  {
    type: 'schedule',
    title: 'Мое расписание',
    description: 'Расписание занятий на сегодня и завтра',
    category: 'education',
    icon: 'Calendar',
    defaultSize: 'medium',
    availableRoles: ['STUDENT']
  },
  {
    type: 'assignments',
    title: 'Домашние задания',
    description: 'Невыполненные задания со сроками',
    category: 'education',
    icon: 'BookOpen',
    defaultSize: 'medium',
    availableRoles: ['STUDENT']
  },
  {
    type: 'grades',
    title: 'Мои оценки',
    description: 'Последние оценки и средний балл',
    category: 'education',
    icon: 'Star',
    defaultSize: 'small',
    availableRoles: ['STUDENT']
  },
  {
    type: 'attendance',
    title: 'Посещаемость',
    description: 'Процент посещения и пропуски',
    category: 'education',
    icon: 'CheckCircle',
    defaultSize: 'small',
    availableRoles: ['STUDENT']
  },

  // Teacher widgets
  {
    type: 'teacher-schedule',
    title: 'Мои уроки сегодня',
    description: 'Расписание с информацией о группах',
    category: 'education',
    icon: 'Calendar',
    defaultSize: 'medium',
    availableRoles: ['TEACHER']
  },
  {
    type: 'my-groups',
    title: 'Мои группы',
    description: 'Список групп с быстрым доступом',
    category: 'education',
    icon: 'Users',
    defaultSize: 'medium',
    availableRoles: ['TEACHER']
  },
  {
    type: 'journal',
    title: 'Журнал',
    description: 'Последние оценки и посещаемость учеников',
    category: 'education',
    icon: 'BookOpen',
    defaultSize: 'large',
    availableRoles: ['TEACHER']
  },

  // Admin widgets - Основные
  {
    type: 'system-stats',
    title: 'Общая статистика',
    description: 'Количество студентов, учителей, групп',
    category: 'management',
    icon: 'BarChart',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'finance-overview',
    title: 'Финансовые показатели',
    description: 'Доходы, расходы, задолженности',
    category: 'finance',
    icon: 'DollarSign',
    defaultSize: 'medium',
    availableRoles: ['ADMIN', 'FINANCIST']
  },
  {
    type: 'system-alerts',
    title: 'Системные уведомления',
    description: 'Критические уведомления и предупреждения',
    category: 'system',
    icon: 'AlertTriangle',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'school-attendance',
    title: 'Посещаемость школы',
    description: 'Общая статистика посещаемости по школе',
    category: 'education',
    icon: 'Users',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'teacher-workload',
    title: 'Нагрузка учителей',
    description: 'Распределение учебной нагрузки',
    category: 'management',
    icon: 'Clock',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'classroom-usage',
    title: 'Использование кабинетов',
    description: 'Занятость и расписание кабинетов',
    category: 'management',
    icon: 'Building',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'grade-analytics',
    title: 'Аналитика оценок',
    description: 'Анализ успеваемости по школе',
    category: 'education',
    icon: 'TrendingUp',
    defaultSize: 'large',
    availableRoles: ['ADMIN']
  },
  {
    type: 'admin-calendar',
    title: 'Календарь администратора',
    description: 'Важные события и мероприятия',
    category: 'management',
    icon: 'Calendar',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'system-monitoring',
    title: 'Мониторинг системы',
    description: 'Состояние серверов и производительность',
    category: 'system',
    icon: 'Monitor',
    defaultSize: 'large',
    availableRoles: ['ADMIN']
  },

  // Admin widgets - Академические
  {
    type: 'academic-performance',
    title: 'Академическая успеваемость',
    description: 'Общие показатели успеваемости по школе',
    category: 'education',
    icon: 'GraduationCap',
    defaultSize: 'large',
    availableRoles: ['ADMIN']
  },
  {
    type: 'student-enrollment',
    title: 'Зачисление студентов',
    description: 'Статистика поступления и выбытия',
    category: 'education',
    icon: 'UserPlus',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'class-schedules',
    title: 'Расписания классов',
    description: 'Обзор расписаний по всем классам',
    category: 'education',
    icon: 'Calendar',
    defaultSize: 'large',
    availableRoles: ['ADMIN']
  },
  {
    type: 'exam-results',
    title: 'Результаты экзаменов',
    description: 'Статистика экзаменационных оценок',
    category: 'education',
    icon: 'FileText',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'homework-completion',
    title: 'Выполнение домашних заданий',
    description: 'Статистика выполненных заданий',
    category: 'education',
    icon: 'CheckSquare',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'lesson-analytics',
    title: 'Аналитика уроков',
    description: 'Эффективность проведения уроков',
    category: 'education',
    icon: 'BookOpen',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'curriculum-progress',
    title: 'Прогресс по программе',
    description: 'Выполнение учебной программы',
    category: 'education',
    icon: 'Target',
    defaultSize: 'medium',
    availableRoles: ['ADMIN']
  },
  {
    type: 'subject-statistics',
    title: 'Статистика по предметам',
    description: 'Детальная аналитика по учебным предметам',
    category: 'education',
    icon: 'PieChart',
    defaultSize: 'large',
    availableRoles: ['ADMIN']
  },

  // Parent widgets
  {
    type: 'child-grades',
    title: 'Успеваемость ребенка',
    description: 'Оценки и динамика успеваемости',
    category: 'family',
    icon: 'TrendingUp',
    defaultSize: 'medium',
    availableRoles: ['PARENT']
  },
  {
    type: 'child-schedule',
    title: 'Расписание ребенка',
    description: 'Уроки на сегодня и завтра',
    category: 'family',
    icon: 'Clock',
    defaultSize: 'medium',
    availableRoles: ['PARENT']
  },

  // Universal widgets
  {
    type: 'news',
    title: 'Новости школы',
    description: 'Последние объявления и новости',
    category: 'personal',
    icon: 'Bell',
    defaultSize: 'medium',
    availableRoles: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'FINANCIST', 'HR']
  },
  {
    type: 'tasks',
    title: 'Задачи',
    description: 'Личные заметки и напоминания',
    category: 'personal',
    icon: 'CheckSquare',
    defaultSize: 'medium',
    availableRoles: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'FINANCIST', 'HR']
  },
  {
    type: 'weather',
    title: 'Погода',
    description: 'Текущая погода и прогноз',
    category: 'personal',
    icon: 'Cloud',
    defaultSize: 'small',
    availableRoles: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'FINANCIST', 'HR']
  },
  {
    type: 'birthdays',
    title: 'Дни рождения',
    description: 'Предстоящие дни рождения сотрудников',
    category: 'personal',
    icon: 'Gift',
    defaultSize: 'medium',
    availableRoles: ['HR', 'ADMIN']
  }
];

// Helper function to get available widgets for a role
export const getAvailableWidgetsForRole = (role: UserRole): WidgetTemplate[] => {
  return WIDGET_TEMPLATES.filter(widget => widget.availableRoles.includes(role));
};

// Helper function to get widget template by type
export const getWidgetTemplate = (type: WidgetType): WidgetTemplate | undefined => {
  return WIDGET_TEMPLATES.find(template => template.type === type);
};

// Default widget sizes in grid units
export const WIDGET_SIZES = {
  small: { width: 1, height: 1 },
  medium: { width: 2, height: 1 },
  large: { width: 2, height: 2 }
};
