import React, { useState, useMemo } from 'react';
import { 
  FaFilter, 
  FaFileExport, 
  FaUserTie,
  FaChalkboardTeacher,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaGraduationCap,
  FaMedal,
  FaClock
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Employee {
  name: string;
  position: string;
  department: string;
  base: number;
  bonus: number;
  total: number;
  email?: string;
  phone?: string;
  startDate?: string;
  education?: string;
  achievements?: string[];
  schedule?: string;
  photo?: string;
  experience?: number;
  skills?: string[];
}

const PayrollPage: React.FC = () => {
  // Состояния для фильтров и модальных окон
  const [filters, setFilters] = useState({
    department: 'all',
    position: 'all',
    period: 'current'
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Демо-данные для статистики
  const summaryStats = {
    totalPayroll: 12500000,
    avgSalary: 350000,
    employeeCount: 45,
    payrollGrowth: 5.2,
    departments: {
      teaching: { count: 28, total: 8400000, avg: 300000 },
      administrative: { count: 12, total: 3000000, avg: 250000 },
      support: { count: 5, total: 1100000, avg: 220000 }
    }
  };

  // Демо-данные сотрудников
  const employees: Employee[] = [
    { 
      name: 'Бекетова А.М.',
      position: 'Учитель математики',
      department: 'Учителя',
      base: 280000,
      bonus: 42000,
      total: 322000,
      email: 'beketova@ab.ai',
      phone: '+7 (777) 123-45-67',
      startDate: '15.09.2020',
      education: 'КазНУ им. аль-Фараби, Математический факультет',
      achievements: ['Лучший учитель 2022', 'Победитель конкурса инноваций'],
      schedule: 'Пн-Пт, 9:00-17:00',
      experience: 8,
      skills: ['Высшая математика', 'Олимпиадная подготовка', 'Методика преподавания']
    },
    { 
      name: 'Каримова Н.С.',
      position: 'Учитель физики',
      department: 'Учителя',
      base: 275000,
      bonus: 41250,
      total: 316250,
      email: 'karimova@ab.ai',
      phone: '+7 (777) 234-56-78',
      startDate: '01.09.2021',
      education: 'КБТУ, Физико-технический факультет',
      achievements: ['Научная публикация 2023'],
      schedule: 'Пн-Пт, 9:00-17:00',
      experience: 5,
      skills: ['Физика', 'Астрономия', 'Лабораторные работы']
    },
    { 
      name: 'Мырзахметов К.А.',
      position: 'Зам. директора',
      department: 'Администрация',
      base: 350000,
      bonus: 52500,
      total: 402500,
      email: 'myrzakhmetov@ab.ai',
      phone: '+7 (777) 345-67-89',
      startDate: '01.03.2019',
      education: 'НУ, Школа образования',
      achievements: ['Медаль "За вклад в образование"'],
      schedule: 'Пн-Пт, 9:00-18:00',
      experience: 12,
      skills: ['Управление персоналом', 'Стратегическое планирование', 'Развитие образования']
    }
  ];

  // Форматирование чисел в тенге
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  };

  // Компонент модального окна фильтров
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="all">Все отделы</option>
            <option value="teaching">Учителя</option>
            <option value="administrative">Администрация</option>
            <option value="support">Тех. персонал</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.position}
            onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
          >
            <option value="all">Все должности</option>
            <option value="teacher">Учитель</option>
            <option value="admin">Администратор</option>
            <option value="support">Тех. специалист</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
          >
            <option value="current">Текущий месяц</option>
            <option value="previous">Предыдущий месяц</option>
            <option value="quarter">Текущий квартал</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={() => {
              setFilters({ department: 'all', position: 'all', period: 'current' });
              setShowFilterModal(false);
            }}
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

  // Фильтрация сотрудников
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      if (filters.department !== 'all' && !employee.department.toLowerCase().includes(filters.department)) {
        return false;
      }
      if (filters.position !== 'all' && !employee.position.toLowerCase().includes(filters.position)) {
        return false;
      }
      return true;
    });
  }, [filters]);

  // Компонент модального окна сотрудника
  const EmployeeModal = () => {
    if (!selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {/* Шапка */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl text-white">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <FaUserTie className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                  <p className="text-blue-100">{selectedEmployee.position}</p>
                </div>
              </div>
            </div>

            {/* Основная информация */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Левая колонка */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-blue-600" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-blue-600" />
                        <span>{selectedEmployee.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Образование и опыт</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaGraduationCap className="text-blue-600" />
                        <span>{selectedEmployee.education}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaCalendar className="text-blue-600" />
                        <span>Стаж работы: {selectedEmployee.experience} лет</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Правая колонка */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Достижения</h3>
                    <div className="space-y-2">
                      {selectedEmployee.achievements?.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <FaMedal className="text-blue-600" />
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Компетенции</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills?.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Зарплата */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Информация о зарплате</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Оклад</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedEmployee.base)}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Премия</div>
                    <div className="text-xl font-bold text-green-600">+{formatCurrency(selectedEmployee.bonus)}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Итого</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(selectedEmployee.total)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Футер */}
            <div className="border-t border-gray-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaClock />
                <span>График работы: {selectedEmployee.schedule}</span>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                  История выплат
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Управление заработной платой</h1>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-2" />
            Фильтры
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
            <FaPlus className="mr-2" />
            Расчет зарплаты
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Основные показатели */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Фонд оплаты труда</div>
            <FaChartLine className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalPayroll)}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <span>+{summaryStats.payrollGrowth}% к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Средняя зарплата</div>
            <FaUserTie className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.avgSalary)}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <span>+3.8% к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Сотрудников</div>
            <FaUsers className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{summaryStats.employeeCount}</div>
            <div className="text-sm text-gray-600 flex items-center mt-1">
              <span>{summaryStats.departments.teaching.count} учителей</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Премиальный фонд</div>
            <FaChartLine className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalPayroll * 0.1)}</div>
            <div className="text-sm text-blue-600 flex items-center mt-1">
              <span>10% от ФОТ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Анализ по отделам */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Распределение по отделам</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Учителя', value: summaryStats.departments.teaching.total, count: summaryStats.departments.teaching.count },
                { name: 'Администрация', value: summaryStats.departments.administrative.total, count: summaryStats.departments.administrative.count },
                { name: 'Тех. персонал', value: summaryStats.departments.support.total, count: summaryStats.departments.support.count }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Динамика ФОТ</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Янв', value: 11500000 },
                { month: 'Фев', value: 11800000 },
                { month: 'Мар', value: 12000000 },
                { month: 'Апр', value: 12200000 },
                { month: 'Май', value: 12500000 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Таблица сотрудников */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Список сотрудников</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Должность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Отдел
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оклад
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Премия
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Итого
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(employee.base)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600">+{formatCurrency(employee.bonus)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(employee.total)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {selectedEmployee && <EmployeeModal />}
    </div>
  );
};

export default PayrollPage; 