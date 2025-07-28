import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from '../components/PermissionGuard';
import { Plus, Search, Filter, Download, Truck, Building2 } from 'lucide-react';
import { Loading } from '../components/ui';
import SupplyModals, { PurchaseRequest, Supplier } from '../components/supply/SupplyModals';
import { supplyService } from '../services/supplyService';

const Supply: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'suppliers' | 'orders'>('requests');
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'createRequest' | 'editRequest' | 'viewRequest' | 'createSupplier' | 'editSupplier' | 'viewSupplier' | 'createOrder' | 'editOrder' | 'viewOrder'>('createRequest');
  const [selectedData, setSelectedData] = useState<PurchaseRequest | Supplier | undefined>();

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'requests') {
        const data = await supplyService.getPurchaseRequests(filters);
        setRequests(data.requests || []);
      } else if (activeTab === 'suppliers') {
        const data = await supplyService.getSuppliers(filters);
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const handleCreate = () => {
    setSelectedData(undefined);
    if (activeTab === 'requests') {
      setModalType('createRequest');
    } else if (activeTab === 'suppliers') {
      setModalType('createSupplier');
    } else if (activeTab === 'orders') {
      setModalType('createOrder');
    }
    setShowModal(true);
  };

  const handleEdit = (data: PurchaseRequest | Supplier) => {
    setSelectedData(data);
    if (activeTab === 'requests') {
      setModalType('editRequest');
    } else if (activeTab === 'suppliers') {
      setModalType('editSupplier');
    }
    setShowModal(true);
  };

  const handleView = (data: PurchaseRequest | Supplier) => {
    setSelectedData(data);
    if (activeTab === 'requests') {
      setModalType('viewRequest');
    } else if (activeTab === 'suppliers') {
      setModalType('viewSupplier');
    }
    setShowModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (modalType.includes('Request')) {
        if (modalType === 'createRequest') {
          await supplyService.createPurchaseRequest(data);
        } else if (modalType === 'editRequest') {
          // Для редактирования используем updatePurchaseRequestStatus или создаем новый метод
          // Пока оставим как есть, так как нужно добавить метод в сервис
          console.log('Edit request not implemented yet', selectedData?.id, data);
        }
      } else if (modalType.includes('Supplier')) {
        if (modalType === 'createSupplier') {
          await supplyService.createSupplier(data);
        } else if (modalType === 'editSupplier') {
          if (selectedData?.id) {
            await supplyService.updateSupplier(selectedData.id, data);
          }
        }
      } else if (modalType.includes('Order')) {
        if (modalType === 'createOrder') {
          await supplyService.createPurchaseOrder(data);
        } else if (modalType === 'editOrder') {
          // Позже добавим метод для редактирования заказов
          console.log('Edit order not implemented yet', selectedData?.id, data);
        }
      }
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Черновик';
      case 'PENDING':
        return 'На рассмотрении';
      case 'APPROVED':
        return 'Одобрено';
      case 'REJECTED':
        return 'Отклонено';
      case 'ORDERED':
        return 'Заказано';
      case 'RECEIVED':
        return 'Получено';
      default:
        return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return 'text-green-600';
      case 'NORMAL':
        return 'text-blue-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'URGENT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
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
            <Truck className="h-6 w-6" />
            Снабжение
          </h1>
          <p className="text-gray-600">Управление закупками и поставщиками</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </button>
          <PermissionGuard module="supply" action="read">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </button>
          </PermissionGuard>
          <PermissionGuard module="supply" action="create">
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'requests' ? 'Новая заявка' : activeTab === 'suppliers' ? 'Новый поставщик' : 'Новый заказ'}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Заявки на закупку
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Поставщики
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Заказы
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={`Поиск ${activeTab === 'requests' ? 'заявок' : activeTab === 'suppliers' ? 'поставщиков' : 'заказов'}...`}
          value={filters.search || ''}
          onChange={handleSearch}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === 'requests' && (
              <>
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
                    <option value="DRAFT">Черновик</option>
                    <option value="PENDING">На рассмотрении</option>
                    <option value="APPROVED">Одобрено</option>
                    <option value="REJECTED">Отклонено</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={filters.urgency || ''}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Все приоритеты</option>
                    <option value="LOW">Низкий</option>
                    <option value="NORMAL">Обычный</option>
                    <option value="HIGH">Высокий</option>
                    <option value="URGENT">Срочный</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'suppliers' && (
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
                  <option value="ACTIVE">Активный</option>
                  <option value="SUSPENDED">Приостановлен</option>
                  <option value="BLACKLISTED">Черный список</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                    <p className="text-sm text-gray-500">#{request.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status.toString())}`}>
                      {getStatusText(request.status.toString())}
                    </span>
                    <span className={`text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{request.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Сумма:</span>
                    <div className="font-medium text-gray-900">{formatCurrency(request.totalAmount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Требуемая дата:</span>
                    <div className="text-gray-900">{request.requiredDate ? formatDate(request.requiredDate) : 'Не указана'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Создана:</span>
                    <div className="text-gray-900">{formatDate(request.createdAt)}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>{request.quotes?.length || 0} предложений</span>
                    <span>{request.orders?.length || 0} заказов</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleView(request)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Просмотр
                    </button>
                    <PermissionGuard module="supply" action="update">
                      <button 
                        onClick={() => handleEdit(request)}
                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Редактировать
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                  </div>
                  <div className="flex items-center">
                    {supplier.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-sm text-gray-600">{supplier.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-16">Email:</span>
                    <span className="text-gray-900">{supplier.email || 'Не указан'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-16">Телефон:</span>
                    <span className="text-gray-900">{supplier.phone || 'Не указан'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-16">Статус:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.status.toString())}`}>
                      {supplier.status.toString() === 'ACTIVE' ? 'Активный' : supplier.status.toString()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Добавлен {formatDate(supplier.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleView(supplier)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Просмотр
                    </button>
                    <PermissionGuard module="supply" action="update">
                      <button 
                        onClick={() => handleEdit(supplier)}
                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Редактировать
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заказов</h3>
            <p className="text-gray-500">Создайте первый заказ на основе одобренной заявки</p>
          </div>
        )}
      </div>

      {(activeTab === 'requests' && requests.length === 0) && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заявок</h3>
          <p className="text-gray-500 mb-4">Создайте первую заявку на закупку</p>
          <PermissionGuard module="supply" action="create">
            <button 
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать заявку
            </button>
          </PermissionGuard>
        </div>
      )}

      {(activeTab === 'suppliers' && suppliers.length === 0) && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет поставщиков</h3>
          <p className="text-gray-500 mb-4">Добавьте первого поставщика</p>
          <PermissionGuard module="supply" action="create">
            <button 
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить поставщика
            </button>
          </PermissionGuard>
        </div>
      )}

      {/* Modal */}
      <SupplyModals
        showModal={showModal}
        modalType={modalType}
        selectedData={selectedData}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Supply;
