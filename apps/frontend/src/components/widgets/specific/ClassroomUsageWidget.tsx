import React from 'react';
import { Widget } from '../../../types/widget';
import { Building, CheckCircle, Clock, Users, MapPin } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface ClassroomRoom {
  number: string;
  status: 'occupied' | 'free' | 'maintenance' | string;
  subject?: string;
  teacher?: string;
  group?: string;
  timeLeft?: string;
  nextClass?: string;
}

interface FloorUsage { floor: string; total: number; occupied: number; utilization: number; }

interface ClassroomUsageData {
  totalRooms: number;
  occupiedRooms: number;
  freeRooms: number;
  utilizationRate: number;
  rooms: ClassroomRoom[];
  floors: FloorUsage[];
}

interface ClassroomUsageWidgetProps {
  data: ClassroomUsageData | null;
  widget: Widget;
}

const ClassroomUsageWidget: React.FC<ClassroomUsageWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const usage: ClassroomUsageData = widgetData || {
    totalRooms: 0,
    occupiedRooms: 0,
    freeRooms: 0,
    utilizationRate: 0,
    rooms: [],
    floors: []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'free':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'maintenance':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'Занят';
      case 'free':
        return 'Свободен';
      case 'maintenance':
        return 'Ремонт';
      default:
        return 'Неизвестно';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className="h-full flex flex-col p-1 min-w-0">
        {/* Usage overview */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-blue-800 truncate" title="Использование кабинетов">Использование кабинетов</span>
            </div>
            <div className={`text-lg font-bold ${getUtilizationColor(usage.utilizationRate)} whitespace-nowrap`} title={`${usage.utilizationRate}%`}>
              {usage.utilizationRate}%
            </div>
          </div>
          <div className="text-xs text-blue-600 mb-2 truncate" title={`${usage.occupiedRooms.toLocaleString('ru-RU')} из ${usage.totalRooms.toLocaleString('ru-RU')}`}> 
            {formatNumberShort(usage.occupiedRooms)} из {formatNumberShort(usage.totalRooms)} кабинетов заняты
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                usage.utilizationRate >= 80 ? 'bg-red-500' :
                usage.utilizationRate >= 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${usage.utilizationRate}%` }}
            />
          </div>
        </div>

        {/* Status summary */}
    <div className="mb-3 grid grid-cols-2 gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
            <Users className="h-4 w-4 text-red-600 mx-auto mb-1" />
      <div className="text-sm font-bold text-red-700 whitespace-nowrap" title={usage.occupiedRooms.toLocaleString('ru-RU')}>{formatNumberShort(usage.occupiedRooms)}</div>
            <div className="text-xs text-red-600">Заняты</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
      <div className="text-sm font-bold text-green-700 whitespace-nowrap" title={usage.freeRooms.toLocaleString('ru-RU')}>{formatNumberShort(usage.freeRooms)}</div>
            <div className="text-xs text-green-600">Свободны</div>
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="Кабинеты">Кабинеты</div>
          <div className="space-y-2">
            {usage.rooms.slice(0, widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6).map((room: ClassroomRoom, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
                <div className="flex items-center justify-between mb-2 min-w-0 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 truncate" title={room.number}>{room.number}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(room.status)} whitespace-nowrap`} title={getStatusText(room.status)}>
                    {getStatusText(room.status)}
                  </span>
                </div>
                
                {room.status === 'occupied' ? (
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate" title={`${room.subject} - ${room.group}`}>{room.subject} - {room.group}</div>
                    <div className="text-xs text-gray-600 truncate" title={room.teacher}>{room.teacher}</div>
                    <div className="flex items-center justify-between text-xs min-w-0 gap-2">
                      <div className="flex items-center space-x-1 text-orange-600 whitespace-nowrap">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span title={room.timeLeft}>Осталось: {room.timeLeft}</span>
                      </div>
                    </div>
                    {room.nextClass && (
                      <div className="text-xs text-gray-500 truncate" title={room.nextClass}>
                        Далее: {room.nextClass}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm text-green-700 font-medium whitespace-nowrap">Свободен</div>
                    {room.nextClass && (
                      <div className="text-xs text-gray-600 truncate" title={room.nextClass}>
                        Далее: {room.nextClass}
                      </div>
                    )}
                    {room.teacher && (
                      <div className="text-xs text-gray-500 truncate" title={`${room.teacher} - ${room.group}`}>
                        {room.teacher} - {room.group}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floor distribution for large widgets */}
        {widget.size.height === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
            <div className="text-xs font-medium text-gray-600 mb-2 truncate" title="По этажам">По этажам</div>
            <div className="space-y-2 min-w-0">
              {usage.floors.map((floor: FloorUsage, index: number) => (
                <div key={index} className="flex items-center justify-between min-w-0 gap-2">
                  <span className="text-xs text-gray-700 truncate" title={floor.floor}>{floor.floor}</span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-gray-600 whitespace-nowrap" title={`${floor.occupied}/${floor.total}`}>{floor.occupied}/{floor.total}</span>
                    <span className={`text-xs font-medium ${getUtilizationColor(floor.utilization)} whitespace-nowrap`} title={`${floor.utilization}%`}>{floor.utilization}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {usage.rooms.length > (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 truncate" title={`и еще ${usage.rooms.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} кабинетов`}>
              и еще {usage.rooms.length - (widget.size.height === 'small' ? 3 : widget.size.height === 'medium' ? 4 : 6)} кабинетов
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ClassroomUsageWidget;
