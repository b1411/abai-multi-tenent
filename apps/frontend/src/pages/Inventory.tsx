import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, QrCode, Package, Move, Wrench } from 'lucide-react';
import { inventoryService, InventoryItem, InventoryFilters, InventoryStatus } from '../services/inventoryService';
import { Loading } from '../components/ui';
import InventoryModals, { InventoryItem as InventoryModalItem } from '../components/inventory/InventoryModals';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuth } from '../hooks/useAuth';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'createItem' | 'editItem' | 'viewItem' | 'moveItem' | 'maintenance'>('viewItem');

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getItems(filters);
      setItems(response.items);
    } catch (error) {
      console.error('Ошибка загрузки предметов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (key: keyof InventoryFilters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setModalType('createItem');
    setShowModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalType('editItem');
    setShowModal(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalType('viewItem');
    setShowModal(true);
  };

  const handleMoveItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalType('moveItem');
    setShowModal(true);
  };

  const handleMaintenanceItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalType('maintenance');
    setShowModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (modalType === 'createItem') {
        await inventoryService.createItem(data);
      } else if (modalType === 'editItem') {
        if (selectedItem?.id) {
          await inventoryService.updateItem(selectedItem.id.toString(), data);
        }
      } else if (modalType === 'moveItem') {
        if (selectedItem?.id) {
          await inventoryService.createMovement(selectedItem.id.toString(), data);
        }
      } else if (modalType === 'maintenance') {
        if (selectedItem?.id) {
          await inventoryService.createMaintenance(selectedItem.id.toString(), data);
        }
      }
      await loadItems();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      await inventoryService.exportData(filters);
      // В реальном проекте здесь будет скачивание файла
      alert('Экспорт запущен');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  };

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case InventoryStatus.REPAIR:
        return 'bg-yellow-100 text-yellow-800';
      case InventoryStatus.WRITTEN_OFF:
        return 'bg-red-100 text-red-800';
      case InventoryStatus.LOST:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.ACTIVE:
        return 'Активен';
      case InventoryStatus.REPAIR:
        return 'В ремонте';
      case InventoryStatus.WRITTEN_OFF:
        return 'Списан';
      case InventoryStatus.LOST:
        return 'Утерян';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Инвентаризация
          </h1>
          <p className="text-gray-600">Управление инвентарем учебного заведения</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </button>
          <PermissionGuard module="inventory" action="read">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </button>
          </PermissionGuard>
          <PermissionGuard module="inventory" action="create">
            <button
              onClick={handleCreateItem}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить предмет
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Поиск по названию, серийному номеру, производителю..."
          value={filters.search || ''}
          onChange={handleSearch}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <input
                type="text"
                placeholder="Техника, Мебель..."
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все статусы</option>
                <option value={InventoryStatus.ACTIVE}>Активен</option>
                <option value={InventoryStatus.REPAIR}>В ремонте</option>
                <option value={InventoryStatus.WRITTEN_OFF}>Списан</option>
                <option value={InventoryStatus.LOST}>Утерян</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Локация
              </label>
              <input
                type="text"
                placeholder="Кабинет 101..."
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ответственный
              </label>
              <input
                type="text"
                placeholder="ФИО ответственного..."
                value={filters.responsible || ''}
                onChange={(e) => handleFilterChange('responsible', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewItem(item)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {item.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Категория:</span>
                  <span className="text-gray-900">{item.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Локация:</span>
                  <span className="text-gray-900">{item.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Стоимость:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.currentValue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ответственный:</span>
                  <span className="text-gray-900">{item.responsible}</span>
                </div>
                {item.serialNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Серийный номер:</span>
                    <span className="text-gray-900 font-mono text-xs">{item.serialNumber}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Последняя инвентаризация:</span>
                  <span>{formatDate(item.lastInventory)}</span>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {item.qrCode && (
                    <span className="inline-flex items-center text-xs text-gray-500">
                      <QrCode className="h-3 w-3 mr-1" />
                      QR
                    </span>
                  )}
                  {item.manufacturer && (
                    <span className="text-xs text-gray-500">
                      {item.manufacturer}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PermissionGuard module="inventory" action="update">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveItem(item);
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-800 font-medium"
                      title="Переместить"
                    >
                      <Move className="h-3 w-3 mr-1" />
                      Переместить
                    </button>
                  </PermissionGuard>
                  <PermissionGuard module="inventory" action="update">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMaintenanceItem(item);
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                      title="Обслуживание"
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Обслуживание
                    </button>
                  </PermissionGuard>
                </div>
                <PermissionGuard module="inventory" action="update">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Редактировать
                  </button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет предметов</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || Object.keys(filters).length > 1
              ? 'По заданным фильтрам предметы не найдены'
              : 'Добавьте первый предмет инвентаря'}
          </p>
          <PermissionGuard module="inventory" action="create">
            <button
              onClick={handleCreateItem}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить предмет
            </button>
          </PermissionGuard>
        </div>
      )}

      {/* Modal */}
      <InventoryModals
        showModal={showModal}
        modalType={modalType}
        selectedItem={selectedItem as InventoryModalItem}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Inventory;
