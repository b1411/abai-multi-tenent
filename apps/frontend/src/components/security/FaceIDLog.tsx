import React, { useState } from 'react';
import { FaceIDEntry } from '../../types/security';
import { Users, Download, Filter, Search, Eye, ArrowUpDown } from 'lucide-react';

interface FaceIDLogProps {
  entries: FaceIDEntry[];
  onExportData: () => void;
}

const FaceIDLog: React.FC<FaceIDLogProps> = ({ entries, onExportData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'entry' | 'exit'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'name'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Фильтрация и сортировка данных
  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = searchQuery === '' || 
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.userRole.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || entry.type === filterType;
      
      const matchesDate = filterDate === '' || 
        new Date(entry.timestamp).toDateString() === new Date(filterDate).toDateString();
      
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'name') {
        comparison = a.userName.localeCompare(b.userName);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getEntryTypeColor = (type: FaceIDEntry['type']) => {
    return type === 'entry' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getEntryTypeText = (type: FaceIDEntry['type']) => {
    return type === 'entry' ? 'Вход' : 'Выход';
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'parent':
        return 'bg-orange-100 text-orange-800';
      case 'guard':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleSort = (field: 'timestamp' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
    
    return {
      total: todayEntries.length,
      entries: todayEntries.filter(e => e.type === 'entry').length,
      exits: todayEntries.filter(e => e.type === 'exit').length
    };
  };

  const stats = getTodayStats();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Журнал Face ID
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Записи входов и выходов через турникеты
            </p>
          </div>
          <button
            onClick={onExportData}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика за сегодня */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Всего сегодня</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{stats.entries}</div>
            <div className="text-xs text-gray-600">Входы</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{stats.exits}</div>
            <div className="text-xs text-gray-600">Выходы</div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Фильтр по типу */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Все записи</option>
              <option value="entry">Только входы</option>
              <option value="exit">Только выходы</option>
            </select>
          </div>

          {/* Фильтр по дате */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Очистить фильтры */}
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterDate('');
            }}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Очистить
          </button>
        </div>
      </div>

      {/* Таблица записей */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Время
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Имя
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Должность
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Турникет
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Фото
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <div className="text-sm">Записи не найдены</div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.userName}
                      </div>
                      {!entry.authorized && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Неавторизован
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(entry.userRole)}`}>
                      {entry.userRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEntryTypeColor(entry.type)}`}>
                      {getEntryTypeText(entry.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {entry.turnstileName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                      <Eye className="h-4 w-4" />
                      Посмотреть
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация (если нужна) */}
      {filteredEntries.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Показано {filteredEntries.length} из {entries.length} записей
            </div>
            <div className="text-sm text-gray-600">
              {sortBy === 'timestamp' ? 'Сортировка по времени' : 'Сортировка по имени'} 
              ({sortOrder === 'desc' ? 'убывание' : 'возрастание'})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceIDLog;
