import React, { useState, useEffect } from 'react';
import { X, Package, QrCode, Calendar, FileText, Upload, Camera, Trash2 } from 'lucide-react';
import { Loading } from '../ui';
import { InventoryStatus } from '../../services/inventoryService';

export interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  location: string;
  status: InventoryStatus;
  purchaseDate: string;
  lastInventory: string;
  cost: number;
  currentValue: number;
  responsible: string;
  qrCode?: string;
  barcode?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  photos?: string[];
  warranty?: {
    start?: string;
    end?: string;
    provider?: string;
  };
  maintenanceSchedule?: {
    lastMaintenance?: string;
    nextMaintenance?: string;
    provider?: string;
  };
}

export interface InventoryMovement {
  id?: number;
  inventoryId: number;
  fromLocation: string;
  toLocation: string;
  responsible: string;
  reason: string;
  date: string;
}

interface InventoryModalsProps {
  showModal: boolean;
  modalType: 'createItem' | 'editItem' | 'viewItem' | 'moveItem' | 'maintenance';
  selectedItem?: InventoryItem;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const InventoryModals: React.FC<InventoryModalsProps> = ({
  showModal,
  modalType,
  selectedItem,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (showModal && selectedItem) {
      if (modalType === 'moveItem') {
        setFormData({
          fromLocation: selectedItem.location || '',
          toLocation: '',
          responsible: '',
          reason: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (modalType === 'maintenance') {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          provider: selectedItem.maintenanceSchedule?.provider || '',
          description: '',
          nextMaintenanceDate: '',
          cost: 0
        });
      } else {
        setFormData({
          name: selectedItem?.name || '',
          category: selectedItem?.category || '',
          location: selectedItem?.location || '',
          status: selectedItem?.status || InventoryStatus.ACTIVE,
          purchaseDate: selectedItem?.purchaseDate || new Date().toISOString().split('T')[0],
          lastInventory: selectedItem?.lastInventory || new Date().toISOString().split('T')[0],
          cost: selectedItem?.cost || 0,
          currentValue: selectedItem?.currentValue || 0,
          responsible: selectedItem?.responsible || '',
          qrCode: selectedItem?.qrCode || '',
          barcode: selectedItem?.barcode || '',
          serialNumber: selectedItem?.serialNumber || '',
          manufacturer: selectedItem?.manufacturer || '',
          model: selectedItem?.model || '',
          warranty: selectedItem?.warranty || {},
          maintenanceSchedule: selectedItem?.maintenanceSchedule || {}
        });
        setPhotos(selectedItem?.photos || []);
      }
    } else if (showModal) {
      // Создание нового предмета
      setFormData({
        name: '',
        category: '',
        location: '',
        status: InventoryStatus.ACTIVE,
        purchaseDate: new Date().toISOString().split('T')[0],
        lastInventory: new Date().toISOString().split('T')[0],
        cost: 0,
        currentValue: 0,
        responsible: '',
        qrCode: '',
        barcode: '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        warranty: {},
        maintenanceSchedule: {}
      });
      setPhotos([]);
    }
  }, [showModal, modalType, selectedItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let dataToSave: any;

      if (modalType === 'moveItem') {
        dataToSave = {
          inventoryId: selectedItem?.id,
          ...formData
        };
      } else if (modalType === 'maintenance') {
        dataToSave = {
          inventoryId: selectedItem?.id,
          ...formData
        };
      } else {
        // Подготавливаем данные для создания/редактирования предмета
        dataToSave = {
          ...formData,
          photos
        };

        // Обрабатываем warranty - отправляем только если есть хотя бы одно заполненное поле
        if (formData.warranty && (formData.warranty.start || formData.warranty.end || formData.warranty.provider)) {
          dataToSave.warranty = {
            start: formData.warranty.start || '',
            end: formData.warranty.end || '',
            provider: formData.warranty.provider || ''
          };
        } else {
          delete dataToSave.warranty;
        }

        // Обрабатываем maintenanceSchedule - отправляем только если есть хотя бы одно заполненное поле
        if (formData.maintenanceSchedule && (formData.maintenanceSchedule.lastMaintenance || formData.maintenanceSchedule.nextMaintenance || formData.maintenanceSchedule.provider)) {
          dataToSave.maintenanceSchedule = {
            lastMaintenance: formData.maintenanceSchedule.lastMaintenance || '',
            nextMaintenance: formData.maintenanceSchedule.nextMaintenance || '',
            provider: formData.maintenanceSchedule.provider || ''
          };
        } else {
          delete dataToSave.maintenanceSchedule;
        }
      }

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = () => {
    const photoUrl = prompt('Введите URL фотографии:');
    if (photoUrl) {
      setPhotos([...photos, photoUrl]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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

  const isReadOnly = modalType === 'viewItem';

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {modalType === 'createItem' && 'Добавить предмет'}
              {modalType === 'editItem' && 'Редактировать предмет'}
              {modalType === 'viewItem' && 'Просмотр предмета'}
              {modalType === 'moveItem' && 'Перемещение предмета'}
              {modalType === 'maintenance' && 'Обслуживание предмета'}
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
            {modalType === 'moveItem' ? (
              // Movement Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текущее местоположение
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.fromLocation || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Новое местоположение *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.toLocation || ''}
                      onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Кабинет 101, Склад А..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ответственный *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.responsible || ''}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ФИО ответственного"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата перемещения *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Причина перемещения *
                  </label>
                  <textarea
                    required
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Укажите причину перемещения..."
                  />
                </div>
              </>
            ) : modalType === 'maintenance' ? (
              // Maintenance Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата обслуживания *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Поставщик услуг
                    </label>
                    <input
                      type="text"
                      value={formData.provider || ''}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Название компании"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Следующее обслуживание
                    </label>
                    <input
                      type="date"
                      value={formData.nextMaintenanceDate || ''}
                      onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Стоимость обслуживания
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cost || 0}
                      onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Сумма в тенге"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание работ *
                  </label>
                  <textarea
                    required
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Подробно опишите выполненные работы..."
                  />
                </div>
              </>
            ) : (
              // Item Form (create/edit/view)
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Наименование *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Название предмета"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категория *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Техника, Мебель, Канцтовары..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Местоположение *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Кабинет 101, Склад А..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Статус
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={formData.status || InventoryStatus.ACTIVE}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value={InventoryStatus.ACTIVE}>Активен</option>
                      <option value={InventoryStatus.REPAIR}>В ремонте</option>
                      <option value={InventoryStatus.WRITTEN_OFF}>Списан</option>
                      <option value={InventoryStatus.LOST}>Утерян</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата покупки *
                    </label>
                    <input
                      type="date"
                      required
                      disabled={isReadOnly}
                      value={formData.purchaseDate || ''}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Последняя инвентаризация
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.lastInventory || ''}
                      onChange={(e) => setFormData({ ...formData, lastInventory: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Первоначальная стоимость *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      disabled={isReadOnly}
                      value={formData.cost || 0}
                      onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Сумма в тенге"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текущая стоимость
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isReadOnly}
                      value={formData.currentValue || 0}
                      onChange={(e) => setFormData({ ...formData, currentValue: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Сумма в тенге"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ответственный *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.responsible || ''}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="ФИО ответственного"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Производитель
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.manufacturer || ''}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Название производителя"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Модель
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.model || ''}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Модель предмета"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Серийный номер
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.serialNumber || ''}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Серийный номер"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR код
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.qrCode || ''}
                      onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="QR код предмета"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Штрих-код
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Штрих-код предмета"
                    />
                  </div>
                </div>

                {/* Warranty Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Гарантия</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Начало гарантии
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={formData.warranty?.start || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          warranty: { ...formData.warranty, start: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Окончание гарантии
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={formData.warranty?.end || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          warranty: { ...formData.warranty, end: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Поставщик гарантии
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={formData.warranty?.provider || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          warranty: { ...formData.warranty, provider: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        placeholder="Название организации"
                      />
                    </div>
                  </div>
                </div>

                {/* Maintenance Schedule */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">График обслуживания</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Последнее обслуживание
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={formData.maintenanceSchedule?.lastMaintenance || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          maintenanceSchedule: { ...formData.maintenanceSchedule, lastMaintenance: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Следующее обслуживание
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={formData.maintenanceSchedule?.nextMaintenance || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          maintenanceSchedule: { ...formData.maintenanceSchedule, nextMaintenance: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Поставщик услуг
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={formData.maintenanceSchedule?.provider || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          maintenanceSchedule: { ...formData.maintenanceSchedule, provider: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        placeholder="Название организации"
                      />
                    </div>
                  </div>
                </div>

                {/* Photos Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Фотографии</h3>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addPhoto}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Добавить фото
                      </button>
                    )}
                  </div>

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x120?text=Фото';
                            }}
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Нет добавленных фотографий</p>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={addPhoto}
                          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Добавить первое фото
                        </button>
                      )}
                    </div>
                  )}
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
              {modalType === 'createItem' ? 'Создать' : 
               modalType === 'moveItem' ? 'Переместить' :
               modalType === 'maintenance' ? 'Записать' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryModals;
