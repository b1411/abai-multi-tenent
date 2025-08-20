import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { Clock, MapPin } from 'lucide-react';
import widgetService from '../../../services/widgetService';

interface LessonItem {
  id?: string | number;
  time?: string; // format HH:MM-HH:MM
  subject: string;
  classroom?: string;
  teacher?: string;
}

interface ScheduleData { lessons: LessonItem[]; }

interface ScheduleWidgetProps {
  data: ScheduleData | null;
  widget: Widget;
}

const ScheduleWidget: React.FC<ScheduleWidgetProps> = ({ data, widget }) => {
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
      const result = await widgetService.getWidgetData('schedule');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setWidgetData({ lessons: [] });
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

  const lessons: LessonItem[] = widgetData?.lessons || [];

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
      <div className="h-full flex flex-col p-1 min-w-0">
        <div className="flex-1 overflow-auto space-y-2 min-w-0">
          {lessons.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((lesson: LessonItem, index: number) => (
            <div key={lesson.id || index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
              <div className="flex items-start space-x-3 min-w-0">
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-sm font-bold text-blue-600 whitespace-nowrap" title={lesson.time?.split('-')[0] || ''}>
                    {lesson.time?.split('-')[0] || ''}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap" title={lesson.time?.split('-')[1] || ''}>
                    {lesson.time?.split('-')[1] || ''}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate" title={lesson.subject}>{lesson.subject}</div>
                  {lesson.classroom && (
                    <div className="flex items-center text-xs text-gray-600 mt-1 min-w-0" title={lesson.classroom}>
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{lesson.classroom}</span>
                    </div>
                  )}
                  {lesson.teacher && (
                    <div className="text-xs text-gray-500 mt-1 truncate" title={lesson.teacher}>{lesson.teacher}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {lessons.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${lessons.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} уроков`}>
              и еще {lessons.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} уроков
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScheduleWidget;
