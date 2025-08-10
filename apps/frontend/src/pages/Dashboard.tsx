import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import useWidgets from '../hooks/useWidgets';
import AddWidgetButton from '../components/widgets/dashboard/AddWidgetButton';
import WidgetSelectionModal from '../components/widgets/dashboard/WidgetSelectionModal';
import DashboardCanvas from '../components/widgets/dashboard/DashboardCanvas';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    widgets,
    availableWidgets,
    loading,
    error,
    addWidget,
    updateWidget,
    deleteWidget,
    updateWidgetPositions,
    isWidgetAdded,
    clearError
  } = useWidgets();

  const [showWidgetModal, setShowWidgetModal] = useState(false);

  const handleAddWidget = async (widgetType: any) => {
    try {
      await addWidget(widgetType);
      setShowWidgetModal(false);
    } catch (err) {
      console.error('Error adding widget:', err);
    }
  };

  const addedWidgetTypes = widgets.map(widget => widget.type);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 sm:py-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Добро пожаловать, {user.name} {user.surname}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Настройте свой дашборд, добавив нужные виджеты
              </p>
            </div>

            <div className="flex-shrink-0">
              <AddWidgetButton 
                onClick={() => setShowWidgetModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full">
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-6">
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-800 text-sm sm:text-base truncate">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Canvas */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto w-full px-1.5 sm:px-6">
          <DashboardCanvas
            widgets={widgets}
            onUpdateWidget={updateWidget}
            onDeleteWidget={deleteWidget}
            onUpdateWidgetPositions={updateWidgetPositions}
            loading={loading}
          />
        </div>
      </div>

      {/* Widget Selection Modal */}
      <WidgetSelectionModal
        isOpen={showWidgetModal}
        onClose={() => setShowWidgetModal(false)}
        availableWidgets={availableWidgets}
        onSelectWidget={handleAddWidget}
        addedWidgets={addedWidgetTypes}
      />
    </div>
  );
};

export default Dashboard;
