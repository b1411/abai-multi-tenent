import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Calendar, AlertCircle } from 'lucide-react';
import rbacService, { RoleResponse, AssignedUser } from '../services/rbacService';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleResponse | null;
  onSaved: () => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({ isOpen, onClose, role, onSaved }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRole, setCurrentRole] = useState<RoleResponse | null>(null);

  useEffect(() => {
    if (isOpen && role) {
      setCurrentRole(role);
      loadUsers();
      setSelectedUsers(new Set());
      setExpirationDate('');
      setContext('');
      setError(null);
      setSearchTerm('');
    }
  }, [isOpen, role]);

  const refreshRoleData = async () => {
    if (role) {
      try {
        const updatedRole = await rbacService.getRoleById(role.id);
        setCurrentRole(updatedRole);
      } catch (err) {
        console.error('Error refreshing role data:', err);
      }
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      // Получаем пользователей из API
      const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const response = await fetch(`${baseURL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch users'}`);
      }
      
      const data = await response.json();
      const users = data.data || data;
      
      // Преобразуем данные в нужный формат
      const formattedUsers: User[] = users.map((user: any) => ({
        id: user.id,
        name: user.name || 'Без имени',
        surname: user.surname || '',
        email: user.email,
        role: user.role || 'USER'
      }));
      
      setAllUsers(formattedUsers);
    } catch (err: any) {
      console.warn('Не удалось загрузить пользователей из API, используем заглушку. Ошибка:', err?.message || err);
      // Fallback к заглушке если API недоступен
      const mockUsers: User[] = [
        { id: 1, name: 'Админ', surname: 'Администратов', email: 'admin@abai.edu.kz', role: 'ADMIN' },
        { id: 2, name: 'Лариса', surname: 'Иванова', email: 'ivanova@abai.edu.kz', role: 'TEACHER' },
        { id: 3, name: 'Азамат', surname: 'Алиев', email: 'aliev@abai.edu.kz', role: 'TEACHER' },
        { id: 4, name: 'Айда', surname: 'Казыбекова', email: 'aida.student@abai.edu.kz', role: 'STUDENT' },
      ];
      setAllUsers(mockUsers);
      
      // Показываем предупреждение о fallback
      setError(`Предупреждение: Используются тестовые данные. Ошибка загрузки пользователей: ${err?.message || 'Неизвестная ошибка'}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.size === 0) {
      setError('Выберите хотя бы одного пользователя');
      return;
    }

    if (!currentRole) return;

    try {
      setLoading(true);
      setError(null);

      const assignData = {
        expiresAt: expirationDate || undefined,
        context: context ? JSON.parse(context) : undefined
      };

      // Назначаем роль каждому выбранному пользователю
      for (const userId of selectedUsers) {
        await rbacService.assignRoleToUser(userId, currentRole.id, assignData);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
      const statusCode = err?.response?.status;
      const detailedError = `Ошибка назначения роли: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const filteredUsers = allUsers.filter(user => {
    const searchString = `${user.name} ${user.surname} ${user.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Фильтруем пользователей, которые уже имеют эту роль
  const availableUsers = filteredUsers.filter(user => {
    return !currentRole?.assignedUsers?.some(assignedUser => assignedUser.id === user.id);
  });

  if (!isOpen || !currentRole) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Назначить роль "{currentRole.name}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите пользователей
            </label>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Поиск пользователей..."
              />
            </div>

            {usersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">Текущая роль: {user.role}</div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm 
                      ? 'Пользователи не найдены' 
                      : 'Все пользователи уже имеют эту роль'
                    }
                  </div>
                )}
              </div>
            )}

            {selectedUsers.size > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Выбрано пользователей: {selectedUsers.size}
              </div>
            )}
          </div>

          {/* Optional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                Дата истечения (необязательно)
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="datetime-local"
                  id="expirationDate"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Оставьте пустым для бессрочного назначения
              </p>
            </div>
            <div>
              <label htmlFor="context" className="block text-sm font-medium text-gray-700">
                Контекст (JSON, необязательно)
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder='{"groupId": 1, "departmentId": 2}'
              />
              <p className="mt-1 text-xs text-gray-500">
                Дополнительные данные для ограничения области действия роли
              </p>
            </div>
          </div>

          {/* Current Assignments */}
          {(currentRole.assignedUsers?.length || 0) > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Пользователи с этой ролью ({currentRole.assignedUsers?.length || 0})
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {(currentRole.assignedUsers || []).map(assignedUser => (
                  <div key={assignedUser.id} className="flex items-center justify-between py-1">
                    <div className="text-sm text-gray-700">
                      {assignedUser.name} ({assignedUser.email})
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500">
                        {assignedUser.expiresAt 
                          ? `До: ${new Date(assignedUser.expiresAt).toLocaleDateString()}`
                          : 'Бессрочно'
                        }
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Вы уверены, что хотите отозвать роль "${currentRole.name}" у пользователя ${assignedUser.name}?`)) {
                            try {
                              await rbacService.revokeRoleFromUser(assignedUser.id, currentRole.id);
                              await refreshRoleData(); // Обновляем данные роли в модальном окне
                              onSaved(); // Обновляем данные в родительском компоненте
                            } catch (err: any) {
                              console.error('Error revoking role:', err);
                              const errorMessage = err?.response?.data?.message || err?.message || 'Неизвестная ошибка';
                              const statusCode = err?.response?.status;
                              const detailedError = `Ошибка отзыва роли: ${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`;
                              setError(detailedError);
                            }
                          }
                        }}
                        className="text-red-400 hover:text-red-600 text-xs"
                        title="Отозвать роль"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3 text-sm text-red-600">{error}</div>
              </div>
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
              disabled={loading || selectedUsers.size === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Назначение...
                </div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Назначить роль
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
