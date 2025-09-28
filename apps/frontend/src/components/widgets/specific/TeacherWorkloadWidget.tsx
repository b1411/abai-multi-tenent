import React from 'react';
import { Widget } from '../../../types/widget';
import { Clock, User, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface TeacherInfo {
  name: string;
  hours: number;
  subjects: string[];
  groups: number;
  status: 'overloaded' | 'optimal' | 'underloaded' | string;
}

interface WorkloadDistribution {
  overloaded: number;
  optimal: number;
  underloaded: number;
}

interface TeacherWorkloadData {
  averageHours: number;
  totalTeachers?: number;
  teachers: TeacherInfo[];
  distribution: WorkloadDistribution;
}

interface TeacherWorkloadWidgetProps {
  data: TeacherWorkloadData | null;
  widget: Widget;
}

const TeacherWorkloadWidget: React.FC<TeacherWorkloadWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const workload: TeacherWorkloadData = widgetData || {
    averageHours: 0,
    teachers: [],
    distribution: { overloaded: 0, optimal: 0, underloaded: 0 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'optimal':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'underloaded':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overloaded':
        return 'Перегружен';
      case 'optimal':
        return 'Оптимально';
      case 'underloaded':
        return 'Недогружен';
      default:
        return 'Нормально';
    }
  };

  const getHoursColor = (hours: number) => {
    if (hours > 27) return 'text-red-600';
    if (hours >= 20) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Summary header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate" title="Нагрузка учителей">Нагрузка учителей</span>
            </div>
            <div className="text-lg font-bold text-blue-700 whitespace-nowrap" title={`${workload.averageHours}ч`}>
              {workload.averageHours}ч
            </div>
          </div>
          <div className="text-xs text-blue-600 truncate" title="Средняя нагрузка на учителя">
            Средняя нагрузка на учителя
          </div>
        </div>

        {/* Distribution summary */}
	<div className="mb-3 grid grid-cols-3 gap-2 min-w-0 overflow-hidden">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <AlertCircle className="h-4 w-4 text-red-600 mx-auto mb-1 flex-shrink-0" />
	  <div className="text-sm font-bold text-red-700 whitespace-nowrap truncate max-w-full" title={workload.distribution.overloaded?.toLocaleString('ru-RU')}>{formatNumberShort(workload.distribution.overloaded)}</div>
            <div className="text-xs text-red-600 truncate max-w-full" title="Перегружены">Перегружены</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1 flex-shrink-0" />
	  <div className="text-sm font-bold text-green-700 whitespace-nowrap truncate max-w-full" title={workload.distribution.optimal?.toLocaleString('ru-RU')}>{formatNumberShort(workload.distribution.optimal)}</div>
            <div className="text-xs text-green-600 truncate max-w-full" title="Оптимально">Оптимально</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center flex flex-col items-center min-w-0 overflow-hidden">
            <User className="h-4 w-4 text-yellow-600 mx-auto mb-1 flex-shrink-0" />
	  <div className="text-sm font-bold text-yellow-700 whitespace-nowrap truncate max-w-full" title={workload.distribution.underloaded?.toLocaleString('ru-RU')}>{formatNumberShort(workload.distribution.underloaded)}</div>
            <div className="text-xs text-yellow-600 truncate max-w-full" title="Недогружены">Недогружены</div>
          </div>
        </div>

        {/* Teachers list */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Учителя">Учителя</div>
          <div className="space-y-2">
            {workload.teachers.slice(0, widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6).map((teacher: TeacherInfo, index: number) => {
              const subjectsFull = teacher.subjects.join(', ');
              const subjectsShort = teacher.subjects.length > 2 ? `${teacher.subjects.slice(0,2).join(', ')} +${teacher.subjects.length - 2}` : subjectsFull;
              return (
              <div key={index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden min-w-0">
                <div className="flex items-center justify-between mb-2 min-w-0 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 truncate" title={teacher.name}>{teacher.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 overflow-hidden">
                    <span className={`text-sm font-bold ${getHoursColor(teacher.hours)} whitespace-nowrap`} title={`${teacher.hours}ч`}>{teacher.hours}ч</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(teacher.status)} whitespace-nowrap truncate max-w-[90px]`} title={getStatusText(teacher.status)}>{getStatusText(teacher.status)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 min-w-0 gap-2 overflow-hidden">
                  <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                    <BookOpen className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-full" title={subjectsFull}>{subjectsShort}</span>
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap" title={`${teacher.groups?.toLocaleString('ru-RU')} групп`}>
                    {formatNumberShort(teacher.groups)} групп
                  </div>
                </div>

                {/* Load bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      teacher.hours > 27 ? 'bg-red-500' :
                      teacher.hours >= 20 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, (teacher.hours / 30) * 100)}%` }}
                  />
                </div>
              </div>
            );})}
          </div>
        </div>

        {workload.teachers.length > (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${workload.teachers.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} учителей`}>
              и еще {workload.teachers.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} учителей
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherWorkloadWidget;
