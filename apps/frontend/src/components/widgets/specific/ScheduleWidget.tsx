import React from 'react';
import { Widget } from '../../../types/widget';
import { Clock, MapPin } from 'lucide-react';

interface ScheduleWidgetProps {
  data: any;
  widget: Widget;
}

const ScheduleWidget: React.FC<ScheduleWidgetProps> = ({ data, widget }) => {
  const lessons = data?.lessons || [];

  if (lessons.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Сегодня уроков нет</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        <div className="flex-1 overflow-auto space-y-2">
          {lessons.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((lesson: any, index: number) => (
            <div key={lesson.id || index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-sm font-bold text-blue-600">
                    {lesson.time?.split('-')[0] || ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {lesson.time?.split('-')[1] || ''}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {lesson.subject}
                  </div>
                  {lesson.classroom && (
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{lesson.classroom}</span>
                    </div>
                  )}
                  {lesson.teacher && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {lesson.teacher}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {lessons.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {lessons.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} уроков
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

export default ScheduleWidget;
