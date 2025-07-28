import React, { useState, useEffect } from 'react';
import { PermissionGuard } from '../components/PermissionGuard';
import { RoleModal } from '../components/RoleModal';
import { UserRoleModal } from '../components/UserRoleModal';
import rbacService, { RoleResponse, RoleListItem, Permission } from '../services/rbacService';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  ToggleLeft, 
  ToggleRight,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Key,
  UserPlus,
  Settings
} from 'lucide-react';

const RoleManagement: React.FC = () => {
  const { refreshPermissions } = useAuth();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);

  // Функции для локализации
  const getModuleName = (module: string): string => {
    const moduleNames: Record<string, string> = {
      '*': 'Все модули',
      'system': 'Система',
      'users': 'Пользователи',
      'students': 'Студенты',
      'teachers': 'Преподаватели',
      'lessons': 'Уроки',
      'homework': 'Домашние задания',
      'schedule': 'Расписание',
      'groups': 'Группы',
      'classrooms': 'Аудитории',
      'materials': 'Материалы',
      'payments': 'Платежи',
      'reports': 'Отчеты',
      'calendar': 'Календарь',
      'tasks': 'Задачи',
      'chat': 'Чат',
      'notifications': 'Уведомления',
      'files': 'Файлы',
      'feedback': 'Обратная связь',
      'rbac': 'Управление ролями',
      'inventory': 'Инвентарь',
      'supply': 'Снабжение',
      'kpi': 'KPI',
      'workload': 'Нагрузка',
      'vacations': 'Отпуска',
      'salaries': 'Зарплаты',
      'loyalty': 'Лояльность',
      'performance': 'Успеваемость',
      'budget': 'Бюджет',
      'activity-monitoring': 'Мониторинг активности',
      'quiz': 'Опросы',
      'parent': 'Родители',
      'dashboard': 'Дашборд',
      'edo': 'ЭДО'
    };
    return moduleNames[module] || module;
  };

  const getActionName = (action: string): string => {
    const actionNames: Record<string, string> = {
      '*': 'Все действия',
      'create': 'Создание',
      'read': 'Просмотр',
      'update': 'Редактирование',
      'delete': 'Удаление',
      'assign': 'Назначение',
      'approve': 'Утверждение',
      'manage': 'Управление',
      'download': 'Скачивание',
      'upload': 'Загрузка',
      'send': 'Отправка',
      'receive': 'Получение',
      'export': 'Экспорт',
      'import': 'Импорт',
      'archive': 'Архивирование',
      'restore': 'Восстановление'
    };
    return actionNames[action] || action;
  };

  const getScopeName = (scope: string): string => {
    const scopeNames: Record<string, string> = {
      'ALL': 'Полный доступ',
      'OWN': 'Только свои',
      'GROUP': 'По группам',
      'DEPARTMENT': 'По отделам',
      'ASSIGNED': 'Назначенные'
    };
    return scopeNames[scope] || scope;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getRoles(true),
        rbacService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err: any) {
      console.error('Error loading RBAC data:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка загрузки данных: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (roleId: string) => {
    try {
      await rbacService.toggleRoleStatus(roleId);
      await loadData();
      // Обновляем разрешения пользователя если изменилась его роль
      await refreshPermissions();
    } catch (err: any) {
      console.error('Error toggling role status:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка изменения статуса роли: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;
    
    try {
      await rbacService.deleteRole(roleId);
      await loadData();
      await refreshPermissions();
    } catch (err: any) {
      console.error('Error deleting role:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка удаления роли: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    }
  };

  const toggleRoleExpansion = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === null || role.isActive === filterActive;
    return matchesSearch && matchesFilter;
  });

  const groupPermissionsByModule = (permissions: Permission[]) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      module="rbac" 
      action="read"
      fallback={
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Недостаточно прав</h3>
          <p className="mt-1 text-sm text-gray-500">
            У вас нет доступа к управлению ролями и разрешениями
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Управление ролями и разрешениями
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Настройка доступа пользователей к функциям системы
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <PermissionGuard module="rbac" action="create">
              <button
                type="button"
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleModal(true);
                }}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Создать роль
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Поиск по названию или описанию..."
                />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                id="status"
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">Все роли</option>
                <option value="true">Активные</option>
                <option value="false">Неактивные</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterActive(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Roles List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredRoles.map((role) => (
              <li key={role.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className={`h-6 w-6 ${role.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                          {role.isSystem && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Системная
                            </span>
                          )}
                          {!role.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Неактивна
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-500">{role.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Key className="h-3 w-3 mr-1" />
                            {role.permissionCount} разрешений
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {role.userCount} пользователей
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PermissionGuard module="rbac" action="update">
                        <button
                          onClick={async () => {
                            try {
                              const fullRole = await rbacService.getRoleById(role.id);
                              setSelectedRole(fullRole);
                              setShowUserRoleModal(true);
                            } catch (err: any) {
                              console.error('Error loading role:', err);
                              const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
                              const statusCode = err?.response?.status;
                              const detailedError = `Ошибка загрузки роли для назначения: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
                              setError(detailedError);
                            }
                          }}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Назначить пользователям"
                        >
                          <UserPlus className="h-5 w-5" />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard module="rbac" action="update">
                        <button
                          onClick={() => handleToggleRole(role.id)}
                          className={`p-2 rounded-md ${role.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                          title={role.isActive ? 'Деактивировать' : 'Активировать'}
                        >
                          {role.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </PermissionGuard>
                      <PermissionGuard module="rbac" action="update">
                        <button
                          onClick={async () => {
                            try {
                              const fullRole = await rbacService.getRoleById(role.id);
                              setEditingRole(fullRole);
                              setShowRoleModal(true);
                            } catch (err: any) {
                              console.error('Error loading role:', err);
                              const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
                              const statusCode = err?.response?.status;
                              const detailedError = `Ошибка загрузки роли для редактирования: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
                              setError(detailedError);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                          title="Редактировать"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard module="rbac" action="delete">
                        {!role.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Удалить"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </PermissionGuard>
                    </div>
                  </div>

                  {/* NOTE: Expanded permissions убрано, так как RoleListItem не содержит permissions */}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Роли не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterActive !== null 
                ? 'Попробуйте изменить критерии поиска' 
                : 'Создайте первую роль для начала работы'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        <RoleModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setEditingRole(null);
          }}
          role={editingRole}
          onSaved={() => {
            loadData();
            refreshPermissions();
          }}
        />

        <UserRoleModal
          isOpen={showUserRoleModal}
          onClose={() => {
            setShowUserRoleModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          onSaved={() => {
            loadData();
            refreshPermissions();
          }}
        />
      </div>
    </PermissionGuard>
  );
};

export default RoleManagement;
