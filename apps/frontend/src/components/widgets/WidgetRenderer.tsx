import React, { useState, useEffect } from 'react';
import { Widget, WidgetType } from '../../types/widget';
import widgetService from '../../services/widgetService';

// Import only widget components that definitely exist
import SystemStatsWidget from './specific/SystemStatsWidget';
import SystemAlertsWidget from './specific/SystemAlertsWidget';
import FinanceOverviewWidget from './specific/FinanceOverviewWidget';
import ActivityMonitoringWidget from './specific/ActivityMonitoringWidget';
import ScheduleWidget from './specific/ScheduleWidget';
import GradesWidget from './specific/GradesWidget';
import WeatherWidget from './specific/WeatherWidget';
import NewsWidget from './specific/NewsWidget';
import TasksWidget from './specific/TasksWidget';
import AssignmentsWidget from './specific/AssignmentsWidget';
import AttendanceWidget from './specific/AttendanceWidget';
import SchoolAttendanceWidget from './specific/SchoolAttendanceWidget';
import TeacherWorkloadWidget from './specific/TeacherWorkloadWidget';
import ClassroomUsageWidget from './specific/ClassroomUsageWidget';
import GradeAnalyticsWidget from './specific/GradeAnalyticsWidget';
import SystemMonitoringWidget from './specific/SystemMonitoringWidget';

interface WidgetRendererProps {
  widget: Widget;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWidgetData = async () => {
      try {
        setLoading(true);
        setError(null);
        const widgetData = await widgetService.getWidgetData(widget.type, widget.config);
        setData(widgetData);
      } catch (err) {
        console.error(`Error loading data for widget ${widget.type}:`, err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadWidgetData();
  }, [widget.type, widget.config]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-500">
        <div className="text-center">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Render specific widget based on type
  const renderWidget = () => {
    switch (widget.type) {
      case 'schedule':
      case 'teacher-schedule':
      case 'child-schedule':
        return <ScheduleWidget data={data} widget={widget} />;
        
      case 'grades':
      case 'child-grades':
        return <GradesWidget data={data} widget={widget} />;
        
      case 'weather':
        return <WeatherWidget data={data} widget={widget} />;
        
      case 'news':
      case 'school-events':
        return <NewsWidget data={data} widget={widget} />;
        
      case 'tasks':
        return <TasksWidget data={data} widget={widget} />;
        
      case 'assignments':
      case 'child-homework':
        return <AssignmentsWidget data={data} widget={widget} />;
        
      case 'attendance':
      case 'child-attendance':
        return <AttendanceWidget data={data} widget={widget} />;

      // Admin widgets
      case 'system-stats':
        return <SystemStatsWidget data={data} widget={widget} />;
        
      case 'system-alerts':
        return <SystemAlertsWidget data={data} widget={widget} />;
        
      case 'finance-overview':
        return <FinanceOverviewWidget data={data} widget={widget} />;
        
      case 'activity-monitoring':
        return <ActivityMonitoringWidget data={data} widget={widget} />;

      case 'school-attendance':
        return <SchoolAttendanceWidget data={data} widget={widget} />;
        
      case 'teacher-workload':
        return <TeacherWorkloadWidget data={data} widget={widget} />;
        
      case 'classroom-usage':
        return <ClassroomUsageWidget data={data} widget={widget} />;

      case 'grade-analytics':
        return <GradeAnalyticsWidget data={data} widget={widget} />;
        
      case 'system-monitoring':
        return <SystemMonitoringWidget data={data} widget={widget} />;

      // For widgets we haven't implemented yet, show a placeholder
      default:
        return <DefaultWidget data={data} widget={widget} />;
    }
  };

  return renderWidget();
};

// Default widget component for types we haven't implemented yet
const DefaultWidget: React.FC<{ data: any; widget: Widget }> = ({ data, widget }) => {
  return (
    <div className="h-full relative">
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-slate-50/30 rounded-lg"></div>
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-gray-500">
        <div className="text-center">
          {/* Modern icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <div className="text-2xl">🚀</div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Скоро будет готово!</h3>
          <p className="text-sm text-gray-600 mb-4">Виджет "{widget.title}" находится в разработке</p>
          
          {/* Preview data if available */}
          {data && Object.keys(data).length > 0 && (
            <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 max-w-sm">
              <div className="text-xs font-medium text-gray-700 mb-2">Предварительные данные:</div>
              <div className="space-y-1">
                {Object.entries(data).slice(0, 3).map(([key, value]: [string, any], index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{key}:</span>
                    <span className="text-gray-800 font-medium">
                      {typeof value === 'object' ? `${Object.keys(value).length} элементов` : String(value).slice(0, 20)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo indicator */}
      <div className="absolute bottom-3 right-3 opacity-60">
        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100/80 text-blue-700 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          <span>В разработке</span>
        </div>
      </div>
    </div>
  );
};

export default WidgetRenderer;
