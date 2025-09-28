import React from 'react';
import { Widget } from '../../../types/widget';
import { Activity, Users, Clock, Eye, MapPin, Smartphone } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface TopActivity { name: string; users: number; percentage: number; }
interface RecentActivity { user: string; action: string; time: string; type: string; }
interface ActivityMonitoringData {
  activeUsers: number;
  onlineStudents: number;
  onlineTeachers: number;
  averageSessionTime: string;
  topActivities: TopActivity[];
  recentActivity: RecentActivity[];
}

interface ActivityMonitoringWidgetProps {
  data: ActivityMonitoringData | null;
  widget: Widget;
}

const ActivityMonitoringWidget: React.FC<ActivityMonitoringWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const data_to_use: ActivityMonitoringData = widgetData || {
    activeUsers: 0,
    onlineStudents: 0,
    onlineTeachers: 0,
    averageSessionTime: '0m',
    topActivities: [],
    recentActivity: []
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Header with live indicator */}
    <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title="Активность">Активность</span>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Live
          </div>
        </div>

        {/* Key metrics */}
  <div className="grid grid-cols-2 gap-2 mb-3 min-w-0">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-lg font-bold text-blue-700">
                <span title={(data_to_use.activeUsers ?? 0).toLocaleString('ru-RU')}>
                  {formatNumberShort(data_to_use.activeUsers ?? 0)}
                </span>
              </div>
            </div>
            <div className="text-xs font-medium text-blue-600 truncate">
              Активные пользователи
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div className="text-lg font-bold text-purple-700">
                {data_to_use.averageSessionTime || '0m'}
              </div>
            </div>
            <div className="text-xs font-medium text-purple-600 truncate">
              Время сессии
            </div>
          </div>
        </div>

        {/* Online breakdown */}
  <div className="grid grid-cols-2 gap-2 mb-3 min-w-0">
          <div className="p-2 rounded-lg bg-green-50 border border-green-200">
            <div className="text-xs font-medium text-gray-600">Студенты</div>
            <div className="text-sm font-bold text-green-700" title={(data_to_use.onlineStudents ?? 0).toLocaleString('ru-RU')}>
              {formatNumberShort(data_to_use.onlineStudents ?? 0)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-xs font-medium text-gray-600">Учителя</div>
            <div className="text-sm font-bold text-blue-700" title={(data_to_use.onlineTeachers ?? 0).toLocaleString('ru-RU')}>
              {formatNumberShort(data_to_use.onlineTeachers ?? 0)}
            </div>
          </div>
        </div>

        {/* Activities based on widget size */}
        <div className="flex-1 overflow-auto">
          {widget.size.height === 'large' ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Популярные активности
              </div>
              {data_to_use.topActivities?.slice(0, 2).map((activity: TopActivity, index: number) => (
                <div key={index} className="p-2 rounded-lg bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800 truncate">{activity.name}</span>
                    <span className="text-xs font-bold text-indigo-600">{activity.users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${activity.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Последняя активность
              </div>
              {data_to_use.recentActivity?.slice(0, widget.size.height === 'small' ? 2 : 3).map((activity: RecentActivity, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-gray-200 min-w-0 overflow-hidden">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'login' ? 'bg-green-400' :
                    activity.type === 'content' ? 'bg-blue-400' : 'bg-purple-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">
                      {activity.user}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {activity.action}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap pl-2">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ActivityMonitoringWidget;
