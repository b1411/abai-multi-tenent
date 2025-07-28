import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { inventoryService, AnalyticsData } from '../services/inventoryService';
import { Loading } from '../components/ui';

const InventoryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'REPAIR':
        return 'bg-yellow-500';
      case 'WRITTEN_OFF':
        return 'bg-red-500';
      case 'LOST':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активные';
      case 'REPAIR':
        return 'В ремонте';
      case 'WRITTEN_OFF':
        return 'Списанные';
      case 'LOST':
        return 'Утерянные';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных</h3>
        <p className="text-gray-500">Не удалось загрузить аналитику инвентаря</p>
      </div>
    );
  }

  return (
    <PermissionGuard module="inventory" action="read">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Аналитика инвентаря
            </h1>
            <p className="text-gray-600">Статистика и отчеты по управлению инвентарем</p>
          </div>
          <PermissionGuard module="inventory" action="read">
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Обновить данные
            </button>
          </PermissionGuard>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Всего предметов</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Общая стоимость</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Требуют ТО</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.maintenanceAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Категорий</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.categoryDistribution.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Распределение по статусам</h3>
          <div className="space-y-4">
            {analytics.statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status)} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {getStatusText(item.status)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                  <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Распределение по локациям</h3>
          <div className="space-y-3">
            {analytics.locationDistribution.slice(0, 5).map((item, index) => (
              <div key={item.location} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.location}</span>
                </div>
                <span className="text-sm text-gray-500">{item.count} предметов</span>
              </div>
            ))}
            {analytics.locationDistribution.length > 5 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  и еще {analytics.locationDistribution.length - 5} локаций...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Распределение по категориям</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.categoryDistribution.map((item, index) => (
            <div key={item.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">{index + 1}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Количество:</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Стоимость:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Alerts */}
      {analytics.maintenanceAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Предметы, требующие техобслуживания
            </h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              {analytics.maintenanceAlerts.length} предметов
            </span>
          </div>
          <div className="space-y-3">
            {analytics.maintenanceAlerts.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500">
                    {item.location} • {item.responsible}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(item.currentValue)}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Сводка</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-2">Общее состояние инвентаря:</p>
            <div className="space-y-1">
              {analytics.statusDistribution.map((item) => (
                <p key={item.status} className="text-gray-800">
                  {getStatusText(item.status)}: <span className="font-medium">{item.count}</span>
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Наиболее ценные категории:</p>
            <div className="space-y-1">
              {analytics.categoryDistribution
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((item) => (
                  <p key={item.name} className="text-gray-800">
                    {item.name}: <span className="font-medium">{formatCurrency(item.value)}</span>
                  </p>
                ))}
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Рекомендации:</p>
            <div className="space-y-1 text-gray-800">
              {analytics.maintenanceAlerts.length > 0 && (
                <p>• Запланировать ТО для {analytics.maintenanceAlerts.length} предметов</p>
              )}
              <p>• Провести инвентаризацию в локациях с наибольшим количеством предметов</p>
              <p>• Оптимизировать распределение ресурсов по категориям</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PermissionGuard>
  );
};

export default InventoryAnalytics;
