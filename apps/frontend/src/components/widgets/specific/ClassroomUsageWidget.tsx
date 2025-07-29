import React from 'react';
import { Widget } from '../../../types/widget';
import { Building, CheckCircle, Clock, Users, MapPin } from 'lucide-react';

interface ClassroomUsageWidgetProps {
  data: any;
  widget: Widget;
}

const ClassroomUsageWidget: React.FC<ClassroomUsageWidgetProps> = ({ data, widget }) => {
  // Mock data structure for classroom usage
  const mockData = {
    totalRooms: 45,
    occupiedRooms: 32,
    freeRooms: 13,
    utilizationRate: 71.1,
    rooms: [
      { 
        number: 'А-101', 
        status: 'occupied', 
        subject: 'Математика', 
        teacher: 'Аманжолова Г.К.',
        group: '10А',
        timeLeft: '25 мин',
        nextClass: '14:00 - Физика'
      },
      { 
        number: 'Б-205', 
        status: 'occupied', 
        subject: 'История', 
        teacher: 'Султанов Д.Б.',
        group: '9Б',
        timeLeft: '15 мин',
        nextClass: '14:00 - Химия'
      },
      { 
        number: 'В-301', 
        status: 'free', 
        nextClass: '14:00 - Английский',
        teacher: 'Нурланова Т.И.',
        group: '8А'
      },
      { 
        number: 'Г-102', 
        status: 'occupied', 
        subject: 'Физика', 
        teacher: 'Кенесарова А.М.',
        group: '11А',
        timeLeft: '35 мин',
        nextClass: '15:00 - Математика'
      },
      { 
        number: 'А-203', 
        status: 'free', 
        nextClass: '15:00 - Литература',
        teacher: 'Жумабекова С.А.',
        group: '10Б'
      },
      { 
        number: 'Б-104', 
        status: 'occupied', 
        subject: 'Химия', 
        teacher: 'Байжанов К.С.',
        group: '9А',
        timeLeft: '45 мин',
        nextClass: '16:00 - Биология'
      }
    ],
    floors: [
      { floor: '1 этаж', total: 15, occupied: 11, utilization: 73.3 },
      { floor: '2 этаж', total: 18, occupied: 13, utilization: 72.2 },
      { floor: '3 этаж', total: 12, occupied: 8, utilization: 66.7 }
    ],
    peakHours: [
      { time: '09:00', usage: 89 },
      { time: '10:00', usage: 93 },
      { time: '11:00', usage: 87 },
      { time: '12:00', usage: 84 },
      { time: '13:00', usage: 91 }
    ]
  };

  const usage = data || mockData;

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
      <div className="h-full flex flex-col p-1">
        {/* Usage overview */}
        <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Использование кабинетов</span>
            </div>
            <div className={`text-lg font-bold ${getUtilizationColor(usage.utilizationRate)}`}>
              {usage.utilizationRate}%
            </div>
          </div>
          <div className="text-xs text-blue-600 mb-2">
            {usage.occupiedRooms} из {usage.totalRooms} кабинетов заняты
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
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
            <Users className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-red-700">{usage.occupiedRooms}</div>
            <div className="text-xs text-red-600">Заняты</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-green-700">{usage.freeRooms}</div>
            <div className="text-xs text-green-600">Свободны</div>
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-600 mb-2">Кабинеты</div>
          <div className="space-y-2">
            {usage.rooms.slice(0, widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6).map((room: any, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {room.number}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(room.status)}`}>
                    {getStatusText(room.status)}
                  </span>
                </div>
                
                {room.status === 'occupied' ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-800">
                      {room.subject} - {room.group}
                    </div>
                    <div className="text-xs text-gray-600">
                      {room.teacher}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span>Осталось: {room.timeLeft}</span>
                      </div>
                    </div>
                    {room.nextClass && (
                      <div className="text-xs text-gray-500 truncate">
                        Далее: {room.nextClass}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm text-green-700 font-medium">
                      Свободен
                    </div>
                    {room.nextClass && (
                      <div className="text-xs text-gray-600">
                        Далее: {room.nextClass}
                      </div>
                    )}
                    {room.teacher && (
                      <div className="text-xs text-gray-500">
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
        {widget.size === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">По этажам</div>
            <div className="space-y-2">
              {usage.floors.map((floor: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">{floor.floor}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">{floor.occupied}/{floor.total}</span>
                    <span className={`text-xs font-medium ${getUtilizationColor(floor.utilization)}`}>
                      {floor.utilization}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {usage.rooms.length > (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500">
              и еще {usage.rooms.length - (widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6)} кабинетов
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

export default ClassroomUsageWidget;
