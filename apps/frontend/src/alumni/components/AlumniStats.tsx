import React from 'react';
import { useAlumniStats } from '../hooks/useAlumni';
import { GraduationCap, Users, Briefcase, TrendingUp, Calendar } from 'lucide-react';

const AlumniStats: React.FC = () => {
  const { stats, loading, error } = useAlumniStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p className="text-red-600">{error || 'Ошибка загрузки статистики'}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего выпускников',
      value: stats.totalAlumni,
      icon: GraduationCap,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Средний GPA',
      value: stats.averageGpa,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Трудоустройство',
      value: `${stats.employmentRate}%`,
      icon: Briefcase,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Активных выпускников',
      value: stats.totalAlumni - (stats.byYear.find(y => y.year === new Date().getFullYear())?.count || 0),
      icon: Users,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="mb-8">
      {/* Основная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {typeof stat.value === 'number' && stat.value > 999 
                    ? stat.value.toLocaleString() 
                    : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Детализированная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика по годам */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Выпуски по годам
          </h3>
          <div className="space-y-3">
            {stats.byYear.slice(0, 5).map((yearStat) => (
              <div key={yearStat.year} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{yearStat.year}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(yearStat.count / Math.max(...stats.byYear.map(y => y.count))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8">
                    {yearStat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика по индустриям */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Популярные индустрии
          </h3>
          <div className="space-y-3">
            {stats.byIndustry.slice(0, 5).map((industryStat, index) => {
              const colors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500'
              ];
              return (
                <div key={industryStat.industry} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {industryStat.industry}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`${colors[index]} h-2 rounded-full`}
                        style={{
                          width: `${(industryStat.count / Math.max(...stats.byIndustry.map(i => i.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">
                      {industryStat.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniStats;
