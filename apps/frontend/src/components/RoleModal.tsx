import React, { useState, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import rbacService, { RoleResponse, Permission, CreateRoleDto, UpdateRoleDto } from '../services/rbacService';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleResponse | null;
  onSaved: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, role, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');

  const isEditing = !!role;

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
    if (isOpen) {
      loadPermissions();
      if (role) {
        setFormData({
          name: role.name,
          description: role.description || ''
        });
        setSelectedPermissions(new Set((role.permissions || []).map(p => p.id)));
      } else {
        setFormData({ name: '', description: '' });
        setSelectedPermissions(new Set());
      }
      setError(null);
      setSearchTerm('');
      setSelectedModule('');
    }
  }, [isOpen, role]);

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const permissions = await rbacService.getPermissions();
      setAllPermissions(permissions);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка загрузки разрешений: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Название роли обязательно');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissions: Array.from(selectedPermissions)
      };

      if (isEditing && role) {
        await rbacService.updateRole(role.id, roleData as UpdateRoleDto);
      } else {
        await rbacService.createRole(roleData as CreateRoleDto);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving role:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка сохранения роли: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAllModulePermissions = (modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));
    
    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      modulePermissionIds.forEach(id => newSelected.delete(id));
    } else {
      modulePermissionIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
  };

  const groupPermissionsByModule = (permissions: Permission[]) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const filteredPermissions = allPermissions.filter(permission => {
    const matchesSearch = searchTerm === '' || 
      permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === '' || permission.module === selectedModule;
    
    return matchesSearch && matchesModule;
  });

  const groupedPermissions = groupPermissionsByModule(filteredPermissions);
  const uniqueModules = [...new Set(allPermissions.map(p => p.module))].sort();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Редактировать роль' : 'Создать роль'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Название роли *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Например: Менеджер"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Описание
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Краткое описание роли"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Разрешения</h4>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Поиск разрешений..."
                  />
                </div>
              </div>
              <div>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Все модули</option>
                  {uniqueModules.map(module => (
                    <option key={module} value={module}>{getModuleName(module)}</option>
                  ))}
                </select>
              </div>
            </div>

            {permissionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                  const allModuleSelected = modulePermissions.every(p => selectedPermissions.has(p.id));
                  const someModuleSelected = modulePermissions.some(p => selectedPermissions.has(p.id));
                  
                  return (
                    <div key={module} className="border-b border-gray-200 last:border-b-0">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allModuleSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someModuleSelected && !allModuleSelected;
                            }}
                            onChange={() => toggleAllModulePermissions(modulePermissions)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label className="ml-3 text-sm font-medium text-gray-900">
                            {getModuleName(module)}
                          </label>
                        </div>
                        <span className="text-xs text-gray-500">
                          {modulePermissions.filter(p => selectedPermissions.has(p.id)).length} / {modulePermissions.length}
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {modulePermissions.map(permission => (
                          <label key={permission.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700" title={`${permission.module}:${permission.action}:${permission.scope}`}>
                              {getActionName(permission.action)} • {getScopeName(permission.scope)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">
              Выбрано разрешений: {selectedPermissions.size} из {allPermissions.length}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? 'Сохранить' : 'Создать'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
