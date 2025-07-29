import React from 'react';
import { Widget } from '../../../types/widget';
import { BookOpen, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface AssignmentsWidgetProps {
  data: any;
  widget: Widget;
}

const AssignmentsWidget: React.FC<AssignmentsWidgetProps> = ({ data, widget }) => {
  // Mock data structure for assignments
  const mockData = {
    assignments: [
      {
        id: 1,
        subject: 'Математика',
        title: 'Решить задачи по алгебре',
        description: 'Глава 5, упражнения 1-20',
        dueDate: '2025-01-29',
        status: 'pending',
        teacher: 'Аманжолова Г.К.',
        priority: 'high'
      },
      {
        id: 2,
        subject: 'Физика',
        title: 'Лабораторная работа №3',
        description: 'Измерение ускорения свободного падения',
        dueDate: '2025-01-30',
        status: 'in_progress',
        teacher: 'Султанов Д.Б.',
        priority: 'medium'
      },
      {
        id: 3,
        subject: 'Химия',
        title: 'Составить уравнения реакций',
        description: 'Реакции окисления-восстановления',
        dueDate: '2025-01-28',
        status: 'submitted',
        teacher: 'Жумабекова С.А.',
        priority: 'medium'
      },
      {
        id: 4,
        subject: 'История',
        title: 'Эссе о Великой Отечественной войне',
        description: 'Объем 2-3 страницы, использовать источники',
        dueDate: '2025-02-01',
        status: 'pending',
        teacher: 'Кенесарова А.М.',
        priority: 'low'
      },
      {
        id: 5,
        subject: 'Литература',
        title: 'Анализ произведения А.С. Пушкина',
        description: 'Евгений Онегин, главы 1-3',
        dueDate: '2025-01-31',
        status: 'overdue',
        teacher: 'Байжанов К.С.',
        priority: 'high'
      }
    ],
    stats: {
      total: 5,
      pending: 2,
      inProgress: 1,
      submitted: 1,
      overdue: 1
    }
  };

  const assignments = data?.assignments || mockData.assignments;
  const stats = data?.stats || mockData.stats;

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
      <div className="h-full flex flex-col p-1">
        {/* Stats overview */}
        {widget.size !== 'small' && (
          <div className="mb-3 grid grid-cols-4 gap-1">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
              <div className="text-sm font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Всего</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
              <div className="text-sm font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-xs text-yellow-600">Новые</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="text-sm font-bold text-green-700">{stats.submitted}</div>
              <div className="text-xs text-green-600">Сдано</div>
            </div>
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
              <div className="text-sm font-bold text-red-700">{stats.overdue}</div>
              <div className="text-xs text-red-600">Просроч.</div>
            </div>
          </div>
        )}

        {/* Assignments list */}
        <div className="flex-1 overflow-auto space-y-2">
          {assignments.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((assignment: any) => (
            <div
              key={assignment.id}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(assignment.status)}
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {assignment.subject}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(assignment.status)}`}>
                  {getStatusName(assignment.status)}
                </span>
              </div>
              
              <div className="mb-2">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">
                  {assignment.title}
                </h4>
                {widget.size !== 'small' && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 truncate">
                  {assignment.teacher}
                </div>
                <div className={`flex items-center text-xs ${
                  isOverdue(assignment.dueDate) && assignment.status !== 'submitted' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(assignment.dueDate).toLocaleDateString('ru-RU')}
                  {assignment.status !== 'submitted' && (
                    <span className="ml-1">
                      ({getDaysUntilDue(assignment.dueDate) >= 0 ? 
                        `${getDaysUntilDue(assignment.dueDate)} дн.` : 
                        'просрочено'
                      })
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {assignments.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {assignments.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} заданий
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

export default AssignmentsWidget;
