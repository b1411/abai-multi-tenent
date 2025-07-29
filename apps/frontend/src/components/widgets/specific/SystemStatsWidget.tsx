import React from 'react';
import { Widget } from '../../../types/widget';
import { Users, GraduationCap, BookOpen, Activity } from 'lucide-react';

interface SystemStatsWidgetProps {
  data: any;
  widget: Widget;
}

const SystemStatsWidget: React.FC<SystemStatsWidgetProps> = ({ data, widget }) => {
  const {
    totalStudents,
    totalTeachers,
    totalGroups,
    totalSubjects,
    activeUsers,
    systemUptime
  } = data || {};

  if (!totalStudents) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Загрузка данных...</p>
          <p className="text-xs text-gray-400 mt-1">TODO: Подключить к API</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Студенты',
      value: totalStudents?.toLocaleString() || '0',
      icon: <GraduationCap className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Учителя',
      value: totalTeachers?.toString() || '0',
      icon: <Users className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      label: 'Группы',
      value: totalGroups?.toString() || '0',
      icon: <BookOpen className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      label: 'Предметы',
      value: totalSubjects?.toString() || '0',
      icon: <Activity className="h-5 w-5 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Stats Grid with compact design */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-gray-50">
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 truncate">
                {stat.label}
              </div>
              
              {/* Simple progress bar */}
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (parseInt(stat.value.replace(',', '')) / 2000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional stats - only for medium and large */}
        {widget.size !== 'small' && (
          <div className="space-y-2 flex-1">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 truncate">Активные пользователи</span>
                </div>
                <div className="text-sm font-bold text-green-700 ml-2">
                  {activeUsers?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700 truncate">Время работы</span>
                </div>
                <div className="text-sm font-bold text-blue-700 ml-2">
                  {systemUptime || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo indicator */}
        <div className="mt-2 flex justify-end">
          <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            Demo
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatsWidget;
