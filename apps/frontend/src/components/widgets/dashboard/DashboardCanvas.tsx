import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Widget as WidgetType } from '../../../types/widget';
import Widget from '../base/Widget';
import WidgetRenderer from '../WidgetRenderer';

interface DashboardCanvasProps {
  widgets: WidgetType[];
  onUpdateWidget: (widget: WidgetType) => void;
  onDeleteWidget: (widgetId: string) => void;
  onUpdateWidgetPositions: (widgets: WidgetType[]) => void;
  loading?: boolean;
}

const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  onUpdateWidgetPositions,
  loading = false
}) => {
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering drag & drop
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions for all widgets
    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      position: {
        ...widget.position,
        x: index % 4, // Simple grid positioning
        y: Math.floor(index / 4)
      }
    }));

    onUpdateWidgetPositions(updatedWidgets);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Начните с добавления виджетов
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Нажмите кнопку "Добавить виджет" в правом верхнем углу, чтобы настроить свой дашборд
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Совет:</strong> Виджеты можно перетаскивать для изменения их порядка
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="vertical">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`
                grid gap-6 
                grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
                auto-rows-min
                transition-colors duration-200
                ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
              `}
            >
              {widgets.map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        transition-all duration-200
                        ${snapshot.isDragging ? 'z-50' : ''}
                      `}
                      style={{
                        ...provided.draggableProps.style,
                        transform: snapshot.isDragging 
                          ? `${provided.draggableProps.style?.transform} rotate(5deg)` 
                          : provided.draggableProps.style?.transform
                      }}
                    >
                      <Widget
                        widget={widget}
                        onUpdate={onUpdateWidget}
                        onDelete={(widgetId) => {
                          console.log('Widget delete requested for ID:', widgetId);
                          onDeleteWidget(widgetId);
                        }}
                        isDragging={snapshot.isDragging}
                      >
                        <WidgetRenderer widget={widget} />
                      </Widget>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default DashboardCanvas;
