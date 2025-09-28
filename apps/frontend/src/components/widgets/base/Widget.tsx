import React, { useState } from 'react';
import { Widget as WidgetType } from '../../../types/widget';
import { MoreVertical, X, Settings } from 'lucide-react';

interface WidgetProps {
  widget: WidgetType;
  children: React.ReactNode;
  onUpdate?: (widget: WidgetType) => void;
  onDelete?: (widgetId: string) => void;
  isDragging?: boolean;
  className?: string;
}

const Widget: React.FC<WidgetProps> = ({
  widget,
  children,
  onUpdate,
  onDelete,
  isDragging = false,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettings(true);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    
    if (onDelete && window.confirm('Вы уверены, что хотите удалить этот виджет?')) {
      onDelete(widget.id);
    }
  };

  const getSizeClasses = () => {
    const heightClasses = {
      small: 'h-60 min-h-60 sm:h-64 sm:min-h-64',
      medium: 'h-72 min-h-72 sm:h-80 sm:min-h-80',
      large: 'h-[28rem] min-h-[28rem] sm:h-96 sm:min-h-96'
    };

    const widthClasses = {
      small: 'w-80 min-w-80',
      medium: 'w-96 min-w-96',
      large: 'w-[32rem] min-w-[32rem]'
    };

    const height = heightClasses[widget.size.height] || heightClasses.medium;
    const width = widthClasses[widget.size.width] || widthClasses.medium;

    return `${height} ${width}`;
  };

  const getSizeWidth = (width: 'small' | 'medium' | 'large') => {
    switch (width) {
      case 'small': return 2;
      case 'medium': return 3;
      case 'large': return 4;
      default: return 3;
    }
  };

  const getSizeHeight = (height: 'small' | 'medium' | 'large') => {
    switch (height) {
      case 'small': return 2;
      case 'medium': return 2;
      case 'large': return 3;
      default: return 2;
    }
  };

  return (
    <div
      className={`
        relative bg-gradient-to-br from-white to-gray-50/30 
        rounded-xl shadow-lg border border-gray-200/60 backdrop-blur-sm
        transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02]
        ${isDragging ? 'opacity-70 rotate-1 scale-105 shadow-2xl' : ''}
        ${getSizeClasses()}
        ${className}
        overflow-hidden group flex flex-col
      `}
    >
      {/* Gradient overlay for premium look */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Header with modern design */}
    <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 border-b border-gray-100/80 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{widget.title}</h3>
        </div>
        
        <div className="relative z-30">
          <button
            onClick={handleMenuToggle}
            className="p-2 rounded-lg hover:bg-white/90 transition-all duration-200 opacity-80 hover:opacity-100 bg-white/50 border border-gray-200/50"
            aria-label="Меню виджета"
          >
            <MoreVertical className="h-4 w-4 text-gray-700" />
          </button>

          {/* Enhanced Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-10 z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[140px] overflow-hidden">
              <div className="py-2">
                <button
                  onClick={handleSettings}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Настройки
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-3" />
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content with controlled height */}
      <div className="relative z-10 flex-1 overflow-hidden">
  <div className="p-3 sm:p-4 h-full overflow-auto">
          {children}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Настройки виджета</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Widget Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название виджета
                </label>
                <input
                  type="text"
                  value={widget.title}
                  onChange={(e) => {
                    console.log('Title changed to:', e.target.value);
                    if (onUpdate) {
                      onUpdate({ 
                        ...widget, 
                        title: e.target.value,
                        updatedAt: new Date().toISOString()
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Widget Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ширина виджета
                  </label>
                  <select
                    value={widget.size.width}
                    onChange={(e) => {
                      const newWidth = e.target.value as 'small' | 'medium' | 'large';
                      console.log('Width changed from', widget.size.width, 'to', newWidth);
                      if (onUpdate) {
                        onUpdate({
                          ...widget,
                          size: { ...widget.size, width: newWidth },
                          position: {
                            ...widget.position,
                            width: getSizeWidth(newWidth)
                          },
                          updatedAt: new Date().toISOString()
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Маленькая</option>
                    <option value="medium">Средняя</option>
                    <option value="large">Большая</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Высота виджета
                  </label>
                  <select
                    value={widget.size.height}
                    onChange={(e) => {
                      const newHeight = e.target.value as 'small' | 'medium' | 'large';
                      console.log('Height changed from', widget.size.height, 'to', newHeight);
                      if (onUpdate) {
                        onUpdate({
                          ...widget,
                          size: { ...widget.size, height: newHeight },
                          position: {
                            ...widget.position,
                            height: getSizeHeight(newHeight)
                          },
                          updatedAt: new Date().toISOString()
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Маленькая</option>
                    <option value="medium">Средняя</option>
                    <option value="large">Большая</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Widget;
