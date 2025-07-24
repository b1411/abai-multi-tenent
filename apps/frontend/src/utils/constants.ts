/**
 * Константы приложения
 */

// API константы
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_TIMEOUT = 30000; // 30 секунд

// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  HR: 'HR',
  FINANCIST: 'FINANCIST'
} as const;

// Статусы
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
  PUBLISHED: 'published'
} as const;

// Размеры файлов
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 20 * 1024 * 1024 // 20MB
};

// Типы файлов
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg']
};

// Цвета темы
export const COLORS = {
  PRIMARY: '#ca181f',
  SECONDARY: '#f5f5f5',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6'
} as const;

// Размеры экранов
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
} as const;

// Локальное хранилище ключи
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings'
} as const;

// Настройки пагинации
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
} as const;

// Форматы дат
export const DATE_FORMATS = {
  SHORT: 'DD.MM.YYYY',
  LONG: 'DD MMMM YYYY',
  WITH_TIME: 'DD.MM.YYYY HH:mm',
  TIME_ONLY: 'HH:mm'
} as const;

// Валюты
export const CURRENCIES = {
  KZT: 'KZT',
  USD: 'USD',
  EUR: 'EUR',
  RUB: 'RUB'
} as const;

// Языки
export const LANGUAGES = {
  RU: 'ru',
  KZ: 'kz',
  EN: 'en'
} as const;

// Уровни логирования
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// Типы уведомлений
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Дни недели
export const DAYS_OF_WEEK = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0
} as const;

// Академические периоды
export const ACADEMIC_PERIODS = {
  QUARTER_1: 'Q1',
  QUARTER_2: 'Q2',
  QUARTER_3: 'Q3',
  QUARTER_4: 'Q4',
  SEMESTER_1: 'S1',
  SEMESTER_2: 'S2',
  YEAR: 'YEAR'
} as const;

// Типы оценок
export const GRADE_TYPES = {
  NUMERIC: 'numeric', // 1-5
  LETTER: 'letter', // A, B, C, D, F
  PERCENT: 'percent', // 0-100%
  PASS_FAIL: 'pass_fail' // Зачет/Незачет
} as const;

// Приоритеты задач
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Статусы платежей
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

// Регулярные выражения
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+?7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
  IIN: /^\d{12}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Вы не авторизованы. Пожалуйста, войдите в систему.',
  FORBIDDEN: 'У вас нет прав для выполнения этого действия.',
  NOT_FOUND: 'Запрашиваемый ресурс не найден.',
  SERVER_ERROR: 'Внутренняя ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Ошибка валидации данных.',
  TIMEOUT: 'Время ожидания истекло. Попробуйте позже.'
} as const;
