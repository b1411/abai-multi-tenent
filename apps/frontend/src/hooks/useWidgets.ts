import { useState, useEffect, useCallback } from 'react';
import { Widget, WidgetType, WidgetTemplate, UserRole } from '../types/widget';
import { useAuth } from './useAuth';
import widgetService from '../services/widgetService';

export const useWidgets = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create demo widgets based on user role (defined before loadWidgets to use as dependency)
  const createDemoWidgets = useCallback(async () => {
    if (!user?.id || !user?.role) return;

    const IMPLEMENTED_WIDGETS: WidgetType[] = [
      'schedule','teacher-schedule','grades','assignments','attendance','tasks','news',
      'system-stats','finance-overview','system-alerts','school-attendance','teacher-workload',
      'classroom-usage','grade-analytics','system-monitoring','activity-monitoring','birthdays',
      'child-grades','child-schedule','child-homework','child-attendance'
    ];

    let demoWidgetTypes: WidgetType[] = [];
    switch (user.role) {
      case 'STUDENT':
        demoWidgetTypes = ['schedule','grades','assignments','tasks'];
        break;
      case 'TEACHER':
        demoWidgetTypes = ['teacher-schedule','grades','assignments','tasks'];
        break;
      case 'ADMIN':
        demoWidgetTypes = ['system-stats','school-attendance','finance-overview','system-alerts','tasks'];
        break;
      case 'PARENT':
        demoWidgetTypes = ['child-schedule','child-grades','child-homework'];
        break;
      case 'FINANCIST':
        demoWidgetTypes = ['finance-overview','tasks'];
        break;
      case 'HR':
        demoWidgetTypes = ['activity-monitoring','teacher-workload','tasks'];
        break;
      default:
        demoWidgetTypes = ['news','tasks'];
    }

    // Filter only implemented & unique
    demoWidgetTypes = Array.from(new Set(demoWidgetTypes.filter(t => IMPLEMENTED_WIDGETS.includes(t))));

    const successfullyCreatedWidgets: Widget[] = [];
    for (const widgetType of demoWidgetTypes) {
      try {
        const widget = await widgetService.addWidget(widgetType, user.id.toString());
        // Only add if widget has valid ID from database
        if (widget && widget.id && !widget.id.startsWith('widget_')) {
          successfullyCreatedWidgets.push(widget);
        } else {
          console.warn(`Demo widget ${widgetType} was not properly saved to database`);
        }
      } catch (err) {
        console.error(`Error creating demo widget ${widgetType}:`, err);
      }
    }

    if (successfullyCreatedWidgets.length > 0) {
      setWidgets(successfullyCreatedWidgets);
      // Save to localStorage
      try {
        await widgetService.saveWidgetLayout(successfullyCreatedWidgets);
      } catch (err) {
        console.error('Error saving demo widgets layout:', err);
      }
    }
  }, [user?.id, user?.role]);

  // Load user's widgets
  const loadWidgets = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Try to load from service first
      const userWidgets = await widgetService.getUserWidgets();
      
      if (userWidgets.length > 0) {
        // Filter out unsupported types (in case legacy data present)
        const supported = userWidgets.filter(w => !!w.type);
        setWidgets(supported);
      } else {
        // If no widgets from service, try localStorage
        const layout = await widgetService.getDashboardLayout(user.id.toString());
        if (layout && layout.widgets.length > 0) {
          setWidgets(layout.widgets);
        } else {
          // If no widgets at all, create demo widgets for user
            console.log('No widgets found, creating demo widgets for user role:', user.role);
            await createDemoWidgets();
        }
      }
    } catch (err) {
      console.error('Error loading widgets:', err);
      setError('Не удалось загрузить виджеты');
      // Even if there's an error, try to create demo widgets
      try {
        await createDemoWidgets();
      } catch (demoErr) {
        console.error('Error creating demo widgets:', demoErr);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, createDemoWidgets]);


  // Load available widgets for user role
  const loadAvailableWidgets = useCallback(async () => {
    if (!user?.role) return;

    try {
      const templates = await widgetService.getAvailableWidgets(user.role as UserRole);
      setAvailableWidgets(templates);
    } catch (err) {
      console.error('Error loading available widgets:', err);
    }
  }, [user?.role]);

  // Add new widget
  const addWidget = useCallback(async (widgetType: WidgetType) => {
    if (!user?.id) return;

    try {
      const newWidget = await widgetService.addWidget(widgetType, user.id.toString());
      
      // Only add to local state if widget has a valid ID (not the temporary one)
      if (newWidget && newWidget.id && !newWidget.id.startsWith('widget_')) {
        // Add to local state
        setWidgets(prev => {
          const updatedWidgets = [...prev, newWidget];
          // Save layout with the new widget
          widgetService.saveWidgetLayout(updatedWidgets).catch(err => 
            console.error('Error saving layout after adding widget:', err)
          );
          return updatedWidgets;
        });
        
        return newWidget;
      } else {
        console.warn('Widget was not properly saved to database, skipping local state update');
        setError('Не удалось сохранить виджет в базе данных');
        return null;
      }
    } catch (err) {
      console.error('Error adding widget:', err);
      setError('Не удалось добавить виджет');
      throw err;
    }
  }, [user?.id]);

  // Update widget
  const updateWidget = useCallback(async (updatedWidget: Widget) => {
    try {
      console.log('Updating widget:', updatedWidget.id, 'New size:', updatedWidget.size);
      
      const updated = await widgetService.updateWidget(updatedWidget);
      
      // Update local state first
      setWidgets(prev => {
        const newWidgets = prev.map(widget => 
          widget.id === updated.id ? updated : widget
        );
        
        // Save layout immediately with updated state
        widgetService.saveWidgetLayout(newWidgets).catch(err => 
          console.error('Error saving layout after update:', err)
        );
        
        return newWidgets;
      });
      
      console.log('Widget updated successfully');
      return updated;
    } catch (err) {
      console.error('Error updating widget:', err);
      setError('Не удалось обновить виджет');
      // Don't throw - let UI update anyway
      return updatedWidget;
    }
  }, []);

  // Delete widget
  const deleteWidget = useCallback(async (widgetId: string) => {
    try {
      console.log('Deleting widget with ID:', widgetId);
      
      // Update local state first
      setWidgets(prev => {
        const updatedWidgets = prev.filter(widget => widget.id !== widgetId);
        
        // Save layout immediately with updated state
        Promise.all([
          widgetService.deleteWidget(widgetId).catch(err => 
            console.warn('Widget service delete failed:', err)
          ),
          widgetService.saveWidgetLayout(updatedWidgets).catch(err => 
            console.warn('Layout save failed:', err)
          )
        ]);
        
        return updatedWidgets;
      });
      
      console.log('Widget deleted successfully');
    } catch (err) {
      console.error('Error deleting widget:', err);
      setError('Не удалось удалить виджет');
      // Don't throw here, we want the UI to update even if backend fails
    }
  }, []);

  // Update widget positions (for drag & drop)
  const updateWidgetPositions = useCallback(async (updatedWidgets: Widget[]) => {
    // Check if positions actually changed
    const hasChanged = updatedWidgets.some((updatedWidget, index) => {
      const currentWidget = widgets[index];
      if (!currentWidget || !updatedWidget.position || !currentWidget.position) return false;
      
      return (
        updatedWidget.position.x !== currentWidget.position.x ||
        updatedWidget.position.y !== currentWidget.position.y ||
        updatedWidget.position.width !== currentWidget.position.width ||
        updatedWidget.position.height !== currentWidget.position.height
      );
    });

    if (!hasChanged) {
      console.log('Widget positions did not change, skipping save');
      return;
    }

    try {
      setWidgets(updatedWidgets);
      await widgetService.saveWidgetLayout(updatedWidgets);
      console.log('Widget positions saved successfully');
    } catch (err) {
      console.error('Error updating widget positions:', err);
      setError('Не удалось сохранить расположение виджетов');
    }
  }, [widgets]);

  // Get widget data
  const getWidgetData = useCallback(async (widgetType: WidgetType, config?: any) => {
    try {
      return await widgetService.getWidgetData(widgetType, config);
    } catch (err) {
      console.error(`Error getting data for widget ${widgetType}:`, err);
      return {};
    }
  }, []);

  // Check if widget type is already added
  const isWidgetAdded = useCallback((widgetType: WidgetType) => {
    return widgets.some(widget => widget.type === widgetType);
  }, [widgets]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      // Clear any old widget data to force refresh
      localStorage.removeItem('widgetLayout');
      loadWidgets();
      loadAvailableWidgets();
    }
  }, [user, loadWidgets, loadAvailableWidgets]);

  return {
    widgets,
    availableWidgets,
    loading,
    error,
    addWidget,
    updateWidget,
    deleteWidget,
    updateWidgetPositions,
    getWidgetData,
    isWidgetAdded,
    clearError,
    refetch: loadWidgets
  };
};

export default useWidgets;
