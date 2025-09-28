import React from 'react';
import { Widget } from '../../../types/widget';
import { BookOpen, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

type AssignmentStatus = 'pending' | 'in_progress' | 'submitted' | 'overdue' | string;

interface AssignmentItem {
  id: string | number;
  subject: string;
  title: string;
  description?: string;
  status: AssignmentStatus;
  teacher?: string;
  dueDate: string;
}

interface AssignmentStats {
  total: number;
  pending: number;
  inProgress: number;
  submitted: number;
  overdue: number;
}

interface AssignmentsData {
  assignments: AssignmentItem[];
  stats?: AssignmentStats;
}

interface AssignmentsWidgetProps {
  data: AssignmentsData | null;
  widget: Widget;
}

const AssignmentsWidget: React.FC<AssignmentsWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const assignments: AssignmentItem[] = widgetData?.assignments || [];
  
  // Calculate stats from assignments if not provided
  const stats: AssignmentStats = widgetData?.stats || {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    overdue: assignments.filter(a => a.status === 'overdue' || 
      (new Date(a.dueDate) < new Date() && a.status !== 'submitted')).length
  };

  if (assignments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет заданий</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Сдано';
      case 'in_progress':
        return 'В работе';
      case 'overdue':
        return 'Просрочено';
      case 'pending':
        return 'Ожидает';
      default:
        return 'Неизвестно';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Stats overview */}
        {widget.size.height !== 'small' && (
      <div className="mb-3 grid grid-cols-4 gap-1 min-w-0">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
        <div className="text-sm font-bold text-gray-900 whitespace-nowrap" title={stats.total.toLocaleString('ru-RU')}>{formatNumberShort(stats.total)}</div>
              <div className="text-xs text-gray-600">Всего</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
        <div className="text-sm font-bold text-yellow-700 whitespace-nowrap" title={stats.pending.toLocaleString('ru-RU')}>{formatNumberShort(stats.pending)}</div>
              <div className="text-xs text-yellow-600">Новые</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
        <div className="text-sm font-bold text-green-700 whitespace-nowrap" title={stats.submitted.toLocaleString('ru-RU')}>{formatNumberShort(stats.submitted)}</div>
              <div className="text-xs text-green-600">Сдано</div>
            </div>
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
        <div className="text-sm font-bold text-red-700 whitespace-nowrap" title={stats.overdue.toLocaleString('ru-RU')}>{formatNumberShort(stats.overdue)}</div>
              <div className="text-xs text-red-600">Просроч.</div>
            </div>
          </div>
        )}

        {/* Assignments list */}
        <div className="flex-1 overflow-auto space-y-2 min-w-0">
          {assignments.slice(0, widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4).map((assignment: AssignmentItem) => (
            <div key={assignment.id} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
              <div className="flex items-start justify-between mb-2 min-w-0 gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="flex-shrink-0">{getStatusIcon(assignment.status)}</div>
                  <span className="text-sm font-semibold text-gray-900 truncate" title={assignment.subject}>{assignment.subject}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ml-2 ${getStatusColor(assignment.status)}`} title={getStatusName(assignment.status)}>{getStatusName(assignment.status)}</span>
              </div>
              <div className="mb-2 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 truncate mb-1" title={assignment.title}>{assignment.title}</h4>
                {widget.size.height !== 'small' && (
                  <p className="text-xs text-gray-600 line-clamp-2" title={assignment.description}>{assignment.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between min-w-0 gap-2">
                <div className="text-xs text-gray-500 truncate flex-1" title={assignment.teacher}>{assignment.teacher}</div>
                <div className={`flex items-center text-xs whitespace-nowrap ${isOverdue(assignment.dueDate) && assignment.status !== 'submitted' ? 'text-red-600' : 'text-gray-500'}`} title={new Date(assignment.dueDate).toLocaleDateString('ru-RU')}>
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(assignment.dueDate).toLocaleDateString('ru-RU')}
                    {assignment.status !== 'submitted' && (
                      <span className="ml-1">
                        ({getDaysUntilDue(assignment.dueDate) >= 0 ? `${getDaysUntilDue(assignment.dueDate)} дн.` : 'просрочено'})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {assignments.length > (widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {assignments.length - (widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4)} заданий
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AssignmentsWidget;
