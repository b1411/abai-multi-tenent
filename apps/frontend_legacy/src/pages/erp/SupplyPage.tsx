import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaFileExport, FaChartLine, FaEdit, FaTrash } from 'react-icons/fa';
import { CreateRequestModal, ViewRequestModal } from '../../components/erp/supply/SupplyModals';

interface Supplier {
  id: string;
  name: string;
  category: string[];
  rating: number;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

interface SupplyRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Низкий' | 'Средний' | 'Высокий';
  status: 'Черновик' | 'На согласовании' | 'Согласовано' | 'Отклонено' | 'В работе' | 'Выполнено';
  requestedBy: string;
  requestDate: Date;
  estimatedCost: number;
  actualCost?: number;
  supplierId?: string;
  approvalChain: {
    level: number;
    approver: string;
    status: 'Ожидает' | 'Одобрено' | 'Отклонено';
    comment?: string;
    date?: Date;
  }[];
}

const mockRequests: SupplyRequest[] = [
  {
    id: 'REQ-001',
    title: 'Закупка офисной мебели',
    description: 'Необходимо закупить 10 офисных стульев и 5 столов для нового отдела',
    category: 'furniture',
    priority: 'Средний',
    status: 'На согласовании',
    requestedBy: 'Иван Петров',
    requestDate: new Date('2024-03-15'),
    estimatedCost: 150000,
    approvalChain: [
      {
        level: 1,
        approver: 'Анна Сидорова',
        status: 'Одобрено',
        date: new Date('2024-03-16')
      },
      {
        level: 2,
        approver: 'Петр Иванов',
        status: 'Ожидает'
      }
    ]
  },
  {
    id: 'REQ-002',
    title: 'Закупка компьютерной техники',
    description: 'Требуется 5 ноутбуков для разработчиков',
    category: 'tech',
    priority: 'Высокий',
    status: 'Согласовано',
    requestedBy: 'Мария Козлова',
    requestDate: new Date('2024-03-10'),
    estimatedCost: 500000,
    actualCost: 485000,
    approvalChain: [
      {
        level: 1,
        approver: 'Анна Сидорова',
        status: 'Одобрено',
        date: new Date('2024-03-11')
      },
      {
        level: 2,
        approver: 'Петр Иванов',
        status: 'Одобрено',
        date: new Date('2024-03-12')
      }
    ]
  }
];

const SupplyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'suppliers' | 'analytics'>('requests');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [requests, setRequests] = useState<SupplyRequest[]>(mockRequests);

  const handleCreateRequest = (data: any) => {
    const newRequest: SupplyRequest = {
      id: `REQ-${String(requests.length + 1).padStart(3, '0')}`,
      ...data,
      status: 'Черновик',
      requestedBy: 'Текущий пользователь',
      requestDate: new Date(),
      approvalChain: [
        {
          level: 1,
          approver: 'Анна Сидорова',
          status: 'Ожидает'
        }
      ]
    };
    setRequests([...requests, newRequest]);
  };

  const getStatusColor = (status: SupplyRequest['status']) => {
    switch (status) {
      case 'Черновик':
        return 'bg-gray-100 text-gray-800';
      case 'На согласовании':
        return 'bg-yellow-100 text-yellow-800';
      case 'Согласовано':
        return 'bg-green-100 text-green-800';
      case 'Отклонено':
        return 'bg-red-100 text-red-800';
      case 'В работе':
        return 'bg-blue-100 text-blue-800';
      case 'Выполнено':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupplyRequest['priority']) => {
    switch (priority) {
      case 'Низкий':
        return 'text-gray-600';
      case 'Средний':
        return 'text-yellow-600';
      case 'Высокий':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление снабжением</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus /> Создать заявку
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <FaFileExport /> Экспорт
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Заявки
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'suppliers' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Поставщики
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Аналитика
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
          <FaFilter /> Фильтры
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {activeTab === 'requests' && (
          <div className="p-4">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Название</th>
                  <th className="text-left py-2">Приоритет</th>
                  <th className="text-left py-2">Статус</th>
                  <th className="text-left py-2">Дата запроса</th>
                  <th className="text-left py-2">Сумма</th>
                  <th className="text-left py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="py-2">{request.id}</td>
                    <td className="py-2">{request.title}</td>
                    <td className="py-2">
                      <span className={getPriorityColor(request.priority)}>{request.priority}</span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2">{request.requestDate.toLocaleDateString()}</td>
                    <td className="py-2">{request.estimatedCost.toLocaleString()} ₽</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Добавить функционал редактирования
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Добавить функционал удаления
                          }}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Каталог поставщиков</h2>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FaPlus /> Добавить поставщика
              </button>
            </div>
            <p className="text-gray-500">Функционал в разработке</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Аналитика закупок</h2>
              <div className="flex gap-4">
                <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
                  <FaFileExport /> Экспорт отчета
                </button>
              </div>
            </div>
            <p className="text-gray-500">Функционал в разработке</p>
          </div>
        )}
      </div>

      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRequest}
      />

      {selectedRequest && (
        <ViewRequestModal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

export default SupplyPage;
