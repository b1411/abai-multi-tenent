import React, { useState, useRef } from 'react';
import { 
  FaPlus, 
  FaFilter, 
  FaSearch, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaFileExport,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaTimes,
  FaPaperclip,
  FaFileUpload,
  FaFileDownload,
  FaFilePdf
} from 'react-icons/fa';

// Типы данных
type VacationType = 'vacation' | 'sick-leave' | 'maternity-leave' | 'unpaid-leave' | 'business-trip';
type VacationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  type: VacationType;
  startDate: string;
  endDate: string;
  days: number;
  status: VacationStatus;
  substituteId?: string;
  substituteName?: string;
  comment?: string;
  lectureTopics?: string;
  documents?: {
    name: string;
    url: string;
    size: number;
    uploadDate: string;
  }[];
}

interface VacationSummary {
  employeeId: string;
  employeeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  sickLeaveDays: number;
}

// Данные для демонстрации
const initialVacations: Vacation[] = [
  {
    id: 'v001',
    employeeId: '001',
    employeeName: 'Иванов Иван Иванович',
    department: 'Кафедра математики',
    position: 'Учитель математики',
    type: 'vacation',
    startDate: '2024-06-15',
    endDate: '2024-07-12',
    days: 28,
    status: 'approved',
    substituteId: '005',
    substituteName: 'Смирнов Дмитрий Игоревич',
    comment: 'Плановый отпуск'
  },
  {
    id: 'v002',
    employeeId: '002',
    employeeName: 'Петрова Мария Сергеевна',
    department: 'Кафедра филологии',
    position: 'Учитель русского языка',
    type: 'vacation',
    startDate: '2024-07-01',
    endDate: '2024-07-28',
    days: 28,
    status: 'pending',
    comment: 'Плановый отпуск'
  },
  {
    id: 'v003',
    employeeId: '003',
    employeeName: 'Сидоров Алексей Петрович',
    department: 'Кафедра естественных наук',
    position: 'Учитель физики',
    type: 'sick-leave',
    startDate: '2024-03-10',
    endDate: '2024-03-17',
    days: 8,
    status: 'completed',
    comment: 'Больничный лист №12345',
    documents: [
      {
        name: 'Больничный лист.pdf',
        url: '/documents/sick-leave-12345.pdf',
        size: 1024 * 1024 * 2, // 2MB
        uploadDate: '2024-03-09'
      }
    ]
  },
  {
    id: 'v004',
    employeeId: '004',
    employeeName: 'Кузнецова Ольга Александровна',
    department: 'Кафедра иностранных языков',
    position: 'Учитель английского языка',
    type: 'business-trip',
    startDate: '2024-04-05',
    endDate: '2024-04-09',
    days: 5,
    status: 'completed',
    comment: 'Повышение квалификации в Москве'
  },
  {
    id: 'v005',
    employeeId: '005',
    employeeName: 'Смирнов Дмитрий Игоревич',
    department: 'Кафедра информатики',
    position: 'Учитель информатики',
    type: 'sick-leave',
    startDate: '2024-02-15',
    endDate: '2024-02-28',
    days: 14,
    status: 'completed',
    comment: 'Больничный лист №67890',
    documents: [
      {
        name: 'Больничный лист 67890.pdf',
        url: '/documents/sick-leave-67890.pdf',
        size: 1024 * 1024 * 1.5, // 1.5MB
        uploadDate: '2024-02-14'
      }
    ]
  }
];

const vacationSummaries: VacationSummary[] = [
  {
    employeeId: '001',
    employeeName: 'Иванов Иван Иванович',
    totalDays: 28,
    usedDays: 28,
    remainingDays: 0,
    sickLeaveDays: 5
  },
  {
    employeeId: '002',
    employeeName: 'Петрова Мария Сергеевна',
    totalDays: 28,
    usedDays: 0,
    remainingDays: 28,
    sickLeaveDays: 0
  },
  {
    employeeId: '003',
    employeeName: 'Сидоров Алексей Петрович',
    totalDays: 28,
    usedDays: 0,
    remainingDays: 28,
    sickLeaveDays: 8
  },
  {
    employeeId: '004',
    employeeName: 'Кузнецова Ольга Александровна',
    totalDays: 28,
    usedDays: 0,
    remainingDays: 28,
    sickLeaveDays: 0
  },
  {
    employeeId: '005',
    employeeName: 'Смирнов Дмитрий Игоревич',
    totalDays: 28,
    usedDays: 0,
    remainingDays: 28,
    sickLeaveDays: 14
  }
];

const VacationPage: React.FC = () => {
  const [vacations, setVacations] = useState<Vacation[]>(initialVacations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<VacationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<VacationStatus | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current-year');
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewVacationModalOpen, setIsNewVacationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'summary'>('current');
  
  // Состояние для новой заявки
  const [newVacation, setNewVacation] = useState<{
    type: VacationType;
    startDate: string;
    endDate: string;
    employeeId: string;
    substituteId?: string;
    comment?: string;
    lectureTopics?: string;
    document?: File | null;
  }>({
    type: 'vacation',
    startDate: '',
    endDate: '',
    employeeId: '',
    substituteId: '',
    comment: '',
    lectureTopics: '',
    document: null
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Типы отпусков и замен для интерфейса
  const vacationTypes = [
    { value: 'vacation', label: 'Отпуск' },
    { value: 'sick-leave', label: 'Больничный' },
    { value: 'maternity-leave', label: 'Декретный отпуск' },
    { value: 'unpaid-leave', label: 'Отпуск без сохранения ЗП' },
    { value: 'business-trip', label: 'Командировка' }
  ];

  const statusTypes = [
    { value: 'pending', label: 'На рассмотрении' },
    { value: 'approved', label: 'Утверждено' },
    { value: 'rejected', label: 'Отклонено' },
    { value: 'completed', label: 'Завершено' }
  ];

  // Фильтрация данных
  const filteredVacations = vacations.filter(vacation => {
    const matchesSearch = 
      vacation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacation.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vacation.substituteName && vacation.substituteName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || vacation.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || vacation.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Обработчики событий
  const handleVacationClick = (vacation: Vacation) => {
    setSelectedVacation(vacation);
    setIsModalOpen(true);
  };

  // Вспомогательные функции для отображения
  const getStatusBadgeClass = (status: VacationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeBadgeClass = (type: VacationType) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800';
      case 'sick-leave':
        return 'bg-red-100 text-red-800';
      case 'maternity-leave':
        return 'bg-purple-100 text-purple-800';
      case 'unpaid-leave':
        return 'bg-gray-100 text-gray-800';
      case 'business-trip':
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status: VacationStatus) => {
    return statusTypes.find(type => type.value === status)?.label || status;
  };

  const getTypeLabel = (type: VacationType) => {
    return vacationTypes.find(t => t.value === type)?.label || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const getStatusIcon = (status: VacationStatus) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'approved':
        return <FaCheck className="text-green-500" />;
      case 'rejected':
        return <FaTimes className="text-red-500" />;
      case 'completed':
        return <FaUserCheck className="text-blue-500" />;
    }
  };

  const getTypeIcon = (type: VacationType) => {
    switch (type) {
      case 'vacation':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'sick-leave':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'maternity-leave':
        return <FaCalendarAlt className="text-purple-500" />;
      case 'unpaid-leave':
        return <FaCalendarAlt className="text-gray-500" />;
      case 'business-trip':
        return <FaCalendarAlt className="text-green-500" />;
    }
  };

  // Обработчики для новой заявки
  const handleNewVacationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVacation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Проверка формата и размера файла
      if (file.type !== 'application/pdf') {
        alert('Пожалуйста, загрузите файл в формате PDF');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      
      setNewVacation(prev => ({
        ...prev,
        document: file
      }));
    }
  };

  const handleSubmitNewVacation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка обязательных полей
    if (!newVacation.type || !newVacation.startDate || !newVacation.endDate) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    // Проверка наличия документа для больничного и декретного отпуска
    if ((newVacation.type === 'sick-leave' || newVacation.type === 'maternity-leave') && !newVacation.document) {
      alert('Пожалуйста, прикрепите документ подтверждения');
      return;
    }
    
    // Расчет количества дней
    const start = new Date(newVacation.startDate);
    const end = new Date(newVacation.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Создание новой заявки
    const newVacationEntry: Vacation = {
      id: `v${Date.now()}`,
      employeeId: newVacation.employeeId || '001',
      employeeName: 'Текущий пользователь',
      department: 'Кафедра',
      position: 'Должность',
      type: newVacation.type,
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      days: diffDays,
      status: 'pending',
      substituteId: newVacation.substituteId,
      substituteName: newVacation.substituteId ? 'Выбранный сотрудник' : undefined,
      comment: newVacation.comment,
      lectureTopics: newVacation.lectureTopics
    };
    
    // Добавление документа, если он есть
    if (newVacation.document) {
      newVacationEntry.documents = [
        {
          name: newVacation.document.name,
          url: URL.createObjectURL(newVacation.document), // В реальном приложении будет URL сохраненного файла
          size: newVacation.document.size,
          uploadDate: new Date().toISOString().split('T')[0]
        }
      ];
    }
    
    // Добавление новой заявки в список
    setVacations(prev => [newVacationEntry, ...prev]);
    
    // Сброс формы и закрытие модального окна
    setNewVacation({
      type: 'vacation',
      startDate: '',
      endDate: '',
      employeeId: '',
      substituteId: '',
      comment: '',
      lectureTopics: '',
      document: null
    });
    setIsNewVacationModalOpen(false);
  };

  // Функция для открытия окна выбора файла
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  // Функция для отображения документов
  const renderDocuments = (documents?: Vacation['documents']) => {
    if (!documents || documents.length === 0) {
      return <span className="text-gray-400">—</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {documents.map((doc, index) => (
          <a 
            key={index}
            href={doc.url}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFilePdf className="mr-1" />
            <span className="underline">{doc.name}</span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Отпуска и замены</h1>
          <p className="text-sm text-gray-500">Управление отпусками, больничными и заменами преподавателей</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
            onClick={() => setIsNewVacationModalOpen(true)}
          >
            <FaPlus className="mr-2" />
            Новая заявка
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'current'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Текущие отпуска и замены
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'summary'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Сводка по сотрудникам
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'current' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              <div className="relative">
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as VacationType | 'all')}
                >
                  <option value="all">Все типы</option>
                  {vacationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <FaFilter className="absolute left-3 top-3 text-gray-400" />
              </div>
              <div className="relative">
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as VacationStatus | 'all')}
                >
                  <option value="all">Все статусы</option>
                  {statusTypes.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <FaFilter className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="current-year">Текущий год</option>
                <option value="next-year">Следующий год</option>
                <option value="previous-year">Предыдущий год</option>
              </select>
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата начала
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата окончания
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дней
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Замена
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Документы
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVacations.map((vacation) => (
                  <tr 
                    key={vacation.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVacationClick(vacation)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vacation.employeeName}</div>
                      <div className="text-xs text-gray-500">{vacation.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(vacation.type)}`}>
                        {getTypeLabel(vacation.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vacation.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vacation.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {vacation.days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vacation.substituteName || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderDocuments(vacation.documents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(vacation.status)}`}>
                        {getStatusLabel(vacation.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Всего дней отпуска
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Использовано
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Осталось
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дней на больничном
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vacationSummaries.map((summary) => (
                <tr key={summary.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{summary.employeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {summary.totalDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {summary.usedDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        summary.remainingDays === 0 ? 'text-red-600' : 
                        summary.remainingDays < 14 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {summary.remainingDays}
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            summary.remainingDays === 0 ? 'bg-red-500' : 
                            summary.remainingDays < 14 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${(summary.remainingDays / summary.totalDays) * 100}%` }}>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {summary.sickLeaveDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно с деталями заявки на отпуск */}
      {isModalOpen && selectedVacation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="mr-4">
                    {getTypeIcon(selectedVacation.type)}
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(selectedVacation.type)}`}>
                      {getTypeLabel(selectedVacation.type)}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedVacation.employeeName}</h2>
                    <p className="text-sm text-gray-600">{selectedVacation.department} • {selectedVacation.position}</p>
                  </div>
                </div>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Период</div>
                  <div className="flex items-center text-gray-900">
                    <FaCalendarAlt className="text-blue-500 mr-2" />
                    <span>
                      {formatDate(selectedVacation.startDate)} — {formatDate(selectedVacation.endDate)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Статус</div>
                  <div className="flex items-center">
                    {getStatusIcon(selectedVacation.status)}
                    <span className={`ml-2 ${
                      selectedVacation.status === 'approved' ? 'text-green-600' :
                      selectedVacation.status === 'rejected' ? 'text-red-600' :
                      selectedVacation.status === 'pending' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {getStatusLabel(selectedVacation.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">Количество дней</div>
                <div className="text-2xl font-bold text-gray-900">{selectedVacation.days}</div>
              </div>

              {selectedVacation.substituteName && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">Замещающий сотрудник</div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FaUserCheck className="text-green-500 mr-2" />
                      <span className="font-medium">{selectedVacation.substituteName}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedVacation.comment && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">Комментарий</div>
                  <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">
                    {selectedVacation.comment}
                  </p>
                </div>
              )}

              {selectedVacation.documents && selectedVacation.documents.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">Прикрепленные документы</div>
                  <div className="space-y-2">
                    {selectedVacation.documents.map((doc, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <FaFilePdf className="text-red-500 mr-2" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(doc.size)} • Загружен {formatDate(doc.uploadDate)}
                            </div>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          download={doc.name}
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaFileDownload />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                {selectedVacation.status === 'pending' && (
                  <>
                    <button className="px-4 py-2 bg-red-50 text-red-700 rounded-md mr-2">
                      Отклонить
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md">
                      Утвердить
                    </button>
                  </>
                )}
                {selectedVacation.status === 'approved' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    Изменить
                  </button>
                )}
                {selectedVacation.status === 'rejected' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    Создать новую заявку
                  </button>
                )}
                {selectedVacation.status === 'completed' && (
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                    Документы
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания новой заявки */}
      {isNewVacationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Новая заявка</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsNewVacationModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitNewVacation}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип отпуска <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={newVacation.type}
                      onChange={handleNewVacationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {vacationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата начала <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={newVacation.startDate}
                        onChange={handleNewVacationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата окончания <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={newVacation.endDate}
                        onChange={handleNewVacationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Сотрудник на замену
                    </label>
                    <select
                      name="substituteId"
                      value={newVacation.substituteId}
                      onChange={handleNewVacationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Выберите сотрудника</option>
                      <option value="001">Иванов Иван Иванович</option>
                      <option value="002">Петрова Мария Сергеевна</option>
                      <option value="003">Сидоров Алексей Петрович</option>
                      <option value="005">Смирнов Дмитрий Игоревич</option>
                    </select>
                  </div>

                  {/* Добавляем поле для тем лекций, которое появляется только при выборе замещающего сотрудника */}
                  {newVacation.substituteId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Темы лекций для заместителя <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="lectureTopics"
                        value={newVacation.lectureTopics}
                        onChange={handleNewVacationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Укажите темы лекций, которые должен провести заместитель"
                        required={!!newVacation.substituteId}
                      />
                    </div>
                  )}

                  {/* Поле загрузки документа появляется только для больничного и декретного отпуска */}
                  {(newVacation.type === 'sick-leave' || newVacation.type === 'maternity-leave') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Прикрепить документ (.pdf) <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                          newVacation.document ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="space-y-1 text-center">
                          {newVacation.document ? (
                            <div className="flex flex-col items-center">
                              <FaFilePdf className="h-12 w-12 text-red-500" />
                              <span className="text-sm text-gray-900">{newVacation.document.name}</span>
                              <span className="text-xs text-gray-500">{formatFileSize(newVacation.document.size)}</span>
                            </div>
                          ) : (
                            <>
                              <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                >
                                  <span>Загрузите файл</span>
                                  <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                  />
                                </label>
                                <p className="pl-1">или перетащите</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF до 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {newVacation.document && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:text-red-800"
                            onClick={() => setNewVacation(prev => ({ ...prev, document: null }))}
                          >
                            Удалить файл
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Комментарий
                    </label>
                    <textarea
                      name="comment"
                      value={newVacation.comment}
                      onChange={handleNewVacationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Например: После обследования в поликлинике №4"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
                      onClick={() => setIsNewVacationModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Подать заявку
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationPage; 