import React, { useState, useEffect } from 'react';
import {
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaDownload,
  FaFilter,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTools,
  FaMoneyBillWave
} from 'react-icons/fa';
import { inventoryService, InventoryItem } from '../../api/inventoryService';

interface AnalyticsData {
  totalItems: number;
  totalValue: number;
  categories: { name: string; count: number; value: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  locationDistribution: { location: string; count: number }[];
  maintenanceAlerts: InventoryItem[];
  depreciationData: { month: string; value: number }[];
  utilizationStats: { category: string; activePercent: number }[];
}

const InventoryAnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock данные для демонстрации
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // Имитация загрузки данных
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: AnalyticsData = {
          totalItems: 342,
          totalValue: 15750000,
          categories: [
            { name: 'Техника', count: 125, value: 8500000 },
            { name: 'Мебель', count: 89, value: 3200000 },
            { name: 'Учебные материалы', count: 78, value: 2800000 },
            { name: 'Инструменты', count: 35, value: 850000 },
            { name: 'Транспорт', count: 15, value: 400000 }
          ],
          statusDistribution: [
            { status: 'active', count: 285, percentage: 83.3 },
            { status: 'repair', count: 28, percentage: 8.2 },
            { status: 'written-off', count: 21, percentage: 6.1 },
            { status: 'lost', count: 8, percentage: 2.4 }
          ],
          locationDistribution: [
            { location: 'Главный корпус', count: 145 },
            { location: 'Лабораторный корпус', count: 98 },
            { location: 'Библиотека', count: 56 },
            { location: 'Спортивный комплекс', count: 43 }
          ],
          maintenanceAlerts: [
            {
              id: '1',
              name: 'Интерактивная доска Samsung',
              category: 'Техника',
              location: 'Аудитория 204',
              status: 'active',
              purchaseDate: '2023-01-15',
              lastInventory: '2024-03-01',
              cost: 850000,
              currentValue: 765000,
              responsible: 'Иванов А.П.',
              maintenanceSchedule: {
                lastMaintenance: '2024-01-15',
                nextMaintenance: '2024-04-15',
                provider: 'TechService'
              }
            },
            {
              id: '2',
              name: 'Проектор Epson',
              category: 'Техника',
              location: 'Конференц-зал',
              status: 'active',
              purchaseDate: '2022-06-10',
              lastInventory: '2024-02-20',
              cost: 450000,
              currentValue: 337500,
              responsible: 'Петрова М.С.',
              maintenanceSchedule: {
                lastMaintenance: '2023-12-10',
                nextMaintenance: '2024-04-10',
                provider: 'ProjectorFix'
              }
            }
          ],
          depreciationData: [
            { month: 'Янв', value: 16200000 },
            { month: 'Фев', value: 16050000 },
            { month: 'Мар', value: 15900000 },
            { month: 'Апр', value: 15750000 }
          ],
          utilizationStats: [
            { category: 'Техника', activePercent: 89.6 },
            { category: 'Мебель', activePercent: 95.5 },
            { category: 'Учебные материалы', activePercent: 76.9 },
            { category: 'Инструменты', activePercent: 71.4 }
          ]
        };
        
        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [dateRange, selectedCategory]);

  const handleExportReport = async () => {
    try {
      await inventoryService.exportData({}, 'xlsx');
      alert('Отчет успешно экспортирован');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Ошибка при экспорте отчета');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ошибка загрузки данных аналитики</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика инвентаря</h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
            <FaCalendarAlt className="text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="text-sm border-none outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="text-sm border-none outline-none"
            />
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
          >
            <FaDownload className="mr-2" />
            Экспорт отчета
          </button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего предметов</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaChartBar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Общая стоимость</p>
              <p className="text-2xl font-bold text-gray-900">
                {(analyticsData.totalValue / 1000000).toFixed(1)}М ₸
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaMoneyBillWave className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Активных</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.statusDistribution.find(s => s.status === 'active')?.count || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Требует ТО</p>
              <p className="text-2xl font-bold text-yellow-600">{analyticsData.maintenanceAlerts.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Графики и диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Распределение по категориям */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Распределение по категориям</h3>
            <FaChartPie className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.categories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-4 h-4 rounded-full`}
                    style={{ 
                      backgroundColor: `hsl(${index * 72}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{category.count}</div>
                  <div className="text-xs text-gray-500">
                    {(category.value / 1000000).toFixed(1)}М ₸
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Распределение по статусам */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Статусы предметов</h3>
            <FaCog className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.statusDistribution.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      status.status === 'active' ? 'bg-green-500' :
                      status.status === 'repair' ? 'bg-yellow-500' :
                      status.status === 'written-off' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {status.status === 'active' ? 'Активен' :
                     status.status === 'repair' ? 'В ремонте' :
                     status.status === 'written-off' ? 'Списан' :
                     'Утерян'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{status.count}</div>
                  <div className="text-xs text-gray-500">{status.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Распределение по локациям */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Распределение по локациям</h3>
          <FaMapMarkerAlt className="text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsData.locationDistribution.map((location, index) => (
            <div key={location.location} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{location.count}</div>
              <div className="text-sm text-gray-600">{location.location}</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-corporate-primary h-2 rounded-full"
                  style={{ 
                    width: `${(location.count / analyticsData.totalItems) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Уведомления о техобслуживании */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Требует технического обслуживания</h3>
          <FaTools className="text-yellow-500" />
        </div>
        {analyticsData.maintenanceAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Предмет</th>
                  <th className="text-left py-2 px-4">Местоположение</th>
                  <th className="text-left py-2 px-4">Последнее ТО</th>
                  <th className="text-left py-2 px-4">Следующее ТО</th>
                  <th className="text-left py-2 px-4">Ответственный</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.maintenanceAlerts.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.location}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.maintenanceSchedule?.lastMaintenance ? 
                        new Date(item.maintenanceSchedule.lastMaintenance).toLocaleDateString() : 
                        'Нет данных'
                      }
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-600 font-medium">
                        {item.maintenanceSchedule?.nextMaintenance ? 
                          new Date(item.maintenanceSchedule.nextMaintenance).toLocaleDateString() : 
                          'Не запланировано'
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.responsible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaCheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <p>Все предметы в хорошем состоянии</p>
          </div>
        )}
      </div>

      {/* Динамика стоимости */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Динамика стоимости инвентаря</h3>
          <FaChartLine className="text-gray-400" />
        </div>
        <div className="flex items-end space-x-4 h-32">
          {analyticsData.depreciationData.map((data, index) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-corporate-primary rounded-t"
                style={{ 
                  height: `${(data.value / Math.max(...analyticsData.depreciationData.map(d => d.value))) * 100}%` 
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2">{data.month}</div>
              <div className="text-xs text-gray-500">
                {(data.value / 1000000).toFixed(1)}М
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalyticsPage;
