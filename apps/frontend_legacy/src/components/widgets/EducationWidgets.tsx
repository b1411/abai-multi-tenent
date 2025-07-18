import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaTrophy, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { useLanguage } from '../../hooks/useLanguage';

export const ClassPerformanceWidget: React.FC = () => {
  const { t } = useLanguage();
  const performanceData = [
    { class: '11A', performance: 85 },
    { class: '11B', performance: 78 },
    { class: '10A', performance: 92 },
    { class: '10B', performance: 88 },
    { class: '9A', performance: 75 },
  ];

  return (
    <div className="space-y-3">
      {performanceData.map((item) => (
        <motion.div
          key={item.class}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          className="relative"
        >
          <div className="flex items-center">
            <div className="w-16 text-sm font-medium">{item.class}</div>
            <div className="flex-1">
              <div className="h-4 bg-blue-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.performance}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
            <div className="w-12 text-sm font-medium text-right">{item.performance}%</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const CurriculumProgressWidget: React.FC = () => {
  const { t } = useLanguage();
  const subjects = [
    { name: t('math'), progress: 75, total: 120, completed: 90 },
    { name: t('physics'), progress: 60, total: 90, completed: 54 },
    { name: t('chemistry'), progress: 85, total: 80, completed: 68 },
    { name: t('biology'), progress: 70, total: 100, completed: 70 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {subjects.map((subject, index) => (
        <motion.div
          key={subject.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative bg-gray-50 rounded-lg p-4"
        >
          <div className="text-sm font-medium mb-2">{subject.name}</div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{subject.completed} {t('hours')}</span>
            <span>{subject.total} {t('hours')}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${subject.progress}%` }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TopStudentsWidget: React.FC = () => {
  const { t } = useLanguage();
  const students = [
    { name: 'Алтынбек Нұрлан', grade: '11A', score: 98 },
    { name: 'Әсел Мұхтар', grade: '10B', score: 97 },
    { name: 'Бақыт Ержан', grade: '11B', score: 96 },
    { name: 'Динара Сәрсен', grade: '9A', score: 95 },
    { name: 'Ерлан Төлеу', grade: '10A', score: 94 },
  ];

  return (
    <div className="space-y-3">
      {students.map((student, index) => (
        <motion.div
          key={student.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden"
        >
          <div className="flex items-center p-3 bg-gray-50 rounded-lg relative z-10">
            <div className="flex items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 font-semibold mr-3">
                {index + 1}
              </div>
              <div>
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-500">{student.grade}</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-lg font-semibold text-yellow-500">{student.score}</div>
              <div className="text-sm text-gray-400 ml-1">{t('points')}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TeacherActivityWidget: React.FC = () => {
  const { t } = useLanguage();
  const activities = [
    { teacher: 'Сәрсенбаев А.Қ.', subject: t('math'), hours: 28, rating: 4.8 },
    { teacher: 'Жұмабаева Г.Н.', subject: t('physics'), hours: 24, rating: 4.9 },
    { teacher: 'Оспанов М.Е.', subject: t('chemistry'), hours: 22, rating: 4.7 },
    { teacher: 'Әбілқайыр Д.С.', subject: t('biology'), hours: 26, rating: 4.6 },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.teacher}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium">{activity.teacher}</div>
              <div className="text-sm text-gray-500">{activity.subject}</div>
            </div>
            <div className="text-sm">
              <span className="font-medium">{activity.hours}</span> {t('hours')}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(activity.rating / 5) * 100}%` }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
            <div className="ml-3 text-sm font-medium text-purple-500">{activity.rating}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AttendanceTrendsWidget: React.FC = () => {
  const { t } = useLanguage();
  const trends = [
    { date: t('mon'), attendance: 95 },
    { date: t('tue'), attendance: 92 },
    { date: t('wed'), attendance: 88 },
    { date: t('thu'), attendance: 94 },
    { date: t('fri'), attendance: 90 },
  ];

  return (
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end">
        {trends.map((day, index) => (
          <motion.div
            key={day.date}
            className="flex-1 flex flex-col items-center"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="w-full px-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${day.attendance}%` }}
                className="bg-indigo-500 rounded-t-lg"
                style={{ maxHeight: '150px' }}
              />
            </div>
            <div className="text-sm font-medium mt-2">{day.date}</div>
            <div className="text-xs text-gray-500">{day.attendance}%</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 