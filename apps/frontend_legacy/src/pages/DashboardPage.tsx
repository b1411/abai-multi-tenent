/**
 * @page DashboardPage
 * @description Главная страница системы с виджетами и общей статистикой
 * @author Бурабай Диас
 * @last_updated 2024-03-23
 * 
 * @backend_requirements
 * 
 * 1. API Endpoints:
 * 
 * GET /api/v1/dashboard/stats
 * - Получение общей статистики для дашборда
 * - Параметры запроса:
 *   - period?: 'day' | 'week' | 'month' | 'year'
 *   - startDate?: string (YYYY-MM-DD)
 *   - endDate?: string (YYYY-MM-DD)
 * 
 * GET /api/v1/dashboard/widgets
 * - Получение списка доступных виджетов и их настроек
 * - Параметры запроса:
 *   - userId: string
 *   - role: string
 * 
 * PUT /api/v1/dashboard/widgets/layout
 * - Сохранение расположения виджетов
 * - Body:
 *   - userId: string
 *   - layout: Array<{
 *       id: string;
 *       x: number;
 *       y: number;
 *       w: number;
 *       h: number;
 *     }>
 * 
 * GET /api/v1/dashboard/notifications
 * - Получение уведомлений для дашборда
 * - Параметры запроса:
 *   - limit?: number
 *   - offset?: number
 *   - type?: 'system' | 'academic' | 'financial'
 * 
 * 2. Модели данных:
 * 
 * interface DashboardStats {
 *   students: {
 *     total: number;
 *     active: number;
 *     newToday: number;
 *     attendance: number;
 *   };
 *   teachers: {
 *     total: number;
 *     present: number;
 *     substitutions: number;
 *   };
 *   classes: {
 *     total: number;
 *     today: number;
 *     completed: number;
 *     upcoming: number;
 *   };
 *   finances: {
 *     monthlyRevenue: number;
 *     outstandingPayments: number;
 *     projectedIncome: number;
 *   };
 * }
 * 
 * interface Widget {
 *   id: string;
 *   type: string;
 *   title: string;
 *   settings: {
 *     refreshInterval?: number;
 *     dataSource?: string;
 *     display?: {
 *       type: 'chart' | 'table' | 'metric';
 *       options?: any;
 *     };
 *   };
 *   layout: {
 *     x: number;
 *     y: number;
 *     w: number;
 *     h: number;
 *   };
 * }
 * 
 * interface Notification {
 *   id: string;
 *   type: 'system' | 'academic' | 'financial';
 *   title: string;
 *   message: string;
 *   severity: 'info' | 'warning' | 'error';
 *   timestamp: string;
 *   read: boolean;
 *   actionUrl?: string;
 * }
 * 
 * 3. Интеграции:
 * - Система уведомлений для real-time обновлений
 * - Система аналитики для сбора метрик
 * - Система авторизации для проверки прав доступа
 * 
 * 4. Требования к безопасности:
 * - Проверка прав доступа к виджетам
 * - Фильтрация данных по роли пользователя
 * - Защита от XSS в уведомлениях
 * - Rate limiting для API endpoints
 * 
 * 5. Кэширование:
 * - Кэширование общей статистики на 5 минут
 * - Кэширование настроек виджетов на 1 час
 * - Кэширование расположения виджетов на 24 часа
 * 
 * 6. WebSocket события:
 * - dashboard:stats:update - обновление статистики
 * - dashboard:notification:new - новое уведомление
 * - dashboard:widget:update - обновление данных виджета
 * 
 * 7. Дополнительные требования:
 * - Поддержка динамического добавления виджетов
 * - Автоматическое обновление данных
 * - Экспорт данных в Excel/PDF
 * - Поддержка мобильной версии
 * - Персонализация дашборда для каждого пользователя
 */

import React from 'react';
import {
  FaGraduationCap,
  FaBook,
  FaTrophy,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaBrain,
  FaUsers,
  FaChartLine,
} from 'react-icons/fa';
import {
  ClassPerformanceWidget,
  CurriculumProgressWidget,
  TopStudentsWidget,
  TeacherActivityWidget,
  AttendanceTrendsWidget,
} from '../components/widgets/EducationWidgets';
import {
  WeeklyIncomeWidget,
  ClassDebtsWidget,
  AIRevenueWidget,
  SalaryFundWidget,
  ExpenseDeviationsWidget,
} from '../components/widgets/FinanceWidgets';
import { useLanguage } from '../hooks/useLanguage';

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaGraduationCap className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('classPerformance')}</h3>
            </div>
            <ClassPerformanceWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaBook className="text-green-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('curriculumProgress')}</h3>
            </div>
            <CurriculumProgressWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaTrophy className="text-yellow-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('topStudents')}</h3>
            </div>
            <TopStudentsWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaChalkboardTeacher className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('teacherActivity')}</h3>
            </div>
            <TeacherActivityWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaUserGraduate className="text-indigo-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('attendanceTrends')}</h3>
            </div>
            <AttendanceTrendsWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaMoneyBillWave className="text-green-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('weeklyIncome')}</h3>
            </div>
            <WeeklyIncomeWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-red-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('classDebts')}</h3>
            </div>
            <ClassDebtsWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaBrain className="text-purple-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('aiRevenue')}</h3>
            </div>
            <AIRevenueWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaUsers className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('salaryFund')}</h3>
            </div>
            <SalaryFundWidget />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaChartLine className="text-orange-500 mr-2" size={20} />
              <h3 className="text-lg font-medium">{t('expenseDeviations')}</h3>
            </div>
            <ExpenseDeviationsWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 