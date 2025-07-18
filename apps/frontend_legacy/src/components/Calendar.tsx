import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7;

    const days = [];
    for (let i = 1; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const isCurrentMonth = currentDate.getMonth() === currentMonth;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()} г.
        </h3>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevMonth}
            className="p-2 text-gray-600 hover:text-corporate-primary"
          >
            <FaChevronLeft size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNextMonth}
            className="p-2 text-gray-600 hover:text-corporate-primary"
          >
            <FaChevronRight size={16} />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            className={`
              aspect-square flex items-center justify-center rounded-lg text-sm
              ${!day ? 'text-gray-400' : 'cursor-pointer'}
              ${isCurrentMonth && day === today ? 'bg-corporate-primary text-white' : ''}
              ${day ? 'hover:bg-corporate-primary/10' : ''}
            `}
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* События дня */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">События на сегодня</h3>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center p-2 rounded-lg hover:bg-corporate-primary/5">
            <div className="w-2 h-2 rounded-full bg-corporate-primary mr-2" />
            <span className="text-sm text-gray-600">09:00 - Собрание учителей</span>
          </div>
          <div className="flex items-center p-2 rounded-lg hover:bg-corporate-primary/5">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <span className="text-sm text-gray-600">14:00 - Открытый урок</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar; 