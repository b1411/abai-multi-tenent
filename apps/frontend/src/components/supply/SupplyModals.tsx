import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2, User, Package, FileText } from 'lucide-react';
import { Loading } from '../ui';
import {
  PurchaseRequest,
  Supplier,
  PurchaseOrder,
  CreatePurchaseRequest,
  CreateSupplier,
  CreatePurchaseRequestItem,
  PurchaseRequestItem
} from '../../services/supplyService';

// Re-export types for use in other components
export type { PurchaseRequest, Supplier, PurchaseOrder };

interface SupplyModalsProps {
  showModal: boolean;
  modalType: 'createRequest' | 'editRequest' | 'viewRequest' | 'createSupplier' | 'editSupplier' | 'viewSupplier' | 'createOrder' | 'editOrder' | 'viewOrder';
  selectedData?: PurchaseRequest | Supplier | PurchaseOrder;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const SupplyModals: React.FC<SupplyModalsProps> = ({
  showModal,
  modalType,
  selectedData,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [items, setItems] = useState<CreatePurchaseRequestItem[]>([]);

  useEffect(() => {
    if (showModal) {
      if (modalType.includes('Request')) {
        const requestData = selectedData as PurchaseRequest;
        setFormData({
          title: requestData?.title || '',
          description: requestData?.description || '',
          requesterId: requestData?.requesterId || 1,
          departmentId: requestData?.departmentId || null,
          totalAmount: requestData?.totalAmount || 0,
          currency: requestData?.currency || 'KZT',
          urgency: requestData?.urgency || 'NORMAL',
          requiredDate: requestData?.requiredDate || ''
        });
        setItems(requestData?.items || []);
      } else if (modalType.includes('Order')) {
        const orderData = selectedData as PurchaseOrder;
        setFormData({
          orderNumber: orderData?.orderNumber || '',
          supplierId: orderData?.supplierId || '',
          totalAmount: orderData?.totalAmount || 0,
          currency: orderData?.currency || 'KZT',
          orderDate: orderData?.orderDate || new Date().toISOString().split('T')[0],
          expectedDate: orderData?.expectedDate || '',
          deliveryAddress: orderData?.deliveryAddress || '',
          paymentTerms: orderData?.paymentTerms || '',
          notes: orderData?.notes || ''
        });
        setItems(orderData?.items || []);
      } else {
        const supplierData = selectedData as Supplier;
        setFormData({
          name: supplierData?.name || '',
          contactPerson: supplierData?.contactPerson || '',
          email: supplierData?.email || '',
          phone: supplierData?.phone || '',
          address: supplierData?.address || '',
          taxId: supplierData?.taxId || '',
          bankDetails: supplierData?.bankDetails || '',
          website: supplierData?.website || '',
          notes: supplierData?.notes || ''
        });
      }
    }
  }, [showModal, modalType, selectedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = (modalType.includes('Request') || modalType.includes('Order'))
        ? { ...formData, items }
        : formData;

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: CreatePurchaseRequestItem = {
      name: '',
      category: '',
      quantity: 1,
      unit: 'шт',
      estimatedPrice: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof CreatePurchaseRequestItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);

    // Пересчитываем общую сумму
    const total = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * (item.estimatedPrice || 0));
    }, 0);
    setFormData({ ...formData, totalAmount: total });
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);

    // Пересчитываем общую сумму
    const total = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * (item.estimatedPrice || 0));
    }, 0);
    setFormData({ ...formData, totalAmount: total });
  };

  const isReadOnly = modalType.includes('view');

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {modalType.includes('Request') ? (
              <FileText className="h-6 w-6 text-blue-600" />
            ) : modalType.includes('Order') ? (
              <Package className="h-6 w-6 text-green-600" />
            ) : (
              <Building2 className="h-6 w-6 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {modalType === 'createRequest' && 'Создать заявку на закупку'}
              {modalType === 'editRequest' && 'Редактировать заявку'}
              {modalType === 'viewRequest' && 'Просмотр заявки'}
              {modalType === 'createSupplier' && 'Добавить поставщика'}
              {modalType === 'editSupplier' && 'Редактировать поставщика'}
              {modalType === 'viewSupplier' && 'Просмотр поставщика'}
              {modalType === 'createOrder' && 'Создать заказ на поставку'}
              {modalType === 'editOrder' && 'Редактировать заказ'}
              {modalType === 'viewOrder' && 'Просмотр заказа'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {modalType.includes('Request') ? (
              // Purchase Request Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название заявки *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Введите название заявки"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Приоритет
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={formData.urgency || 'NORMAL'}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="LOW">Низкий</option>
                      <option value="NORMAL">Обычный</option>
                      <option value="HIGH">Высокий</option>
                      <option value="URGENT">Срочный</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Требуемая дата
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.requiredDate || ''}
                      onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Общая сумма
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        disabled={true}
                        value={formData.totalAmount || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100"
                        placeholder="Автоматически рассчитывается"
                      />
                      <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500">
                        {formData.currency || 'KZT'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Дополнительная информация о заявке"
                  />
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Позиции заявки</h3>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить позицию
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Наименование *
                            </label>
                            <input
                              type="text"
                              required
                              disabled={isReadOnly}
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Название товара"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Категория *
                            </label>
                            <input
                              type="text"
                              required
                              disabled={isReadOnly}
                              value={item.category}
                              onChange={(e) => updateItem(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Техника, Мебель..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Кол-во
                              </label>
                              <input
                                type="number"
                                min="1"
                                disabled={isReadOnly}
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ед.изм.
                              </label>
                              <select
                                disabled={isReadOnly}
                                value={item.unit}
                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              >
                                <option value="шт">шт</option>
                                <option value="кг">кг</option>
                                <option value="м">м</option>
                                <option value="л">л</option>
                                <option value="упак">упак</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Цена
                              </label>
                              <input
                                type="number"
                                disabled={isReadOnly}
                                value={item.estimatedPrice || 0}
                                onChange={(e) => updateItem(index, 'estimatedPrice', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Бренд
                            </label>
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={item.brand || ''}
                              onChange={(e) => updateItem(index, 'brand', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Производитель"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Модель
                            </label>
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={item.model || ''}
                              onChange={(e) => updateItem(index, 'model', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Модель товара"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание/Спецификация
                          </label>
                          <textarea
                            disabled={isReadOnly}
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Дополнительные требования и спецификации"
                          />
                        </div>

                        {!isReadOnly && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Нет добавленных позиций</p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Добавить первую позицию
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : modalType.includes('Order') ? (
              // Purchase Order Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер заказа *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.orderNumber || ''}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="PO-2025-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Поставщик *
                    </label>
                    <select
                      required
                      disabled={isReadOnly}
                      value={formData.supplierId || ''}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Выберите поставщика</option>
                      <option value="1">ТОО "Техника Плюс"</option>
                      <option value="2">ИП "Канцтовары"</option>
                      <option value="3">ТОО "Мебель Офис"</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата заказа *
                    </label>
                    <input
                      type="date"
                      required
                      disabled={isReadOnly}
                      value={formData.orderDate || ''}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ожидаемая дата поставки
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.expectedDate || ''}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Общая сумма
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        disabled={true}
                        value={formData.totalAmount || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100"
                        placeholder="Автоматически рассчитывается"
                      />
                      <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500">
                        {formData.currency || 'KZT'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Условия оплаты
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={formData.paymentTerms || ''}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Выберите условия</option>
                      <option value="prepayment">100% предоплата</option>
                      <option value="partial">50% предоплата, 50% по факту</option>
                      <option value="postpayment">Оплата по факту поставки</option>
                      <option value="deferred">Отсрочка 30 дней</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес доставки
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.deliveryAddress || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Полный адрес доставки"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Примечания к заказу
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Дополнительные требования и условия"
                  />
                </div>

                {/* Order Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Позиции заказа</h3>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить позицию
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Наименование *
                            </label>
                            <input
                              type="text"
                              required
                              disabled={isReadOnly}
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Название товара"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Количество *
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              disabled={isReadOnly}
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Единица измерения
                            </label>
                            <select
                              disabled={isReadOnly}
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            >
                              <option value="шт">шт</option>
                              <option value="кг">кг</option>
                              <option value="м">м</option>
                              <option value="л">л</option>
                              <option value="упак">упак</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Цена за единицу *
                            </label>
                            <input
                              type="number"

                              required
                              disabled={isReadOnly}
                              value={item.estimatedPrice || 0}
                              onChange={(e) => updateItem(index, 'estimatedPrice', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </div>

                        {!isReadOnly && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Нет добавленных позиций</p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Добавить первую позицию
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Supplier Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название организации *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="ТОО, ИП и т.д."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Контактное лицо
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="ФИО контактного лица"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      disabled={isReadOnly}
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="+7 777 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ИИН/БИН
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="123456789012"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Веб-сайт
                    </label>
                    <input
                      type="url"
                      disabled={isReadOnly}
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Полный адрес организации"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Банковские реквизиты
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.bankDetails || ''}
                    onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Банк, БИК, счет и т.д."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Примечания
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Дополнительная информация о поставщике"
                  />
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loading />}
              {modalType.includes('create') ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplyModals;
