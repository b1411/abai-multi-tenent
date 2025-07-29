import React from 'react';
import { Widget } from '../../../types/widget';
import { CheckSquare, Square, Plus, Clock, Flag } from 'lucide-react';

interface TasksWidgetProps {
  data: any;
  widget: Widget;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ data, widget }) => {
  // Mock data structure for tasks
  const mockData = {
    tasks: [
      {
        id: 1,
        title: 'Подготовить презентацию по математике',
        completed: false,
        priority: 'high',
        dueDate: '2025-01-28',
        category: 'homework'
      },
      {
        id: 2,
        title: 'Сдать отчет по физике',
        completed: true,
        priority: 'medium',
        dueDate: '2025-01-27',
        category: 'assignment'
      },
      {
        id: 3,
        title: 'Записаться на дополнительные курсы',
        completed: false,
        priority: 'low',
        dueDate: '2025-01-30',
        category: 'personal'
      },
      {
        id: 4,
        title: 'Подготовиться к контрольной по химии',
        completed: false,
        priority: 'high',
        dueDate: '2025-01-29',
        category: 'study'
      },
      {
        id: 5,
        title: 'Встреча с классным руководителем',
        completed: false,
        priority: 'medium',
        dueDate: '2025-01-31',
        category: 'meeting'
      }
    ],
    completedCount: 1,
    totalCount: 5
  };

  const tasks = data?.tasks || mockData.tasks;
  const completedCount = data?.completedCount || mockData.completedCount;
  const totalCount = data?.totalCount || mockData.totalCount;

  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет задач</p>
          <p className="text-xs text-gray-400 mt-1">Добавьте новую задачу</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'homework':
        return 'Д/З';
      case 'assignment':
        return 'Задание';
      case 'personal':
        return 'Личное';
      case 'study':
        return 'Учеба';
      case 'meeting':
        return 'Встреча';
      default:
        return 'Задача';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Progress header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-800">
              Прогресс задач
            </div>
            <div className="text-sm font-bold text-blue-700">
              {completedCount}/{totalCount}
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {completionPercentage}% выполнено
          </div>
        </div>

        {/* Tasks list */}
        <div className="flex-1 overflow-auto space-y-2">
          {tasks.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((task: any) => (
            <div
              key={task.id}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {task.completed ? (
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'} line-clamp-2`}>
                    {task.title}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityBg(task.priority)}`}>
                        <Flag className={`h-3 w-3 inline mr-1 ${getPriorityColor(task.priority)}`} />
                        {getCategoryName(task.category)}
                      </span>
                    </div>
                    
                    {task.dueDate && (
                      <div className={`flex items-center text-xs ${
                        isOverdue(task.dueDate) && !task.completed ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add task button for large widgets */}
        {widget.size === 'large' && (
          <div className="mt-3">
            <button className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Добавить задачу</span>
            </button>
          </div>
        )}

        {tasks.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {tasks.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} задач
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

export default TasksWidget;
