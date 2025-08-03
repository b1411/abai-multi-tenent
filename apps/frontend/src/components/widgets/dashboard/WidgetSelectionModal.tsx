import React, { useState, useMemo } from 'react';
import { X, Search, Plus, RefreshCw } from 'lucide-react';
import { WidgetTemplate, WidgetCategory, WidgetType } from '../../../types/widget';
import widgetService from '../../../services/widgetService';
import * as Icons from 'lucide-react';

interface WidgetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: WidgetTemplate[];
  onSelectWidget: (widgetType: WidgetType) => void;
  addedWidgets: WidgetType[];
}

const categoryLabels: Record<WidgetCategory, string> = {
  education: '📚 Образование',
  management: '💼 Управление',
  finance: '💰 Финансы',
  family: '👪 Семья',
  system: '🔧 Система',
  personal: '👤 Личное'
};

const WidgetSelectionModal: React.FC<WidgetSelectionModalProps> = ({
  isOpen,
  onClose,
  availableWidgets,
  onSelectWidget,
  addedWidgets
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  // Filter and group widgets
  const filteredWidgets = useMemo(() => {
    let filtered = availableWidgets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(widget =>
        widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(widget => widget.category === selectedCategory);
    }

    // Group by category
    const grouped = filtered.reduce((acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    }, {} as Record<WidgetCategory, WidgetTemplate[]>);

    return grouped;
  }, [availableWidgets, searchTerm, selectedCategory]);

  // Get unique categories from available widgets
  const categories = useMemo(() => {
    const cats = new Set(availableWidgets.map(w => w.category));
    return Array.from(cats);
  }, [availableWidgets]);

  const handleSelectWidget = (widgetType: WidgetType) => {
    onSelectWidget(widgetType);
    onClose();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Icons.Square className="h-5 w-5" />;
  };

  const isWidgetAdded = (widgetType: WidgetType) => {
    return addedWidgets.includes(widgetType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Добавить виджет
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск виджетов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-auto p-6">
          {Object.keys(filteredWidgets).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500">
                {searchTerm ? 'Виджеты не найдены' : 'Нет доступных виджетов'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredWidgets).map(([category, widgets]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {categoryLabels[category as WidgetCategory]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {widgets.map(widget => {
                      const isAdded = isWidgetAdded(widget.type);
                      return (
                        <div
                          key={widget.type}
                          className={`
                            relative border rounded-lg p-4 cursor-pointer transition-all
                            ${isAdded 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                          onClick={() => !isAdded && handleSelectWidget(widget.type)}
                        >
                          {/* Widget Icon and Title */}
                          <div className="flex items-start space-x-3 mb-3">
                            <div className={`
                              p-2 rounded-lg
                              ${isAdded 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                              }
                            `}>
                              {getIcon(widget.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {widget.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {widget.description}
                              </p>
                            </div>
                          </div>

                          {/* Size Badge */}
                          <div className="flex items-center justify-between">
                            <span className={`
                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${widget.defaultSize === 'small' 
                                ? 'bg-gray-100 text-gray-800' 
                                : widget.defaultSize === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                              }
                            `}>
                              {widget.defaultSize === 'small' ? 'Маленький' :
                               widget.defaultSize === 'medium' ? 'Средний' : 'Большой'}
                            </span>
                            
                            {isAdded ? (
                              <span className="text-green-600 text-sm font-medium">
                                Добавлен
                              </span>
                            ) : (
                              <Plus className="h-4 w-4 text-blue-600" />
                            )}
                          </div>

                          {/* Overlay for added widgets */}
                          {isAdded && (
                            <div className="absolute inset-0 bg-green-50 bg-opacity-50 rounded-lg flex items-center justify-center">
                              <div className="bg-green-600 text-white p-2 rounded-full">
                                <Icons.Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetSelectionModal;
