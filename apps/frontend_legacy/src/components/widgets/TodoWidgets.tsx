import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaListUl
} from 'react-icons/fa';

export const PersonalTasksWidget: React.FC = () => {
  const tasks = [
    {
      title: 'Подготовить отчет',
      deadline: '2024-03-22',
      priority: 'high',
      completed: false
    },
    {
      title: 'Проверить контрольные',
      deadline: '2024-03-23',
      priority: 'medium',
      completed: true
    },
    {
      title: 'Обновить план урока',
      deadline: '2024-03-24',
      priority: 'low',
      completed: false
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaTasks className="text-purple-500" />
          <span className="text-sm font-medium">Мои задачи</span>
        </div>
        <span className="text-xs text-gray-500">
          {tasks.filter(t => !t.completed).length} активных
        </span>
      </div>
      {tasks.map((task, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${task.completed ? 'bg-gray-50' : 'bg-white border border-gray-200'}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' :
              task.priority === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />
            <div className="flex-1">
              <div className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'font-medium'}`}>
                {task.title}
              </div>
              <div className="text-xs text-gray-500">
                Срок: {task.deadline}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-full ${
                task.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
              }`}
            >
              <FaCheckCircle />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TeamTasksWidget: React.FC = () => {
  const teamTasks = [
    {
      title: 'Подготовка к олимпиаде',
      assignee: 'Петров И.А.',
      deadline: '2024-03-25',
      status: 'in_progress',
      progress: 65
    },
    {
      title: 'Организация экскурсии',
      assignee: 'Иванова Е.П.',
      deadline: '2024-03-26',
      status: 'not_started',
      progress: 0
    },
    {
      title: 'Проверка дипломных работ',
      assignee: 'Команда',
      deadline: '2024-03-27',
      status: 'completed',
      progress: 100
    }
  ];

  return (
    <div className="space-y-4">
      {teamTasks.map((task, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{task.title}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              task.status === 'completed' ? 'bg-green-100 text-green-700' :
              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {task.status === 'completed' ? 'Завершено' :
               task.status === 'in_progress' ? 'В работе' : 'Не начато'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Ответственный: {task.assignee}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Срок: {task.deadline}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                task.status === 'completed' ? 'bg-green-500' :
                task.status === 'in_progress' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const DeadlinesWidget: React.FC = () => {
  const deadlines = [
    {
      task: 'Сдача отчетов',
      dueDate: '2024-03-22',
      timeLeft: '2 дня',
      status: 'urgent'
    },
    {
      task: 'Родительское собрание',
      dueDate: '2024-03-25',
      timeLeft: '5 дней',
      status: 'normal'
    },
    {
      task: 'Проверка работ',
      dueDate: '2024-03-21',
      timeLeft: '1 день',
      status: 'overdue'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaClock className="text-red-500" />
        <span className="text-sm font-medium">Сроки</span>
      </div>
      {deadlines.map((deadline, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${
            deadline.status === 'urgent' ? 'bg-red-50' :
            deadline.status === 'normal' ? 'bg-blue-50' :
            'bg-yellow-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{deadline.task}</span>
            <span className={`text-xs font-medium ${
              deadline.status === 'urgent' ? 'text-red-500' :
              deadline.status === 'normal' ? 'text-blue-500' :
              'text-yellow-500'
            }`}>
              {deadline.timeLeft}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Срок: {deadline.dueDate}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TaskPriorityWidget: React.FC = () => {
  const priorities = [
    {
      level: 'Высокий',
      count: 5,
      tasks: ['Отчет за квартал', 'Подготовка к экзаменам']
    },
    {
      level: 'Средний',
      count: 8,
      tasks: ['Проверка тетрадей', 'Подготовка к уроку']
    },
    {
      level: 'Низкий',
      count: 3,
      tasks: ['Обновление стенда', 'Сортировка документов']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaExclamationCircle className="text-yellow-500" />
        <span className="text-sm font-medium">Приоритеты задач</span>
      </div>
      {priorities.map((priority, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                priority.level === 'Высокий' ? 'bg-red-500' :
                priority.level === 'Средний' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-sm font-medium">{priority.level}</span>
            </div>
            <span className="text-xs text-gray-500">{priority.count} задач</span>
          </div>
          <div className="space-y-1">
            {priority.tasks.map((task, i) => (
              <div key={i} className="text-xs text-gray-700">
                • {task}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TaskProgressWidget: React.FC = () => {
  const categories = [
    {
      name: 'Учебные задачи',
      completed: 12,
      total: 15,
      trend: 'up'
    },
    {
      name: 'Административные',
      completed: 8,
      total: 10,
      trend: 'stable'
    },
    {
      name: 'Проекты',
      completed: 3,
      total: 7,
      trend: 'down'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaListUl className="text-blue-500" />
        <span className="text-sm font-medium">Прогресс по категориям</span>
      </div>
      {categories.map((category, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{category.name}</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {category.completed}/{category.total}
              </span>
              <span className={`text-xs ${
                category.trend === 'up' ? 'text-green-500' :
                category.trend === 'stable' ? 'text-blue-500' :
                'text-red-500'
              }`}>
                {category.trend === 'up' ? '↑' :
                 category.trend === 'stable' ? '→' : '↓'}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(category.completed / category.total) * 100}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                (category.completed / category.total) > 0.8 ? 'bg-green-500' :
                (category.completed / category.total) > 0.5 ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 