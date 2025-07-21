import React from 'react';
import { motion } from 'framer-motion';

const AttendanceChart: React.FC = () => {
  const attendanceData = [
    { day: 'ПН', value: 95, color: 'bg-corporate-primary' },
    { day: 'ВТ', value: 88, color: 'bg-corporate-primary' },
    { day: 'СР', value: 92, color: 'bg-corporate-primary' },
    { day: 'ЧТ', value: 85, color: 'bg-corporate-primary' },
    { day: 'ПТ', value: 90, color: 'bg-corporate-primary' },
    { day: 'СБ', value: 78, color: 'bg-corporate-primary' }
  ];

  const averageAttendance = Math.round(
    attendanceData.reduce((acc, curr) => acc + curr.value, 0) / attendanceData.length
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Посещаемость</h3>
        <div className="flex items-center">
          <span className="text-2xl font-bold text-corporate-primary">{averageAttendance}%</span>
          <span className="text-sm text-gray-500 ml-2">За последнюю неделю</span>
        </div>
      </div>

      <div className="space-y-4">
        {attendanceData.map((data, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center">
              <span className="w-8 text-sm text-gray-600">{data.day}</span>
              <div className="flex-1 ml-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.value}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-2 bg-corporate-primary/20 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${data.color}`}
                  />
                </motion.div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">0%</span>
                  <span className="text-xs font-medium text-corporate-primary">{data.value}%</span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-corporate-primary mr-2" />
          <span className="text-gray-600">Присутствовали</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-200 mr-2" />
          <span className="text-gray-600">Отсутствовали</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart; 