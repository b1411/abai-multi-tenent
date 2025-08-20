import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { Users, TrendingUp, TrendingDown, Calendar, CheckCircle } from 'lucide-react';
import widgetService from '../../../services/widgetService';
import { formatNumberShort } from '../base/numberFormat';

interface TodayAttendance {
  present: number;
  absent: number;
  late: number;
  total?: number;
}

interface GradeAttendanceItem {
  grade: string;
  attendance: number; // percentage
  students: number;
}

interface WeeklyTrendItem {
  day: string;
  percentage: number;
}

interface SchoolAttendanceData {
  overall: number;
  trend: string;
  trendDirection: 'up' | 'down';
  byGrade: GradeAttendanceItem[];
  today: TodayAttendance;
  weeklyTrend: WeeklyTrendItem[];
}

interface SchoolAttendanceWidgetProps {
  data: SchoolAttendanceData | null;
  widget: Widget;
}

const SchoolAttendanceWidget: React.FC<SchoolAttendanceWidgetProps> = ({ data, widget }) => {
  const [widgetData, setWidgetData] = useState(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      loadWidgetData();
    }
  }, [data]);

  const loadWidgetData = async () => {
    try {
      setLoading(true);
      const result = await widgetService.getWidgetData('school-attendance');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading school attendance data:', error);
      setWidgetData({
        overall: 92.3,
        trend: '+2.1%',
        trendDirection: 'up',
        byGrade: [
          { grade: '1-й класс', attendance: 94.2, students: 156 },
          { grade: '2-й класс', attendance: 93.8, students: 148 }
        ],
        today: {
          present: 1087,
          absent: 95,
          late: 23,
          total: 1205
        },
        weeklyTrend: [
          { day: 'Пн', percentage: 89.2 },
          { day: 'Вт', percentage: 91.5 }
        ]
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

  const attendance: SchoolAttendanceData = widgetData || {
    overall: 0,
    trend: '0%',
    trendDirection: 'up',
    byGrade: [],
    today: { present: 0, absent: 0, late: 0 },
    weeklyTrend: []
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-green-500';
    if (percentage >= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Overall attendance header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate" title="Общая посещаемость">Общая посещаемость</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className={`text-lg font-bold ${getPercentageColor(attendance.overall)} whitespace-nowrap`} title={`${attendance.overall}%`}>
                {attendance.overall}%
              </div>
              {attendance.trendDirection === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-green-600 font-medium whitespace-nowrap" title={attendance.trend}>{attendance.trend}</span>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(attendance.overall)}`}
              style={{ width: `${attendance.overall}%` }}
            />
          </div>
        </div>

        {/* Today's summary */}
	<div className="mb-3 grid grid-cols-3 gap-2 min-w-0 overflow-hidden">
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1 flex-shrink-0" />
	  <div className="text-sm font-bold text-green-700 whitespace-nowrap truncate max-w-full" title={(attendance.today?.present || 0).toLocaleString('ru-RU')}>{formatNumberShort(attendance.today?.present || 0)}</div>
            <div className="text-xs text-green-600 truncate max-w-full" title="Присутствуют">Присутствуют</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <Calendar className="h-4 w-4 text-red-600 mx-auto mb-1 flex-shrink-0" />
	  <div className="text-sm font-bold text-red-700 whitespace-nowrap truncate max-w-full" title={(attendance.today?.absent || 0).toLocaleString('ru-RU')}>{formatNumberShort(attendance.today?.absent || 0)}</div>
            <div className="text-xs text-red-600 truncate max-w-full" title="Отсутствуют">Отсутствуют</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto mb-1 flex-shrink-0"></div>
	  <div className="text-sm font-bold text-yellow-700 whitespace-nowrap truncate max-w-full" title={(attendance.today?.late || 0).toLocaleString('ru-RU')}>{formatNumberShort(attendance.today?.late || 0)}</div>
            <div className="text-xs text-yellow-600 truncate max-w-full" title="Опоздали">Опоздали</div>
          </div>
        </div>

        {/* Attendance by grade */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="По классам">По классам</div>
      <div className="space-y-2 min-w-0">
            {(attendance.byGrade || []).slice(0, widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6).map((grade: GradeAttendanceItem, index: number) => (
        <div key={index} className="p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden min-w-0">
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate max-w-full" title={grade.grade}>{grade.grade}</div>
          <div className="text-xs text-gray-500 truncate max-w-full" title={`${grade.students.toLocaleString('ru-RU')} учеников`}>
                      {formatNumberShort(grade.students)} учеников
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className={`text-sm font-bold ${getPercentageColor(grade.attendance)} whitespace-nowrap`} title={`${grade.attendance}%`}>{grade.attendance}%</div>
                  </div>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(grade.attendance)}`}
                    style={{ width: `${grade.attendance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly trend for large widgets */}
        {widget.size === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Тренд недели">Тренд недели</div>
            <div className="grid grid-cols-5 gap-1">
              {(attendance.weeklyTrend || []).map((day: WeeklyTrendItem, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{day.day}</div>
                  <div className={`text-xs font-bold ${getPercentageColor(day.percentage)} whitespace-nowrap`} title={`${day.percentage}%`}>{day.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(attendance.byGrade || []).length > (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {(attendance.byGrade || []).length - (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6)} классов
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

export default SchoolAttendanceWidget;
