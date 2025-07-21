import React, { useState } from 'react';
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaKey } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'i.petrov@school.edu',
    role: 'Администратор',
    department: 'IT отдел',
    status: 'active',
    lastLogin: '2024-03-21 10:30'
  },
  {
    id: '2',
    name: 'Мария Иванова',
    email: 'm.ivanova@school.edu',
    role: 'Учитель',
    department: 'Математика',
    status: 'active',
    lastLogin: '2024-03-21 09:15'
  }
];

const UsersPage: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaUserPlus /> Добавить пользователя
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-500 hover:text-blue-600">
                      <FaEdit />
                    </button>
                    <button className="text-yellow-500 hover:text-yellow-600">
                      <FaKey />
                    </button>
                    <button className="text-red-500 hover:text-red-600">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage; 