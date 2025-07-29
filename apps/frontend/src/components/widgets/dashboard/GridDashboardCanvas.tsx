import React, { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Widget } from '../../../types/widget';
import WidgetRenderer from '../WidgetRenderer';
import { Move, RotateCcw, Settings, X } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridDashboardCanvasProps {
  widgets: Widget[];
  onUpdateWidget: (widget: Widget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onUpdateWidgetPositions: (widgets: Widget[]) => void;
  loading?: boolean;
}

const GridDashboardCanvas: React.FC<GridDashboardCanvasProps> = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  onUpdateWidgetPositions,
  loading = false
}) => {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Convert widgets to grid layout format
  const generateLayouts = useMemo(() => {
    const gridItems = widgets.map((widget, index) => ({
      i: widget.id,
      x: widget.position?.x || (index % 4) * 2,
      y: widget.position?.y || Math.floor(index / 4) * 2,
      w: widget.position?.width || getSizeWidth(widget.size),
      h: widget.position?.height || getSizeHeight(widget.size),
      minW: 1,
      minH: 1,
      maxW: 8,
      maxH: 6
    }));

    return {
      lg: gridItems,
      md: gridItems,
      sm: gridItems.map(item => ({ ...item, w: Math.min(item.w, 3) })),
      xs: gridItems.map(item => ({ ...item, w: Math.min(item.w, 2) })),
      xxs: gridItems.map(item => ({ ...item, w: 1 }))
    };
  }, [widgets]);

  useEffect(() => {
    setLayouts(generateLayouts);
  }, [generateLayouts]);

  const getSizeWidth = (size: string) => {
    switch (size) {
      case 'small': return 2;
      case 'medium': return 3;
      case 'large': return 4;
      default: return 3;
    }
  };

  const getSizeHeight = (size: string) => {
    switch (size) {
      case 'small': return 2;
      case 'medium': return 2;
      case 'large': return 3;
      default: return 2;
    }
  };

  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
    
    // Update widget positions
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            ...widget.position,
            x: layoutItem.x,
            y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h
          }
        };
      }
      return widget;
    });

    onUpdateWidgetPositions(updatedWidgets);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = () => {
    setIsResizing(false);
  };

  const resetLayout = () => {
    const resetWidgets = widgets.map((widget, index) => ({
      ...widget,
      position: {
        ...widget.position,
        x: (index % 4) * 2,
        y: Math.floor(index / 4) * 2,
        width: getSizeWidth(widget.size),
        height: getSizeHeight(widget.size)
      }
    }));
    onUpdateWidgetPositions(resetWidgets);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка виджетов...</p>
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Move className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Добро пожаловать в ваш дашборд!
          </h3>
          <p className="text-gray-600 mb-6">
            Начните настройку вашего рабочего пространства, добавив первый виджет.
            Вы сможете свободно перемещать и изменять размеры виджетов.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Move className="h-4 w-4 mr-1" />
              Перетаскивание
            </div>
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Изменение размера
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-auto">
      {/* Grid controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        <button
          onClick={resetLayout}
          className="flex items-center space-x-1 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm"
          title="Сбросить расположение"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Сбросить</span>
        </button>
        
        {(isDragging || isResizing) && (
          <div className="flex items-center space-x-1 px-3 py-2 bg-blue-100/90 backdrop-blur-sm border border-blue-200/60 rounded-lg text-blue-700 text-sm">
            <Move className="h-4 w-4" />
            <span>{isDragging ? 'Перемещение...' : 'Изменение размера...'}</span>
          </div>
        )}
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Responsive Grid Layout */}
      <div className="p-6">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onResizeStart={handleResizeStart}
          onResizeStop={handleResizeStop}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 8, md: 6, sm: 4, xs: 2, xxs: 1 }}
          rowHeight={80}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={true}
          isResizable={true}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`relative group ${isDragging || isResizing ? 'z-50' : 'z-10'}`}
            >
              {/* Widget container with modern styling */}
              <div className={`
                h-full w-full rounded-xl overflow-hidden
                bg-gradient-to-br from-white via-white to-gray-50/30
                border border-gray-200/60 shadow-lg backdrop-blur-sm
                transition-all duration-300 ease-out
                ${isDragging ? 'shadow-2xl scale-105 rotate-2' : 'hover:shadow-xl hover:scale-[1.02]'}
                ${isResizing ? 'shadow-2xl ring-2 ring-blue-400/50' : ''}
              `}>
                
                {/* Drag handle */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/60">
                    <Move className="h-3 w-3 text-gray-600 cursor-move" />
                    <span className="text-xs text-gray-600">Переместить</span>
                  </div>
                </div>

                {/* Widget header */}
                <div className="relative flex items-center justify-between p-4 border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{widget.title}</h3>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateWidget(widget)}
                      className="p-1.5 rounded-lg hover:bg-white/80 transition-all duration-200 opacity-60 hover:opacity-100"
                      title="Настройки"
                    >
                      <Settings className="h-3 w-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDeleteWidget(widget.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-60 hover:opacity-100"
                      title="Удалить"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Widget content */}
                <div className="p-4 h-full overflow-auto">
                  <WidgetRenderer widget={widget} />
                </div>

                {/* Resize indicator */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-4 h-4 border-r-2 border-b-2 border-gray-400/60 cursor-se-resize"></div>
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default GridDashboardCanvas;
