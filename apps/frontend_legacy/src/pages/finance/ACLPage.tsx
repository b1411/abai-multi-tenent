import React, { useState } from 'react';
import {
  FaChartLine,
  FaUsers,
  FaStar,
  FaChalkboardTeacher,
  FaSchool,
  FaBookReader,
  FaComments,
  FaFileExport
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Типы данных
interface RepeatPurchaseMetrics {
  id: string;
  name: string;
  type: 'group' | 'direction' | 'teacher' | 'academy';
  repeatRate: number;
  totalStudents: number;
  returningStudents: number;
  averageRating: number;
}

interface Review {
  id: string;
  studentName: string;
  teacherName: string;
  group: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  helpful: number;
}

// Моковые данные
const mockMetrics: RepeatPurchaseMetrics[] = [
  {
    id: '1',
    name: 'МК24-1М',
    type: 'group',
    repeatRate: 75,
    totalStudents: 20,
    returningStudents: 15,
    averageRating: 4.5
  },
  {
    id: '2',
    name: 'Математика',
    type: 'direction',
    repeatRate: 82,
    totalStudents: 150,
    returningStudents: 123,
    averageRating: 4.7
  },
  {
    id: '3',
    name: 'Иванов И.И.',
    type: 'teacher',
    repeatRate: 88,
    totalStudents: 45,
    returningStudents: 40,
    averageRating: 4.8
  },
  {
    id: '4',
    name: 'FIZMAT Academy',
    type: 'academy',
    repeatRate: 80,
    totalStudents: 500,
    returningStudents: 400,
    averageRating: 4.6
  }
];

const mockReviews: Review[] = [
  {
    id: '1',
    studentName: 'Алексей К.',
    teacherName: 'Иванов И.И.',
    group: 'МК24-1М',
    rating: 5,
    comment: 'Отличный преподаватель! Очень доступно объясняет сложные темы.',
    date: '2024-03-15',
    likes: 12,
    helpful: 8
  },
  {
    id: '2',
    studentName: 'Мария С.',
    teacherName: 'Петрова М.С.',
    group: 'МК24-2М',
    rating: 4,
    comment: 'Хорошие занятия, но иногда не хватает практических примеров.',
    date: '2024-03-14',
    likes: 5,
    helpful: 3
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ACLPage: React.FC = () => {
  const [selectedMetricType, setSelectedMetricType] = useState<'group' | 'direction' | 'teacher' | 'academy'>('group');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');

  // Фильтрация метрик по типу
  const filteredMetrics = mockMetrics.filter(metric => metric.type === selectedMetricType);

  // Фильтрация отзывов
  const filteredReviews = mockReviews.filter(review => 
    selectedRating === 'all' || review.rating === selectedRating
  );

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Генерация звёздного рейтинга
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Анализ лояльности клиентов</h1>
          <p className="text-sm text-gray-500">Метрики повторных покупок и отзывы студентов</p>
        </div>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
          <FaFileExport className="mr-2" />
          Экспорт данных
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Метрики повторных покупок */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Процент повторных покупок</h2>
            <div className="flex gap-2">
              <select
                className="px-3 py-1 border rounded-md text-sm"
                value={selectedMetricType}
                onChange={(e) => setSelectedMetricType(e.target.value as any)}
              >
                <option value="group">По группам</option>
                <option value="direction">По направлениям</option>
                <option value="teacher">По учителям</option>
                <option value="academy">По академии</option>
              </select>
              <select
                className="px-3 py-1 border rounded-md text-sm"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
              >
                <option value="month">За месяц</option>
                <option value="quarter">За квартал</option>
                <option value="year">За год</option>
              </select>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="repeatRate" name="Процент повторных покупок" fill="#8884d8" />
                <Bar dataKey="averageRating" name="Средний рейтинг" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Всего студентов</div>
              <div className="text-2xl font-bold text-blue-900">
                {filteredMetrics.reduce((sum, m) => sum + m.totalStudents, 0)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Вернувшихся</div>
              <div className="text-2xl font-bold text-green-900">
                {filteredMetrics.reduce((sum, m) => sum + m.returningStudents, 0)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Средний рейтинг</div>
              <div className="text-2xl font-bold text-purple-900">
                {(filteredMetrics.reduce((sum, m) => sum + m.averageRating, 0) / filteredMetrics.length).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Отзывы и рейтинги */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Отзывы студентов</h2>
            <select
              className="px-3 py-1 border rounded-md text-sm"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Все оценки</option>
              <option value="5">5 звёзд</option>
              <option value="4">4 звезды</option>
              <option value="3">3 звезды</option>
              <option value="2">2 звезды</option>
              <option value="1">1 звезда</option>
            </select>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {filteredReviews.map(review => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{review.studentName}</div>
                    <div className="text-sm text-gray-500">
                      {review.teacherName} • {review.group}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>{formatDate(review.date)}</div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FaComments className="text-blue-500" />
                      {review.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUsers className="text-green-500" />
                      {review.helpful}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Детальная статистика</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Всего студентов
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Вернувшихся
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Процент повторных
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Рейтинг
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockMetrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{metric.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${metric.type === 'group' ? 'bg-blue-100 text-blue-800' :
                        metric.type === 'direction' ? 'bg-green-100 text-green-800' :
                        metric.type === 'teacher' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {metric.type === 'group' ? 'Группа' :
                       metric.type === 'direction' ? 'Направление' :
                       metric.type === 'teacher' ? 'Учитель' :
                       'Академия'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {metric.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {metric.returningStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`font-medium ${
                        metric.repeatRate >= 80 ? 'text-green-600' :
                        metric.repeatRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {metric.repeatRate}%
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            metric.repeatRate >= 80 ? 'bg-green-500' :
                            metric.repeatRate >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${metric.repeatRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(metric.averageRating)}
                      <span className="ml-2 text-gray-500">
                        {metric.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ACLPage; 