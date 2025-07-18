import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSave,
  FaFolderOpen,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

interface Template {
  id: string;
  name: string;
  description: string;
  layout: any; // Тип зависит от используемой библиотеки для сетки
  createdAt: string;
  updatedAt: string;
}

interface TemplatesManagerProps {
  currentLayout: any;
  onApplyTemplate: (layout: any) => void;
  onSaveTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  currentLayout,
  onApplyTemplate,
  onSaveTemplate
}) => {
  const [templates, setTemplates] = React.useState<Template[]>([
    {
      id: '1',
      name: 'Стандартный',
      description: 'Базовый набор виджетов для администратора',
      layout: {},
      createdAt: '2024-03-20',
      updatedAt: '2024-03-20'
    },
    {
      id: '2',
      name: 'Учебный процесс',
      description: 'Фокус на образовательных метриках',
      layout: {},
      createdAt: '2024-03-21',
      updatedAt: '2024-03-21'
    }
  ]);

  const [isAddingTemplate, setIsAddingTemplate] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState({
    name: '',
    description: ''
  });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const handleSaveTemplate = () => {
    if (newTemplate.name.trim()) {
      onSaveTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        layout: currentLayout
      });
      setNewTemplate({ name: '', description: '' });
      setIsAddingTemplate(false);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleEditTemplate = (template: Template) => {
    if (editingId === template.id) {
      setEditingId(null);
    } else {
      setEditingId(template.id);
      setNewTemplate({
        name: template.name,
        description: template.description
      });
    }
  };

  const handleUpdateTemplate = (template: Template) => {
    setTemplates(templates.map(t =>
      t.id === template.id
        ? { ...template, updatedAt: new Date().toISOString().split('T')[0] }
        : t
    ));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Шаблоны расположения</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          onClick={() => setIsAddingTemplate(true)}
        >
          <FaSave />
          <span>Сохранить текущее</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isAddingTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Название шаблона"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newTemplate.name}
                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <textarea
                placeholder="Описание шаблона"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newTemplate.description}
                onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsAddingTemplate(false)}
                >
                  Отмена
                </button>
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  onClick={handleSaveTemplate}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {templates.map(template => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            {editingId === template.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newTemplate.description}
                  onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setEditingId(null)}
                  >
                    <FaTimes />
                  </button>
                  <button
                    className="p-2 text-green-500 hover:text-green-700"
                    onClick={() => handleUpdateTemplate({
                      ...template,
                      name: newTemplate.name,
                      description: newTemplate.description
                    })}
                  >
                    <FaCheck />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <FaTrash />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-500 hover:text-blue-700"
                      onClick={() => onApplyTemplate(template.layout)}
                    >
                      <FaFolderOpen />
                    </motion.button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>Создан: {template.createdAt}</span>
                  <span>Обновлен: {template.updatedAt}</span>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 