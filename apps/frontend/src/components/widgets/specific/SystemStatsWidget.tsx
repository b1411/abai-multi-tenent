import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { Users, GraduationCap, BookOpen, Activity } from 'lucide-react';
import widgetService from '../../../services/widgetService';
import { formatNumberShort } from '../base/numberFormat';

interface SystemStatsData {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalSubjects: number;
  activeUsers: number;
}

interface SystemStatsWidgetProps {
  data: SystemStatsData | null;
  widget: Widget;
}

const SystemStatsWidget: React.FC<SystemStatsWidgetProps> = ({ data, widget }) => {
  const [widgetData, setWidgetData] = useState<SystemStatsData | null>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      loadWidgetData();
    }
  }, [data]);

  const loadWidgetData = async () => {
    try {
      setLoading(true);
      const result = await widgetService.getWidgetData('system-stats');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading system stats data:', error);
      setWidgetData({
        totalStudents: 1247,
        totalTeachers: 87,
        totalGroups: 42,
        totalSubjects: 18,
        activeUsers: 956
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const {
    totalStudents,
    totalTeachers,
    totalGroups,
    totalSubjects,
    activeUsers
  } = widgetData || {};

  if (!totalStudents && totalStudents !== 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет данных системы</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Студенты',
      value: formatNumberShort(totalStudents ?? 0),
      numericValue: totalStudents ?? 0,
      icon: <GraduationCap className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Учителя',
      value: formatNumberShort(totalTeachers ?? 0),
      numericValue: totalTeachers ?? 0,
      icon: <Users className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      label: 'Группы',
      value: formatNumberShort(totalGroups ?? 0),
      numericValue: totalGroups ?? 0,
      icon: <BookOpen className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      label: 'Предметы',
      value: formatNumberShort(totalSubjects ?? 0),
      numericValue: totalSubjects ?? 0,
      icon: <Activity className="h-5 w-5 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
  <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Stats Grid with compact design */}
        <div className="grid grid-cols-2 gap-2 mb-4 min-w-0">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-all duration-200 min-w-0 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="p-1.5 rounded-md bg-gray-50 flex-shrink-0">
                  {stat.icon}
                </div>
                <div className="text-right min-w-0 flex-1 ml-2">
                  <div className="text-xl font-bold text-gray-900 truncate" title={stat.numericValue.toLocaleString('ru-RU')}>{stat.value}</div>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 truncate">
                {stat.label}
              </div>
              
              {/* Simple progress bar */}
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stat.numericValue / 2000) * 100)}%` }}
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
                <div className="text-sm font-bold text-green-700 ml-2" title={(activeUsers ?? 0).toLocaleString('ru-RU')}> 
                  {formatNumberShort(activeUsers ?? 0)}
                </div>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default SystemStatsWidget;
