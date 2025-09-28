import React from 'react';
import { Widget } from '../../../types/widget';
import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface SystemAlertItem {
  id: string | number;
  type: 'critical' | 'warning' | 'info' | string;
  message: string;
  time: string;
}

interface SystemAlertsData {
  critical: number;
  warnings: number;
  info: number;
  alerts: SystemAlertItem[];
}

interface SystemAlertsWidgetProps {
  data: SystemAlertsData | null;
  widget: Widget;
}

const SystemAlertsWidget: React.FC<SystemAlertsWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const { critical = 0, warnings = 0, info = 0, alerts = [] } = (widgetData || {}) as Partial<SystemAlertsData>;

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
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-1 mb-3 min-w-0">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center overflow-hidden">
            <div className="text-lg font-bold text-red-700 whitespace-nowrap" title={critical.toLocaleString('ru-RU')}>{formatNumberShort(critical)}</div>
            <div className="text-xs text-red-600 truncate" title="Критич.">Критич.</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center overflow-hidden">
            <div className="text-lg font-bold text-yellow-700 whitespace-nowrap" title={warnings.toLocaleString('ru-RU')}>{formatNumberShort(warnings)}</div>
            <div className="text-xs text-yellow-600 truncate" title="Предупр.">Предупр.</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center overflow-hidden">
            <div className="text-lg font-bold text-blue-700 whitespace-nowrap" title={info.toLocaleString('ru-RU')}>{formatNumberShort(info)}</div>
            <div className="text-xs text-blue-600 truncate" title="Инфо">Инфо</div>
          </div>
        </div>

        {/* Alerts list */}
        <div className="flex-1 space-y-2 overflow-auto min-w-0">
          {alerts.slice(0, widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4).map((alert: SystemAlertItem) => (
            <div key={alert.id} className={`p-3 rounded-lg border hover:shadow-sm transition-all duration-200 overflow-hidden ${getAlertColor(alert.type)}`}>
              <div className="flex items-start space-x-2 min-w-0">
                <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2" title={alert.message}>{alert.message}</p>
                  {widget.size.height !== 'small' && (
                    <div className="flex items-center text-xs text-gray-500 mt-1 whitespace-nowrap" title={new Date(alert.time).toLocaleString('ru-RU')}>
                      <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                      {new Date(alert.time).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > (widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4) && (
          <div className="text-center mt-2">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${alerts.length - (widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4)} уведомлений`}>
              и еще {alerts.length - (widget.size.height === 'small' ? 2 : widget.size.height === 'medium' ? 3 : 4)} уведомлений
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SystemAlertsWidget;
