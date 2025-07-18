import React, { useState, useMemo } from 'react';
import { 
  FaFilter, 
  FaFileExport, 
  FaBell, 
  FaDownload, 
  FaSortAmountDown,
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBill
} from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';

// Типы данных
interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  serviceType: 'tuition' | 'extra' | 'meals' | 'transportation';
  serviceName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  paymentDate?: string;
  paidAmount?: number;
}

// Константы
const serviceTypeLabels = {
  tuition: 'Основное обучение',
  extra: 'Дополнительные занятия',
  meals: 'Питание',
  transportation: 'Транспорт'
};

const statusLabels = {
  paid: 'Оплачено',
  unpaid: 'Не оплачено',
  partial: 'Частично оплачено',
  overdue: 'Просрочено'
};

const statusColors = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-gray-100 text-gray-800',
  partial: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800'
};

// Демо-данные
const initialPayments: Payment[] = [
  {
    id: 'p001',
    studentId: 's001',
    studentName: 'Асанов Алмас',
    grade: '9А',
    serviceType: 'tuition',
    serviceName: 'Обучение за 1 четверть',
    amount: 150000,
    currency: 'KZT',
    dueDate: '2024-09-15',
    status: 'paid',
    paymentDate: '2024-09-10',
    paidAmount: 150000
  },
  {
    id: 'p002',
    studentId: 's002',
    studentName: 'Бекова Айгерим',
    grade: '7Б',
    serviceType: 'tuition',
    serviceName: 'Обучение за 1 четверть',
    amount: 150000,
    currency: 'KZT',
    dueDate: '2024-09-15',
    status: 'overdue',
    paidAmount: 0
  },
  {
    id: 'p003',
    studentId: 's003',
    studentName: 'Серіков Темірлан',
    grade: '11А',
    serviceType: 'extra',
    serviceName: 'Подготовка к ЕНТ',
    amount: 45000,
    currency: 'KZT',
    dueDate: '2024-09-20',
    status: 'unpaid',
    paidAmount: 0
  },
  {
    id: 'p004',
    studentId: 's004',
    studentName: 'Джумабаева Дина',
    grade: '8В',
    serviceType: 'meals',
    serviceName: 'Питание за сентябрь',
    amount: 30000,
    currency: 'KZT',
    dueDate: '2024-09-10',
    status: 'partial',
    paymentDate: '2024-09-05',
    paidAmount: 15000
  },
  {
    id: 'p005',
    studentId: 's005',
    studentName: 'Нуртаев Нурсултан',
    grade: '10Б',
    serviceType: 'transportation',
    serviceName: 'Транспорт за сентябрь',
    amount: 20000,
    currency: 'KZT',
    dueDate: '2024-09-05',
    status: 'paid',
    paymentDate: '2024-09-02',
    paidAmount: 20000
  },
  {
    id: 'p006',
    studentId: 's001',
    studentName: 'Асанов Алмас',
    grade: '9А',
    serviceType: 'extra',
    serviceName: 'Дополнительные уроки английского',
    amount: 35000,
    currency: 'KZT',
    dueDate: '2024-09-25',
    status: 'unpaid',
    paidAmount: 0
  },
  {
    id: 'p007',
    studentId: 's006',
    studentName: 'Кенжебаева Аружан',
    grade: '6А',
    serviceType: 'tuition',
    serviceName: 'Обучение за 1 четверть',
    amount: 145000,
    currency: 'KZT',
    dueDate: '2024-09-15',
    status: 'paid',
    paymentDate: '2024-09-12',
    paidAmount: 145000
  },
  {
    id: 'p008',
    studentId: 's007',
    studentName: 'Абдрахманов Абылай',
    grade: '5В',
    serviceType: 'meals',
    serviceName: 'Питание за сентябрь',
    amount: 30000,
    currency: 'KZT',
    dueDate: '2024-09-10',
    status: 'overdue',
    paidAmount: 0
  },
  {
    id: 'p009',
    studentId: 's008',
    studentName: 'Ахметова Камила',
    grade: '11Б',
    serviceType: 'transportation',
    serviceName: 'Транспорт за сентябрь',
    amount: 20000,
    currency: 'KZT',
    dueDate: '2024-09-05',
    status: 'partial',
    paymentDate: '2024-09-03',
    paidAmount: 10000
  },
  {
    id: 'p010',
    studentId: 's009',
    studentName: 'Бахытжанов Бахыт',
    grade: '10А',
    serviceType: 'tuition',
    serviceName: 'Обучение за 1 четверть',
    amount: 150000,
    currency: 'KZT',
    dueDate: '2024-09-15',
    status: 'paid',
    paymentDate: '2024-09-14',
    paidAmount: 150000
  }
];

// Данные для графика
const monthlyPaymentData = [
  { name: 'Сен', plan: 3500000, actual: 2800000 },
  { name: 'Окт', plan: 3500000, actual: 3200000 },
  { name: 'Ноя', plan: 3500000, actual: 3450000 },
  { name: 'Дек', plan: 3500000, actual: 3350000 },
  { name: 'Янв', plan: 3500000, actual: 3200000 },
  { name: 'Фев', plan: 3500000, actual: 3300000 },
  { name: 'Мар', plan: 3500000, actual: 3400000 },
  { name: 'Апр', plan: 3500000, actual: 3600000 },
  { name: 'Май', plan: 3500000, actual: 3550000 }
];

const PaymentsPage: React.FC = () => {
  // Состояния
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [filters, setFilters] = useState({
    grade: '',
    serviceType: '',
    status: ''
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Вычисляемые данные
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Фильтр по классу
      const gradeMatch = !filters.grade || payment.grade === filters.grade;
      
      // Фильтр по типу услуги
      const serviceTypeMatch = !filters.serviceType || payment.serviceType === filters.serviceType;
      
      // Фильтр по статусу
      const statusMatch = !filters.status || payment.status === filters.status;
      
      return gradeMatch && serviceTypeMatch && statusMatch;
    });
  }, [payments, filters]);

  // Статистика
  const stats = useMemo(() => {
    const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    const overdueCount = payments.filter(payment => payment.status === 'overdue').length;
    const paidCount = payments.filter(payment => payment.status === 'paid').length;
    
    return {
      totalDue,
      totalPaid,
      overdueCount,
      paidCount,
      collectionRate: Math.round((totalPaid / totalDue) * 100)
    };
  }, [payments]);

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

  const handleSendReminder = (id: string) => {
    // Логика отправки напоминания
    alert(`Напоминание отправлено для оплаты #${id}`);
  };

  const handleGenerateInvoice = (id: string) => {
    // Логика генерации квитанции
    alert(`Квитанция сгенерирована для оплаты #${id}`);
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
            <option value="5В">5В</option>
            <option value="6А">6А</option>
            <option value="7Б">7Б</option>
            <option value="8В">8В</option>
            <option value="9А">9А</option>
            <option value="10А">10А</option>
            <option value="10Б">10Б</option>
            <option value="11А">11А</option>
            <option value="11Б">11Б</option>
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
              <p className="font-medium">{serviceTypeLabels[selectedPayment.serviceType]}</p>
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
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[selectedPayment.status]}`}>
                {statusLabels[selectedPayment.status]}
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
            >
              <FaBell className="mr-2" /> Отправить напоминание
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center"
              onClick={() => handleGenerateInvoice(selectedPayment.id)}
            >
              <FaDownload className="mr-2" /> Сформировать квитанцию
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Рендер
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Оплаты и задолженности</h1>
      
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
            <FaMoneyBill className="mr-2" />
            Добавить оплату
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Общая сумма к оплате</div>
          <div className="text-2xl font-bold">{stats.totalDue.toLocaleString()} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Собрано оплат</div>
          <div className="text-2xl font-bold">{stats.totalPaid.toLocaleString()} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Процент сбора</div>
          <div className="text-2xl font-bold">{stats.collectionRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${stats.collectionRate}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Просроченные оплаты</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
        </div>
      </div>

      {/* Таблица платежей */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
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
                    <div className="text-sm text-gray-500">{serviceTypeLabels[payment.serviceType]}</div>
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
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[payment.status]}`}>
                      {statusLabels[payment.status]}
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
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {showPaymentModal && <PaymentModal />}
    </div>
  );
};

export default PaymentsPage; 