import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaUserCheck,
  FaChalkboardTeacher,
  FaChartBar,
  FaExclamationTriangle,
  FaUserClock
} from 'react-icons/fa';

export const CurrentlyWorkingWidget: React.FC = () => {
  const staff = [
    { name: 'Сакенов А.М.', role: 'Преподаватель', status: 'В классе 305', time: '14:30' },
    { name: 'Ким Н.В.', role: 'Преподаватель', status: 'В классе 201', time: '14:30' },
    { name: 'Алиева Г.К.', role: 'Администратор', status: 'В офисе', time: '14:30' },
    { name: 'Петров И.А.', role: 'Тех. специалист', status: 'Этаж 2', time: '14:30' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Сейчас на работе</div>
        <div className="text-sm font-medium text-corporate-primary">32 сотрудника</div>
      </div>
      {staff.map((person, index) => (
        <motion.div
          key={person.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <div className="text-sm font-medium">{person.name}</div>
            <div className="text-xs text-gray-500">{person.role}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-corporate-primary">{person.status}</div>
            <div className="text-xs text-gray-500">{person.time}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TeacherLoadWidget: React.FC = () => {
  const teachers = [
    { name: 'Сакенов А.М.', hours: 18, maxHours: 20 },
    { name: 'Ким Н.В.', hours: 20, maxHours: 20 },
    { name: 'Петров И.А.', hours: 15, maxHours: 20 },
    { name: 'Алиева Г.К.', hours: 12, maxHours: 20 }
  ];

  return (
    <div className="space-y-4">
      {teachers.map((teacher, index) => (
        <motion.div
          key={teacher.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{teacher.name}</span>
            <span className="text-sm text-gray-500">
              {teacher.hours}/{teacher.maxHours} часов
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(teacher.hours / teacher.maxHours) * 100}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${teacher.hours === teacher.maxHours ? 'bg-yellow-500' : 'bg-corporate-primary'}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const StaffKPIWidget: React.FC = () => {
  const kpiData = [
    { name: 'Сакенов А.М.', kpi: 95, trend: 'up' },
    { name: 'Ким Н.В.', kpi: 92, trend: 'up' },
    { name: 'Петров И.А.', kpi: 88, trend: 'down' },
    { name: 'Алиева Г.К.', kpi: 94, trend: 'up' }
  ];

  return (
    <div className="space-y-4">
      {kpiData.map((staff, index) => (
        <motion.div
          key={staff.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="text-sm font-medium">{staff.name}</div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">{staff.kpi}%</span>
            <span className={staff.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {staff.trend === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const FictivePositionsWidget: React.FC = () => {
  const warnings = [
    { 
      position: 'Преподаватель истории',
      issue: 'Нет активности в системе',
      risk: 'high'
    },
    { 
      position: 'Лаборант',
      issue: 'Несоответствие графика',
      risk: 'medium'
    },
    { 
      position: 'Методист',
      issue: 'Дублирование функций',
      risk: 'low'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-red-500">
        <FaExclamationTriangle />
        <span className="text-sm font-medium">AI обнаружил несоответствия</span>
      </div>
      {warnings.map((warning, index) => (
        <motion.div
          key={warning.position}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg border-l-4 border-red-500"
        >
          <div className="text-sm font-medium">{warning.position}</div>
          <div className="text-xs text-gray-500">{warning.issue}</div>
          <div className={`text-xs mt-1 ${
            warning.risk === 'high' ? 'text-red-500' :
            warning.risk === 'medium' ? 'text-yellow-500' : 'text-orange-500'
          }`}>
            Риск: {warning.risk === 'high' ? 'Высокий' : warning.risk === 'medium' ? 'Средний' : 'Низкий'}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AbsentEmployeesWidget: React.FC = () => {
  const absences = [
    { 
      name: 'Иванов С.П.',
      reason: 'Отпуск',
      dates: '15.03 - 29.03',
      type: 'vacation'
    },
    { 
      name: 'Петрова А.К.',
      reason: 'Больничный',
      dates: '20.03 - 24.03',
      type: 'sick'
    },
    { 
      name: 'Сидоров И.М.',
      reason: 'Командировка',
      dates: '22.03 - 25.03',
      type: 'business'
    }
  ];

  return (
    <div className="space-y-4">
      {absences.map((absence, index) => (
        <motion.div
          key={absence.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg flex items-center justify-between ${
            absence.type === 'vacation' ? 'bg-blue-50' :
            absence.type === 'sick' ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <div>
            <div className="text-sm font-medium">{absence.name}</div>
            <div className="text-xs text-gray-500">{absence.reason}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium">{absence.dates}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 