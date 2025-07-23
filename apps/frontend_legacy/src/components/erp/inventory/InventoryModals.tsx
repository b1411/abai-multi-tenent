import React, { useState } from 'react';
import { FaTimes, FaQrcode, FaBarcode, FaHistory, FaCamera, FaMapMarkerAlt, FaCalendarAlt, FaUserCog, FaTools, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import { InventoryItem, CreateInventoryItem, InventoryFilters } from '../../../api/inventoryService';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemModalProps extends ModalProps {
  item?: CreateInventoryItem;
  onSave: (item: CreateInventoryItem) => void;
}

interface FilterModalProps extends ModalProps {
  filters: InventoryFilters;
  onApply: (filters: InventoryFilters) => void;
}

interface ScannerModalProps extends ModalProps {
  onScan: (result: string) => void;
}

interface ViewModalProps extends ModalProps {
  item: InventoryItem;
}

// Базовый компонент модального окна
const Modal: React.FC<{ children: React.ReactNode } & ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

// Модальное окно добавления/редактирования
export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = React.useState<Omit<InventoryItem, 'id'>>(
    item || {
      name: '',
      category: '',
      location: '',
      status: 'active',
      purchaseDate: '',
      lastInventory: new Date().toISOString().split('T')[0],
      cost: 0,
      currentValue: 0,
      responsible: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Наименование</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Категория</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Выберите категорию</option>
                <option value="Техника">Техника</option>
                <option value="Мебель">Мебель</option>
                <option value="Учебные материалы">Учебные материалы</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Статус</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="active">Активен</option>
                <option value="repair">В ремонте</option>
                <option value="written-off">Списан</option>
                <option value="lost">Утерян</option>
              </select>
            </div>
          </div>
          {/* Дополнительные поля */}
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-corporate-primary text-base font-medium text-white hover:bg-corporate-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:ml-3 sm:w-auto sm:text-sm"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Модальное окно фильтров
export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Категория</label>
          <select
            value={localFilters.category}
            onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Все категории</option>
            <option value="Техника">Техника</option>
            <option value="Мебель">Мебель</option>
            <option value="Учебные материалы">Учебные материалы</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Статус</label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as any })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Все статусы</option>
            <option value="active">Активен</option>
            <option value="repair">В ремонте</option>
            <option value="written-off">Списан</option>
            <option value="lost">Утерян</option>
          </select>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleApply}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-corporate-primary text-base font-medium text-white hover:bg-corporate-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:ml-3 sm:w-auto sm:text-sm"
        >
          Применить
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        >
          Отмена
        </button>
      </div>
    </Modal>
  );
};

// Модальное окно сканера
export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => onScan('qr')}
            className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90"
          >
            <FaQrcode className="mr-2" />
            Сканировать QR-код
          </button>
          <button
            onClick={() => onScan('barcode')}
            className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90"
          >
            <FaBarcode className="mr-2" />
            Сканировать штрих-код
          </button>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:w-auto sm:text-sm"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
};

// Модальное окно просмотра
export const ViewModal: React.FC<ViewModalProps> = ({ isOpen, onClose, item }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'photos'>('info');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-medium text-gray-900">{item.name}</h3>
          <button
            onClick={onClose}
            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === 'info'
                ? 'border-b-2 border-corporate-primary text-corporate-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <FaInfoCircle className="inline-block mr-2" />
            Информация
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'history'
                ? 'border-b-2 border-corporate-primary text-corporate-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory className="inline-block mr-2" />
            История
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'photos'
                ? 'border-b-2 border-corporate-primary text-corporate-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('photos')}
          >
            <FaCamera className="inline-block mr-2" />
            Фото
          </button>
        </div>

        {/* Содержимое вкладок */}
        <div className="space-y-6">
          {activeTab === 'info' && (
            <>
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Основная информация</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Категория</p>
                      <p className="text-sm font-medium text-gray-900">{item.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Статус</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'repair' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'written-off' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'active' ? 'Активен' :
                         item.status === 'repair' ? 'В ремонте' :
                         item.status === 'written-off' ? 'Списан' :
                         'Утерян'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Серийный номер</p>
                      <p className="text-sm font-medium text-gray-900">{item.serialNumber}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Местоположение и стоимость</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Местоположение</p>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-gray-400 mr-1" />
                        <p className="text-sm font-medium text-gray-900">{item.location}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Текущая стоимость</p>
                      <p className="text-sm font-medium text-gray-900">{item.currentValue.toLocaleString()} тг</p>
                      <p className="text-xs text-gray-500">Начальная: {item.cost.toLocaleString()} тг</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Гарантия и обслуживание */}
              {(item.warranty || item.maintenanceSchedule) && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {item.warranty && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Гарантия</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-500">Действует до</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(item.warranty.end).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Поставщик</p>
                            <p className="text-sm font-medium text-gray-900">{item.warranty.provider}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {item.maintenanceSchedule && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Техническое обслуживание</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-500">Последнее ТО</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(item.maintenanceSchedule.lastMaintenance).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Следующее ТО</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(item.maintenanceSchedule.nextMaintenance).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">История перемещений и обслуживания</h4>
              {item.movements && item.movements.length > 0 ? (
                <div className="space-y-4">
                  {item.movements.map((movement, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {movement.fromLocation} → {movement.toLocation}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ответственный: {movement.responsible}
                          </p>
                          <p className="text-xs text-gray-500">
                            Причина: {movement.reason}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(movement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">История перемещений отсутствует</p>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">Фотографии</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Здесь будут фотографии */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Фото отсутствует</p>
                </div>
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Фото отсутствует</p>
                </div>
              </div>
              <button
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaCamera className="mr-2" />
                Добавить фото
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary sm:text-sm"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
};
