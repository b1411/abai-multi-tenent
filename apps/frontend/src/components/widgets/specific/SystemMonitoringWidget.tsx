import React from 'react';
import { Widget } from '../../../types/widget';
import { Monitor, Cpu, HardDrive, Wifi, Database, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface MonitoringService {
  name: string;
  status: 'running' | 'warning' | 'error' | string;
  uptime: string;
  load: number;
}

interface PerformanceMetrics {
  requestsPerSecond: number;
  responseTime: number; // ms
  errorRate: number; // %
  throughput: number; // generic numeric (maybe MB/s)
}

interface MonitoringAlert { message: string; time: string; }

interface SystemMonitoringData {
  serverStatus: string;
  cpuUsage: number;
  memoryUsage: number;
  services: MonitoringService[];
  performance?: PerformanceMetrics;
  alerts?: MonitoringAlert[];
}

interface SystemMonitoringWidgetProps {
  data: SystemMonitoringData | null;
  widget: Widget;
}

const SystemMonitoringWidget: React.FC<SystemMonitoringWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const monitoring: SystemMonitoringData = widgetData || {
    serverStatus: 'unknown',
    cpuUsage: 0,
    memoryUsage: 0,
    services: [],
    performance: { requestsPerSecond: 0, responseTime: 0, errorRate: 0, throughput: 0 },
    alerts: []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* System status header */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <Monitor className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate" title="Мониторинг системы">Мониторинг системы</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold text-green-700 whitespace-nowrap" title="Работает">Работает</span>
            </div>
          </div>
        </div>

        {/* Resource usage */}
    <div className="mb-3 grid grid-cols-2 gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-white border border-gray-200 text-center">
            <Cpu className="h-4 w-4 text-gray-600 mx-auto mb-1" />
      <div className={`text-sm font-bold ${getUsageTextColor(monitoring.cpuUsage)} whitespace-nowrap`} title={`${monitoring.cpuUsage}%`}>{monitoring.cpuUsage}%</div>
            <div className="text-xs text-gray-600">CPU</div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getUsageColor(monitoring.cpuUsage)}`}
                style={{ width: `${monitoring.cpuUsage}%` }}
              />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-gray-200 text-center">
            <Database className="h-4 w-4 text-gray-600 mx-auto mb-1" />
      <div className={`text-sm font-bold ${getUsageTextColor(monitoring.memoryUsage)} whitespace-nowrap`} title={`${monitoring.memoryUsage}%`}>{monitoring.memoryUsage}%</div>
            <div className="text-xs text-gray-600">RAM</div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getUsageColor(monitoring.memoryUsage)}`}
                style={{ width: `${monitoring.memoryUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Services status */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Сервисы">Сервисы</div>
          <div className="space-y-2">
            {monitoring.services.slice(0, widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6).map((service: MonitoringService, index: number) => (
              <div key={index} className="p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
                <div className="flex items-center justify-between mb-1 min-w-0 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    {getStatusIcon(service.status)}
                    <span className="text-sm font-medium text-gray-900 truncate" title={service.name}>{service.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(service.status)} whitespace-nowrap`} title={service.status === 'running' ? 'Работает' : service.status === 'warning' ? 'Предупреждение' : 'Ошибка'}>
                    {service.status === 'running' ? 'Работает' : 
                     service.status === 'warning' ? 'Предупреждение' : 'Ошибка'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 min-w-0 gap-2">
                  <span className="truncate" title={`Работает: ${service.uptime}`}>Работает: {service.uptime}</span>
                  <span className="whitespace-nowrap" title={`Нагрузка: ${service.load}%`}>Нагрузка: {service.load}%</span>
                </div>

                {service.status === 'running' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getUsageColor(service.load)}`}
                      style={{ width: `${service.load}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Performance metrics for large widgets */}
        {widget.size.height === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Производительность">Производительность</div>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Запросов/сек</span>
                <span className="text-xs font-medium text-blue-600 whitespace-nowrap" title={monitoring.performance?.requestsPerSecond?.toLocaleString('ru-RU')}>{formatNumberShort(monitoring.performance?.requestsPerSecond || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Время ответа</span>
                <span className="text-xs font-medium text-green-600 whitespace-nowrap" title={`${monitoring.performance?.responseTime}мс`}>{monitoring.performance?.responseTime}мс</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Ошибки</span>
                <span className="text-xs font-medium text-yellow-600 whitespace-nowrap" title={`${monitoring.performance?.errorRate}%`}>{monitoring.performance?.errorRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Трафик</span>
                <span className="text-xs font-medium text-purple-600 whitespace-nowrap" title={monitoring.performance?.throughput?.toLocaleString('ru-RU')}>{formatNumberShort(monitoring.performance?.throughput || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent alerts */}
        {widget.size.height !== 'small' && monitoring.alerts && monitoring.alerts.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Последние события">Последние события</div>
            <div className="space-y-1">
              {monitoring.alerts.slice(0, 2).map((alert: MonitoringAlert, index: number) => (
                <div key={index} className="flex items-center justify-between min-w-0 gap-2">
                  <span className="text-xs text-gray-700 truncate" title={alert.message}>{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap" title={alert.time}>{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {monitoring.services.length > (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${monitoring.services.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} сервисов`}>
              и еще {monitoring.services.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} сервисов
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SystemMonitoringWidget;
