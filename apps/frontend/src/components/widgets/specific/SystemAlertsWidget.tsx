import React, { useEffect, useState } from 'react';
import { Widget } from '../../../types/widget';
import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import widgetService from '../../../services/widgetService';

interface SystemAlertsWidgetProps {
  data: any;
  widget: Widget;
}

const SystemAlertsWidget: React.FC<SystemAlertsWidgetProps> = ({ data, widget }) => {
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
      const result = await widgetService.getWidgetData('system-alerts');
      setWidgetData(result);
    } catch (error) {
      console.error('Error loading system alerts data:', error);
      setWidgetData({ alerts: [] });
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

  const { critical, warnings, info, alerts } = widgetData || {};

  if (!alerts || alerts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет уведомлений</p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
            <div className="text-lg font-bold text-red-700">{critical || 0}</div>
            <div className="text-xs text-red-600">Критич.</div>
          </div>
          
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
            <div className="text-lg font-bold text-yellow-700">{warnings || 0}</div>
            <div className="text-xs text-yellow-600">Предупр.</div>
          </div>
          
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
            <div className="text-lg font-bold text-blue-700">{info || 0}</div>
            <div className="text-xs text-blue-600">Инфо</div>
          </div>
        </div>

        {/* Alerts list */}
        <div className="flex-1 space-y-2 overflow-auto">
          {alerts.slice(0, widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4).map((alert: any) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border hover:shadow-sm transition-all duration-200 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {alert.message}
                  </p>
                  {widget.size !== 'small' && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(alert.time).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4) && (
          <div className="text-center mt-2">
            <div className="text-xs text-gray-500">
              и еще {alerts.length - (widget.size === 'small' ? 2 : widget.size === 'medium' ? 3 : 4)} уведомлений
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

export default SystemAlertsWidget;
