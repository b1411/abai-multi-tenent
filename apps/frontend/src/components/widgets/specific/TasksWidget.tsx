import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { CheckSquare, Square, Plus, Clock, Flag } from 'lucide-react';
import widgetService from '../../../services/widgetService';
import { formatNumberShort } from '../base/numberFormat';

interface TaskItem {
  id: string | number;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | string;
  category?: string;
  dueDate?: string;
}

interface TasksData {
  tasks: TaskItem[];
  completedCount?: number;
  totalCount?: number;
}

interface TasksWidgetProps {
  data: TasksData | null;
  widget: Widget;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ data, widget }) => {
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
      const result = await widgetService.getWidgetData('tasks');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading tasks data:', error);
      setWidgetData({ 
        tasks: [],
        completedCount: 0,
        totalCount: 0
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

  const tasks: TaskItem[] = widgetData?.tasks || [];
  const completedCount = widgetData?.completedCount ?? tasks.filter(t => t.completed).length;
  const totalCount = widgetData?.totalCount ?? tasks.length;

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
              <span title={`${completedCount.toLocaleString('ru-RU')}/${totalCount.toLocaleString('ru-RU')}`}>
                {formatNumberShort(completedCount)}/{formatNumberShort(totalCount)}
              </span>
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
          {tasks.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((task: TaskItem) => (
            <div
              key={task.id}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start space-x-3 min-w-0">
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
                  
                  <div className="flex items-center justify-between mt-2 min-w-0 gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${getPriorityBg(task.priority)}`}>
                        <Flag className={`h-3 w-3 inline mr-1 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                        <span className="truncate">{getCategoryName(task.category || 'task')}</span>
                      </span>
                    </div>
                    
                    {task.dueDate && (
                      <div className={`flex items-center text-xs whitespace-nowrap ${
                        isOverdue(task.dueDate) && !task.completed ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
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
