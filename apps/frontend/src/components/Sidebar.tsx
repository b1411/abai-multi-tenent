import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from './PermissionGuard';
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
  Cog,
  Heart,
  MessageCircle,
  X,
  FolderOpen,
  Plus,
  CheckCircle,
  Newspaper,
  Activity,
  Zap,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasAnyRole, hasPermission, hasAnyPermission } = useAuth();
  const { canAccess } = usePermissions();
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
      permission: { module: 'dashboard', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'Новости',
      href: '/news',
      icon: Newspaper,
      permission: { module: 'system', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'Приложение',
      icon: ClipboardList,
      permission: { module: 'system', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
      key: 'app',
      children: [
        { name: 'Чат', href: '/app/chat', icon: MessageSquare, permission: { module: 'chat', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'AI чат', href: '/app/ai-chat', icon: Bot, permission: { module: 'chat', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Календарь', href: '/app/calendar', icon: Calendar, permission: { module: 'calendar', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Список дел', href: '/app/tasks', icon: List, permission: { module: 'tasks', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Fizmat AI Ala', href: '/app/neuro-abai', icon: Brain, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      name: 'Учебный процесс',
      icon: BookOpen,
      permission: { module: 'lessons', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT'],
      key: 'study',
      children: [
        { name: 'Учебные планы', href: '/study-plans', icon: BookOpen, permission: { module: 'lessons', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Уроки', href: '/lessons', icon: BookOpen, permission: { module: 'lessons', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Домашние задания', href: '/homework', icon: ClipboardList, permission: { module: 'homework', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Учебный журнал', href: '/academic/academic-journal', icon: BookOpen, permission: { module: 'lessons', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER'] },
        { name: 'Расписание', href: '/academic/schedule', icon: Calendar, permission: { module: 'schedule', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { name: 'Аудитории', href: '/classrooms', icon: Building, permission: { module: 'classrooms', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER'] },
        { name: 'Отчеты', href: '/educational-reports', icon: BarChart3, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      name: 'Студенты',
      icon: Users,
      permission: { module: 'students', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'HR', 'STUDENT', 'PARENT'],
      key: 'students',
      children: [
        { name: 'Списки учащихся', href: '/students', icon: GraduationCap, permission: { module: 'students', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'HR', 'STUDENT', 'PARENT'] },
        { name: 'Группы', href: '/groups', icon: Users, permission: { module: 'groups', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'HR'] },
        { name: 'Успеваемость', href: '/performance', icon: TrendingUp, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'TEACHER', 'HR'] },
      ]
    },
    {
      name: 'Alumni',
      href: '/alumni',
      icon: GraduationCap,
      permission: { module: 'students', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'HR']
    },
    {
      name: 'JAS.LIFE',
      href: '/jas-life',
      icon: Zap,
      permission: { module: 'system', action: 'read' },
      fallbackRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR', 'FINANCIST']
    },
    {
      name: 'HR (Персонал)',
      icon: Users,
      permission: { module: 'users', action: 'read' },
      fallbackRoles: ['ADMIN', 'HR', 'TEACHER', 'FINANCIST'],
      key: 'hr',
      children: [
        { name: 'Сотрудники и преподаватели', href: '/hr/employees', icon: Users, permission: { module: 'users', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Нагрузки и расписание ставок', href: '/hr/workload', icon: ClipboardList, permission: { module: 'schedule', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'KPI и эффективность', href: '/hr/kpi', icon: BarChart3, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Отпуска и замены', href: '/hr/vacation', icon: Umbrella, permission: { module: 'users', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Замещения', href: '/hr/substitutions', icon: Users, permission: { module: 'users', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Контроль фиктивных ставок (AI)', href: '/hr/fake-positions', icon: UserX, permission: { module: 'users', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
      ]
    },
    {
      name: 'Финансы',
      icon: DollarSign,
      permission: { module: 'payments', action: 'read' },
      fallbackRoles: ['ADMIN', 'FINANCIST', 'PARENT'],
      key: 'finance',
      children: [
        { name: 'Оплаты и задолженности', href: '/finance/payments', icon: CreditCard, permission: { module: 'payments', action: 'read' }, fallbackRoles: ['ADMIN', 'FINANCIST', 'PARENT'] },
        { name: 'Финансовые отчеты', href: '/finance/reports', icon: FileText, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'FINANCIST'] },
        { name: 'Бюджет и прогноз', href: '/finance/budget', icon: BarChart3, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'FINANCIST'] },
        { name: 'Анализ лояльности', href: '/finance/acl', icon: TrendingUp, permission: { module: 'reports', action: 'read' }, fallbackRoles: ['ADMIN', 'FINANCIST'] },
        { name: 'Управление зарплатой', href: '/finance/payroll', icon: Briefcase, permission: { module: 'payments', action: 'read' }, fallbackRoles: ['ADMIN', 'FINANCIST'] },
      ]
    },
    {
      name: 'ERP система',
      icon: Package,
      permission: { module: 'system', action: 'read' },
      fallbackRoles: ['ADMIN', 'HR'],
      key: 'erp',
      children: [
        { name: 'Digital инвентаризация', href: '/app/erp/inventory', icon: Package, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Запросы на снабжение', href: '/app/erp/supply', icon: ShoppingCart, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN', 'HR'] },
        { name: 'Безопасность', href: '/app/erp/security', icon: Lock, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN'] },
      ]
    },
    {
      name: 'ЭДО',
      icon: FolderOpen,
      permission: { module: 'system', action: 'read' },
      fallbackRoles: ['ADMIN', 'HR', 'TEACHER'],
      key: 'edo',
      children: [
        { name: 'Документы', href: '/edo', icon: FileText, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN', 'HR', 'TEACHER'] },
        { name: 'Создать документ', href: '/edo/create', icon: Plus, permission: { module: 'system', action: 'create' }, fallbackRoles: ['ADMIN', 'HR'] },
      ]
    },
    {
      name: 'Настройки',
      icon: Settings,
      permission: { module: 'system', action: 'update' },
      fallbackRoles: ['ADMIN'],
      key: 'settings',
      children: [
        { name: 'Пользователи', href: '/settings/users', icon: Users, permission: { module: 'users', action: 'update' }, fallbackRoles: ['ADMIN'] },
        { name: 'Роли и разрешения', href: '/role-management', icon: Shield, permission: { module: 'rbac', action: 'read' }, fallbackRoles: ['ADMIN'] },
        { name: 'Интеграции', href: '/settings/integrations', icon: Cog, permission: { module: 'system', action: 'update' }, fallbackRoles: ['ADMIN'] },
        { name: 'Брендинг', href: '/settings/branding', icon: Palette, permission: { module: 'system', action: 'update' }, fallbackRoles: ['ADMIN'] },
        { name: 'Система', href: '/settings/system', icon: Settings, permission: { module: 'system', action: 'update' }, fallbackRoles: ['ADMIN'] },
        { name: 'Обратная связь', href: '/settings/feedback', icon: MessageCircle, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN'] },
        { name: 'Мониторинг активности', href: '/settings/activity-monitoring', icon: Activity, permission: { module: 'system', action: 'read' }, fallbackRoles: ['ADMIN'] },
      ]
    },
  ];

  // Фильтрация элементов навигации на основе разрешений
  const hasAccess = (item: any) => {
    // Строгая проверка только по RBAC разрешениям
    if (item.permission) {
      const hasPermissionAccess = hasPermission(item.permission.module, item.permission.action);
      return hasPermissionAccess;
    }
    
    // Если нет разрешений - не показываем
    return false;
  };

  // Проверить, есть ли доступные дочерние элементы
  const hasAccessibleChildren = (item: any) => {
    if (!item.children) return false;
    return item.children.some((child: any) => hasAccess(child));
  };

  // Фильтрация с учетом дочерних элементов
  const filteredItems = navigationItems.filter(item => {
    // Если у элемента есть href (прямая ссылка), проверяем доступ к нему
    if (item.href) {
      return hasAccess(item);
    }
    
    // Если у элемента есть дочерние элементы, показываем только если есть доступ к родителю И есть доступные дети
    if (item.children) {
      return hasAccess(item) && hasAccessibleChildren(item);
    }
    
    // Иначе проверяем обычный доступ
    return hasAccess(item);
  });

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="flex h-full flex-col">
        {/* Logo and close button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">ABAI LMS</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
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
                          .filter(child => hasAccess(child))
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
