import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { ActivityStats, ActivityItem } from '../../contexts/ActivityContext';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';

interface ActivityStatisticsProps {
  stats: ActivityStats | null;
  activities: ActivityItem[];
  loading: boolean;
}

export const ActivityStatistics: React.FC<ActivityStatisticsProps> = ({
  stats,
  activities,
  loading
}) => {
  // Подготовка данных для графиков
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    // Группировка активности по дням
    const dailyActivity = activities.reduce((acc, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);

    const dailyData = Object.entries(dailyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Последние 7 дней

    // Группировка по типам активности
    const activityTypes = activities.reduce((acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = 0;
      }
      acc[activity.type]++;
      return acc;
    }, {} as Record<string, number>);

    const typeData = Object.entries(activityTypes).map(([type, count]) => ({
      type,
      count,
      percentage: (count / activities.length * 100).toFixed(1)
    }));

    // Активность по часам дня
    const hourlyActivity = activities.reduce((acc, activity) => {
      const hour = new Date(activity.createdAt).getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour]++;
      return acc;
    }, {} as Record<number, number>);

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: hourlyActivity[hour] || 0
    }));

    // Активность по пользователям (топ 10)
    const userActivity = activities.reduce((acc, activity) => {
      const userName = `${activity.user.name} ${activity.user.surname}`;
      if (!acc[userName]) {
        acc[userName] = 0;
      }
      acc[userName]++;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      dailyData,
      typeData,
      hourlyData,
      topUsers
    };
  }, [activities]);

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Недостаточно данных для отображения статистики</p>
        <p className="text-gray-400 text-sm">Дождитесь накопления данных об активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Дополнительная статистика в карточках */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Всего сессий</p>
              <p className="text-2xl font-bold">
                {stats?.summary?.totalSessions || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Активность сегодня</p>
              <p className="text-2xl font-bold">
                {chartData.dailyData[chartData.dailyData.length - 1]?.count || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Самый активный пользователь</p>
              <p className="text-lg font-bold truncate">
                {chartData.topUsers[0]?.name || 'N/A'}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Пиковый час</p>
              <p className="text-2xl font-bold">
                {chartData.hourlyData.reduce((max, curr) => 
                  curr.count > max.count ? curr : max
                ).hour}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* График активности по дням */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h4 className="text-base md:text-lg font-semibold mb-4">Активность за последние 7 дней</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Распределение по типам активности */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h4 className="text-base md:text-lg font-semibold mb-4">Типы активности</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Активность по часам */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h4 className="text-base md:text-lg font-semibold mb-4">Активность по часам дня</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Топ активных пользователей */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h4 className="text-base md:text-lg font-semibold mb-4">Топ-10 активных пользователей</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.topUsers} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Детальная таблица статистики */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold">Детальная статистика</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Общие показатели</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Всего событий:</span>
                  <span className="font-medium">{activities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Уникальных пользователей:</span>
                  <span className="font-medium">{chartData.topUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Типов активности:</span>
                  <span className="font-medium">{chartData.typeData.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Временные показатели</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Период данных:</span>
                  <span className="font-medium">{chartData.dailyData.length} дней</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Среднее за день:</span>
                  <span className="font-medium">
                    {Math.round(activities.length / chartData.dailyData.length)} событий
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Пик активности:</span>
                  <span className="font-medium">
                    {chartData.hourlyData.reduce((max, curr) => 
                      curr.count > max.count ? curr : max
                    ).hour}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Активность пользователей</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Максимум за пользователя:</span>
                  <span className="font-medium">{chartData.topUsers[0]?.count || 0} событий</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Среднее за пользователя:</span>
                  <span className="font-medium">
                    {Math.round(activities.length / chartData.topUsers.length)} событий
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Активных пользователей:</span>
                  <span className="font-medium">{stats?.summary?.activeUsers || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
