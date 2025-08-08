import React, { useState } from 'react';
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useUsers } from '../hooks/useSystem';
import { User, CreateUserDto, UpdateUserDto } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

interface UserModalProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'teacher',
    department: user?.department || '',
    status: user?.status || 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department,
        status: user.status
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'teacher',
        department: '',
        status: 'active'
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (user) {
        // Обновление - не отправляем пароль если он пустой
        const updateData: UpdateUserDto = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          status: formData.status as 'active' | 'inactive'
        };
        await onSave(updateData);
      } else {
        // Создание - пароль обязателен
        const createData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department
        };
        await onSave(createData);
      }
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
          {user ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full p-2 border rounded-lg pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              className="w-full p-2 border rounded-lg"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="admin">Администратор</option>
              <option value="teacher">Учитель</option>
              <option value="student">Студент</option>
              <option value="parent">Родитель</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Отдел
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="Например: Математика"
            />
          </div>
          
          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              >
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSaving ? <Spinner size="sm" /> : null}
              {user ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const { users, loading, error, createUser, updateUser, deleteUser, resetPassword, refetch } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: CreateUserDto | UpdateUserDto) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, data as UpdateUserDto);
    } else {
      await createUser(data as CreateUserDto);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteUser(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const newPassword = await resetPassword(id);
      alert(`Новый пароль: ${newPassword}`);
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
    }
  };

  React.useEffect(() => {
    refetch({ search: searchQuery, role: roleFilter, status: statusFilter });
  }, [searchQuery, roleFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Управление пользователями</h1>
        <button 
          onClick={handleCreateUser}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <FaUserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить пользователя</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="relative sm:col-span-1">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-2.5 sm:top-3 text-gray-400 text-sm" />
        </div>
        
        <select
          className="p-2 text-sm sm:text-base border rounded-lg"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="teacher">Учитель</option>
          <option value="student">Студент</option>
          <option value="parent">Родитель</option>
        </select>
        
        <select
          className="p-2 text-sm sm:text-base border rounded-lg"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>

      {/* Десктоп таблица */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Имя</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Роль</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Отдел</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Статус</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Последний вход</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="capitalize">{user.role}</span>
                </td>
                <td className="px-4 py-3">{user.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : 'Никогда'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-blue-500 hover:text-blue-600"
                      title="Редактировать"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(user.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title="Сбросить пароль"
                    >
                      <FaKey />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className={`${
                        deleteConfirm === user.id 
                          ? 'text-red-700 bg-red-100 px-2 py-1 rounded text-xs' 
                          : 'text-red-500 hover:text-red-600'
                      }`}
                      title={deleteConfirm === user.id ? 'Подтвердить удаление' : 'Удалить'}
                    >
                      {deleteConfirm === user.id ? 'Подтвердить' : <FaTrash />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Пользователи не найдены
          </div>
        )}
      </div>

      {/* Мобильные карточки */}
      <div className="lg:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            Пользователи не найдены
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg p-4 shadow border">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Роль:</span>
                  <div className="font-medium capitalize">{user.role}</div>
                </div>
                <div>
                  <span className="text-gray-500">Отдел:</span>
                  <div className="font-medium truncate">{user.department || '—'}</div>
                </div>
              </div>
              
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Последний вход:</span>
                <div className="font-medium">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ru-RU') : 'Никогда'}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => handleEditUser(user)}
                  className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm"
                >
                  <FaEdit className="w-3 h-3" />
                  Редактировать
                </button>
                <button 
                  onClick={() => handleResetPassword(user.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded text-sm"
                >
                  <FaKey className="w-3 h-3" />
                  Сбросить пароль
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                    deleteConfirm === user.id 
                      ? 'text-white bg-red-600 hover:bg-red-700' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <FaTrash className="w-3 h-3" />
                  {deleteConfirm === user.id ? 'Подтвердить' : 'Удалить'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <UserModal
        user={selectedUser || undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UsersPage;
