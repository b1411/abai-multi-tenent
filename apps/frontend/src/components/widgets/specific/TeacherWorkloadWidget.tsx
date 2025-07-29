import React from 'react';
import { Widget } from '../../../types/widget';
import { Clock, User, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

interface TeacherWorkloadWidgetProps {
  data: any;
  widget: Widget;
}

const TeacherWorkloadWidget: React.FC<TeacherWorkloadWidgetProps> = ({ data, widget }) => {
  // Mock data structure for teacher workload
  const mockData = {
    averageHours: 24.5,
    totalTeachers: 87,
    overloadedTeachers: 12,
    underloadedTeachers: 8,
    teachers: [
      { 
        name: 'Аманжолова Г.К.', 
        hours: 28, 
        subjects: ['Математика', 'Алгебра'], 
        groups: 6,
        status: 'overloaded'
      },
      { 
        name: 'Султанов Д.Б.', 
        hours: 22, 
        subjects: ['История', 'Обществознание'], 
        groups: 4,
        status: 'normal'
      },
      { 
        name: 'Жумабекова С.А.', 
        hours: 26, 
        subjects: ['Казахский язык', 'Литература'], 
        groups: 5,
        status: 'optimal'
      },
      { 
        name: 'Кенесарова А.М.', 
        hours: 18, 
        subjects: ['Физика'], 
        groups: 3,
        status: 'underloaded'
      },
      { 
        name: 'Байжанов К.С.', 
        hours: 25, 
        subjects: ['Химия', 'Биология'], 
        groups: 5,
        status: 'optimal'
      },
      { 
        name: 'Нурланова Т.И.', 
        hours: 30, 
        subjects: ['Английский язык'], 
        groups: 8,
        status: 'overloaded'
      }
    ],
    distribution: {
      overloaded: 12, // >27 hours
      optimal: 45,    // 20-27 hours
      underloaded: 30 // <20 hours
    }
  };

  const workload = data || mockData;

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
      <div className="h-full flex flex-col p-1">
        {/* Summary header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Нагрузка учителей</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {workload.averageHours}ч
            </div>
          </div>
          <div className="text-xs text-blue-600">
            Средняя нагрузка на учителя
          </div>
        </div>

        {/* Distribution summary */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
            <AlertCircle className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-red-700">{workload.distribution.overloaded}</div>
            <div className="text-xs text-red-600">Перегружены</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-green-700">{workload.distribution.optimal}</div>
            <div className="text-xs text-green-600">Оптимально</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
            <User className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-yellow-700">{workload.distribution.underloaded}</div>
            <div className="text-xs text-yellow-600">Недогружены</div>
          </div>
        </div>

        {/* Teachers list */}
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">Учителя</div>
          <div className="space-y-2">
            {workload.teachers.slice(0, widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6).map((teacher: any, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {teacher.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${getHoursColor(teacher.hours)}`}>
                      {teacher.hours}ч
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(teacher.status)}`}>
                      {getStatusText(teacher.status)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-3 w-3" />
                    <span className="truncate">
                      {teacher.subjects.join(', ')}
                    </span>
                  </div>
                  <div>
                    {teacher.groups} групп
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
            ))}
          </div>
        </div>

        {workload.teachers.length > (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {workload.teachers.length - (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6)} учителей
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

export default TeacherWorkloadWidget;
