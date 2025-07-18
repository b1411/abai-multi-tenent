import React, { useState, useMemo } from 'react';
import {
  FaBarcode,
  FaQrcode,
  FaSearch,
  FaFilter,
  FaPlus,
  FaFileExport,
  FaHistory,
  FaChartBar,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaPrint,
  FaExchangeAlt
} from 'react-icons/fa';
import { ItemModal, FilterModal, ScannerModal, ViewModal } from '../../components/erp/inventory/InventoryModals';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'active' | 'repair' | 'written-off' | 'lost';
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
    start: string;
    end: string;
    provider: string;
  };
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    provider: string;
  };
  movements?: Array<{
    date: string;
    fromLocation: string;
    toLocation: string;
    responsible: string;
    reason: string;
  }>;
}

const InventoryPage: React.FC = () => {
  // Состояния
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Интерактивная доска Samsung Flip 3',
      category: 'Техника',
      location: 'Кабинет 204',
      status: 'active',
      purchaseDate: '2024-01-15',
      lastInventory: '2024-03-01',
      cost: 850000,
      currentValue: 807500,
      responsible: 'Иванов А.П.',
      serialNumber: 'SF3-2024-001',
      manufacturer: 'Samsung',
      model: 'Flip 3',
      warranty: {
        start: '2024-01-15',
        end: '2027-01-15',
        provider: 'Samsung Kazakhstan'
      },
      maintenanceSchedule: {
        lastMaintenance: '2024-02-15',
        nextMaintenance: '2024-05-15',
        provider: 'TechService Ltd'
      }
    },
    // Добавьте больше примеров...
  ]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    location: ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Фильтрация элементов
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesLocation = !filters.location || item.location === filters.location;

      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [items, searchQuery, filters]);

  // Обработчики
  const handleScan = (result: string) => {
    // Здесь будет логика обработки результатов сканирования
    console.log('Scan result:', result);
    setShowScannerModal(false);
  };

  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
    };
    setItems([...items, newItem]);
  };

  const handleEditItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleExport = () => {
    // Экспорт данных
  };

  const handleApplyFilters = (newFilters: { category: string; status: string; location: string }) => {
    setFilters(newFilters);
  };

  // Обработчик для открытия модального окна просмотра
  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Заголовок и основные действия */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Digital инвентаризация</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
          >
            <FaQrcode className="mr-2" />
            Сканировать
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
          >
            <FaPlus className="mr-2" />
            Добавить
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-corporate-primary text-corporate-primary rounded-lg hover:bg-corporate-primary/10 transition-colors"
          >
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Поиск по названию, серийному номеру или штрих-коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaFilter className="mr-2 text-gray-400" />
          Фильтры
        </button>
      </div>

      {/* Таблица инвентаря */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Наименование
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Категория
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Местоположение
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Стоимость
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ответственный
              </th>
              <th className="px-6 py-3 relative">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(item)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.serialNumber && `S/N: ${item.serialNumber}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <FaMapMarkerAlt className="text-gray-400 mr-2" />
                    {item.location}
                  </div>
                </td>
                <td className="px-6 py-4">
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
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{item.currentValue.toLocaleString()} тг</div>
                  <div className="text-xs text-gray-500">
                    Начальная: {item.cost.toLocaleString()} тг
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.responsible}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item.id, {});
                    }}
                    className="text-corporate-primary hover:text-corporate-primary/80 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальные окна */}
      <ItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleScan}
      />

      {selectedItem && (
        <ViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
    </div>
  );
};

export default InventoryPage;
