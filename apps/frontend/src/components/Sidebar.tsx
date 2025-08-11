import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/api';
import StudentProfileWidget from './StudentProfileWidget';
import {
  Home,
  Users,
  BookOpen,
  Settings,
  LogOut,
  GraduationCap,
  ClipboardList,
  CreditCard,
  BarChart3,
  ChevronDown,
  TrendingUp,
  Calendar,
  Building,
  MessageSquare,
  Bot,
  List,
  Brain,
  FileText,
  DollarSign,
  Briefcase,
  Umbrella,
  UserX,
  Package,
  ShoppingCart,
  Lock,
  Palette,
  Cog,
  Heart,
  MessageCircle,
  X,
  FolderOpen,
  Plus,
  CheckCircle,
  Newspaper,
  Activity,
  Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasAnyRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    study: false,
    students: false,
    hr: false,
    finance: false,
    app: false,
    erp: false,
    edo: false,
    settings: false
  });

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const navigationItems = [
    {
      name: 'Главная',
      href: '/',
      icon: Home,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'Новости',
      href: '/news',
      icon: Newspaper,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'Приложение',
      icon: ClipboardList,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', "FINANCIST"],
      key: 'app',
      children: [
        { name: 'Чат', href: '/app/chat', icon: MessageSquare },
        { name: 'Чаты сотрудников', href: '/app/admin-chats', icon: Users, roles: ['ADMIN'] },
        { name: 'AI чат', href: '/app/ai-chat', icon: Bot, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Календарь', href: '/app/calendar', icon: Calendar },
        { name: 'Список дел', href: '/app/tasks', icon: List, roles: ['ADMIN', 'TEACHER', "FINANCIST", "HR"] },
        { name: 'Fizmat AI Ala', href: '/app/neuro-abai', icon: Brain, roles: ['ADMIN', 'TEACHER', "FINANCIST", "HR"] },
      ]
    },
    {
      name: 'Учебный процесс',
      icon: BookOpen,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
      key: 'study',
      children: [
        { name: 'Учебные планы', href: '/study-plans', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Уроки', href: '/lessons', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Домашние задания', href: '/homework', icon: ClipboardList, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Учебный журнал', href: '/academic/academic-journal', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
        { name: 'Расписание', href: '/academic/schedule', icon: Calendar, roles: ['ADMIN', 'TEACHER'] },
        { name: 'Аудитории', href: '/classrooms', icon: Building, roles: ['ADMIN', 'TEACHER'] },
        { name: 'Отчеты', href: '/educational-reports', icon: BarChart3, roles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      name: 'Студенты',
      icon: Users,
      roles: ['ADMIN', 'TEACHER', 'HR', 'STUDENT', 'PARENT'],
      key: 'students',
      children: [
        { name: 'Списки учащихся', href: '/students', icon: GraduationCap, roles: ['ADMIN', 'TEACHER', 'HR'] },
        { name: 'Мои дети', href: '/my-children', icon: Heart, roles: ['PARENT'] },
        { name: 'Группы', href: '/groups', icon: Users, roles: ['ADMIN', 'TEACHER', 'HR', 'PARENT'] },
        { name: 'Успеваемость', href: '/performance', icon: TrendingUp },
      ]
    },
    {
      name: 'Alumni',
      href: '/alumni',
      icon: GraduationCap,
      roles: ['ADMIN', 'TEACHER', 'HR']
    },
    {
      name: 'JAS.LIFE',
      href: '/jas-life',
      icon: Zap,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'HR (Персонал)',
      icon: Users,
      roles: ['ADMIN', 'HR', 'TEACHER', 'FINANCIST'],
      key: 'hr',
      children: [
        { name: 'Сотрудники и преподаватели', href: '/hr/employees', icon: Users, roles: ['ADMIN', 'HR'] },
        { name: 'Нагрузки и расписание ставок', href: '/hr/workload', icon: ClipboardList, roles: ['ADMIN', 'HR'] },
        { name: 'KPI и эффективность', href: '/hr/kpi', icon: BarChart3, roles: ['ADMIN', 'HR'] },
        { name: 'Отпуска и замены', href: '/hr/vacation', icon: Umbrella, roles: ['ADMIN', 'HR', 'TEACHER', 'FINANCIST'] },
        { name: 'Контроль фиктивных ставок (AI)', href: '/hr/fake-positions', icon: UserX, roles: ['ADMIN', 'HR'] },
      ]
    },
    {
      name: 'Финансы',
      icon: DollarSign,
      roles: ['ADMIN', 'FINANCIST', 'PARENT'],
      key: 'finance',
      children: [
        { name: 'Оплаты и задолженности', href: '/finance/payments', icon: CreditCard, roles: ['ADMIN', 'FINANCIST', 'PARENT'] },
        { name: 'Финансовые отчеты', href: '/finance/reports', icon: FileText, roles: ['ADMIN', 'FINANCIST'] },
        { name: 'Бюджет и прогноз', href: '/finance/budget', icon: BarChart3, roles: ['ADMIN', 'FINANCIST'] },
        { name: 'Анализ лояльности', href: '/finance/acl', icon: TrendingUp, roles: ['ADMIN', 'FINANCIST'] },
        { name: 'Управление зарплатой', href: '/finance/payroll', icon: Briefcase, roles: ['ADMIN', 'FINANCIST'] },
      ]
    },
    {
      name: 'ERP система',
      icon: Package,
      roles: ['ADMIN', 'HR'],
      key: 'erp',
      children: [
        { name: 'Digital инвентаризация', href: '/app/erp/inventory', icon: Package },
        { name: 'Запросы на снабжение', href: '/app/erp/supply', icon: ShoppingCart },
        { name: 'Безопасность', href: '/app/erp/security', icon: Lock },
      ]
    },
    {
      name: 'ЭДО',
      icon: FolderOpen,
      roles: ['ADMIN', 'HR', 'TEACHER'],
      key: 'edo',
      children: [
        { name: 'Документы', href: '/edo', icon: FileText },
        { name: 'Создать документ', href: '/edo/create', icon: Plus },
      ]
    },
    {
      name: 'Настройки',
      icon: Settings,
      roles: ['ADMIN'],
      key: 'settings',
      children: [
        { name: 'Пользователи', href: '/settings/users', icon: Users },
        { name: 'Интеграции', href: '/settings/integrations', icon: Cog },
        { name: 'Брендинг', href: '/settings/branding', icon: Palette },
        { name: 'Система', href: '/settings/system', icon: Settings },
        { name: 'Обратная связь', href: '/settings/feedback', icon: MessageCircle },
        { name: 'Мониторинг активности', href: '/settings/activity-monitoring', icon: Activity },
      ]
    },
  ];

  const filteredItems = navigationItems.filter(item =>
    hasAnyRole(item.roles as User['role'][])
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="flex h-full flex-col">
        {/* Logo and close button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">ABAI LMS</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Профиль студента */}
          {user?.role === 'STUDENT' && (
            <div className="mb-6">
              <StudentProfileWidget variant="sidebar" />
            </div>
          )}

          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li key={item.name}>
                {item.href ? (
                  <NavLink
                    to={item.href}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ) : (
                  <div>
                    <button
                      onClick={() => item.key && toggleExpand(item.key)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {item.key && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expandedItems[item.key] ? 'rotate-180' : ''
                            }`}
                        />
                      )}
                    </button>
                    {item.children && item.key && expandedItems[item.key] && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children
                          .filter(child =>
                            !child.roles || hasAnyRole(child.roles as User['role'][])
                          )
                          .map((child) => (
                            <li key={child.name}>
                              <NavLink
                                to={child.href}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={({ isActive }) =>
                                  `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                  }`
                                }
                              >
                                <child.icon className="mr-3 h-4 w-4" />
                                {child.name}
                              </NavLink>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="mr-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.[0]}{user?.surname?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.name} {user?.surname}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
