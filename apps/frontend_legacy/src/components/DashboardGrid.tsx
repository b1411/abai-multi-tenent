import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { FaPlus, FaExpand, FaCompress, FaCog, FaSave } from 'react-icons/fa';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  category: 'education' | 'finance' | 'hr' | 'erp' | 'ai' | 'communication' | 'todo' | 'events';
}

const WIDGET_CATEGORIES = [
  { id: 'education', name: 'Образование', color: 'bg-blue-500' },
  { id: 'finance', name: 'Финансы', color: 'bg-green-500' },
  { id: 'hr', name: 'Кадры', color: 'bg-yellow-500' },
  { id: 'erp', name: 'ERP / Безопасность', color: 'bg-red-500' },
  { id: 'ai', name: 'AI-аналитика', color: 'bg-purple-500' },
  { id: 'communication', name: 'Коммуникации', color: 'bg-pink-500' },
  { id: 'todo', name: 'To-Do', color: 'bg-indigo-500' },
  { id: 'events', name: 'События', color: 'bg-orange-500' }
];

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'students', type: 'counter', title: 'Число студентов', size: 'small', category: 'education' },
  { id: 'teachers', type: 'counter', title: 'Число преподавателей', size: 'small', category: 'hr' },
  { id: 'present', type: 'status', title: 'Сейчас на работе', size: 'medium', category: 'hr' },
  { id: 'debts', type: 'finance', title: 'Статус долгов', size: 'medium', category: 'finance' },
  { id: 'todo', type: 'task', title: 'Текущая задача', size: 'small', category: 'todo' }
];

const DashboardGrid: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

  const templates = {
    default: 'Стандартный режим',
    financial: 'Финансовый режим',
    academic: 'Учебный сезон',
    exam: 'Экзаменационный период'
  };

  const handleAddWidget = (category: string) => {
    // Здесь будет логика добавления виджета
    setIsAddingWidget(false);
  };

  const handleSaveTemplate = () => {
    // Здесь будет логика сохранения текущего набора виджетов как шаблона
  };

  return (
    <div className="p-6">
      {/* Панель инструментов */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingWidget(true)}
            className="px-4 py-2 bg-corporate-primary text-white rounded-lg flex items-center space-x-2"
          >
            <FaPlus />
            <span>Добавить виджет</span>
          </motion.button>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm"
          >
            {Object.entries(templates).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveTemplate}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center space-x-2"
        >
          <FaSave />
          <span>Сохранить шаблон</span>
        </motion.button>
      </div>

      {/* Сетка виджетов */}
      <Reorder.Group as="div" axis="y" values={widgets} onReorder={setWidgets} className="grid grid-cols-12 gap-6">
        {widgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            as={motion.div}
            layout
            className={`
              bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-notion
              ${widget.size === 'small' ? 'col-span-3' : widget.size === 'medium' ? 'col-span-6' : 'col-span-12'}
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-corporate-primary"
                >
                  <FaExpand size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-corporate-primary"
                >
                  <FaCog size={14} />
                </motion.button>
              </div>
            </div>
            {/* Здесь будет контент виджета */}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Модальное окно добавления виджета */}
      {isAddingWidget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Добавить виджет</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAddingWidget(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {WIDGET_CATEGORIES.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddWidget(category.id)}
                  className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${category.color} mb-2`} />
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">5 виджетов доступно</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardGrid; 