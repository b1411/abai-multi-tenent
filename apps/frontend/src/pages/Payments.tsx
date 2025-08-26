import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaFilter, 
  FaFileExport, 
  FaBell, 
  FaDownload, 
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBill,
  FaUsers
} from 'react-icons/fa';
import { Alert } from '../components/ui';
import {
  SERVICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  CreatePaymentDto
} from '../types/finance';
import paymentsService, { Payment, PaymentSummary, PaymentFilters } from '../services/paymentsService';
import PaymentForm from '../components/PaymentForm';
import GroupPaymentForm from '../components/GroupPaymentForm';
import InvoiceGenerator from '../components/InvoiceGenerator';
import { useAuth } from '../hooks/useAuth';
import { groupPaymentService, CreateGroupPaymentDto, GroupPaymentResult } from '../services/groupPaymentService';

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
  const [showGroupPaymentModal, setShowGroupPaymentModal] = useState(false);
  const [createPaymentLoading, setCreatePaymentLoading] = useState(false);
  const [groupPaymentLoading, setGroupPaymentLoading] = useState(false);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [invoicePaymentId, setInvoicePaymentId] = useState<string | null>(null);
  const [invoiceStudentId, setInvoiceStudentId] = useState<string | null>(null);
  const [invoiceMode, setInvoiceMode] = useState<'single' | 'summary'>('single');
  const [invoiceStudentName, setInvoiceStudentName] = useState<string>('');
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
        const response = await paymentsService.getPayments(filters);
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
      await paymentsService.sendPaymentReminder(id, {
        method: 'email',
        message: 'Напоминание об оплате'
      });
      alert(`Напоминание отправлено для платежа #${id}`);
    } catch (err) {
      console.error('Ошибка при отправке напоминания:', err);
      setError('Ошибка при отправке напоминания');
    }
  };

  const handleGenerateInvoice = (payment: Payment) => {
    setInvoicePaymentId(payment.id);
    setInvoiceStudentId(payment.studentId);
    setInvoiceStudentName(payment.studentName);
    setInvoiceMode('single');
    setShowInvoiceGenerator(true);
  };

  const handleGenerateSummaryInvoice = (payment: Payment) => {
    setInvoicePaymentId(null);
    setInvoiceStudentId(payment.studentId);
    setInvoiceStudentName(payment.studentName);
    setInvoiceMode('summary');
    setShowInvoiceGenerator(true);
  };

  const handleCloseInvoiceGenerator = () => {
    setShowInvoiceGenerator(false);
    setInvoicePaymentId(null);
    setInvoiceStudentId(null);
    setInvoiceStudentName('');
  };

  const handleExport = async () => {
    try {
      const blob = await paymentsService.exportPayments(filters, 'xlsx');
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
      await paymentsService.createPayment(paymentData);
      setShowCreatePaymentModal(false);
      // Перезагружаем данные
      const response = await paymentsService.getPayments(filters);
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

  const handleCreateGroupPayment = async (paymentData: CreateGroupPaymentDto) => {
    try {
      setGroupPaymentLoading(true);
      const result = await groupPaymentService.createGroupPayment(paymentData);
      setShowGroupPaymentModal(false);
      
      // Показываем результат
      let message = `Групповой платеж создан для группы "${result.groupName}":\n`;
      message += `• Создано платежей: ${result.createdPayments}\n`;
      message += `• Обработано студентов: ${result.processedStudents} из ${result.totalStudents}\n`;
      
      if (result.errors.length > 0) {
        message += `\nОшибки:\n`;
        result.errors.forEach(error => {
          message += `• ${error.studentName}: ${error.error}\n`;
        });
      }
      
      alert(message);
      
      // Перезагружаем данные
      const response = await paymentsService.getPayments(filters);
      setPayments(response.payments);
      setStats(response.summary);
    } catch (err) {
      console.error('Ошибка при создании группового платежа:', err);
      setError('Ошибка при создании группового платежа');
    } finally {
      setGroupPaymentLoading(false);
    }
  };

  // Компоненты фильтров
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
            value={filters.grade || ''}
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
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
            value={filters.serviceType || ''}
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
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
            <option value="partial">Частично оплачено</option>
            <option value="overdue">Просрочено</option>
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={handleResetFilters}
          >
            Сбросить
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
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
    // Локальные состояния редактирования (инициализация допускает отсутствие selectedPayment)
    const [editStatus, setEditStatus] = useState<string>(selectedPayment?.status || 'unpaid');
    const [editPaidAmount, setEditPaidAmount] = useState<number>(selectedPayment?.paidAmount || 0);
    const [editPaymentDate, setEditPaymentDate] = useState<string>(selectedPayment?.paymentDate ? selectedPayment.paymentDate.split('T')[0] : '');
    const [saving, setSaving] = useState(false);

    // Синхронизация при смене выбранного платежа
    useEffect(() => {
      if (selectedPayment) {
        setEditStatus(selectedPayment.status);
        setEditPaidAmount(selectedPayment.paidAmount || 0);
        setEditPaymentDate(selectedPayment.paymentDate ? selectedPayment.paymentDate.split('T')[0] : '');
      }
    }, [selectedPayment]);

    if (!selectedPayment) return null;

    const statusOptions = [
      { value: 'unpaid', label: 'Не оплачено' },
      { value: 'partial', label: 'Частично оплачено' },
      { value: 'paid', label: 'Оплачено' },
      { value: 'overdue', label: 'Просрочено' },
    ];

    const handleSave = async () => {
      try {
        setSaving(true);
        const payload: any = {
          status: editStatus,
        };

        if (editStatus === 'paid') {
          payload.paidAmount = editPaidAmount || selectedPayment.amount;
          payload.paymentDate = editPaymentDate || new Date().toISOString().split('T')[0];
        } else if (editStatus === 'partial') {
          payload.paidAmount = editPaidAmount;
          if (editPaymentDate) payload.paymentDate = editPaymentDate;
        } else {
          // unpaid / overdue
          payload.paidAmount = editStatus === 'unpaid' ? 0 : editPaidAmount;
          if (editPaymentDate) payload.paymentDate = editPaymentDate;
        }

        await paymentsService.updatePayment(selectedPayment.id, payload);
        const response = await paymentsService.getPayments(filters);
        setPayments(response.payments);
        setStats(response.summary);
        const refreshed = response.payments.find(p => p.id === selectedPayment.id);
        if (refreshed) setSelectedPayment(refreshed);
        alert('Платеж обновлен');
      } catch (e) {
        console.error(e);
        setError('Ошибка обновления платежа');
      } finally {
        setSaving(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Информация о платеже</h3>
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="text-gray-500 text-2xl leading-none hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Ученик</p>
              <p className="font-medium text-sm sm:text-base">{selectedPayment.studentName}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Класс</p>
              <p className="font-medium text-sm sm:text-base">{selectedPayment.grade}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs sm:text-sm text-gray-500">Услуга</p>
              <p className="font-medium text-sm sm:text-base">{selectedPayment.serviceName}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs sm:text-sm text-gray-500">Тип услуги</p>
              <p className="font-medium text-sm sm:text-base">{SERVICE_TYPE_LABELS[selectedPayment.serviceType as keyof typeof SERVICE_TYPE_LABELS] || selectedPayment.serviceType}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Сумма</p>
              <p className="font-medium text-sm sm:text-base">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Срок оплаты</p>
              <p className="font-medium text-sm sm:text-base">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Статус</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${PAYMENT_STATUS_COLORS[selectedPayment.status as keyof typeof PAYMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                {PAYMENT_STATUS_LABELS[selectedPayment.status as keyof typeof PAYMENT_STATUS_LABELS] || selectedPayment.status}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Дата оплаты</p>
              <p className="font-medium text-sm sm:text-base">
                {selectedPayment.paymentDate 
                  ? new Date(selectedPayment.paymentDate).toLocaleDateString() 
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Оплачено</p>
              <p className="font-medium text-sm sm:text-base">
                {selectedPayment.paidAmount !== undefined 
                  ? `${selectedPayment.paidAmount.toLocaleString()} ${selectedPayment.currency}` 
                  : '0 ' + selectedPayment.currency}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Остаток</p>
              <p className="font-medium text-red-600 text-sm sm:text-base">
                {((selectedPayment.amount - (selectedPayment.paidAmount || 0))).toLocaleString()} {selectedPayment.currency}
              </p>
            </div>
          </div>

          {!isParent && (
            <div className="border-t pt-4 mb-4">
              <h4 className="text-sm font-semibold mb-3">Изменить статус</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Статус</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {(editStatus === 'partial' || editStatus === 'paid') && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Оплачено (KZT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(parseInt(e.target.value || '0', 10))}
                    />
                  </div>
                )}
                {(editStatus === 'partial' || editStatus === 'paid') && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Дата оплаты</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      value={editPaymentDate}
                      onChange={(e) => setEditPaymentDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-60"
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {!isParent && (
              <button
                className="w-full sm:w-auto px-3 py-2 sm:px-4 border border-gray-300 rounded-md text-xs sm:text-sm flex items-center justify-center"
                onClick={() => handleSendReminder(selectedPayment.id)}
                disabled={loading}
              >
                <FaBell className="mr-1 sm:mr-2" /> 
                <span className="hidden sm:inline">Отправить напоминание</span>
                <span className="sm:hidden">Напоминание</span>
              </button>
            )}
            <button
              className="w-full sm:w-auto px-3 py-2 sm:px-4 border border-blue-600 text-blue-600 rounded-md text-xs sm:text-sm flex items-center justify-center"
              onClick={() => handleGenerateSummaryInvoice(selectedPayment)}
              disabled={loading}
            >
              <FaDownload className="mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">Сводная квитанция</span>
              <span className="sm:hidden">Сводная</span>
            </button>
            <button
              className="w-full sm:w-auto px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-md text-xs sm:text-sm flex items-center justify-center"
              onClick={() => handleGenerateInvoice(selectedPayment)}
              disabled={loading}
            >
              <FaDownload className="mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">Сформировать квитанцию</span>
              <span className="sm:hidden">Квитанция</span>
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
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        {isParent ? 'Платежи моих детей' : 'Оплаты и задолженности'}
      </h1>
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Фильтры и действия */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <button 
            className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Фильтры</span>
            <span className="sm:hidden">Фильтр</span>
            {(filters.grade || filters.serviceType || filters.status) && (
              <span className="ml-1 sm:ml-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
          {canCreatePayments && (
            <>
              <button 
                className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap"
                onClick={() => setShowCreatePaymentModal(true)}
              >
                <FaMoneyBill className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Добавить оплату</span>
                <span className="sm:hidden">Оплата</span>
              </button>
              <button 
                className="px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors flex items-center whitespace-nowrap"
                onClick={() => setShowGroupPaymentModal(true)}
              >
                <FaUsers className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Групповой платеж</span>
                <span className="sm:hidden">Группа</span>
              </button>
            </>
          )}
          <button 
            className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center whitespace-nowrap"
            onClick={handleExport}
          >
            <FaFileExport className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Экспорт</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Общая сумма к оплате</div>
          <div className="text-lg sm:text-2xl font-bold">{stats?.totalDue?.toLocaleString() || '0'} KZT</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">{isParent ? 'Оплачено' : 'Собрано оплат'}</div>
          <div className="text-lg sm:text-2xl font-bold">{stats?.totalPaid?.toLocaleString() || '0'} KZT</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">{isParent ? 'Процент оплаты' : 'Процент сбора'}</div>
          <div className="text-lg sm:text-2xl font-bold">{stats?.collectionRate || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2 sm:h-2.5 rounded-full" 
              style={{ width: `${stats?.collectionRate || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Просроченные оплаты</div>
          <div className="text-lg sm:text-2xl font-bold text-red-600">{stats?.overdueCount || 0}</div>
        </div>
      </div>

      {/* Таблица платежей */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-gray-500 mb-4">
              <FaMoneyBill className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Нет данных о платежах</h3>
            <p className="text-sm sm:text-base text-gray-500 px-2">
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
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ученик
                </th>
                <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Услуга
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Срок
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-xs text-gray-500">Класс: {payment.grade}</div>
                        <div className="sm:hidden text-xs text-gray-500 mt-1">{payment.serviceName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.serviceName}</div>
                    <div className="text-sm text-gray-500">{SERVICE_TYPE_LABELS[payment.serviceType as keyof typeof SERVICE_TYPE_LABELS] || payment.serviceType}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900 font-medium">{payment.amount.toLocaleString()} {payment.currency}</div>
                    {payment.paidAmount !== undefined && payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                      <div className="text-xs text-green-600">Оплачено: {payment.paidAmount.toLocaleString()}</div>
                    )}
                    <div className="md:hidden text-xs text-gray-500 mt-1">{new Date(payment.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                      <span className="hidden sm:inline">{PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] || payment.status}</span>
                      <span className="sm:hidden">
                        {payment.status === 'paid' ? 'ОК' : 
                         payment.status === 'unpaid' ? 'НЕТ' : 
                         payment.status === 'partial' ? 'ЧАСТ' : 
                         payment.status === 'overdue' ? 'ПРОСР' : payment.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1 sm:space-x-2">
                      {!isParent && (
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-0.5 sm:p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendReminder(payment.id);
                          }}
                          title="Отправить напоминание"
                        >
                          <FaBell className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                      <button 
                        className="text-purple-600 hover:text-purple-900 p-0.5 sm:p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateSummaryInvoice(payment);
                        }}
                        title="Сводная квитанция"
                      >
                        <FaFileExport className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 p-0.5 sm:p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateInvoice(payment);
                        }}
                        title="Квитанция"
                      >
                        <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
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

      {/* Форма группового платежа */}
      <GroupPaymentForm
        isOpen={showGroupPaymentModal}
        onClose={() => setShowGroupPaymentModal(false)}
        onSubmit={handleCreateGroupPayment}
        isLoading={groupPaymentLoading}
      />

      {/* Генератор квитанций */}
      <InvoiceGenerator
        isOpen={showInvoiceGenerator}
        onClose={handleCloseInvoiceGenerator}
        paymentId={invoicePaymentId || undefined}
        studentId={invoiceStudentId || undefined}
        mode={invoiceMode}
        studentName={invoiceStudentName}
      />
    </div>
  );
};

export default PaymentsPage;
