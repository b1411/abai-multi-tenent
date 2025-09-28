// Utility functions for widget sizing
export const getMaxItemsForWidget = (widgetSize: { width: string; height: string }, small: number, medium: number, large: number): number => {
  switch (widgetSize.height) {
    case 'small': return small;
    case 'medium': return medium;
    case 'large': return large;
    default: return medium;
  }
};

export const isWidgetSize = (widgetSize: { width: string; height: string }, size: string): boolean => {
  return widgetSize.height === size || widgetSize.width === size;
};