import React from 'react';
import { Widget } from '../../../types/widget';
import { CheckCircle, XCircle, Clock, Calendar, TrendingUp, User } from 'lucide-react';

interface AttendanceWidgetProps {
  data: any;
  widget: Widget;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ data, widget }) => {
  // Mock data structure for attendance
  const mockData = {
    currentMonth: {
      totalDays: 20,
      presentDays: 18,
      absentDays: 2,
      lateDays: 1,
      percentage: 90
    },
    recentAttendance: [
      { date: '2025-01-27', status: 'present', lessons: 6, note: null },
      { date: '2025-01-26', status: 'present', lessons: 5, note: null },
      { date: '2025-01-25', status: 'late', lessons: 6, note: 'Опоздание на 15 мин' },
      { date: '2025-01-24', status: 'absent', lessons: 6, note: 'Болезнь' },
      { date: '2025-01-23', status: 'present', lessons: 6, note: null },
      { date: '2025-01-22', status: 'present', lessons: 5, note: null },
      { date: '2025-01-21', status: 'present', lessons: 6, note: null }
    ],
    weeklyStats: {
      thisWeek: 95,
      lastWeek: 85,
      trend: 'up'
    }
  };

  const attendance = data || mockData;
  const { currentMonth, recentAttendance, weeklyStats } = attendance;

  if (!currentMonth) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет данных о посещаемости</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'absent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'late':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'present':
        return 'Присутствовал';
      case 'absent':
        return 'Отсутствовал';
      case 'late':
        return 'Опоздание';
      default:
        return 'Неизвестно';
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Current month stats */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-800">
              Посещаемость за месяц
            </div>
            <div className={`text-sm font-bold ${getPercentageColor(currentMonth.percentage)}`}>
              {currentMonth.percentage}%
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(currentMonth.percentage)}`}
              style={{ width: `${currentMonth.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-700">{currentMonth.presentDays}</div>
              <div className="text-green-600">Присутствие</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-700">{currentMonth.absentDays}</div>
              <div className="text-red-600">Отсутствие</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-700">{currentMonth.lateDays}</div>
              <div className="text-yellow-600">Опоздания</div>
            </div>
          </div>
        </div>

        {/* Weekly trend for medium and large widgets */}
        {widget.size !== 'small' && weeklyStats && (
          <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Эта неделя</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">{weeklyStats.thisWeek}%</span>
                {weeklyStats.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Прошлая неделя: {weeklyStats.lastWeek}%
            </div>
          </div>
        )}

        {/* Recent attendance */}
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">Последние дни</div>
          <div className="space-y-2">
            {recentAttendance?.slice(0, widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5).map((record: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(record.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('ru-RU')}
                    </div>
                    {record.note && widget.size !== 'small' && (
                      <div className="text-xs text-gray-500 truncate max-w-32">
                        {record.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(record.status)}`}>
                    {getStatusName(record.status)}
                  </span>
                  {widget.size === 'large' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {record.lessons} уроков
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {recentAttendance && recentAttendance.length > (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {recentAttendance.length - (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 5)} дней
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

export default AttendanceWidget;
