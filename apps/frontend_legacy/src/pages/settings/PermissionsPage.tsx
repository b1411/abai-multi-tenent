import React, { useState } from 'react';
import { FaShieldAlt, FaSearch, FaSave } from 'react-icons/fa';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: [
      { id: 'p1', module: 'Пользователи', action: 'create', description: 'Создание пользователей' },
      { id: 'p2', module: 'Пользователи', action: 'edit', description: 'Редактирование пользователей' },
      { id: 'p3', module: 'Безопасность', action: 'view', description: 'Просмотр журнала безопасности' }
    ]
  },
  {
    id: '2',
    name: 'Учитель',
    description: 'Доступ к учебным материалам и журналам',
    permissions: [
      { id: 'p4', module: 'Журнал', action: 'edit', description: 'Редактирование оценок' },
      { id: 'p5', module: 'Материалы', action: 'view', description: 'Просмотр учебных материалов' }
    ]
  }
];

const PermissionsPage: React.FC = () => {
  const [roles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление правами доступа</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaShieldAlt /> Создать роль
        </button>
      </div>

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
                  selectedRole?.id === role.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
            ))}
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
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <FaSave /> Сохранить изменения
                </button>
              </div>

              <div className="space-y-6">
                {['Пользователи', 'Безопасность', 'Журнал', 'Материалы'].map(module => (
                  <div key={module} className="border-t pt-4">
                    <h3 className="font-semibold mb-4">{module}</h3>
                    <div className="space-y-3">
                      {selectedRole.permissions
                        .filter(p => p.module === module)
                        .map(permission => (
                          <div key={permission.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.id}
                              className="mr-3"
                              defaultChecked
                            />
                            <label htmlFor={permission.id} className="text-sm">
                              {permission.description}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
              <p className="text-gray-500">Выберите роль для просмотра и редактирования прав доступа</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage; 