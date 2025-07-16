import React, { useState } from 'react';
import { FaSearch, FaDownload, FaEllipsisV, FaPlus, FaTimes, FaEnvelope, FaPhone, FaGraduationCap, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaFilter, FaExchangeAlt } from 'react-icons/fa';

interface Employee {
  id: number;
  name: string;
  iin: string;
  email: string;
  position: string;
  category: string;
  subject: string;
  experience: string;
  status: 'active' | 'vacation' | 'sick' | 'business_trip';
  employmentType: 'fulltime' | 'parttime'; // Тип занятости: штатный или совместитель
  phone?: string;
  education?: string;
  specialization?: string;
  address?: string;
  hireDate?: string;
  subjects?: {
    general: string[]; // Общепрофессиональные дисциплины
    special: string[]; // Специальные дисциплины
  };
  achievements?: string[];
  documents?: Array<{
    id: string;
    type: string;
    number: string;
    date: string;
    name: string;
    status: 'active' | 'expired';
  }>;
}

const employees: Employee[] = [
  {
    id: 1,
    name: 'Сатпаев Арман Болатович',
    iin: '880501300999',
    email: 'satpayev@school.edu.kz',
    position: 'Учитель математики',
    category: 'Высшая категория',
    subject: 'Математика',
    experience: '12 лет',
    status: 'active',
    employmentType: 'fulltime',
    phone: '+7 (777) 123-45-67',
    education: 'КазНУ им. аль-Фараби, факультет механики и математики',
    specialization: 'Математика и информатика',
    address: 'г. Астана, ул. Кабанбай батыра 53',
    hireDate: '01.09.2012',
    subjects: {
      general: ['Алгебра', 'Геометрия'],
      special: ['Математический анализ', 'Дискретная математика']
    },
    achievements: [
      'Победитель республиканского конкурса "Учитель года - 2022"',
      'Автор методических пособий по подготовке к ЕНТ',
      'Руководитель школьного математического кружка'
    ],
    documents: [
      {
        id: 'doc1',
        type: 'Приказ',
        number: '123-П',
        date: '01.09.2012',
        name: 'Приказ о назначении на должность',
        status: 'active'
      },
      {
        id: 'doc2',
        type: 'Сертификат',
        number: 'NK-2023-123',
        date: '15.03.2023',
        name: 'Сертификат о повышении квалификации "Современные методы преподавания математики"',
        status: 'active'
      },
      {
        id: 'doc3',
        type: 'Диплом',
        number: 'ЖБ-123456',
        date: '15.06.2010',
        name: 'Диплом о высшем образовании',
        status: 'active'
      }
    ]
  },
  {
    id: 2,
    name: 'Алимова Динара Нурлановна',
    iin: '900712400777',
    email: 'alimova@school.edu.kz',
    position: 'Учитель русского языка',
    category: 'Первая категория',
    subject: 'Русский язык',
    experience: '8 лет',
    status: 'vacation',
    employmentType: 'parttime',
    subjects: {
      general: ['Русский язык', 'Литература'],
      special: []
    }
  },
  {
    id: 3,
    name: 'Байтуров Нурлан Серикович',
    iin: '850304500888',
    email: 'baiturov@school.edu.kz',
    position: 'Учитель физики',
    category: 'Высшая категория',
    subject: 'Физика',
    experience: '15 лет',
    status: 'active',
    employmentType: 'fulltime',
    subjects: {
      general: ['Физика'],
      special: ['Астрономия', 'Прикладная физика']
    }
  },
  {
    id: 4,
    name: 'Нурпеисова Айгуль Маратовна',
    iin: '920825600555',
    email: 'nurpeisova@school.edu.kz',
    position: 'Учитель английского языка',
    category: 'Первая категория',
    subject: 'Английский язык',
    experience: '6 лет',
    status: 'active',
    employmentType: 'fulltime',
    subjects: {
      general: ['Английский язык'],
      special: ['Технический перевод', 'Деловой английский']
    }
  },
  {
    id: 5,
    name: 'Жумабаев Даулет Ерланович',
    iin: '891130200333',
    email: 'zhumabaev@school.edu.kz',
    position: 'Учитель информатики',
    category: 'Высшая категория',
    subject: 'Информатика',
    experience: '7 лет',
    status: 'business_trip',
    employmentType: 'parttime',
    subjects: {
      general: ['Информатика', 'Основы программирования'],
      special: ['Веб-разработка', 'Администрирование сетей', 'Базы данных']
    }
  }
];

const EmployeesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Все предметы');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [employeesList, setEmployeesList] = useState<Employee[]>(employees);

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vacation':
        return 'bg-blue-100 text-blue-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'business_trip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'Активен';
      case 'vacation':
        return 'Отпуск';
      case 'sick':
        return 'Больничный';
      case 'business_trip':
        return 'Командировка';
      default:
        return status;
    }
  };

  const getEmploymentTypeColor = (type: 'fulltime' | 'parttime') => {
    return type === 'fulltime' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getEmploymentTypeText = (type: 'fulltime' | 'parttime') => {
    return type === 'fulltime' ? 'Штатный' : 'Совместитель';
  };

  const filteredEmployees = employeesList.filter(employee => {
    // Фильтр по поиску
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Фильтр по предмету
    const matchesSubject = selectedSubject === 'Все предметы' || 
                             employee.subject === selectedSubject;
    
    // Фильтр по статусу
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Разделение сотрудников на штатных и совместителей
  const fulltimeEmployees = filteredEmployees.filter(emp => emp.employmentType === 'fulltime');
  const parttimeEmployees = filteredEmployees.filter(emp => emp.employmentType === 'parttime');

  // Функция для изменения типа занятости
  const toggleEmploymentType = (employeeId: number) => {
    setEmployeesList(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          employmentType: emp.employmentType === 'fulltime' ? 'parttime' : 'fulltime'
        };
      }
      return emp;
    }));
    // Закрываем модальное окно, если оно открыто
    if (selectedEmployee?.id === employeeId) {
      setSelectedEmployee(null);
    }
  };

  // Функция для удаления сотрудника
  const deleteEmployee = (employeeId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить сотрудника?")) {
      setEmployeesList(prev => prev.filter(emp => emp.id !== employeeId));
      // Закрываем модальное окно, если оно открыто
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
    }
  };

  // Компонент таблицы сотрудников
  const EmployeeTable = ({ employees, title }: { employees: Employee[], title: string }) => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{title} ({employees.length})</h2>
        <p className="text-sm text-gray-500">Всего: {employees.length} человек</p>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Сотрудник
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Должность
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Стаж
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 bg-gray-50"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr 
              key={employee.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedEmployee(employee)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{employee.position}</div>
                <div className="text-sm text-gray-500">{employee.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.experience}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                  {getStatusText(employee.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button 
                    className="text-gray-400 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEmploymentType(employee.id);
                    }}
                    title={employee.employmentType === 'fulltime' ? 'Перевести в совместители' : 'Перевести в штатные'}
                  >
                    <FaExchangeAlt className="w-4 h-4" />
                  </button>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployee(employee);
                    }}
                  >
                    <FaEllipsisV className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                В этой категории нет сотрудников
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники и преподаватели</h1>
          <p className="text-sm text-gray-500">Управление кадровым составом образовательного учреждения</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <FaDownload className="w-4 h-4" />
            Экспорт
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus className="w-4 h-4" />
            Добавить сотрудника
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по сотрудникам..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option>Все предметы</option>
          <option>Математика</option>
          <option>Русский язык</option>
          <option>Физика</option>
          <option>Английский язык</option>
          <option>Информатика</option>
          <option>История</option>
          <option>Биология</option>
          <option>Химия</option>
          <option>География</option>
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Employee['status'] | 'all')}
        >
          <option value="all">Все статусы</option>
          <option value="active">Активен</option>
          <option value="vacation">Отпуск</option>
          <option value="sick">Больничный</option>
          <option value="business_trip">Командировка</option>
        </select>
      </div>

      {/* Двухколоночный макет */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Колонка штатных сотрудников */}
        <EmployeeTable employees={fulltimeEmployees} title="🟦 Штатные преподаватели" />
        
        {/* Колонка совместителей */}
        <EmployeeTable employees={parttimeEmployees} title="🟨 Совместители" />
      </div>

      {/* Модальное окно сотрудника */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Заголовок */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-medium">
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                      <span className="text-sm text-gray-500">ИИН: {selectedEmployee.iin}</span>
                    </div>
                    <p className="text-gray-600">{selectedEmployee.position}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedEmployee.status)}`}>
                        {getStatusText(selectedEmployee.status)}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEmploymentTypeColor(selectedEmployee.employmentType)}`}>
                        {getEmploymentTypeText(selectedEmployee.employmentType)}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setSelectedEmployee(null)}
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Контактная информация</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    {selectedEmployee.phone && (
                      <div className="flex items-center">
                        <FaPhone className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedEmployee.phone}</span>
                      </div>
                    )}
                    {selectedEmployee.address && (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedEmployee.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Профессиональная информация</h3>
                  <div className="space-y-3">
                    {selectedEmployee.education && (
                      <div className="flex items-center">
                        <FaGraduationCap className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedEmployee.education}</span>
                      </div>
                    )}
                    {selectedEmployee.specialization && (
                      <div className="flex items-center">
                        <FaIdCard className="w-5 h-5 text-gray-400 mr-3" />
                        <span>{selectedEmployee.specialization}</span>
                      </div>
                    )}
                    {selectedEmployee.hireDate && (
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-5 h-5 text-gray-400 mr-3" />
                        <span>Дата приема: {selectedEmployee.hireDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Предметы */}
              {selectedEmployee.subjects && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Преподаваемые предметы</h3>
                  
                  {/* Общепрофессиональные дисциплины */}
                  {selectedEmployee.subjects.general.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Общепрофессиональные дисциплины:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.subjects.general.map((subject, index) => (
                          <span 
                            key={`general-${index}`}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Специальные дисциплины */}
                  {selectedEmployee.subjects.special.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-2">Специальные дисциплины:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.subjects.special.map((subject, index) => (
                          <span 
                            key={`special-${index}`}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Достижения */}
              {selectedEmployee.achievements && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Достижения</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {selectedEmployee.achievements.map((achievement, index) => (
                      <li key={index} className="text-gray-700">{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Документы */}
              {selectedEmployee.documents && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Документы</h3>
                  <div className="space-y-3">
                    {selectedEmployee.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-sm text-gray-500">
                            {doc.type} №{doc.number} от {doc.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {doc.status === 'active' ? 'Действующий' : 'Истёк'}
                          </span>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <FaDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Редактировать
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    Скачать личное дело
                  </button>
                  <button 
                    className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100"
                    onClick={() => toggleEmploymentType(selectedEmployee.id)}
                  >
                    {selectedEmployee.employmentType === 'fulltime' 
                      ? 'Перевести в совместители' 
                      : 'Перевести в штатные'}
                  </button>
                </div>
                <button 
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                  onClick={() => deleteEmployee(selectedEmployee.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления сотрудника */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Добавить сотрудника</h2>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowAddModal(false)}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="mb-4 text-gray-700">Выберите тип занятости:</p>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <h3 className="font-medium mb-2">Штатный преподаватель</h3>
                    <p className="text-sm text-gray-500">Полная занятость, официальное трудоустройство</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <h3 className="font-medium mb-2">Совместитель</h3>
                    <p className="text-sm text-gray-500">Частичная занятость, почасовая оплата</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setShowAddModal(false)}
                >
                  Отмена
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage; 