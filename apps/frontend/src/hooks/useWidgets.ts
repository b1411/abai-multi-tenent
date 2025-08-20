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

    const demoWidgets: Widget[] = [];
    for (const widgetType of demoWidgetTypes) {
      try {
        const widget = await widgetService.addWidget(widgetType, user.id.toString());
        demoWidgets.push(widget);
      } catch (err) {
        console.error(`Error creating demo widget ${widgetType}:`, err);
      }
    }

    if (demoWidgets.length > 0) {
      setWidgets(demoWidgets);
      // Save to localStorage
      try {
        await widgetService.saveWidgetLayout(demoWidgets);
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
      
      // Add to local state
      setWidgets(prev => [...prev, newWidget]);
      
      // Save layout
      const updatedWidgets = [...widgets, newWidget];
      await widgetService.saveWidgetLayout(updatedWidgets);
      
      return newWidget;
    } catch (err) {
      console.error('Error adding widget:', err);
      setError('Не удалось добавить виджет');
      throw err;
    }
  }, [user?.id, widgets]);

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
    try {
      setWidgets(updatedWidgets);
      await widgetService.saveWidgetLayout(updatedWidgets);
    } catch (err) {
      console.error('Error updating widget positions:', err);
      setError('Не удалось сохранить расположение виджетов');
    }
  }, []);

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
