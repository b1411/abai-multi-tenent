import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/api';
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
  Cog
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout, hasAnyRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    study: false,
    students: false,
    hr: false,
    finance: false,
    app: false,
    erp: false,
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
      name: 'Приложение',
      icon: ClipboardList,
      roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
      key: 'app',
      children: [
        { name: 'Чат', href: '/app/chat', icon: MessageSquare },
        { name: 'AI чат', href: '/app/ai-chat', icon: Bot },
        { name: 'Календарь', href: '/app/calendar', icon: Calendar },
        { name: 'Список дел', href: '/app/tasks', icon: List },
        { name: 'Fizmat AI Ala', href: '/app/neuro-abai', icon: Brain, roles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      name: 'Учебный процесс',
      icon: BookOpen,
      roles: ['ADMIN', 'TEACHER', 'STUDENT'],
      key: 'study',
      children: [
        { name: 'Учебные планы', href: '/study-plans', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Уроки', href: '/lessons', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Домашние задания', href: '/homework', icon: ClipboardList, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Учебный журнал', href: '/academic/academic-journal', icon: BookOpen },
        { name: 'Расписание', href: '/academic/schedule', icon: Calendar },
        { name: 'Аудитории', href: '/classrooms', icon: Building },
      ]
    },
    {
      name: 'Студенты',
      icon: Users,
      roles: ['ADMIN', 'TEACHER', 'HR', 'STUDENT', 'PARENT'],
      key: 'students',
      children: [
        { name: 'Списки учащихся', href: '/students', icon: GraduationCap },
        { name: 'Успеваемость', href: '/performance', icon: TrendingUp },
      ]
    },
    {
      name: 'HR (Персонал)',
      icon: Users,
      roles: ['ADMIN', 'HR'],
      key: 'hr',
      children: [
        { name: 'Сотрудники и преподаватели', href: '/hr/employees', icon: Users },
        { name: 'Нагрузки и расписание ставок', href: '/hr/workload', icon: ClipboardList },
        { name: 'KPI и эффективность', href: '/hr/kpi', icon: BarChart3 },
        { name: 'Отпуска и замены', href: '/hr/vacation', icon: Umbrella },
        { name: 'Контроль фиктивных ставок (AI)', href: '/hr/fake-positions', icon: UserX },
      ]
    },
    {
      name: 'Финансы',
      icon: DollarSign,
      roles: ['ADMIN', 'FINANCIST', 'PARENT'],
      key: 'finance',
      children: [
        { name: 'Оплаты и задолженности', href: '/finance/payments', icon: CreditCard },
        { name: 'Финансовые отчеты', href: '/finance/reports', icon: FileText },
        { name: 'Бюджет и прогноз', href: '/finance/budget', icon: BarChart3 },
        { name: 'Анализ лояльности', href: '/finance/acl', icon: TrendingUp },
        { name: 'Управление зарплатой', href: '/finance/payroll', icon: Briefcase },
        { name: 'Зарплаты', href: '/finance/salaries', icon: DollarSign },
        { name: 'Антифрод', href: '/finance/antifraud', icon: UserX },
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
      ]
    },
    {
      name: 'Настройки',
      icon: Settings,
      roles: ['ADMIN'],
      key: 'settings',
      children: [
        { name: 'Пользователи', href: '/settings/users', icon: Users },
        { name: 'Права доступа', href: '/settings/permissions', icon: Lock },
        { name: 'Интеграции', href: '/settings/integrations', icon: Cog },
        { name: 'Брендинг', href: '/settings/branding', icon: Palette },
        { name: 'Система', href: '/settings/system', icon: Settings },
      ]
    },
  ];

  const filteredItems = navigationItems.filter(item => 
    hasAnyRole(item.roles as User['role'][])
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">ABAI LMS</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li key={item.name}>
                {item.href ? (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
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
                          className={`h-4 w-4 transition-transform ${
                            expandedItems[item.key] ? 'rotate-180' : ''
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
                              className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                  isActive
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
