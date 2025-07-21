import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaBrain,
  FaChartLine,
  FaGraduationCap,
  FaUserGraduate,
  FaChartBar
} from 'react-icons/fa';

export const StudentPerformancePredictionWidget: React.FC = () => {
  const predictions = [
    {
      student: 'Иванов А.С.',
      currentGrade: 4.5,
      predictedGrade: 4.8,
      trend: 'up',
      confidence: 85
    },
    {
      student: 'Петрова М.И.',
      currentGrade: 3.8,
      predictedGrade: 3.5,
      trend: 'down',
      confidence: 75
    },
    {
      student: 'Сидоров К.П.',
      currentGrade: 4.2,
      predictedGrade: 4.5,
      trend: 'up',
      confidence: 90
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaBrain className="text-purple-500" />
        <span className="text-sm font-medium">AI Прогноз успеваемости</span>
      </div>
      {predictions.map((prediction, index) => (
        <motion.div
          key={prediction.student}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{prediction.student}</span>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                prediction.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {prediction.trend === 'up' ? '↑' : '↓'}
                {prediction.predictedGrade}
              </span>
              <span className="text-xs text-gray-500">
                ({prediction.confidence}% уверенность)
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.confidence}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-purple-500"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AttendancePredictionWidget: React.FC = () => {
  const predictions = [
    {
      class: '10A',
      expectedAttendance: 92,
      trend: 'up',
      factors: ['Хорошая погода', 'Нет праздников']
    },
    {
      class: '11Б',
      expectedAttendance: 85,
      trend: 'down',
      factors: ['Контрольная работа', 'Конец четверти']
    },
    {
      class: '9В',
      expectedAttendance: 88,
      trend: 'up',
      factors: ['Интересная тема', 'Новый преподаватель']
    }
  ];

  return (
    <div className="space-y-4">
      {predictions.map((prediction, index) => (
        <motion.div
          key={prediction.class}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Класс {prediction.class}</span>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                prediction.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {prediction.expectedAttendance}%
              </span>
              <span className="text-xs">ожидаемая посещаемость</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Факторы влияния:
            <ul className="mt-1 space-y-1">
              {prediction.factors.map((factor, i) => (
                <li key={i} className="flex items-center space-x-1">
                  <span>•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const LearningPatternAnalysisWidget: React.FC = () => {
  const patterns = [
    {
      subject: 'Математика',
      bestTime: '9:00 - 11:00',
      bestDays: ['Вторник', 'Четверг'],
      effectiveness: 85
    },
    {
      subject: 'Физика',
      bestTime: '11:00 - 13:00',
      bestDays: ['Понедельник', 'Среда'],
      effectiveness: 78
    },
    {
      subject: 'Литература',
      bestTime: '14:00 - 16:00',
      bestDays: ['Среда', 'Пятница'],
      effectiveness: 92
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaChartLine className="text-blue-500" />
        <span className="text-sm font-medium">Анализ паттернов обучения</span>
      </div>
      {patterns.map((pattern, index) => (
        <motion.div
          key={pattern.subject}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="text-sm font-medium mb-2">{pattern.subject}</div>
          <div className="text-xs text-gray-500">
            Лучшее время: {pattern.bestTime}
          </div>
          <div className="text-xs text-gray-500">
            Лучшие дни: {pattern.bestDays.join(', ')}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Эффективность</span>
              <span className="font-medium">{pattern.effectiveness}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pattern.effectiveness}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const ResourceOptimizationWidget: React.FC = () => {
  const recommendations = [
    {
      resource: 'Учебные материалы',
      recommendation: 'Обновить учебники по физике',
      impact: 'high',
      roi: 85
    },
    {
      resource: 'Расписание',
      recommendation: 'Перенести сложные предметы на утро',
      impact: 'medium',
      roi: 65
    },
    {
      resource: 'Оборудование',
      recommendation: 'Добавить интерактивные доски',
      impact: 'high',
      roi: 92
    }
  ];

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={rec.resource}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{rec.resource}</span>
            <span className={`text-xs font-medium ${
              rec.impact === 'high' ? 'text-green-500' :
              rec.impact === 'medium' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              ROI: {rec.roi}%
            </span>
          </div>
          <div className="text-xs text-gray-500">{rec.recommendation}</div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rec.roi}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                rec.impact === 'high' ? 'bg-green-500' :
                rec.impact === 'medium' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TeachingMethodsAnalysisWidget: React.FC = () => {
  const methods = [
    {
      method: 'Интерактивные упражнения',
      effectiveness: 92,
      subjects: ['Математика', 'Физика'],
      recommendation: 'Увеличить частоту применения'
    },
    {
      method: 'Групповые проекты',
      effectiveness: 85,
      subjects: ['История', 'Литература'],
      recommendation: 'Оптимально'
    },
    {
      method: 'Видео-уроки',
      effectiveness: 78,
      subjects: ['Биология', 'География'],
      recommendation: 'Требует доработки'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaGraduationCap className="text-indigo-500" />
        <span className="text-sm font-medium">Анализ методик преподавания</span>
      </div>
      {methods.map((method, index) => (
        <motion.div
          key={method.method}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{method.method}</span>
            <span className="text-xs font-medium">
              {method.effectiveness}% эффективность
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Предметы: {method.subjects.join(', ')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {method.recommendation}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${method.effectiveness}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                method.effectiveness >= 90 ? 'bg-green-500' :
                method.effectiveness >= 80 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 