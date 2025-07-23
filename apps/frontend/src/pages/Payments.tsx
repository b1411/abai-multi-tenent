import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaFilter, 
  FaFileExport, 
  FaBell, 
  FaDownload, 
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBill
} from 'react-icons/fa';
import { Alert } from '../components/ui';
import {
  Payment,
  PaymentSummary,
  SERVICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PaymentFilters,
  CreatePaymentDto
} from '../types/finance';
import { financeService } from '../services/financeService';
import PaymentForm from '../components/PaymentForm';
import { useAuth } from '../hooks/useAuth';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    grade: '',
    serviceType: '',
    status: ''
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [createPaymentLoading, setCreatePaymentLoading] = useState(false);
  const [stats, setStats] = useState<PaymentSummary>({
    totalDue: 0,
    totalPaid: 0,
    overdueCount: 0,
    paidCount: 0,
    collectionRate: 0
  });

  // Проверка прав доступа
  const isParent = user?.role === 'PARENT';
  const canCreatePayments = ['ADMIN', 'FINANCIST'].includes(user?.role || '');

  // Загрузка данных
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await financeService.getPayments(filters);
        setPayments(response.payments);
        setStats(response.summary);
      } catch (err) {
        console.error('Ошибка загрузки платежей:', err);
        setError('Не удалось загрузить данные о платежах');
        setPayments([]);
        setStats({
          totalDue: 0,
          totalPaid: 0,
          overdueCount: 0,
          paidCount: 0,
          collectionRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [filters]);

  // Вычисляемые данные
  const filteredPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) {
      return [];
    }
    
    return payments.filter(payment => {
      const gradeMatch = !filters.grade || payment.grade === filters.grade;
      const serviceTypeMatch = !filters.serviceType || payment.serviceType === filters.serviceType;
      const statusMatch = !filters.status || payment.status === filters.status;
      
      return gradeMatch && serviceTypeMatch && statusMatch;
    });
  }, [payments, filters]);

  // Обработчики событий
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      grade: '',
      serviceType: '',
      status: ''
    });
    setShowFilterModal(false);
  };

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSendReminder = async (id: string) => {
    try {
      await financeService.sendPaymentReminder(id, {
        method: 'email',
        message: 'Напоминание об оплате'
      });
      alert(`Напоминание отправлено для платежа #${id}`);
    } catch (err) {
      console.error('Ошибка при отправке напоминания:', err);
      setError('Ошибка при отправке напоминания');
    }
  };

  const handleGenerateInvoice = async (id: string) => {
    try {
      const blob = await financeService.generateInvoice(id, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка при генерации квитанции:', err);
      setError('Ошибка при генерации квитанции');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await financeService.exportPayments(filters, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка при экспорте данных:', err);
      setError('Ошибка при экспорте данных');
    }
  };

  const handleCreatePayment = async (paymentData: CreatePaymentDto) => {
    try {
      setCreatePaymentLoading(true);
      await financeService.createPayment(paymentData);
      setShowCreatePaymentModal(false);
      // Перезагружаем данные
      const response = await financeService.getPayments(filters);
      setPayments(response.payments);
      setStats(response.summary);
      alert('Платеж успешно создан');
    } catch (err) {
      console.error('Ошибка при создании платежа:', err);
      setError('Ошибка при создании платежа');
    } finally {
      setCreatePaymentLoading(false);
    }
  };

  // Компоненты фильтров
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Все классы</option>
            <option value="7Б">7Б</option>
            <option value="8В">8В</option>
            <option value="9А">9А</option>
            <option value="10Б">10Б</option>
            <option value="11А">11А</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип услуги</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
          >
            <option value="">Все услуги</option>
            <option value="tuition">Основное обучение</option>
            <option value="extra">Дополнительные занятия</option>
            <option value="meals">Питание</option>
            <option value="transportation">Транспорт</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
            <option value="partial">Частично оплачено</option>
            <option value="overdue">Просрочено</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={handleResetFilters}
          >
            Сбросить
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            onClick={() => setShowFilterModal(false)}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );

  // Модальное окно платежа
  const PaymentModal = () => {
    if (!selectedPayment) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Информация о платеже</h3>
            <button onClick={() => setShowPaymentModal(false)} className="text-gray-500">
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Ученик</p>
              <p className="font-medium">{selectedPayment.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Класс</p>
              <p className="font-medium">{selectedPayment.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Услуга</p>
              <p className="font-medium">{selectedPayment.serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Тип услуги</p>
              <p className="font-medium">{SERVICE_TYPE_LABELS[selectedPayment.serviceType]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Сумма</p>
              <p className="font-medium">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Срок оплаты</p>
              <p className="font-medium">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Статус</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${PAYMENT_STATUS_COLORS[selectedPayment.status]}`}>
                {PAYMENT_STATUS_LABELS[selectedPayment.status]}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Дата оплаты</p>
              <p className="font-medium">
                {selectedPayment.paymentDate 
                  ? new Date(selectedPayment.paymentDate).toLocaleDateString() 
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Оплачено</p>
              <p className="font-medium">
                {selectedPayment.paidAmount !== undefined 
                  ? `${selectedPayment.paidAmount.toLocaleString()} ${selectedPayment.currency}` 
                  : '0 ' + selectedPayment.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Остаток</p>
              <p className="font-medium text-red-600">
                {((selectedPayment.amount - (selectedPayment.paidAmount || 0))).toLocaleString()} {selectedPayment.currency}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-sm flex items-center"
              onClick={() => handleSendReminder(selectedPayment.id)}
              disabled={loading}
            >
              <FaBell className="mr-2" /> Отправить напоминание
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center"
              onClick={() => handleGenerateInvoice(selectedPayment.id)}
              disabled={loading}
            >
              <FaDownload className="mr-2" /> Сформировать квитанцию
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Оплаты и задолженности</h1>
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Фильтры и действия */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-2" />
            Фильтры
            {(filters.grade || filters.serviceType || filters.status) && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {canCreatePayments && (
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              onClick={() => setShowCreatePaymentModal(true)}
            >
              <FaMoneyBill className="mr-2" />
              Добавить оплату
            </button>
          )}
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={handleExport}
          >
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Общая сумма к оплате</div>
          <div className="text-2xl font-bold">{stats?.totalDue?.toLocaleString() || '0'} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Собрано оплат</div>
          <div className="text-2xl font-bold">{stats?.totalPaid?.toLocaleString() || '0'} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Процент сбора</div>
          <div className="text-2xl font-bold">{stats?.collectionRate || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${stats?.collectionRate || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Просроченные оплаты</div>
          <div className="text-2xl font-bold text-red-600">{stats?.overdueCount || 0}</div>
        </div>
      </div>

      {/* Таблица платежей */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <FaMoneyBill className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных о платежах</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(Boolean) 
                ? 'Попробуйте изменить фильтры для отображения данных.'
                : 'Данные о платежах пока не загружены или отсутствуют в системе.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ученик
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Услуга
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Срок
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(payment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">Класс: {payment.grade}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.serviceName}</div>
                    <div className="text-sm text-gray-500">{SERVICE_TYPE_LABELS[payment.serviceType]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.amount.toLocaleString()} {payment.currency}</div>
                    {payment.paidAmount !== undefined && payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                      <div className="text-sm text-green-600">Оплачено: {payment.paidAmount.toLocaleString()} {payment.currency}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PAYMENT_STATUS_COLORS[payment.status]}`}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(payment.id);
                      }}
                    >
                      <FaBell />
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateInvoice(payment.id);
                      }}
                    >
                      <FaDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {showPaymentModal && <PaymentModal />}
      
      {/* Форма создания платежа */}
      <PaymentForm
        isOpen={showCreatePaymentModal}
        onClose={() => setShowCreatePaymentModal(false)}
        onSubmit={handleCreatePayment}
        isLoading={createPaymentLoading}
      />
    </div>
  );
};

export default PaymentsPage;
