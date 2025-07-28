import React, { useState } from 'react';
import { FaShieldAlt, FaSearch, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import { useRoles } from '../hooks/useSystem';
import { Role, CreateRoleDto, UpdateRoleDto } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';

interface RoleModalProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleDto | UpdateRoleDto) => Promise<void>;
  availablePermissions: { module: string; permissions: string[] }[];
}

const RoleModal: React.FC<RoleModalProps> = ({ 
  role, 
  isOpen, 
  onClose, 
  onSave, 
  availablePermissions 
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions.map(p => p.id) || []
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => p.id)
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
  }, [role]);

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const data = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      };
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения роли:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {role ? 'Редактировать роль' : 'Создать роль'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название роли
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Например: Администратор"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              className="w-full p-2 border rounded-lg"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Описание роли и её назначения"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Права доступа
            </label>
            <div className="space-y-4">
              {availablePermissions.map(module => (
                <div key={module.module} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{module.module}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {module.permissions.map(permission => {
                      const permissionId = `${module.module}_${permission}`;
                      return (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={formData.permissions.includes(permissionId)}
                            onChange={() => handlePermissionToggle(permissionId)}
                          />
                          <span className="text-sm capitalize">{permission}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
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
              {role ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PermissionsPage: React.FC = () => {
  const { roles, permissions, loading, error, createRole, updateRole, deleteRole } = useRoles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleSaveRole = async (data: CreateRoleDto | UpdateRoleDto) => {
    if (selectedRole) {
      await updateRole(selectedRole.id, data as UpdateRoleDto);
    } else {
      await createRole(data as CreateRoleDto);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteRole(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionGuard module="rbac" action="read">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Управление правами доступа</h1>
          <PermissionGuard module="rbac" action="create">
            <button 
              onClick={handleCreateRole}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus /> Создать роль
            </button>
          </PermissionGuard>
        </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск ролей..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            {filteredRoles.map(role => (
              <div
                key={role.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {role.permissions.length} прав доступа
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <PermissionGuard module="rbac" action="update">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        className="text-blue-500 hover:text-blue-600 p-1"
                        title="Редактировать"
                      >
                        <FaShieldAlt size={14} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="rbac" action="delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id);
                        }}
                        className={`p-1 ${
                          deleteConfirm === role.id 
                            ? 'text-red-700 bg-red-100 rounded' 
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title={deleteConfirm === role.id ? 'Подтвердить удаление' : 'Удалить'}
                      >
                        <FaTrash size={12} />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRoles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Роли не найдены
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          {selectedRole ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedRole.name}</h2>
                  <p className="text-gray-500">{selectedRole.description}</p>
                </div>
                <PermissionGuard module="rbac" action="update">
                  <button 
                    onClick={() => handleEditRole(selectedRole)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FaSave /> Редактировать
                  </button>
                </PermissionGuard>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Права доступа</h3>
                
                {permissions.map(module => {
                  const rolePermissions = selectedRole.permissions.filter(p => 
                    p.module === module.module
                  );
                  
                  return (
                    <div key={module.module} className="border-t pt-4">
                      <h4 className="font-semibold mb-3">{module.module}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {module.permissions.map(permission => {
                          const hasPermission = rolePermissions.some(p => 
                            p.action === permission
                          );
                          
                          return (
                            <div key={permission} className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                hasPermission ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className={`text-sm capitalize ${
                                hasPermission ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {permission}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {selectedRole.permissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    У этой роли нет прав доступа
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
              <div className="text-center">
                <FaShieldAlt className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Выберите роль для просмотра и редактирования прав доступа
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <RoleModal
        role={selectedRole || undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRole}
        availablePermissions={permissions}
      />
    </div>
    </PermissionGuard>
  );
};

export default PermissionsPage;
