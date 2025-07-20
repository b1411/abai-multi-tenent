import React from 'react';
import { motion } from 'framer-motion';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface WeekGridProps {
  schedule: Array<{
    id: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    classId: string;
    subject: string;
    teacherName: string;
    roomId: string;
  }>;
  onCellClick?: (day: DayOfWeek, time: string) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({ schedule, onCellClick }) => {
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00'
  ];

  const days: Array<{ id: DayOfWeek; label: string }> = [
    { id: 'monday', label: 'Пн' },
    { id: 'tuesday', label: 'Вт' },
    { id: 'wednesday', label: 'Ср' },
    { id: 'thursday', label: 'Чт' },
    { id: 'friday', label: 'Пт' }
  ];

  const getScheduleItem = (day: DayOfWeek, time: string) => {
    return schedule.find(item => 
      item.day === day && item.startTime === time
    );
  };

  return (
    <div className="grid grid-cols-6 gap-0 border border-gray-200">
      {/* Заголовки дней недели */}
      <div className="h-12 border-b border-r border-gray-200 bg-gray-50"></div>
      {days.map(day => (
        <div
          key={day.id}
          className="h-12 border-b border-r border-gray-200 bg-gray-50 flex items-center justify-center font-medium"
        >
          {day.label}
        </div>
      ))}

      {/* Временная сетка */}
      {timeSlots.map(time => (
        <React.Fragment key={time}>
          {/* Временной слот */}
          <div className="h-24 border-b border-r border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-600">
            {time}
          </div>
          
          {/* Ячейки для каждого дня */}
          {days.map(day => {
            const item = getScheduleItem(day.id, time);
            return (
              <div
                key={`${day.id}-${time}`}
                className="h-24 border-b border-r border-gray-200 relative group cursor-pointer"
                onClick={() => !item && onCellClick && onCellClick(day.id, time)}
              >
                {item ? (
                  <motion.div
                    className="absolute inset-1 rounded-lg bg-blue-50 border border-blue-200 p-2 cursor-pointer hover:shadow-lg transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-sm font-medium text-blue-800">
                      {item.subject}
                    </div>
                    <div className="text-xs text-blue-600">
                      {item.classId} • {item.roomId}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {item.teacherName}
                    </div>
                  </motion.div>
                ) : (
                  <div className="hidden group-hover:flex absolute inset-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                    <span className="text-2xl">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default WeekGrid;
